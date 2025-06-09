package handlers

import (
	"Restaurant/src/database"
	"Restaurant/src/models"
	"fmt"

	"github.com/gofiber/fiber/v2"
)

// GET /categorias/:id
func GetCategoria(c *fiber.Ctx) error {
	id := c.Params("id")
	var categoria models.Categoria
	if err := database.DB.First(&categoria, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Categoria não encontrada"})
	}
	return c.JSON(categoria)
}

// POST /categorias
func CreateCategoria(c *fiber.Ctx) error {
	var categoria models.Categoria
	if err := c.BodyParser(&categoria); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Erro ao fazer o parse da requisição"})
	}

	if categoria.Nome == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Nome é obrigatório"})
	}

	if err := database.DB.Create(&categoria).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Erro ao criar categoria"})
	}
	return c.Status(201).JSON(categoria)
}

// PUT /categorias/:id
func UpdateCategoria(c *fiber.Ctx) error {
	id := c.Params("id")
	var categoria models.Categoria

	if err := database.DB.First(&categoria, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Categoria não encontrada"})
	}

	var input models.Categoria
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Erro ao fazer o parse da requisição"})
	}

	categoria.Nome = input.Nome

	if err := database.DB.Save(&categoria).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Erro ao atualizar categoria"})
	}
	return c.JSON(categoria)
}

// DELETE /categorias/:id
func DeleteCategoria(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := database.DB.Delete(&models.Categoria{}, id).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Erro ao deletar categoria"})
	}
	return c.SendStatus(204)
}

// GET /categorias
func GetCategorias(c *fiber.Ctx) error {
	var categorias []models.Categoria
	if err := database.DB.Find(&categorias).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Erro ao buscar categorias"})
	}
	return c.JSON(categorias)
}

// GET /categorias-com-subcategorias
func GetCategoriasSub(c *fiber.Ctx) error {
		var categorias []models.Categoria
	if err := database.DB.Preload("Subcategorias").Find(&categorias).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Erro ao buscar categorias com subcategorias"})
	}
	fmt.Println(categorias)
	return c.JSON(categorias)
}
