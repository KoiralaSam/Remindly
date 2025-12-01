package middleware

import (
	"errors"
	"net/http"

	"github.com/KoiralaSam/Remindly/backend/internal/models"
	"github.com/KoiralaSam/Remindly/backend/internal/utils"
	"github.com/gin-gonic/gin"
)

func AuthMiddleware(ctx *gin.Context) {
	token := ctx.GetHeader("Authorization")

	if token == "" {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": errors.New("unauthorized")})
		return
	}

	authDetails, err := utils.VerifyToken(token)

	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": errors.New("unauthorized")})
		return
	}

	auth, err := models.FetchAuth(authDetails)

	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": errors.New("unauthorized")})
		return
	}

	if auth == nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": errors.New("unauthorized")})
		return
	}

	ctx.Set("userID", auth.UserID)
	ctx.Set("authUUID", auth.AuthUUID)
	ctx.Set("token", token)

	ctx.Next()
}
