package main

import (
	"log"
	"net/http"
	"time"

	"Restaurant/src/broadcast"
	"Restaurant/src/database"
	"Restaurant/src/handlers"
	"Restaurant/src/models"

	"github.com/valyala/fasthttp/fasthttpadaptor"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"

	"github.com/gorilla/websocket"
)

// Gorilla Upgrader
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func main() {
	// Conectar banco
	database.Connect()

	// AutoMigrate
	if err := database.DB.AutoMigrate(
		&models.Produto{},
		&models.Order{},
		&models.Categoria{},
		&models.StatusTable{},
		&models.OrderItem{},
		&models.PaymentRecord{},
	); err != nil {
		log.Fatalf("AutoMigrate erro: %v", err)
	}

	// Inicia o Hub
	go broadcast.GlobalHub.Run()
	log.Println("[INFO] WebSocket Hub iniciado.")

	app := fiber.New()
	app.Use(cors.New())

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

	// Ping opcional para manter app acordado
	go func() {
		for {
			_, err := http.Get("https://restaurant-sw98.onrender.com")
			if err != nil {
				log.Println("❌ Erro ao fazer ping:", err)
			} else {
				log.Println("✅ Ping enviado")
			}
			time.Sleep(50 * time.Second)
		}
	}()

	// Start server
	log.Println("Servidor iniciado na porta :4000")
	if err := app.Listen(":4000"); err != nil {
		log.Fatalf("Erro ao iniciar servidor: %v", err)
	}
}
