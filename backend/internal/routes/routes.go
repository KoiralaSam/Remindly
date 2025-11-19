package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(server *gin.Engine) {
	server.GET("/ping", func(ctx *gin.Context) {
		ctx.JSON(http.StatusOK, gin.H{"message": "pong"})
	})
}
