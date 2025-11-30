package utils

import (
	"errors"
	"os"

	"github.com/golang-jwt/jwt/v5"
)

type AuthDetails struct {
	UserID   string `json:"userId"`
	AuthUuid string `json:"auth_uuid"`
}

func GenerateToken(claims AuthDetails) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"authorized": true,
		"auth_uuid":  claims.AuthUuid,
		"user_id":    claims.UserID,
	})

	return token.SignedString([]byte(os.Getenv("JWT_SECRET")))
}

func VerifyToken(token string) (*AuthDetails, error) {
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

	userId, ok := claims["user_id"].(string)
	if !ok {
		return nil, errors.New("could not extract userId from token")
	}

	authUuid, ok := claims["auth_uuid"].(string)
	if !ok {
		return nil, errors.New("could not extract email from token")
	}

	authDetails := &AuthDetails{
		UserID:   userId,
		AuthUuid: authUuid,
	}

	return authDetails, nil
}
