package models

import (
	"gorm.io/gorm"
)

func (Produto) TableName() string {
	return "produtos"
}



type Produto struct {
	gorm.Model
	ID             uint           `gorm:"primaryKey"`
	Active		   bool
	Nome           string         `gorm:"size:255"`
	Descricao      string         `gorm:"type:text"`
	Preco          string         `gorm:"size:255"`
	PrecoPromocional          string         `gorm:"size:255"`
	Imagem         string         `gorm:"size:512"`
	SubcategoriaID uint           `gorm:"column:subcategoria_id"`
	Subcategoria   Subcategoria   `gorm:"foreignKey:SubcategoriaID"`
	DeletedAt      gorm.DeletedAt `gorm:"index"`
}
