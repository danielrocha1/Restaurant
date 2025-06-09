package models

type Categoria struct {
	ID            uint           `gorm:"primaryKey"`
	Nome          string         `gorm:"size:255"`
	Subcategorias []Subcategoria `gorm:"foreignKey:CategoriaID"`
}

func (Categoria) TableName() string {
	return "categorias"
}

type Subcategoria struct {
	ID          uint      `gorm:"primaryKey"`
	Nome        string    `gorm:"size:255"`
	CategoriaID uint      `gorm:"column:categoria_id"`
	Categoria   Categoria `gorm:"foreignKey:CategoriaID"` // associação explícita
}

func (Subcategoria) TableName() string {
	return "subcategorias"
}
