package handlers

import (
	"context"
	"fmt"
	"log"

	
	"time"

	"Restaurant/src/database"
	"Restaurant/src/models"
	"Restaurant/src/broadcast"
	"Restaurant/src/utils"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// -------------------------
// CHECKOUT REQUEST STRUCTS
// -------------------------
type Itens struct {
	ID         uint `json:"id"`
	Preco      uint `json:"price"`
	Quantidade uint `json:"quantity"`
}

type CheckoutRequest struct {
	QRCode string  `json:"qrCode"`
	Itens  []Itens `json:"items"`
	Total  uint    `json:"total"`
}
 
// -------------------------
// CHECKOUT HANDLER
// -------------------------
func Checkout(c *fiber.Ctx) error {
	var payload CheckoutRequest
	if err := c.BodyParser(&payload); err != nil {
		log.Printf("[CHECKOUT] Erro ao fazer parse do payload: %v", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "JSON inválido"})
	}
	if len(payload.Itens) == 0 {
		log.Printf("[CHECKOUT] Nenhum item enviado no payload")
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Nenhum item enviado"})
	}

	// pegar auth do middleware (middleware já validou token e mesa)
	authLocal := c.Locals("auth")
	if authLocal == nil {
		log.Printf("[CHECKOUT] auth não encontrado no contexto (middleware pode não estar configurado)")
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Token não fornecido"})
	}
	auth, ok := authLocal.(utils.AuthPayload)
	if !ok {
		log.Printf("[CHECKOUT] formato de auth inválido no contexto")
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Token inválido"})
	}

	// validações rápidas nos itens
	itemMap := make(map[uint]uint)
	for _, it := range payload.Itens {
		if it.Quantidade == 0 {
			log.Printf("[CHECKOUT] Item com quantidade zero (produto %d)", it.ID)
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": fmt.Sprintf("Quantidade inválida para produto %d", it.ID)})
		}
		itemMap[it.ID] += it.Quantidade
	}
	if len(itemMap) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Itens inválidos"})
	}

	productIDs := make([]uint, 0, len(itemMap))
	for id := range itemMap {
		productIDs = append(productIDs, id)
	}

	// inicia transação com contexto
	ctx, cancel := context.WithTimeout(c.Context(), 10*time.Second)
	defer cancel()
	tx := database.DB.WithContext(ctx).Begin()
	if tx.Error != nil {
		log.Printf("[CHECKOUT] Erro ao iniciar transação: %v", tx.Error)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Erro ao iniciar transação"})
	}

	committed := false
	defer func() {
		if !committed {
			log.Printf("[CHECKOUT] Rollback da transação por erro ou commit não realizado")
			_ = tx.Rollback()
		}
	}()

	// 1) get or create status (usa SELECT FOR UPDATE internamente)
	status, nova, err := utils.GetOrCreateStatusTx(tx, auth.Mesa) // usa auth.Mesa (número) para localizar/gerar status
	if err != nil {
		log.Printf("[CHECKOUT] Erro ao obter/criar status: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Erro ao obter/criar status"})
	}

	// 2) buscar produtos WITHIN tx
	var produtos []models.Produto
	if err := tx.Where("id IN ?", productIDs).Find(&produtos).Error; err != nil {
		log.Printf("[CHECKOUT] Erro ao buscar produtos: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Erro ao buscar produtos"})
	}
	if len(produtos) != len(productIDs) {
		// identificar quais faltaram
		found := make(map[uint]bool)
		for _, p := range produtos {
			found[p.ID] = true
		}
		var missing []uint
		for _, id := range productIDs {
			if !found[id] {
				missing = append(missing, id)
			}
		}
		log.Printf("[CHECKOUT] Produtos não encontrados: %v", missing)
		return c.Status(400).JSON(fiber.Map{"error": fmt.Sprintf("Produtos não encontrados: %v", missing)})
	}

	// 3) criar order (assumindo que Order.MesaID é fk para status.ID - manter consistente)
	order := models.Order{
		NomeLoja: auth.Loja,
		MesaID:   status.ID,            // <-- usar status.ID (PK) para referenciar o status da mesa
		QRCode:   payload.QRCode,
		Status:   "Pendente",
	}
	if err := tx.Create(&order).Error; err != nil {
		log.Printf("[CHECKOUT] Erro ao criar pedido: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Erro ao criar pedido"})
	}

	// 4) agregar itens e calcular total usando uint64 para evitar overflow
	prodMap := make(map[uint]models.Produto)
	for _, p := range produtos {
		prodMap[p.ID] = p
	}

	var itemsToUpsert []models.OrderItem
	var total64 uint64 = 0
	for id, qty := range itemMap {
		prod := prodMap[id] // garantido existir acima
		var price uint
		if prod.PrecoPromocional != 0 {
			price = prod.PrecoPromocional
		} else {
			price = prod.Preco
		}
		// acumula
		total64 += uint64(price) * uint64(qty)

		itemsToUpsert = append(itemsToUpsert, models.OrderItem{
			OrderID:       order.ID,
			ProdutoID:     prod.ID,
			Quantidade:    qty,
			PrecoUnitario: price,
		})
	}

	// (Opcional) comparar payload.Total com total calculado — comente/descomente conforme política
	if payload.Total != 0 {
	    if uint64(payload.Total) != total64 {
	        log.Printf("[CHECKOUT] Total enviado (%d) difere do calculado (%d)", payload.Total, total64)
	        return c.Status(400).JSON(fiber.Map{"error": "Total inválido"})
	    }
	}

	// 5) upsert items (dentro da transação)
	if len(itemsToUpsert) > 0 {
		if err := tx.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "order_id"}, {Name: "produto_id"}},
			DoUpdates: clause.Assignments(map[string]interface{}{"quantidade": gorm.Expr("order_items.quantidade + EXCLUDED.quantidade"), "preco_unitario": gorm.Expr("EXCLUDED.preco_unitario")}),
		}).Create(&itemsToUpsert).Error; err != nil {
			log.Printf("[CHECKOUT] Erro ao inserir/upsert items: %v", err)
			return c.Status(500).JSON(fiber.Map{"error": "Erro ao inserir/upsert items"})
		}
	}

	// 6) atualizar total no pedido (cast seguro)
	if err := tx.Model(&models.Order{}).Where("id = ?", order.ID).Update("total", uint(total64)).Error; err != nil {
		log.Printf("[CHECKOUT] Erro ao atualizar total do pedido: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Erro ao atualizar total"})
	}

	// 7) atualizar last_order_at no status (mantém dentro da tx)
	if err := tx.Model(&status).Updates(map[string]interface{}{"last_order_at": time.Now()}).Error; err != nil {
		log.Printf("[CHECKOUT] Erro ao atualizar Last_order_at da mesa: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Erro ao atualizar Last_order_at da mesa"})
	}

	// commit
	if err := tx.Commit().Error; err != nil {
		log.Printf("[CHECKOUT] Erro ao commitar transação: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Erro ao commitar transação"})
	}
	committed = true

	// 8) recuperar pedido salvo (fora da tx, após commit) e broadcast
	var savedOrder models.Order
	if err := database.DB.Preload("Items.Produto").First(&savedOrder, order.ID).Error; err != nil {
		log.Printf("[CHECKOUT] Erro ao buscar pedido salvo: %v", err)
		// pedido foi criado mas não conseguimos buscar com preload; retornamos ID parcial
		return c.Status(500).JSON(fiber.Map{"error": "Erro ao buscar pedido salvo"})
	}

	// preparar payload de broadcast
	mesaMap := map[string]uint{
		"id":     status.ID,
		"number": status.Number,
	}
	if nova {
		broadcast.BroadcastNewTable(mesaMap)
	} else {
		broadcast.BroadcastNewOrder(savedOrder, status.ID)
	}

	return c.JSON(fiber.Map{
		"message": "Checkout autorizado e pedido salvo",
		"order":   savedOrder,
	})
}
