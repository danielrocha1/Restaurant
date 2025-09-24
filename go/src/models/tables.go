package models

import "time"

type Table struct {
	ID          uint       `gorm:"primaryKey"`
	Number      int        `gorm:"index;not null"`          // número fixo da mesa
	LastOrderAt *time.Time `gorm:"index"`
	OpenedAt    *time.Time `gorm:"index"`
	ClosedAt    *time.Time `gorm:"index"`
	ServiceID   *uint      `gorm:"index"`
	IsOpen      bool       `gorm:"not null;default:false;index"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

func (Table) TableName() string { return "tables" }