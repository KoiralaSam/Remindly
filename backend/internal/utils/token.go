package utils

import (
	"errors"
	"os"

	"github.com/golang-jwt/jwt/v5"
)

type TokenClaims struct {
	UserID string `json:"userId"`
	Name   string `json:"name"`
	Email  string `json:"email"`
}

func GenerateToken(userID string, name string, email string) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"userId": userID,
		"name":   name,
		"email":  email,
	})

	return token.SignedString([]byte(os.Getenv("JWT_SECRET")))
}

func VerifyToken(token string) (*TokenClaims, error) {
	parsedToken, err := jwt.Parse(token, func(token *jwt.Token) (any, error) {
		_, ok := token.Method.(*jwt.SigningMethodHMAC)

		if !ok {
			return nil, errors.New("invalid token signing method")
		}

		return []byte(os.Getenv("JWT_SECRET")), nil

	})

	if err != nil {
		return nil, errors.New("invalid token")
	}

	if !parsedToken.Valid {
		return nil, errors.New("invalid token")
	}

	claims, ok := parsedToken.Claims.(jwt.MapClaims)

	if !ok {
		return nil, errors.New("invalid token claims")
	}

	userId, ok := claims["userId"].(string)
	if !ok {
		return nil, errors.New("could not extract userId from token")
	}

	email, ok := claims["email"].(string)
	if !ok {
		return nil, errors.New("could not extract email from token")
	}

	name, ok := claims["name"].(string)
	if !ok {
		return nil, errors.New("could not extract name from token")
	}

	tokenClaims := &TokenClaims{
		UserID: userId,
		Email:  email,
		Name:   name,
	}

	return tokenClaims, nil
}
