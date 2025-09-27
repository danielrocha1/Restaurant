package models
<<<<<<< HEAD

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
=======

import "time"

type Table struct {
	ID          uint       `gorm:"primaryKey"`
	Number      int        `gorm:"index;not null"`   // número fixo da mesa
	LastOrderAt *time.Time `gorm:"index"`
	OpenedAt    *time.Time `gorm:"index"`
	ClosedAt    *time.Time `gorm:"index"`
	ServiceID   *uint      `gorm:"index"`
	IsOpen      bool       `gorm:"not null;default:false;index"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

func (Table) TableName() string { return "tables" }
>>>>>>> 5e6290a (tables)
