package middleware

import (
	"log"
	"net/http"
	"strings"

	"github.com/KoiralaSam/Remindly/backend/internal/models"
	"github.com/KoiralaSam/Remindly/backend/internal/utils"
	"github.com/gin-gonic/gin"
)

// In your auth middleware file
func AuthMiddleware() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var token string

		// Try to get token from Authorization header first
		authHeader := ctx.GetHeader("Authorization")
		if authHeader != "" {
			// Bearer token format
			if strings.HasPrefix(authHeader, "Bearer ") {
				token = strings.TrimPrefix(authHeader, "Bearer ")
			} else {
				token = authHeader
			}
		}

		// If no token in header, check query parameters (for WebSocket connections)
		if token == "" {
			token = ctx.Query("token")
		}

		// If still no token, check cookies
		if token == "" {
			tokenCookie, err := ctx.Cookie("token")
			if err == nil {
				token = tokenCookie
			}
		}

		if token == "" {
			log.Printf("No token found in request from %s", ctx.Request.RemoteAddr)
			ctx.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "authorization token required"})
			return
		}

		// Validate the token and extract user info
		claims, err := utils.VerifyToken(token) // Your JWT validation function
		if err != nil {
			log.Printf("Token validation failed: %v", err)
			ctx.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired token"})
			return
		}
		user := &models.User{ID: claims.UserID}

		err = user.Get()
		if err != nil {
			log.Printf("Error getting user: %v", err)
			ctx.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired token"})
			return
		}

		// Set user info in context
		ctx.Set("userID", claims.UserID)
		ctx.Set("username", user.Name)
		ctx.Set("email", user.Email) // if you have it

		log.Printf("Auth successful for user: %s (%s)", user.Name, claims.UserID)

		ctx.Next()
	}
}
