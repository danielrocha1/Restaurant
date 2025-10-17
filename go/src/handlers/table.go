package handlers

import (
	"net/http"
	"time"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"

	"Restaurant/src/models"
	"encoding/json"
	"database/sql"
)

type TablePayload struct {
	Number    uint   `json:"number"`
	ServiceID *uint `json:"service_id,omitempty"`
}
 
// POST /tables/close
func CloseTable(db *gorm.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var body TablePayload
		if err := c.BodyParser(&body); err != nil || body.Number <= 0 {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "body inválido"})
		}

		now := time.Now().UTC()
		var current models.StatusTable

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


func ViewOpenTables(db *gorm.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Consulta todas as mesas abertas
		rows, err := db.Raw("SELECT * FROM status_tables WHERE is_open = true").Rows()
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
				"error":  "erro ao consultar status_table",
				"detail": err.Error(),
			})
		}
		defer rows.Close()

		cols, err := rows.Columns()
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
				"error":  "erro ao ler colunas",
				"detail": err.Error(),
			})
		}

		results := make([]map[string]interface{}, 0)

		for rows.Next() {
			values := make([]interface{}, len(cols))
			valuePtrs := make([]interface{}, len(cols))
			for i := range values {
				valuePtrs[i] = &values[i]
			}

			if err := rows.Scan(valuePtrs...); err != nil {
				return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
					"error":  "erro ao fazer scan das linhas",
					"detail": err.Error(),
				})
			}

			rowMap := make(map[string]interface{}, len(cols))
			for i, col := range cols {
				v := values[i]

				if b, ok := v.([]byte); ok {
					var maybeJSON interface{}
					if json.Unmarshal(b, &maybeJSON) == nil {
						rowMap[col] = maybeJSON
					} else {
						rowMap[col] = string(b)
					}
				} else if v == nil {
					rowMap[col] = nil
				} else if val, ok := v.(sql.NullString); ok {
					if val.Valid {
						rowMap[col] = val.String
					} else {
						rowMap[col] = nil
					}
				} else {
					rowMap[col] = v
				}
			}

			results = append(results, rowMap)
		}

		return c.Status(http.StatusOK).JSON(results)
	}
}


// POST /tables/history
func ViewListTable(db *gorm.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var body TablePayload
		if err := c.BodyParser(&body); err != nil || body.Number <= 0 {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "body inválido"})
		}

		// Consulta a view — filtra por mesa_id; troque para order_id se quiser.
		rows, err := db.Raw("SELECT * FROM view_pedidos_abertos_com_produtos_json WHERE mesa_id = ?", body.Number).Rows()
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "erro ao consultar view", "detail": err.Error()})
		}
		defer rows.Close()

		cols, err := rows.Columns()
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "erro ao ler colunas", "detail": err.Error()})
		}

		results := make([]map[string]interface{}, 0)

		for rows.Next() {
			// prepara pointers
			values := make([]interface{}, len(cols))
			valuePtrs := make([]interface{}, len(cols))
			for i := range values {
				valuePtrs[i] = &values[i]
			}

			if err := rows.Scan(valuePtrs...); err != nil {
				return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "erro ao fazer scan das linhas", "detail": err.Error()})
			}

			rowMap := make(map[string]interface{}, len(cols))
			for i, col := range cols {
				var v interface{} = values[i]

				// Postgres driver frequentemente retorna []byte para text/json
				if b, ok := v.([]byte); ok {
					// tenta desserializar JSON (para 'produtos' por exemplo)
					var maybeJSON interface{}
					if json.Unmarshal(b, &maybeJSON) == nil {
						rowMap[col] = maybeJSON
					} else {
						// se não for JSON válido, retornar string
						rowMap[col] = string(b)
					}
				} else if v == nil {
					rowMap[col] = nil
				} else if val, ok := v.(sql.NullString); ok {
					// lidar com sql.NullString se driver usar isso
					if val.Valid {
						rowMap[col] = val.String
					} else {
						rowMap[col] = nil
					}
				} else {
					rowMap[col] = v
				}
			}

			results = append(results, rowMap)
		}

		// retornar array (mesmo vazio) — assim você sempre tem consistência no frontend
		return c.Status(http.StatusOK).JSON(results)
	}
}



