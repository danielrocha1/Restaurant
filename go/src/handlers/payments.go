package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"Restaurant/src/database"
	"Restaurant/src/models"
	"Restaurant/src/broadcast"

	"github.com/gofiber/fiber/v2"
)

// -------------------------
// AUTH & TOKEN (Copie isso do seu arquivo original)
// -------------------------

// PaymentHandler processa o resumo de uma transação de pagamento, fecha a mesa e registra o pagamento.
// Parâmetros: espera um JSON TransactionSummary no body.
func PaymentHandler(c *fiber.Ctx) error {
	log.Printf("[PAYMENT] Iniciando processamento de pagamento. Body: %s", string(c.Body()))
	var payload models.TransactionSummary
	if err := c.BodyParser(&payload); err != nil {
		log.Printf("[PAYMENT] Erro ao fazer parse do payload: %v", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "JSON inválido ou malformado"})
	}

	// Validação de tipos e valores do payload
	if payload.TableID == 0 || payload.TableNumber == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "ID e número da mesa são obrigatórios"})
	}
	if len(payload.Payments) == 0 || payload.TotalPaid <= 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Dados de pagamento incompletos ou inválidos"})
	}

	// Início da Transação GORM e Configuração de Timeout/Rollback
	ctx, cancel := context.WithTimeout(c.Context(), 10*time.Second)
	defer cancel()
	tx := database.DB.WithContext(ctx).Begin()
	if tx.Error != nil {
		log.Printf("[PAYMENT] Erro ao iniciar transação: %v", tx.Error)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Erro ao iniciar transação GORM"})
	}

	committed := false
	defer func() {
		if !committed {
			log.Printf("[PAYMENT] Rollback da transação por erro ou commit não realizado")
			tx.Rollback()
		}
	}()

	// Buscar Status da Mesa e Validar se Está Aberta
	var statusTable models.StatusTable
	if err := tx.Where("id = ?", payload.TableID).First(&statusTable).Error; err != nil {
		log.Printf("[PAYMENT] Mesa %d não encontrada ou erro de busca: %v", payload.TableNumber, err)
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": fmt.Sprintf("Mesa %d não encontrada ou erro de busca: %v", payload.TableNumber, err)})
	}
	if !statusTable.IsOpen {
		log.Printf("[PAYMENT] Mesa %d já está fechada.", payload.TableNumber)
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": fmt.Sprintf("Mesa %d já está fechada.", payload.TableNumber)})
	}

	// Serializar e Salvar o Registro de Pagamento
	paymentsJSON, err := json.Marshal(payload.Payments)
	if err != nil {
		log.Printf("[PAYMENT] Erro ao serializar pagamentos: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Erro ao serializar pagamentos"})
	}

	paymentRecord := models.PaymentRecord{
		TotalTransaction: payload.TotalPaid,
		MesaID:           payload.TableID,
		ChangeDue:        payload.ChangeDue,
		PaymentJSON:      string(paymentsJSON),
	}
	if err := tx.Create(&paymentRecord).Error; err != nil {
		log.Printf("[PAYMENT] Erro ao salvar registro de pagamento: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Erro ao salvar registro de pagamento"})
	}

	// Fechar a Mesa (UPDATE)
	now := time.Now()
	updateData := models.StatusTable{IsOpen: false, ClosedAt: &now}
	updateResult := tx.Model(&statusTable).
		Where("id = ?", statusTable.ID).
		Select("IsOpen", "ClosedAt").
		Updates(updateData)
	if updateResult.Error != nil {
		log.Printf("[PAYMENT] Erro ao fechar a mesa: %v", updateResult.Error)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Erro ao fechar a mesa"})
	}
	if updateResult.RowsAffected == 0 {
		log.Printf("[PAYMENT] Não foi possível fechar a mesa. Status pode ter sido alterado.")
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "Não foi possível fechar a mesa."})
	}

	// COMITAR A TRANSAÇÃO
	if err := tx.Commit().Error; err != nil {
		log.Printf("[PAYMENT] Erro ao commitar transação: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Erro ao commitar transação"})
	}
	committed = true

	// Broadcast para notificar fechamento da mesa
	broadcastMesaID := map[string]uint{
		"mesaNumber": statusTable.Number,
		"mesaID":     statusTable.ID,
	}
	broadcast.BroadcastCloseTable(broadcastMesaID)
	log.Printf("[PAYMENT] Pagamento registrado e mesa %d fechada com sucesso!", statusTable.Number)

	return c.JSON(fiber.Map{
		"message":    fmt.Sprintf("Pagamento registrado e Mesa %d fechada com sucesso!", payload.TableNumber),
		"table_id":   statusTable.ID,
		"payment_id": paymentRecord.ID,
	})
}
