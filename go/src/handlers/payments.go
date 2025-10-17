package handlers

import (
    "context"
    "fmt"
    "time"
    "encoding/json"


    // Seus pacotes
    "Restaurant/src/database"
    "Restaurant/src/models"
    
    // JWT e Fiber
    "github.com/gofiber/fiber/v2"
)

// -------------------------
// AUTH & TOKEN (Copie isso do seu arquivo original)
// -------------------------

// PaymentHandler processa o resumo de uma transação de pagamento
func PaymentHandler(c *fiber.Ctx) error {
    // 1. Decodificar o Payload
	fmt.Println(string(c.Body()))
    var payload models.TransactionSummary
    if err := c.BodyParser(&payload); err != nil {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "JSON inválido ou malformado", "details": err.Error()})
    }
    
    // 2. Validação básica de dados
    if len(payload.Payments) == 0 || payload.TotalPaid <= 0 {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Dados de pagamento incompletos ou inválidos"})
    }

    // A mesa será identificada pelo TableNumber, conforme seu modelo StatusTable
    tableNumber := payload.TableNumber 

    // 3. Início da Transação GORM e Configuração de Timeout/Rollback
    ctx, cancel := context.WithTimeout(c.Context(), 10*time.Second)
    defer cancel()
    tx := database.DB.WithContext(ctx).Begin()
    if tx.Error != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Erro ao iniciar transação GORM"})
    }

    committed := false
    defer func() {
        if !committed {
            tx.Rollback()
        }
    }()

    // -------------------------
    // 1. Buscar Status da Mesa e Validar se Está Aberta
    // -------------------------
    var statusTable models.StatusTable
    // USANDO O CAMPO 'number' que corresponde à coluna 'number' no seu modelo StatusTable
    if err := tx.Where("number = ?", tableNumber).First(&statusTable).Error; err != nil {
        // Se a mesa não for encontrada ou houver erro no DB (gorm.ErrRecordNotFound)
        return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": fmt.Sprintf("Mesa %d não encontrada ou erro de busca: %v", tableNumber, err)})
    }

    if !statusTable.IsOpen {
        // Se a mesa já estiver fechada, impede o registro de pagamento
        return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": fmt.Sprintf("Mesa %d já está fechada.", tableNumber)})
    }


    // -------------------------
    // 2. Serializar e Salvar o Registro de Pagamento
    // -------------------------
    paymentsJSON, err := json.Marshal(payload.Payments)
    if err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Erro ao serializar pagamentos"})
    }

    // Nota: Aqui estamos usando tableID do payload para o PaymentRecord,
    // mas se TableID for um campo sem valor no payload, ele será 0.
    // É mais seguro usar o ID da tabela encontrado em statusTable (statusTable.ID) 
    // se PaymentRecord precisar de uma FK para o ID da tabela principal.
    
    paymentRecord := models.PaymentRecord{
		TotalTransaction: payload.TotalPaid,
        MesaID:            payload.TableID, // Se MesaID é a FK, use o valor do payload
        ChangeDue:         payload.ChangeDue,
        PaymentJSON:       string(paymentsJSON),
    }

    if err := tx.Create(&paymentRecord).Error; err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Erro ao salvar registro de pagamento", "details": err.Error()})
    }
    
    
    // -------------------------
    // 3. Fechar a Mesa (UPDATE)
    // -------------------------
   now := time.Now()
// O GORM precisa de um ponteiro para o campo ClosedAt
	updateData := models.StatusTable{IsOpen: false, ClosedAt: &now}

// CORREÇÃO: Usamos statusTable.ID (o ID da linha no DB que acabamos de carregar)
	updateResult := tx.Model(&statusTable).
    Where("id = ?", statusTable.ID).
    Select("IsOpen", "ClosedAt"). // <--- ESPECIFICANDO OS CAMPOS A SEREM ATUALIZADOS
    Updates(updateData)

	
    if updateResult.Error != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Erro ao fechar a mesa", "details": updateResult.Error.Error()})
    }

    if updateResult.RowsAffected == 0 {
        return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "Não foi possível fechar a mesa. Status pode ter sido alterado."})
    }
    

    // -------------------------
    // 4. COMITAR A TRANSAÇÃO
    // -------------------------
    if err := tx.Commit().Error; err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Erro ao commitar transação", "details": err.Error()})
    }
    committed = true

    // 5. Retornar Sucesso
    return c.JSON(fiber.Map{
        "message": fmt.Sprintf("Pagamento registrado e Mesa %d fechada com sucesso!", tableNumber),
        "table_id": statusTable.ID, // Retorna o ID do registro de status
        "payment_id": paymentRecord.ID, 
    })
}
