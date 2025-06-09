package database

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func LoadEnv() {
	err := godotenv.Load("../.env") // Caminho relativo para encontrar o arquivo na pasta de cima
	if err != nil {
		log.Fatal("Erro ao carregar .env: ", err)
	}
}


func Connect() {
	LoadEnv()

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("DATABASE_URL não encontrada no .env")
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Erro ao conectar no banco de dados: %v", err)
	}

	DB = db
	fmt.Println("Conexão com banco de dados bem-sucedida.")
}
