package routes

import "github.com/gin-gonic/gin"

func SetupRoutes(server *gin.Engine) {
	server.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "Hello, World!"})
	})
}
