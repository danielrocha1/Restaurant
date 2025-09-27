package handlers

import (
	"net/http"
	"time"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

    "Restaurant/src/models"

)

// POST /tables/:number/activity
// - Se existir sessão aberta (is_open=true) p/ a mesa -> atualiza last_order_at (ping)
// - Se NÃO existir sessão aberta -> cria nova linha (novo ID) com is_open=true
type UpsertTablePayload struct {
	ServiceID *uint `json:"service_id,omitempty"`
}

func TouchOrOpenTable(db *gorm.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		number, err := c.ParamsInt("number")
		if err != nil || number <= 0 {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "number inválido"})
		}

		var body UpsertTablePayload
		_ = c.BodyParser(&body)

		now := time.Now()
		var current models.Table

		err = db.Transaction(func(tx *gorm.DB) error {
			// Lock pessimista nas possíveis linhas da mesa
			q := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
				Where("number = ? AND is_open = ?", number, true).
				Order("opened_at DESC")

			if err := q.First(&current).Error; err != nil {
				if err == gorm.ErrRecordNotFound {
					// Não há sessão aberta -> cria nova linha (novo ID)
					current = models.Table{
						Number:      number,
						IsOpen:      true,
						OpenedAt:    &now,
						LastOrderAt: &now,
						ServiceID:   body.ServiceID,
					}
					return tx.Create(&current).Error
				}
				return err
			}

			// Há sessão aberta -> apenas ping (atualiza last_order_at)
			current.LastOrderAt = &now
			if body.ServiceID != nil {
				current.ServiceID = body.ServiceID
			}
			return tx.Save(&current).Error
		})

		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
				"error":  "falha ao registrar atividade da mesa",
				"detail": err.Error(),
			})
		}

		return c.Status(http.StatusOK).JSON(current)
	}
}

// POST /tables/:number/close
// Fecha a sessão aberta da mesa (se houver). Não cria nada novo aqui.
func CloseTable(db *gorm.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		number, err := c.ParamsInt("number")
		if err != nil || number <= 0 {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "number inválido"})
		}

		now := time.Now()
		var current models.Table

		// fecha somente a sessão aberta mais recente
		if err := db.Where("number = ? AND is_open = ?", number, true).
			Order("opened_at DESC").First(&current).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "nenhuma sessão aberta para esta mesa"})
			}
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "erro ao buscar sessão aberta"})
		}

		current.IsOpen = false
		current.ClosedAt = &now

		if err := db.Save(&current).Error; err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "erro ao fechar a mesa"})
		}

		return c.Status(http.StatusOK).JSON(current)
	}
}

// GET /tables/:number/open
// Retorna a sessão aberta (se existir)
func GetOpenTable(db *gorm.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		number, err := c.ParamsInt("number")
		if err != nil || number <= 0 {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "number inválido"})
		}

		var current models.Table
		if err := db.Where("number = ? AND is_open = ?", number, true).
			Order("opened_at DESC").First(&current).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "mesa sem sessão aberta"})
			}
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "erro ao buscar mesa"})
		}
		return c.Status(http.StatusOK).JSON(current)
	}
}

// GET /tables/:number/history
// Histórico de sessões da mesa (abertas/fechadas), mais recente primeiro
func ListTableHistory(db *gorm.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		number, err := c.ParamsInt("number")
		if err != nil || number <= 0 {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "number inválido"})
		}

		var rows []models.Table
		if err := db.Where("number = ?", number).
			Order("opened_at DESC NULLS LAST, id DESC").
			Find(&rows).Error; err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "erro ao listar histórico"})
		}
		return c.Status(http.StatusOK).JSON(rows)
	}
}
