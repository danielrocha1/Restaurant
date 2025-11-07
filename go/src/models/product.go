package models

import (
	"gorm.io/gorm"
)

func (Produto) TableName() string {
	return "produtos"
}



type Produto struct {
	gorm.Model
	Active         bool
	Nome           string         `gorm:"size:255"`
	Descricao      string         `gorm:"type:text"`
	Preco          uint           `gorm:"size:255"`
	PrecoPromocional uint         `gorm:"size:255"`
	Imagem         string         `gorm:"size:512"`
	SubcategoriaID uint           `gorm:"column:subcategoria_id"`
	Subcategoria   Subcategoria   `gorm:"foreignKey:SubcategoriaID"`
}


type OrderProduto struct {
	gorm.Model
	ProdutoID  uint
	OrderID    uint
	Quantity   uint
}
