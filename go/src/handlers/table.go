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
		var body struct{
			ID uint 
		} // nenhum dado necessário do body

		_ = c.BodyParser(&body) // ignoramos erros, pois não precisamos de campos

		// Consulta todas as mesas abertas
		rows, err := db.Raw("SELECT * FROM view_transacoes_mesa WHERE mesa_id = ?", body.ID).Rows()
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
// A estrutura para o resultado da consulta SQL
type TableSummary struct {
    ID              uint       `json:"id" gorm:"column:id"`
    Number          int        `json:"number" gorm:"column:number"`
    LastOrderAt     *time.Time `json:"last_order_at" gorm:"column:last_order_at"` // Ponteiro, pois pode ser NULL
    OpenedAt        time.Time  `json:"opened_at" gorm:"column:opened_at"`
    ClosedAt        *time.Time `json:"closed_at" gorm:"column:closed_at"` // Ponteiro, pois pode ser NULL/tem a data de fechamento
    ServiceID       *uint      `json:"service_id" gorm:"column:service_id"` // Assumindo uint ou int, e ponteiro para ser NULL
    IsOpen          bool       `json:"is_open" gorm:"column:is_open"`

    // Campo agregado do JOIN
    TotalOrderValue float64 `json:"total_order_value" gorm:"column:total_order_value"`
}

func ViewTablesOnDate(db *gorm.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var body struct {
			Date string `json:"date"` // formato esperado: "YYYY-MM-DD"
		}

		if err := c.BodyParser(&body); err != nil || body.Date == "" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Corpo inválido ou data ausente (formato esperado da data: 'YYYY-MM-DD')",
			})
		}

		// Carrega timezone do usuário
		loc, err := time.LoadLocation("America/Sao_Paulo")
		if err != nil {
			loc = time.UTC
		}

		userDate, err := time.ParseInLocation("2006-01-02", body.Date, loc)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Formato de data inválido. Use 'YYYY-MM-DD'",
			})
		}

		// Intervalo do dia
		startLocal := time.Date(userDate.Year(), userDate.Month(), userDate.Day(), 0, 0, 0, 0, loc)
		endLocal := startLocal.Add(24 * time.Hour)

		// Converte para UTC, assumindo que created_at está em UTC
		startUTC := startLocal.UTC()
		endUTC := endLocal.UTC()

		// Query SQL sem prepared statement (evita erro de "prepared statement already in use")
		query := `
			SELECT
				st.*,
				COALESCE(SUM(o.total)::numeric, 0) / 100.0 AS total_order_value
			FROM status_tables st
			LEFT JOIN orders o ON o.mesa_id = st.id
			WHERE st.created_at >= ? 
			  AND st.created_at < ?
			GROUP BY st.id
			ORDER BY st.created_at DESC
		`

		var results []TableSummary

		if err := db.Session(&gorm.Session{PrepareStmt: false}).
			Raw(query, startUTC, endUTC).
			Scan(&results).Error; err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error":  "Erro ao consultar mesas do dia",
				"detail": err.Error(),
			})
		}

		return c.Status(fiber.StatusOK).JSON(results)
	}
}
