package handlers

import (
	"net/http"
	"time"

	"Restaurant/src/database"

	"github.com/gofiber/fiber/v2"
)

// ---------- MODELOS DE RETORNO ----------
type DailySales struct {
	Dia           time.Time `json:"dia"`
	VendasDiarias float64   `json:"vendas_diarias"`
}

type TodayInfo struct {
	TotalVendidoHoje float64 `json:"total_vendido_hoje"`
	TotalPedidosHoje int64   `json:"total_pedidos_hoje"`
	TicketMedioHoje  float64 `json:"ticket_medio_hoje"`
}

type TopItem struct {
	ProdutoNome            string  `json:"produto_nome"`
	TotalQuantidadeVendida int64   `json:"total_quantidade_vendida"`
	ReceitaGerada          float64 `json:"receita_gerada"`
}

type DateRequest struct {
	Date string `json:"date"`
}

// helper: parse date (se invalida -> retorna erro)
func parseDateOrToday(dateStr string) (time.Time, error) {
	if dateStr == "" {
		return time.Now(), nil
	}
	t, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		// tentar parse com layout completo (caso venha timestamp)
		t, err2 := time.Parse(time.RFC3339, dateStr)
		if err2 == nil {
			return t, nil
		}
		return time.Time{}, err
	}
	return t, nil
}

// ---------- ENDPOINTS ----------

// 1️⃣ Vendas diárias do mês da data enviada
func GetDailySales(c *fiber.Ctx) error {
	var req DateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "body inválido", "detail": err.Error()})
	}

	date, err := parseDateOrToday(req.Date)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "formato de data inválido, use YYYY-MM-DD", "detail": err.Error()})
	}

	// usar a data formatada como string para a query
	dateStr := date.Format("2006-01-02")

	var results []DailySales
	query := `
		SELECT
			DATE(order_created_at) AS dia,
			COALESCE(SUM(receita_item),0) AS vendas_diarias
		FROM financial_metrics_view
		WHERE EXTRACT(MONTH FROM order_created_at) = EXTRACT(MONTH FROM ?::date)
			AND EXTRACT(YEAR FROM order_created_at) = EXTRACT(YEAR FROM ?::date)
		GROUP BY dia
		ORDER BY dia;
	`
	if err := database.DB.Raw(query, dateStr, dateStr).Scan(&results).Error; err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "erro na query", "detail": err.Error()})
	}
	return c.JSON(results)
}

// 2️⃣ Informações consolidadas do dia da data enviada
func GetDayInfo(c *fiber.Ctx) error {
	var req DateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "body inválido", "detail": err.Error()})
	}

	date, err := parseDateOrToday(req.Date)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "formato de data inválido, use YYYY-MM-DD", "detail": err.Error()})
	}
	dateStr := date.Format("2006-01-02")

	var result TodayInfo
	query := `
		SELECT
			COALESCE(SUM(total_pago_real), 0) AS total_vendido_hoje,
			COALESCE(COUNT(DISTINCT order_id), 0) AS total_pedidos_hoje,
			CASE 
				WHEN COUNT(DISTINCT order_id) > 0 
				THEN SUM(total_pago_real) / COUNT(DISTINCT order_id)
				ELSE 0 
			END AS ticket_medio_hoje
		FROM financial_metrics_view
		WHERE DATE(order_created_at) = ?::date;
	`
	if err := database.DB.Raw(query, dateStr).Scan(&result).Error; err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "erro na query", "detail": err.Error()})
	}
	return c.JSON(result)
}

// 3️⃣ Itens mais vendidos da data enviada
func GetTopItemsByDate(c *fiber.Ctx) error {
	var req DateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "body inválido", "detail": err.Error()})
	}

	date, err := parseDateOrToday(req.Date)
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "formato de data inválido, use YYYY-MM-DD", "detail": err.Error()})
	}
	dateStr := date.Format("2006-01-02")

	var results []TopItem
	query := `
		SELECT
			produto_nome,
			COALESCE(SUM(quantidade),0) AS total_quantidade_vendida,
			COALESCE(SUM(receita_item),0) AS receita_gerada
		FROM financial_metrics_view
		WHERE DATE(order_created_at) = ?::date
		GROUP BY produto_nome
		ORDER BY total_quantidade_vendida DESC, receita_gerada DESC
		LIMIT 4;
	`
	if err := database.DB.Raw(query, dateStr).Scan(&results).Error; err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "erro na query", "detail": err.Error()})
	}
	return c.JSON(results)
}

// 4️⃣ Health check (opcional)
func HealthCheck(c *fiber.Ctx) error {
	var count int64
	if err := database.DB.Table("financial_metrics_view").Count(&count).Error; err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"status": "error", "error": err.Error()})
	}
	return c.JSON(fiber.Map{
		"status": "ok",
		"rows":   count,
	})
}
