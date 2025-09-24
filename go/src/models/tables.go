package models

import "time"

// Table representa só as colunas que você quer no banco.
// Todas as tags usam `column:` explicitamente para evitar surpresas de pluralização/nomes.
type StatusTable struct {
	ID          uint       `gorm:"column:id;primaryKey;autoIncrement"`
	Number      int        `gorm:"column:number;not null"`
	LastOrderAt *time.Time `gorm:"column:last_order_at"`
	OpenedAt    *time.Time `gorm:"column:opened_at"`
	ClosedAt    *time.Time `gorm:"column:closed_at"`
	ServiceID   *uint      `gorm:"column:service_id"`
	IsOpen      bool       `gorm:"column:is_open;not null;default:false"`
}

// Garante o nome exato da tabela e evita pluralização/inflections
func (StatusTable) TableName() string {
	return "status_tables"
}