// POST /tables/history
func ListTableHistory(db *gorm.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var body TablePayload
		if err := c.BodyParser(&body); err != nil || body.Number <= 0 {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "body inválido"})
		}

		var rows []models.StatusTable
		if err := db.Where("number = ?", body.Number).
			Order("opened_at DESC NULLS LAST, id DESC").
			Find(&rows).Error; err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "erro ao listar histórico"})
		}

		return c.Status(http.StatusOK).JSON(rows)
	}
}


// POST /tables/open
func ViewClosedTables(db *gorm.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Aqui podemos receber filtros opcionais no body, mas vamos manter simples
		var body struct{} // nenhum dado necessário do body

		_ = c.BodyParser(&body) // ignoramos erros, pois não precisamos de campos

		// Consulta todas as mesas abertas
		rows, err := db.Raw("SELECT * FROM status_tables WHERE is_open = false").Rows()
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
				"error":  "erro ao consultar status_table",
				"detail": err.Error(),
			})
		}
		defer rows.Close()

		cols, err := rows.Columns()
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
				"error":  "erro ao ler colunas",
				"detail": err.Error(),
			})
		}

		results := make([]map[string]interface{}, 0)

		for rows.Next() {
			values := make([]interface{}, len(cols))
			valuePtrs := make([]interface{}, len(cols))
			for i := range values {
				valuePtrs[i] = &values[i]
			}

			if err := rows.Scan(valuePtrs...); err != nil {
				return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
					"error":  "erro ao fazer scan das linhas",
					"detail": err.Error(),
				})
			}

			rowMap := make(map[string]interface{}, len(cols))
			for i, col := range cols {
				v := values[i]

				if b, ok := v.([]byte); ok {
					var maybeJSON interface{}
					if json.Unmarshal(b, &maybeJSON) == nil {
						rowMap[col] = maybeJSON
					} else {
						rowMap[col] = string(b)
					}
				} else if v == nil {
					rowMap[col] = nil
				} else if val, ok := v.(sql.NullString); ok {
					if val.Valid {
						rowMap[col] = val.String
					} else {
						rowMap[col] = nil
					}
				} else {
					rowMap[col] = v
				}
			}

			results = append(results, rowMap)
		}

		return c.Status(http.StatusOK).JSON(results)
	}
}

// POST /tables/closed
func ViewClosedTablesOnDate(db *gorm.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var body struct {
			Date string `json:"date"`
		}

		if err := c.BodyParser(&body); err != nil || body.Date == "" {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{
				"error": "corpo inválido ou data ausente",
			})
		}

		rows, err := db.Raw(`
			SELECT * FROM status_tables 
			WHERE is_open = false 
			AND DATE(closed_at) = ?
		`, body.Date).Rows()
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
				"error":  "erro ao consultar status_table",
				"detail": err.Error(),
			})
		}
		defer rows.Close()

		cols, err := rows.Columns()
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
				"error":  "erro ao ler colunas",
				"detail": err.Error(),
			})
		}

		results := make([]map[string]interface{}, 0)
		for rows.Next() {
			values := make([]interface{}, len(cols))
			valuePtrs := make([]interface{}, len(cols))
			for i := range values {
				valuePtrs[i] = &values[i]
			}
			if err := rows.Scan(valuePtrs...); err != nil {
				return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
					"error":  "erro ao fazer scan das linhas",
					"detail": err.Error(),
				})
			}

			rowMap := make(map[string]interface{}, len(cols))
			for i, col := range cols {
				v := values[i]
				if b, ok := v.([]byte); ok {
					var maybeJSON interface{}
					if json.Unmarshal(b, &maybeJSON) == nil {
						rowMap[col] = maybeJSON
					} else {
						rowMap[col] = string(b)
					}
				} else {
					rowMap[col] = v
				}
			}
			results = append(results, rowMap)
		}

		return c.Status(http.StatusOK).JSON(results)
	}
}
