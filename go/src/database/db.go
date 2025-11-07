package database

import (
	"fmt"
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func LoadEnv() {
	
	dbURL, bol := os.LookupEnv("DATABASE_URL")
	if bol == false {
		log.Fatal("Erro ao carregar .env: ", bol)
	}
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
