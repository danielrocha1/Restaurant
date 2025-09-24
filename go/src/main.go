package main

import (
	"log"
	"net/http"
	"time"

	"Restaurant/src/database"
	"Restaurant/src/handlers"
	"Restaurant/src/models"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func main() {
	// conecta no banco e deixa a variável database.DB pronta
	database.Connect()

	// auto-migrate dos models
	if err := database.DB.AutoMigrate(
		&models.Produto{},
		&models.Order{},
		&models.Categoria{},
		&models.Table{},
	); err != nil {
		log.Fatalf("AutoMigrate erro: %v", err)
	}

	app := fiber.New()
	app.Use(cors.New())

	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("API está rodando!")
	})

	// Produtos
	app.Get("/produtos", handlers.GetProdutos)
	app.Get("/produtos/:id", handlers.GetProduto)
	app.Post("/produtos", handlers.CreateProduto)
	app.Put("/produtos/:id", handlers.UpdateProduto)
	app.Delete("/produtos/:id", handlers.DeleteProduto)

	app.Get("/produtos-lists", handlers.GetProdutosLists)
	app.Get("/produtos-list", handlers.GetProdutosList)

	// Categorias
	app.Get("/categorias", handlers.GetCategorias)
	app.Get("/categoriassub", handlers.GetCategoriasSub)
	app.Get("/categorias/:id", handlers.GetCategoria)
	app.Post("/categorias", handlers.CreateCategoria)
	app.Put("/categorias/:id", handlers.UpdateCategoria)
	app.Delete("/categorias/:id", handlers.DeleteCategoria)

	// Orders
	app.Get("/orders", handlers.GetOrders)
	app.Get("/orders/:id", handlers.GetOrder)
	app.Post("/orders", handlers.CreateOrder)
	app.Put("/orders/:id", handlers.UpdateOrder)
	app.Delete("/orders/:id", handlers.DeleteOrder)

	app.Post("/checkout", handlers.Checkout)

	// Tables — endpoints que RECEBEM o número via BODY (conforme você pediu)
	// Os handlers devem ter a forma: func TouchOrOpenTable(db *gorm.DB) fiber.Handler
	app.Post("/tables/activity", handlers.TouchOrOpenTable(database.DB))
	app.Post("/tables/close", handlers.CloseTable(database.DB))
	app.Post("/tables/open", handlers.GetOpenTable(database.DB))
	app.Post("/tables/history", handlers.ListTableHistory(database.DB))

	// Ping para manter app acordado no Render (opcional)
	go func() {
		for {
			_, err := http.Get("https://restaurant-9gdi.onrender.com")
			if err != nil {
				log.Println("❌ Erro ao fazer ping:", err)
			} else {
				log.Println("✅ Ping enviado")
			}
			time.Sleep(50 * time.Second)
		}
	}()

	// start server
	if err := app.Listen(":4000"); err != nil {
		log.Fatalf("Erro ao iniciar servidor: %v", err)
	}
}