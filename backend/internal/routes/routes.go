package routes

import (
	"github.com/KoiralaSam/Remindly/backend/internal/handlers"
	"github.com/KoiralaSam/Remindly/backend/internal/middleware"
	"github.com/gin-gonic/gin"
)

func SetupRoutes(server *gin.Engine, wsHandler *handlers.WShandler, signalingHandler *handlers.SignalingHandler) {
	// Health check endpoint (no auth required) - for App Platform health checks
	server.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"service": "remindly-backend",
		})
	})

	// Authentication Routes (no root handler - let frontend handle /)
	server.POST("/api/auth/register", handlers.RegisterUser)
	server.POST("/api/auth/login", handlers.Login)

	authenticated := server.Group("/api")
	authenticated.Use(middleware.AuthMiddleware())

	authenticated.GET("/logout", handlers.Logout)

	// User Routes
	authenticated.GET("/users/me", handlers.GetUser)
	authenticated.PATCH("/users/me", handlers.UpdateUser)
	authenticated.GET("/users/from-my-groups", handlers.GetUsersFromMyGroups)

	// Group Routes
	authenticated.POST("/groups", handlers.CreateGroup(wsHandler))
	authenticated.GET("/groups", handlers.GetGroups)

	authenticatedGroupMember := authenticated.Group("/groups/:groupID")
	authenticatedGroupMember.Use(middleware.AuthGroupMemberMiddleware)

	// NEW: Signaling WebSocket (separate channel) - must be after group member middleware
	authenticatedGroupMember.GET("/ws/signaling/:roomId", signalingHandler.JoinSignaling)

	//websocket routes
	authenticatedGroupMember.POST("/ws/createRoom", wsHandler.CreateRoom)
	authenticatedGroupMember.GET("/ws/joinRoom/:roomId", wsHandler.JoinRoom)
	authenticatedGroupMember.GET("/ws/rooms", wsHandler.GetRooms)
	authenticatedGroupMember.GET("/ws/rooms/clients", wsHandler.GetClients)
	authenticatedGroupMember.POST("/ws/rooms/:roomId/messages", handlers.CreateMessage(wsHandler.GetHub()))
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

	// Group Invitation Routes
	authenticated.GET("/invitations", handlers.GetInvitations)
	authenticated.POST("/invitations/:invitationID/accept", handlers.AcceptInvitation)
	authenticated.POST("/invitations/:invitationID/decline", handlers.DeclineInvitation)

	// Task Routes
	authenticatedGroupMember.POST("/tasks", handlers.CreateTask(wsHandler.GetHub()))
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
	authenticated.GET("/notifications", handlers.GetUserNotifications)
	authenticated.PATCH("/notifications/:id", handlers.UpdateNotification)
	authenticated.DELETE("/notifications/:id", handlers.DeleteNotification)

	// File Routes
	authenticatedGroupMember.POST("/files", handlers.UploadFile)
	authenticatedGroupMember.GET("/files", handlers.GetFiles)
	authenticatedGroupMember.GET("/files/:fileID", handlers.GetFileInfo)
	authenticatedGroupMember.GET("/files/:fileID/download", handlers.GetFileDownloadURL)
	authenticatedGroupMember.DELETE("/files/:fileID", handlers.DeleteFile)

	// Folder Routes
	authenticatedGroupMember.POST("/folders", handlers.CreateFolder)
	authenticatedGroupMember.GET("/folders", handlers.GetFolders)
	authenticatedGroupMember.GET("/folders/:folderID", handlers.GetFolder)
	authenticatedGroupMember.DELETE("/folders/:folderID", handlers.DeleteFolder)

	// Link Routes
	authenticatedGroupMember.POST("/links", handlers.CreateLink)
	authenticatedGroupMember.GET("/links", handlers.GetLinks)
	authenticatedGroupMember.GET("/links/:linkID", handlers.GetLink)
	authenticatedGroupMember.DELETE("/links/:linkID", handlers.DeleteLink)
}
