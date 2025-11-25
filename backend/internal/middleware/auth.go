package middleware

import (
	"errors"
	"net/http"

	"github.com/KoiralaSam/Remindly/backend/internal/utils"
	"github.com/gin-gonic/gin"
)

func AuthMiddleware(ctx *gin.Context) {
	token := ctx.GetHeader("Authorization")

	if token == "" {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": errors.New("unauthorized")})
		return
	}

	tokenClaims, err := utils.VerifyToken(token)

	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": errors.New("unauthorized")})
		return
	}

	ctx.Set("userID", tokenClaims.UserID)
	ctx.Set("email", tokenClaims.Email)
	ctx.Set("name", tokenClaims.Name)

	ctx.Next()
}
