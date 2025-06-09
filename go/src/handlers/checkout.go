package handlers

import (
	"fmt"
	"time"
	"Restaurant/src/database"
	"Restaurant/src/models"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"

	"strings"
	
)

var secretKey = []byte("MyS3cr3tKey_@2025!#jwtTokenAkiroSG")

type AuthPayload struct {
	Loja       string `json:"loja"`
	Mesa       int    `json:"mesa"`
	Permission bool   `json:"permission"`
}

type CustomClaims struct {
	Auth AuthPayload `json:"auth"`
	jwt.RegisteredClaims
}

// Struct para receber o JSON do corpo da requisição
type CheckoutRequest struct {
	QRCode string                   `json:"qrCode"`
	Itens  []int `json:"itens"`
	Total  string                  `json:"total"`
}

func GenerateToken(auth AuthPayload) (string, error) {
	claims := CustomClaims{
		Auth: auth,
		RegisteredClaims: jwt.RegisteredClaims{
			IssuedAt: jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(secretKey)
}

func validateToken(tokenStr string) (*CustomClaims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &CustomClaims{}, func(token *jwt.Token) (interface{}, error) {
		return secretKey, nil
	})
	if err != nil {
		return nil, err
	}
	if claims, ok := token.Claims.(*CustomClaims); ok && token.Valid {
		return claims, nil
	}
	return nil, fmt.Errorf("token inválido")
}

func Checkout(c *fiber.Ctx) error {
	var payload CheckoutRequest

	// Parse do corpo da requisição JSON
	if err := c.BodyParser(&payload); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "JSON inválido"})
	}

	// Valida o token JWT
	claims, err := validateToken(payload.QRCode)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Token inválido"})
	}

	// Validação do número da mesa (1 a 15)
	if claims.Auth.Mesa < 1 || claims.Auth.Mesa > 15 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Mesa fora do intervalo permitido (1-15)"})
	}

	var ids []string
	for _, item := range payload.Itens {
		id := fmt.Sprintf("%v", item)
		ids = append(ids, id)
	}
	produtosCSV := strings.Join(ids, ",")

	// Criar pedido
	order := models.Order{
		NomeLoja:   claims.Auth.Loja,
		Mesa:       claims.Auth.Mesa,
		QRCode:     payload.QRCode,
		IDProdutos: produtosCSV,
		Total:      payload.Total,
		Status:     "Pendente",
		Timestamp:  time.Now(),
	}

	if err := database.DB.Create(&order).Error; err != nil {
		return c.Status(500).SendString(err.Error())
	}

	fmt.Println("✅ Pedido salvo no banco:", order)

	// Resposta de sucesso
	return c.JSON(fiber.Map{
		"message": "Checkout autorizado e pedido salvo",
		"order":   order,
	})
}
