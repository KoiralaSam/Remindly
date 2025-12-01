package routes

import (
	"github.com/KoiralaSam/Remindly/backend/internal/handlers"
	"github.com/KoiralaSam/Remindly/backend/internal/middleware"
	"github.com/gin-gonic/gin"
)

func SetupRoutes(server *gin.Engine) {
	server.POST("/api/auth/register", handlers.RegisterUser)
	server.POST("/api/auth/login", handlers.Login)

	authenticated := server.Group("/api")
	authenticated.Use(middleware.AuthMiddleware)

	authenticated.POST("/groups", handlers.CreateGroup)
	authenticated.GET("/logout", handlers.Logout)
	authenticated.GET("/users/me", handlers.GetUser)
	authenticated.PATCH("/users/me", handlers.UpdateUser)
}
