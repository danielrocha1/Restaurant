package models

import ("time"
	"gorm.io/gorm"
	
)


// Order (Pedido)
type Order struct {
	ID         uint              `gorm:"primaryKey"`
	NomeLoja   string            `gorm:"not null"`
	MesaID       uint               `gorm:"not null"`
	QRCode     string            `gorm:"index"`
	Total      float64           `gorm:"not null;default:0"`
	Status     string            `gorm:"default:'pendente'"`
	CreatedAt  time.Time
	DeletedAt  gorm.DeletedAt    `gorm:"index"`
	Items      []OrderItem       `gorm:"constraint:OnDelete:CASCADE;"`
}

// OrderItem (linha do pedido: referência ao produto + quantidade)
type OrderItem struct {
	ID        uint           `gorm:"primaryKey"`
	OrderID   uint           `gorm:"index;not null"`
	ProdutoID uint           `gorm:"index;not null"`
	Quantidade uint          `gorm:"not null;default:1"`
	PrecoUnitario uint    `gorm:"not null"` // fixa o preço do produto no momento do pedido
	CreatedAt time.Time

	// relações
	Produto   Produto        `gorm:"foreignKey:ProdutoID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`
}