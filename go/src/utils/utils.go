package utils

import (
	"strings"
	"fmt"
	"log"
	"time"
	
	"github.com/golang-jwt/jwt/v5"
	"Restaurant/src/models"

	"errors"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	

)

var SecretKey = []byte("MyS3cr3tKey_@2025!#jwtTokenAkiroSG")

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
// -------------------------


// fetchProducts busca produtos dentro da transação e retorna erro se ocorrer falha.
func FetchProducts(tx *gorm.DB, ids []uint) ([]models.Produto, error) {
var produtos []models.Produto
if err := tx.Where("id IN ?", ids).Find(&produtos).Error; err != nil {
return nil, err
}
return produtos, nil
}


// buildItemsAndTotal recebe a lista de produtos encontrados, o map de id->qty e o orderID
// e retorna os OrderItem prontos para persistir e o total calculado (uint64). Retorna erro
// se algum produto requisitado não existir.
func BuildItemsAndTotal(produtos []models.Produto, itemMap map[uint]uint, orderID uint) ([]models.OrderItem, uint64, error) {
prodMap := make(map[uint]models.Produto, len(produtos))
for _, p := range produtos {
prodMap[p.ID] = p
}


var items []models.OrderItem
var total uint64
for id, qty := range itemMap {
p, ok := prodMap[id]
if !ok {
return nil, 0, fmt.Errorf("produto %d não encontrado", id)
}
price := p.Preco
if p.PrecoPromocional != 0 {
price = p.PrecoPromocional
}


items = append(items, models.OrderItem{
OrderID: orderID,
ProdutoID: p.ID,
Quantidade: qty,
PrecoUnitario: price,
})
total += uint64(price) * uint64(qty)
}
return items, total, nil
}


// persistItems faz o upsert (on conflict) dos itens dentro da transação.
func PersistItems(tx *gorm.DB, items []models.OrderItem) error {
if len(items) == 0 {
return nil
}
return tx.Clauses(clause.OnConflict{
Columns: []clause.Column{{Name: "order_id"}, {Name: "produto_id"}},
DoUpdates: clause.Assignments(map[string]interface{}{"quantidade": gorm.Expr("order_items.quantidade + EXCLUDED.quantidade"), "preco_unitario": gorm.Expr("EXCLUDED.preco_unitario")}),
}).Create(&items).Error
}

func GenerateToken(auth AuthPayload) (string, error) {
	claims := CustomClaims{
		Auth: auth,
		RegisteredClaims: jwt.RegisteredClaims{
			IssuedAt: jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(SecretKey)
}

// validateToken valida o JWT e retorna as claims customizadas.
func ValidateToken(tokenStr string) (*CustomClaims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &CustomClaims{}, func(token *jwt.Token) (interface{}, error) {
		return SecretKey, nil
	})
	if err != nil {
		log.Printf("[AUTH] Erro ao validar token: %v", err)
		return nil, err
	}
	if claims, ok := token.Claims.(*CustomClaims); ok && token.Valid {
		return claims, nil
	}
	log.Printf("[AUTH] Token inválido: %v", tokenStr)
	return nil, fmt.Errorf("token inválido")
}

// -------------------------
// STATUS MESA
// -------------------------
// getOrCreateStatusTx busca ou cria o status da mesa de forma transacional.
func GetOrCreateStatusTx(tx *gorm.DB, tableNumber uint) (models.StatusTable, bool, error) {
	const maxAttempts = 5
	var status models.StatusTable

	for attempt := 0; attempt < maxAttempts; attempt++ {
		// SELECT FOR UPDATE
		err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("number = ? AND is_open = ?", tableNumber, true).
			First(&status).Error

		if err == nil {
			return status, false, nil
		}

		if !errors.Is(err, gorm.ErrRecordNotFound) {
			log.Printf("[DB] Erro ao buscar status da mesa: %v", err)
			return status, false, err
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
			log.Printf("[DB] Erro ao criar status da mesa: %v", err)
			return status, true, err
		}
		return nova, true, nil
	}

	log.Printf("[DB] Falha ao criar/obter status da mesa após %d tentativas", maxAttempts)
	return status, false, fmt.Errorf("não foi possível criar/obter status da mesa após várias tentativas")
}