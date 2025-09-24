package models

import "time"

type Table struct {
	ID          uint       `gorm:"primaryKey;autoIncrement"`
	Number      int        `gorm:"not null"` // número fixo da mesa
	LastOrderAt *time.Time
	OpenedAt    *time.Time
	ClosedAt    *time.Time
	ServiceID   *uint
	IsOpen      bool       `gorm:"not null;default:false"`
}
