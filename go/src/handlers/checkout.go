package handlers

import (
    "context"
    "errors"
    "fmt"
    // "regexp"
    // "strconv"
    "strings"
    "time"

    "Restaurant/src/database"
    "Restaurant/src/models"

    "github.com/gofiber/fiber/v2"
    "github.com/golang-jwt/jwt/v5"
    "gorm.io/gorm"
    "gorm.io/gorm/clause"
)

var secretKey = []byte("MyS3cr3tKey_@2025!#jwtTokenAkiroSG")

// -------------------------
// AUTH & TOKEN
// -------------------------
type AuthPayload struct {
    Loja       string `json:"loja"`
    Mesa       uint   `json:"mesa"`
    Permission bool   `json:"permission"`
}

type CustomClaims struct {
    Auth AuthPayload `json:"auth"`
    jwt.RegisteredClaims
}

func GenerateToken(auth AuthPayload) (string, error) {
    claims := CustomClaims{
        Auth: auth,
        RegisteredClaims: jwt.RegisteredClaims{
            IssuedAt: jwt.NewNumericDate(time.Now()),
        },
    }
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString(secretKey)
}

func validateToken(tokenStr string) (*CustomClaims, error) {
    token, err := jwt.ParseWithClaims(tokenStr, &CustomClaims{}, func(token *jwt.Token) (interface{}, error) {
        return secretKey, nil
    })
    if err != nil {
        return nil, err
    }
    if claims, ok := token.Claims.(*CustomClaims); ok && token.Valid {
        return claims, nil
    }
    return nil, fmt.Errorf("token inválido")
}

// -------------------------
// STATUS MESA
// -------------------------
func getOrCreateStatusTx(tx *gorm.DB, tableNumber uint) (models.StatusTable, error) {
    const maxAttempts = 5
    var status models.StatusTable

    for attempt := 0; attempt < maxAttempts; attempt++ {
        // SELECT FOR UPDATE
        err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
            Where("number = ? AND is_open = ?", tableNumber, true).
            First(&status).Error

        if err == nil {
            return status, nil
        }

        if !errors.Is(err, gorm.ErrRecordNotFound) {
            return status, err
        }

        // CREATE
        now := time.Now()
        nova := models.StatusTable{
            Number:   tableNumber,
            OpenedAt: &now,
            IsOpen:   true,
        }

        if err := tx.Create(&nova).Error; err != nil {
            if strings.Contains(strings.ToLower(err.Error()), "duplicate") || strings.Contains(strings.ToLower(err.Error()), "unique") {
                continue
            }
            return status, err
        }
        return nova, nil
    }

    return status, fmt.Errorf("não foi possível criar/obter status da mesa após várias tentativas")
}

// -------------------------
// CHECKOUT REQUEST STRUCTS
// -------------------------
type Itens struct {
    ID         uint    `json:"id"`
    Preco      uint `json:"price"`
    Quantidade uint    `json:"quantity"`
}

type CheckoutRequest struct {
    QRCode string  `json:"qrCode"`
    Itens  []Itens `json:"items"`
    Total  uint `json:"total"`
}

// -------------------------
// UTIL: PARSE PRICE
// -------------------------
// func parsePriceString(s string) (float64, error) {
//     s = strings.TrimSpace(s)
//     re := regexp.MustCompile(`[^\d.,\-]`)
//     s = re.ReplaceAllString(s, "")
//     if s == "" {
//         return 0, nil
//     }

//     if strings.Contains(s, ".") && strings.Contains(s, ",") {
//         s = strings.ReplaceAll(s, ".", "")
//         s = strings.ReplaceAll(s, ",", ".")
//     } else {
//         s = strings.ReplaceAll(s, ",", ".")
//     }

//     return strconv.ParseFloat(s, 64)
// }

