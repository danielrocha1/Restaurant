package routes

import (
	"net/http"
	"log"

	"Restaurant/src/broadcast"
	"Restaurant/src/database"
	"Restaurant/src/handlers"
	"Restaurant/src/middleware" // <-- import do middleware

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


func RegisterRoutes(app *fiber.App) {
    // middleware JWT (instância única)
    jwt := middleware.JWTClaimsMiddleware()

    app.Get("/", func(c *fiber.Ctx) error {
        return c.SendString("API está rodando!")
    })

    // WS (mantém igual)
    app.All("/ws", func(c *fiber.Ctx) error {
        h := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            conn, err := upgrader.Upgrade(w, r, nil)
            if err != nil {
                log.Println("Erro ao fazer upgrade:", err)
                return
            }
            broadcast.HandleConnection(conn)
        })

        fasthttpadaptor.NewFastHTTPHandlerFunc(h)(c.Context())
        return nil
    })

    // ROTAS PÚBLICAS (GETs)
    app.Get("/produtos", handlers.GetProdutos)
    app.Get("/produtos/:id", handlers.GetProduto)

    // ROTAS ADMIN (protegidas por JWT)
    app.Post("/produtos", handlers.CreateProduto)
    app.Put("/produtos/:id",  handlers.UpdateProduto)
    app.Delete("/produtos/:id", handlers.DeleteProduto)

    app.Get("/produtos-lists", handlers.GetProdutosLists)
    app.Get("/produtos-list", handlers.GetProdutosList)
    app.Get("/produtos-list/admin", handlers.GetProdutosListAdmin) // se essa rota for admin

    // Categorias
    app.Get("/categorias", handlers.GetCategorias)
    app.Get("/categoriassub", handlers.GetCategoriasSub)
    app.Get("/categorias/:id", handlers.GetCategoria)
    app.Post("/categorias", handlers.CreateCategoria)
    app.Put("/categorias/:id", handlers.UpdateCategoria)
    app.Delete("/categorias/:id", handlers.DeleteCategoria)

    // Orders (dependendo do fluxo, proteja criação/alteração/exclusão)
    app.Get("/orders", handlers.GetOrders)
    app.Get("/orders/:id", handlers.GetOrder)
    app.Post("/orders", handlers.CreateOrder) // se criação de pedidos for admin-only; senão remova jwt
    app.Put("/orders/:id", handlers.UpdateOrder)
    app.Delete("/orders/:id", handlers.DeleteOrder)

    // Demais rotas públicas / internas
    app.Post("/checkout", jwt, handlers.Checkout)
    app.Post("/tables/viewclose", handlers.ViewClosedTables(database.DB))
    app.Post("/tables/viewcloseondate", handlers.ViewClosedTablesOnDate(database.DB))
    app.Post("/tables/view", handlers.ViewListTable(database.DB))
    app.Get("/tables/isOpen", handlers.ViewOpenTables(database.DB))
    app.Post("/payment/", handlers.PaymentHandler)

    // Financial Routes - proteja endpoints que alteram dados (aqui são consultas, portanto mantive públicas)
    api := app.Group("/api/finance")
    api.Post("/daily-sales", handlers.GetDailySales)
    api.Post("/today-info", handlers.GetDayInfo)
    api.Post("/top-items", handlers.GetTopItemsByDate)
    api.Post("/day-to-monthly", handlers.GetDayToMonthlyInfo)
    api.Post("/health", handlers.HealthCheck)
}