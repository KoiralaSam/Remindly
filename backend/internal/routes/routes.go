package routes

import (
	"github.com/KoiralaSam/Remindly/backend/internal/handlers"
	"github.com/gin-gonic/gin"
)

func SetupRoutes(server *gin.Engine) {
	server.POST("/api/auth/register", handlers.RegisterUser)
	
	server.POST("/api/groups", handlers.CreateGroup)
}
