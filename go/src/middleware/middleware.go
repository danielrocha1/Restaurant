package middleware

import (
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"

	"Restaurant/src/utils"
)

// JWTClaimsMiddleware valida token JWT, verifica claims.Auth (mesa) e popula c.Locals.
// Procura o token na ordem:
// 1) Header Authorization: Bearer <token>
// 2) Header X-QRCode-Token: <token>
// 3) Query param ?qrCode=<token>
//
// Validações efetuadas:
// - token parse/assinatura
// - mesa dentro do intervalo permitido (1..15) -> ajustável
// - (opcional) permission se quiser cancelar quem pode acessar (comentado)
//
// Após validação, popula:
// c.Locals("userClaims") -> *handlers.CustomClaims
// c.Locals("auth")       -> handlers.AuthPayload (pronto para uso)

func JWTClaimsMiddleware() fiber.Handler {
	// pega secret do env, fallback para um valor "dev" (não use em prod)
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "changeme123" // ajuste para produção
	}

	return func(c *fiber.Ctx) error {
		var tokenStr string

		// 1) Authorization header
		auth := c.Get("Authorization")
		if auth != "" {
			parts := strings.Fields(auth)
			if len(parts) == 2 && strings.ToLower(parts[0]) == "bearer" {
				tokenStr = parts[1]
			}
		}

		// 2) X-QRCode-Token header (compatibilidade com qr token)
		if tokenStr == "" {
			tokenStr = c.Get("X-QRCode-Token", "")
		}

		// 3) query param qrCode
		if tokenStr == "" {
			tokenStr = c.Query("qrCode", "")
		}

		if tokenStr == "" {
			return fiber.NewError(fiber.StatusUnauthorized, "token não fornecido")
		}

		claims := &utils.CustomClaims{}
		parsed, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
			// opcional: checar método de assinatura
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fiber.NewError(fiber.StatusUnauthorized, "método de assinatura inválido")
			}
			return []byte(secret), nil
		})
		if err != nil || !parsed.Valid {
			return fiber.NewError(fiber.StatusUnauthorized, "token inválido ou expirado")
		}

		// Validar claims (defensivamente)
		// Mesa: entre 1 e 15 (ajuste conforme necessidade)
		if claims == nil {
			return fiber.NewError(fiber.StatusUnauthorized, "claims inválidas no token")
		}

		if claims.Auth.Mesa < 1 || claims.Auth.Mesa > 15 {
			return fiber.NewError(fiber.StatusBadRequest, "mesa fora do intervalo permitido")
		}

		// (Opcional) checar permission
		// if !claims.Auth.Permission {
		//     return fiber.NewError(fiber.StatusForbidden, "sem permissão para realizar checkout")
		// }

		// Popula locals para handlers consumirem sem parse adicional
		c.Locals("userClaims", claims)
		c.Locals("auth", claims.Auth)

		// tudo ok, segue
		return c.Next()
	}
}
