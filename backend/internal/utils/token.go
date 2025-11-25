package utils

import (
	"os"

	"github.com/golang-jwt/jwt/v5"
)

func GenerateToken(userID string, name string, email string) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":   userID,
		"name":  name,
		"email": email,
	})

	return token.SignedString([]byte(os.Getenv("JWT_SECRET")))
}
