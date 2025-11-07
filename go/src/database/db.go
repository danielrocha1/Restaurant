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
	err := godotenv.Load() // Caminho relativo para encontrar o arquivo na pasta de cima
	if err != nil {
		log.Fatal("Erro ao carregar .env: ", err)
	}
	dbURL, _ := os.LookupEnv("DATABASE_URL")
	log.Println("DATABASE_URL length:", len(dbURL)) // só para debug, não logue valores sensíveis em produção

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
