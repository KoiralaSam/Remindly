package routes

import (
	"github.com/KoiralaSam/Remindly/backend/internal/handlers"
	"github.com/KoiralaSam/Remindly/backend/internal/middleware"
	"github.com/gin-gonic/gin"
)

func SetupRoutes(server *gin.Engine, wsHandler *handlers.WShandler) {
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
	authenticated.POST("/groups", handlers.CreateGroup(wsHandler))
	authenticated.GET("/groups", handlers.GetGroups)

	authenticatedGroupMember := authenticated.Group("/groups/:groupID")
	authenticatedGroupMember.Use(middleware.AuthGroupMemberMiddleware)

	//websocket routes
	authenticatedGroupMember.POST("/ws/createRoom", wsHandler.CreateRoom)
	authenticatedGroupMember.GET("/ws/joinRoom/:roomId", wsHandler.JoinRoom)
	authenticatedGroupMember.GET("/ws/rooms", wsHandler.GetRooms)
	authenticatedGroupMember.GET("/ws/rooms/clients", wsHandler.GetClients)
	authenticatedGroupMember.POST("/ws/rooms/:roomId/messages", handlers.CreateMessage)
	authenticatedGroupMember.GET("/ws/rooms/:roomId/messages", handlers.GetRoomMessages)
	authenticatedGroupMember.GET("/ws/rooms/:roomId/messages/:userId", handlers.GetUserRoomMessages)
	authenticatedGroupMember.DELETE("/ws/messages/:messageId", handlers.DeleteMessage)

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
	authenticatedGroupMember.GET("/tasks/:taskId", handlers.GetTaskByIDWithAssignees)
	authenticatedGroupMember.PATCH("/tasks/:taskId", handlers.UpdateTask)
	authenticatedGroupMember.DELETE("/tasks/:taskId", handlers.DeleteTask)

	// Task Assignment Routes
	authenticatedGroupMember.POST("/tasks/:taskId/assign", handlers.AssignTask)
	authenticatedGroupMember.GET("/tasks/:taskId/assignments", handlers.GetTaskAssignments)
	authenticatedGroupMember.DELETE("/tasks/:taskId/assignments", handlers.UnassignTask)

	//Task Notification Routes
	authenticatedGroupMember.POST("/tasks/:taskId/notifications", handlers.CreateTaskNotification)
	authenticatedGroupMember.GET("/tasks/:taskId/notifications", handlers.GetTaskNotifications)

	// Notification Routes (direct access by ID)
	authenticated.PATCH("/notifications/:id", handlers.UpdateNotification)
	authenticated.DELETE("/notifications/:id", handlers.DeleteNotification)
}
