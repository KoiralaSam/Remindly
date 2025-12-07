package middleware

import (
	"net/http"

	"github.com/KoiralaSam/Remindly/backend/internal/models"
	"github.com/KoiralaSam/Remindly/backend/internal/utils"
	"github.com/gin-gonic/gin"
)

func AuthMiddleware(ctx *gin.Context) {
	token := ctx.GetHeader("Authorization")

	if token == "" {
		ctx.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	authDetails, err := utils.VerifyToken(token)

	if err != nil {
		ctx.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	auth, err := models.FetchAuth(authDetails)

	if err != nil {
		ctx.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	if auth == nil {
		ctx.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	ctx.Set("userID", auth.UserID)
	ctx.Set("authUUID", auth.AuthUUID)
	ctx.Set("token", token)

	ctx.Next()
}
