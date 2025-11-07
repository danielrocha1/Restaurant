package routes

import (
    "net/http"
    "log"
    "time"

    "Restaurant/src/broadcast"
    "Restaurant/src/database"
    "Restaurant/src/handlers"

    "github.com/valyala/fasthttp/fasthttpadaptor"
    "github.com/gofiber/fiber/v2"
    "github.com/gorilla/websocket"
)

// Gorilla Upgrader (pode ser exportado se quiser customizar)
var upgrader = websocket.Upgrader{
    ReadBufferSize:  1024,
    WriteBufferSize: 1024,
    CheckOrigin: func(r *http.Request) bool {
        return true
    },
}

// RegisterRoutes registra todas as rotas no app Fiber
func RegisterRoutes(app *fiber.App) {
    app.Get("/", func(c *fiber.Ctx) error {
        return c.SendString("API está rodando!")
    })

    // ------------------------------
    // ROTA WEBSOCKET (Gorilla)
    // ------------------------------
    app.All("/ws", func(c *fiber.Ctx) error {
        h := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            conn, err := upgrader.Upgrade(w, r, nil)
            if err != nil {
                log.Println("Erro ao fazer upgrade:", err)
                return
            }
            broadcast.HandleConnection(conn)
        })

        // Converte para FastHTTP
        fasthttpadaptor.NewFastHTTPHandlerFunc(h)(c.Context())
        return nil
    })

    // ------------------------------
    // ROTAS REST
    // ------------------------------
    app.Get("/produtos", handlers.GetProdutos)
    app.Get("/produtos/:id", handlers.GetProduto)
    app.Post("/produtos", handlers.CreateProduto)
    app.Put("/produtos/:id", handlers.UpdateProduto)
    app.Delete("/produtos/:id", handlers.DeleteProduto)

    app.Get("/produtos-lists", handlers.GetProdutosLists)
    app.Get("/produtos-list", handlers.GetProdutosList)
    app.Get("/produtos-list/admin", handlers.GetProdutosListAdmin)

    app.Get("/categorias", handlers.GetCategorias)
    app.Get("/categoriassub", handlers.GetCategoriasSub)
    app.Get("/categorias/:id", handlers.GetCategoria)
    app.Post("/categorias", handlers.CreateCategoria)
    app.Put("/categorias/:id", handlers.UpdateCategoria)
    app.Delete("/categorias/:id", handlers.DeleteCategoria)

    app.Get("/orders", handlers.GetOrders)
    app.Get("/orders/:id", handlers.GetOrder)
    app.Post("/orders", handlers.CreateOrder)
    app.Put("/orders/:id", handlers.UpdateOrder)
    app.Delete("/orders/:id", handlers.DeleteOrder)

    app.Post("/checkout", handlers.Checkout)
    app.Post("/tables/viewclose", handlers.ViewClosedTables(database.DB))
    app.Post("/tables/viewcloseondate", handlers.ViewClosedTablesOnDate(database.DB))
    app.Post("/tables/view", handlers.ViewListTable(database.DB))
    app.Get("/tables/isOpen", handlers.ViewOpenTables(database.DB))
    app.Post("/payment/", handlers.PaymentHandler)

    //==================================================================
    // Financial Routes
    //==================================================================
    api := app.Group("/api/finance")
    api.Post("/daily-sales", handlers.GetDailySales)
    api.Post("/today-info", handlers.GetDayInfo)
    api.Post("/top-items", handlers.GetTopItemsByDate)
    api.Post("/day-to-monthly", handlers.GetDayToMonthlyInfo)
    api.Post("/health", handlers.HealthCheck)
}

// (Opcional) Função para ping automático, se quiser manter aqui
func StartPing() {
    go func() {
        for {
            _, err := http.Get("https://restaurant-2dfg.onrender.com")
            if err != nil {
                log.Println("❌ Erro ao fazer ping:", err)
            } else {
                log.Println("✅ Ping enviado")
            }
            time.Sleep(50 * time.Second)
        }
    }()
}