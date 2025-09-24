package handlers

import (
	"net/http"
	"time"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"Restaurant/src/models"
)

type TablePayload struct {
	Number    int   `json:"number"`
	ServiceID *uint `json:"service_id,omitempty"`
}

// POST /tables/activity
// Se mesa aberta -> atualiza last_order_at
// Se mesa fechada -> cria nova sessão aberta
func TouchOrOpenTable(db *gorm.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var body TablePayload
		if err := c.BodyParser(&body); err != nil || body.Number <= 0 {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "body inválido"})
		}

		now := time.Now().UTC()
		var current models.Table

		err := db.Transaction(func(tx *gorm.DB) error {
			q := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
				Where("number = ? AND is_open = ?", body.Number, true).
				Order("opened_at DESC")

			if err := q.First(&current).Error; err != nil {
				if err == gorm.ErrRecordNotFound {
					// não tem mesa aberta -> cria nova
					current = models.Table{
						Number:      body.Number,
						IsOpen:      true,
						OpenedAt:    &now,
						LastOrderAt: &now,
						ServiceID:   body.ServiceID,
					}
					return tx.Create(&current).Error
				}
				return err
			}

			// mesa já aberta -> só atualiza last_order_at
			current.LastOrderAt = &now
			if body.ServiceID != nil {
				current.ServiceID = body.ServiceID
			}
			return tx.Save(&current).Error
		})

		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
				"error":  "falha ao registrar atividade",
				"detail": err.Error(),
			})
		}

		return c.Status(http.StatusOK).JSON(current)
	}
}

// POST /tables/close
func CloseTable(db *gorm.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var body TablePayload
		if err := c.BodyParser(&body); err != nil || body.Number <= 0 {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "body inválido"})
		}

		now := time.Now().UTC()
		var current models.Table

		if err := db.Where("number = ? AND is_open = ?", body.Number, true).
			Order("opened_at DESC").
			First(&current).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "nenhuma sessão aberta"})
			}
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "erro ao buscar sessão"})
		}

		current.IsOpen = false
		current.ClosedAt = &now

		if err := db.Save(&current).Error; err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "erro ao fechar mesa"})
		}

		return c.Status(http.StatusOK).JSON(current)
	}
}

// POST /tables/open
func GetOpenTable(db *gorm.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var body TablePayload
		if err := c.BodyParser(&body); err != nil || body.Number <= 0 {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "body inválido"})
		}

		var current models.Table
		if err := db.Where("number = ? AND is_open = ?", body.Number, true).
			Order("opened_at DESC").
			First(&current).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "mesa sem sessão aberta"})
			}
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "erro ao buscar mesa"})
		}

		return c.Status(http.StatusOK).JSON(current)
	}
}

// POST /tables/history
func ListTableHistory(db *gorm.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var body TablePayload
		if err := c.BodyParser(&body); err != nil || body.Number <= 0 {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "body inválido"})
		}

		var rows []models.Table
		if err := db.Where("number = ?", body.Number).
			Order("opened_at DESC NULLS LAST, id DESC").
			Find(&rows).Error; err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "erro ao listar histórico"})
		}

		return c.Status(http.StatusOK).JSON(rows)
	}
}