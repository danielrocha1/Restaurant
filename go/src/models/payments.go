package models

import "gorm.io/gorm"

// --- Payload de Entrada (Input da API) ---
// Note que "value" é o valor em centavos (int)
type Payment struct {
    ID             int64  `json:"id"`
    Method         string `json:"method"`
    MethodLabel    string `json:"methodLabel"`
    Value          int    `json:"value"` // Centavos (ex: 20000)
    ValueCentavos  int    `json:"value_centavos"`
    ValueReais     float64 `json:"value_reais"` // Float, mas só para visualização/log
}

// TransactionSummary é o payload completo que vem do React.
// Todos os campos numéricos são INTEIROS (exceto changeDue e value_reais)
type TransactionSummary struct {
    ChangeDue    string    `json:"changeDue"` // Mantido como string ("58.03")
    Payments     []Payment `json:"payments"`
    TableID      uint      `json:"tableID"`
    TableNumber  uint      `json:"tableNumber"`
    TotalPaid    int       `json:"totalPaid"` // <--- Corrigido para INT (Centavos)
}

// --- Modelo GORM para o Banco de Dados ---
// É o que será migrado e salvo.
type PaymentRecord struct {
    gorm.Model           
	TotalTransaction   int       `gorm:"column:total_transaction"`
    MesaID               uint      `gorm:"index"` 
    ChangeDue            string    
    PaymentJSON          string    `gorm:"type:jsonb"` // JSON serializado de Payments
    Status               string    `gorm:"default:completed"` 
}