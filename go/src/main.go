package main

import (
	"Restaurant/src/database"
	"github.com/gofiber/fiber/v2"
	"log"
	"Restaurant/src/handlers"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"Restaurant/src/models"
 )

func main() {
	database.Connect()

	database.DB.AutoMigrate(&models.Produto{},
							&models.Order{},
							&models.Categoria{},
						)


	app := fiber.New()	
	
	app.Use(cors.New())

	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("API está rodando!")
	})

	app.Get("/produtos", handlers.GetProdutos)
	app.Get("/produtos/:id", handlers.GetProduto)
	app.Post("/produtos", handlers.CreateProduto)
	app.Put("/produtos/:id", handlers.UpdateProduto)
	app.Delete("/produtos/:id", handlers.DeleteProduto)

	app.Get("/produtos-lists", handlers.GetProdutosLists)
	app.Get("/produtos-list", handlers.GetProdutosList)
	
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


	err := app.Listen(":4000")
	if err != nil {
		log.Fatalf("Erro ao iniciar servidor: %v", err)
	}
}
