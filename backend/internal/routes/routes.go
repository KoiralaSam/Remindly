package routes

import (
	"github.com/KoiralaSam/Remindly/backend/internal/handlers"
	"github.com/KoiralaSam/Remindly/backend/internal/middleware"
	"github.com/gin-gonic/gin"
)

func SetupRoutes(server *gin.Engine) {
	// Authentication Routes
	server.POST("/api/auth/register", handlers.RegisterUser)
	server.POST("/api/auth/login", handlers.Login)

	authenticated := server.Group("/api")
	authenticated.Use(middleware.AuthMiddleware)

	authenticated.GET("/logout", handlers.Logout)

	// User Routes
	authenticated.GET("/users/me", handlers.GetUser)
	authenticated.PATCH("/users/me", handlers.UpdateUser)

	// Group Routes
	authenticated.POST("/groups", handlers.CreateGroup)
	authenticated.GET("/groups", handlers.GetGroups)

	authenticatedGroupMember := authenticated.Group("/groups/:groupID")
	authenticatedGroupMember.Use(middleware.AuthGroupMemberMiddleware)

	authenticatedGroupMember.GET("", handlers.GetGroupByID)
	authenticatedGroupMember.PATCH("", handlers.UpdateGroup)
	authenticatedGroupMember.DELETE("", handlers.DeleteGroup)

	// Group Member Routes
	authenticatedGroupMember.POST("/members", handlers.AddGroupMember)
	authenticatedGroupMember.GET("/members", handlers.GetGroupMembers)
	authenticatedGroupMember.PATCH("members/:userId", handlers.UpdateGroupMemberRole)
	authenticatedGroupMember.DELETE("members/:userId", handlers.DeleteGroupMember)

	// Task Routes
	authenticatedGroupMember.POST("/tasks", handlers.CreateTask)
	authenticatedGroupMember.GET("/tasks", handlers.GetGroupTasks)
	authenticated.GET("/tasks/user", handlers.GetUserTasks)
	// authenticatedGroupMember.PATCH("/tasks/:taskId", handlers.UpdateTask)
	// authenticatedGroupMember.DELETE("/tasks/:taskId", handlers.DeleteTask)

	// Task Assignment Routes
	authenticatedGroupMember.POST("/tasks/:taskId/assign", handlers.AssignTask)
	// authenticatedGroupMember.GET("/tasks/:taskId/assignments", handlers.GetTaskAssignments)
	// authenticatedGroupMember.DELETE("/tasks/:taskId/assignments/:userId", handlers.DeleteTaskAssignment)
}
