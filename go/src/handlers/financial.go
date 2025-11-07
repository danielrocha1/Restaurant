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

// parseDateOrToday tenta converter uma string de data para time.Time, ou retorna o dia atual.
func parseDateOrToday(dateStr string) (time.Time, error) {
	if dateStr == "" {
		return time.Now(), nil
	}
	t, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		t, err2 := time.Parse(time.RFC3339, dateStr)
		if err2 == nil {
			return t, nil
		}
		return time.Time{}, err
	}
	return t, nil
}

// ---------- ENDPOINTS ----------

// SQL para vendas diárias do mês
const queryDailySales = `
	SELECT
		DATE(order_created_at) AS dia,
		COALESCE(SUM(receita_item),0) AS vendas_diarias
	FROM financial_metrics_view
	WHERE EXTRACT(MONTH FROM order_created_at) = EXTRACT(MONTH FROM ?::date)
		AND EXTRACT(YEAR FROM order_created_at) = EXTRACT(YEAR FROM ?::date)
	GROUP BY dia
	ORDER BY dia;
`

// GetDailySales retorna as vendas diárias do mês da data enviada.
func GetDailySales(c *fiber.Ctx) error {
	var req DateRequest
	if err := c.BodyParser(&req); err != nil {
		// log.Printf("[FINANCIAL] Erro ao fazer parse do body: %v", err)
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Body inválido"})
	}
	date, err := parseDateOrToday(req.Date)
	if err != nil {
		// log.Printf("[FINANCIAL] Erro ao converter data: %v", err)
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Formato de data inválido, use YYYY-MM-DD"})
	}
	dateStr := date.Format("2006-01-02")
	var results []DailySales
	if err := database.DB.Raw(queryDailySales, dateStr, dateStr).Scan(&results).Error; err != nil {
		// log.Printf("[FINANCIAL] Erro ao consultar vendas diárias: %v", err)
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Erro ao consultar vendas diárias"})
	}
	return c.JSON(results)
}

// SQL para informações consolidadas do dia
const queryDayInfo = `
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

// GetDayInfo retorna informações consolidadas do dia da data enviada.
func GetDayInfo(c *fiber.Ctx) error {
	var req DateRequest
	if err := c.BodyParser(&req); err != nil {
		// log.Printf("[FINANCIAL] Erro ao fazer parse do body: %v", err)
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Body inválido"})
	}
	date, err := parseDateOrToday(req.Date)
	if err != nil {
		// log.Printf("[FINANCIAL] Erro ao converter data: %v", err)
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Formato de data inválido, use YYYY-MM-DD"})
	}
	dateStr := date.Format("2006-01-02")
	var result TodayInfo
	if err := database.DB.Raw(queryDayInfo, dateStr).Scan(&result).Error; err != nil {
		// log.Printf("[FINANCIAL] Erro ao consultar informações do dia: %v", err)
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Erro ao consultar informações do dia"})
	}
	return c.JSON(result)
}

// SQL para receita diária do mês
const queryDayToMonthly = `
	SELECT
		DATE(order_created_at) AS day,
		ROUND(SUM(total_pago_real))::bigint AS receita,
		COUNT(DISTINCT order_id)::bigint AS total_pedidos
	FROM financial_metrics_view
	WHERE DATE(order_created_at) BETWEEN ?::date AND ?::date
	GROUP BY DATE(order_created_at)
	ORDER BY DATE(order_created_at) ASC;
`

// DailyRevenue representa receita e pedidos por dia
type DailyRevenue struct {
	Day          string `json:"day"`
	Receita      int64  `json:"receita"`
	TotalPedidos int64  `json:"total_pedidos"`
}

// GetDayToMonthlyInfo retorna receita e pedidos por dia do mês até a data enviada.
func GetDayToMonthlyInfo(c *fiber.Ctx) error {
	var req DateRequest
	if err := c.BodyParser(&req); err != nil {
		// log.Printf("[FINANCIAL] Erro ao fazer parse do body: %v", err)
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Body inválido"})
	}
	date, err := parseDateOrToday(req.Date)
	if err != nil {
		// log.Printf("[FINANCIAL] Erro ao converter data: %v", err)
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Formato de data inválido, use YYYY-MM-DD"})
	}
	loc := date.Location()
	startOfMonth := time.Date(date.Year(), date.Month(), 1, 0, 0, 0, 0, loc)
	startStr := startOfMonth.Format("2006-01-02")
	endStr := date.Format("2006-01-02")
	var rows []DailyRevenue
	if err := database.DB.Raw(queryDayToMonthly, startStr, endStr).Scan(&rows).Error; err != nil {
		// log.Printf("[FINANCIAL] Erro ao consultar receita mensal: %v", err)
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Erro ao consultar receita mensal"})
	}
	dayMap := make(map[string]DailyRevenue)
	for _, r := range rows {
		dayMap[r.Day] = r
	}
	var result []DailyRevenue
	for d := startOfMonth; !d.After(date); d = d.AddDate(0, 0, 1) {
		key := d.Format("2006-01-02")
		if v, ok := dayMap[key]; ok {
			result = append(result, v)
		} else {
			result = append(result, DailyRevenue{
				Day:          key,
				Receita:      0,
				TotalPedidos: 0,
			})
		}
	}
	return c.JSON(result)
}

// SQL para itens mais vendidos do dia
const queryTopItemsByDate = `
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

// GetTopItemsByDate retorna os itens mais vendidos da data enviada.
func GetTopItemsByDate(c *fiber.Ctx) error {
	var req DateRequest
	if err := c.BodyParser(&req); err != nil {
		// log.Printf("[FINANCIAL] Erro ao fazer parse do body: %v", err)
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Body inválido"})
	}
	date, err := parseDateOrToday(req.Date)
	if err != nil {
		// log.Printf("[FINANCIAL] Erro ao converter data: %v", err)
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Formato de data inválido, use YYYY-MM-DD"})
	}
	dateStr := date.Format("2006-01-02")
	var results []TopItem
	if err := database.DB.Raw(queryTopItemsByDate, dateStr).Scan(&results).Error; err != nil {
		// log.Printf("[FINANCIAL] Erro ao consultar itens mais vendidos: %v", err)
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "Erro ao consultar itens mais vendidos"})
	}
	return c.JSON(results)
}

// HealthCheck verifica se a view financeira está acessível e retorna o número de linhas.
func HealthCheck(c *fiber.Ctx) error {
	var count int64
	if err := database.DB.Table("financial_metrics_view").Count(&count).Error; err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"status": "error", "error": "Erro ao acessar view financeira"})
	}
	return c.JSON(fiber.Map{
		"status": "ok",
		"rows":   count,
	})
}
