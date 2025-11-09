package main

import (
    "log"
    "os"

    "net/http"
    "time"

    "Restaurant/src/broadcast"
    "Restaurant/src/database"
    "Restaurant/src/models"
    "Restaurant/src/routes"

    "github.com/gofiber/fiber/v2"
    "github.com/gofiber/fiber/v2/middleware/cors"
)

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

    frontendURL := os.Getenv("FRONTEND_URL")
    if frontendURL == "" {
        log.Println("[WARN] FRONTEND_URL não definido, CORS liberado para todas as origens!")
        app.Use(cors.New())
        // log.Fatalf("Erro ao obter cors")

    } else {
        app.Use(cors.New(cors.Config{
            AllowOrigins: frontendURL,
            AllowCredentials: true,
        }))
    }

    // Registra todas as rotas no app
    routes.RegisterRoutes(app)

    // Start server
    log.Println("Servidor iniciado na porta :4000")
    if err := app.Listen(":4000"); err != nil {
        log.Fatalf("Erro ao iniciar servidor: %v", err)
    }

    go func() {
		for {
            mesaMap := map[string]uint{
                "id":     173,
                "number": 2,
            }
		    broadcast.BroadcastNewTable(mesaMap)
	

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