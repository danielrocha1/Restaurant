package models

import ("time"
	"gorm.io/gorm"
	
)

type Order struct {
	ID         uint           `gorm:"primaryKey"`
	NomeLoja   string
	Mesa       int
	QRCode     string
	Total      string
	Status     string
	IDProdutos	string
	Timestamp  time.Time
	Produtos   []Produto `gorm:"many2many:produtos;"`
	DeletedAt  gorm.DeletedAt `gorm:"index"`
}