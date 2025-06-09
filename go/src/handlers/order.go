package handlers

import (
	"Restaurant/src/database"
	"Restaurant/src/models"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
)

func GetOrders(c *fiber.Ctx) error {
	var orders []models.Order
	if err := database.DB.Find(&orders).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Erro ao buscar pedidos"})
	}

	for i, order := range orders {
		if order.IDProdutos == "" {
			continue
		}

		// Separar string por vírgula, ex: "1,2,3"
		raw := strings.ReplaceAll(order.IDProdutos, "[", "")
		raw = strings.ReplaceAll(raw, "]", "")
		raw = strings.ReplaceAll(raw, "{", "")
		raw = strings.ReplaceAll(raw, "}", "")

		strIDs := strings.Split(raw, ",")
		var intIDs []int
		for _, idStr := range strIDs {
			id, err := strconv.Atoi(strings.TrimSpace(idStr))
			if err == nil {
				intIDs = append(intIDs, id)
			}
		}

		fmt.Println(intIDs)
		// Buscar os produtos por ID
		var produtos []models.Produto
		if len(intIDs) > 0 {
			if err := database.DB.Where("id IN ?", intIDs).Find(&produtos).Error; err != nil {
				return c.Status(500).JSON(fiber.Map{"error": "Erro ao buscar produtos"})
			}
		}

		orders[i].Produtos = produtos
	}

	return c.JSON(orders)
}


func GetOrder(c *fiber.Ctx) error {
	id := c.Params("id")
	var order models.Order
	if err := database.DB.First(&order, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Pedido não encontrado"})
	}
	return c.JSON(order)
}

func CreateOrder(c *fiber.Ctx) error {
	order := new(models.Order)
	if err := c.BodyParser(order); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Erro no corpo da requisição"})
	}

	order.Timestamp = time.Now()

	if err := database.DB.Create(&order).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Erro ao criar pedido"})
	}

	return c.Status(201).JSON(order)
}

func UpdateOrder(c *fiber.Ctx) error {
	id := c.Params("id")
	var order models.Order
	if err := database.DB.First(&order, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Pedido não encontrado"})
	}

	updateData := new(models.Order)
	if err := c.BodyParser(updateData); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Erro no corpo da requisição"})
	}

	// Atualiza os campos (incluindo status)
	order.NomeLoja = updateData.NomeLoja
	order.Mesa = updateData.Mesa
	order.QRCode = updateData.QRCode
	order.Total = updateData.Total
	order.Status = updateData.Status

	if err := database.DB.Save(&order).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Erro ao atualizar pedido"})
	}

	return c.JSON(order)
}

func DeleteOrder(c *fiber.Ctx) error {
	id := c.Params("id")
	idNum, err := strconv.Atoi(id)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "ID inválido"})
	}

	if err := database.DB.Delete(&models.Order{}, idNum).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Erro ao deletar pedido"})
	}

	return c.SendStatus(204)
}