// -------------------------
// CHECKOUT HANDLER
// -------------------------
func Checkout(c *fiber.Ctx) error {
    var payload CheckoutRequest
    if err := c.BodyParser(&payload); err != nil {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "JSON inválido", "details": err.Error()})
    }
    if len(payload.Itens) == 0 {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Nenhum item enviado"})
    }

    claims, err := validateToken(payload.QRCode)
    if err != nil {
        return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Token inválido"})
    }

    if claims.Auth.Mesa < 1 || claims.Auth.Mesa > 15 {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Mesa fora do intervalo permitido"})
    }

    ctx, cancel := context.WithTimeout(c.Context(), 10*time.Second)
    defer cancel()
    tx := database.DB.WithContext(ctx).Begin()
    if tx.Error != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Erro ao iniciar transação"})
    }

    committed := false
    defer func() {
        if !committed {
            tx.Rollback()
        }
    }()

    // -------------------------
    // 1) GET OR CREATE STATUS
    // -------------------------
    status, err := getOrCreateStatusTx(tx, claims.Auth.Mesa)
    if err != nil {
        return c.Status(500).JSON(fiber.Map{"error": "Erro ao obter/criar status", "details": err.Error()})
    }

    // -------------------------
    // 2) CRIAR PEDIDO
    // -------------------------
    order := models.Order{
        NomeLoja:  claims.Auth.Loja,
        MesaID:      claims.Auth.Mesa,
        QRCode:    payload.QRCode,
        Status:    "Pendente",
        CreatedAt: time.Now(),
    }
    if err := tx.Create(&order).Error; err != nil {
        return c.Status(500).JSON(fiber.Map{"error": "Erro ao criar pedido", "details": err.Error()})
    }

    

    // -------------------------
    // 3) ATUALIZAR STATUS MESA
    // -------------------------
    if err := tx.Model(&status).Updates(map[string]interface{}{
        "last_order_at": time.Now(),
    }).Error; err != nil {
        return c.Status(500).JSON(fiber.Map{"error": "Erro ao atualizar status da mesa", "details": err.Error()})
    }

     if err := tx.Model(&models.Order{}).Where("id = ?", order.ID).Update("mesa_id", status.ID).Error; err != nil {
        return c.Status(500).JSON(fiber.Map{"error": "Erro ao atualizar total", "details": err.Error()})
    }

    // -------------------------
    // 4) AGREGAR ITENS
    // -------------------------
    itemMap := make(map[uint]uint)
    for _, it := range payload.Itens {
        itemMap[it.ID] += it.Quantidade
    }

    productIDs := make([]uint, 0, len(itemMap))
    for id := range itemMap {
        productIDs = append(productIDs, id)
    }

    var produtos []models.Produto
    if err := tx.Where("id IN ?", productIDs).Find(&produtos).Error; err != nil {
        return c.Status(500).JSON(fiber.Map{"error": "Erro ao buscar produtos", "details": err.Error()})
    }

    prodMap := make(map[uint]models.Produto)
    for _, p := range produtos {
        prodMap[p.ID] = p
    }

    var itemsToUpsert []models.OrderItem
    var total uint
    for id, qty := range itemMap {
        prod, ok := prodMap[id]
        if !ok {
            return c.Status(400).JSON(fiber.Map{"error": fmt.Sprintf("Produto ID %d não encontrado", id)})
        }

        var priceStr uint
        if prod.PrecoPromocional != ' ' {
            priceStr = prod.PrecoPromocional
        } else {
            priceStr = prod.Preco
        }
        
        price := priceStr
         
        total += price * uint(qty)

        itemsToUpsert = append(itemsToUpsert, models.OrderItem{
            OrderID:       order.ID,
            ProdutoID:     prod.ID,
            Quantidade:    qty,
            PrecoUnitario: price,
            CreatedAt:     time.Now(),
        })
    }

    // -------------------------
    // 5) UPSERT ITENS
    // -------------------------
    if len(itemsToUpsert) > 0 {
        if err := tx.Clauses(clause.OnConflict{
            Columns:   []clause.Column{{Name: "order_id"}, {Name: "produto_id"}},
            DoUpdates: clause.Assignments(map[string]interface{}{"quantidade": gorm.Expr("order_items.quantidade + EXCLUDED.quantidade"), "preco_unitario": gorm.Expr("EXCLUDED.preco_unitario")}),
        }).Create(&itemsToUpsert).Error; err != nil {
            return c.Status(500).JSON(fiber.Map{"error": "Erro ao inserir/upsert items", "details": err.Error()})
        }
    }

    // -------------------------
    // 6) ATUALIZAR TOTAL
    // -------------------------
    if err := tx.Model(&models.Order{}).Where("id = ?", order.ID).Update("total", total).Error; err != nil {
        return c.Status(500).JSON(fiber.Map{"error": "Erro ao atualizar total", "details": err.Error()})
    }

     if err := tx.Model(&status).Updates(map[string]interface{}{
        "last_order_at": time.Now(),
    }).Error; err != nil {
        return c.Status(500).JSON(fiber.Map{"error": "Erro ao atualizar Last_order_at da mesa", "details": err.Error()})
    }


    if err := tx.Commit().Error; err != nil {
        return c.Status(500).JSON(fiber.Map{"error": "Erro ao commitar transação", "details": err.Error()})
    }
    committed = true

   

    // -------------------------
    // 7) RETORNAR PEDIDO
    // -------------------------
    var savedOrder models.Order
    if err := database.DB.Preload("Items.Produto").First(&savedOrder, order.ID).Error; err != nil {
        return c.Status(500).JSON(fiber.Map{"error": "Erro ao buscar pedido salvo", "details": err.Error()})
    }

    return c.JSON(fiber.Map{
        "message": "Checkout autorizado e pedido salvo",
        "order":   savedOrder,
    })
}
