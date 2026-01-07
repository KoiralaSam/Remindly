package handlers

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/KoiralaSam/Remindly/backend/internal/WS"
	"github.com/KoiralaSam/Remindly/backend/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// CreateMessage creates a new message in a room
// It broadcasts via WebSocket first for real-time display, then saves to DB in background
func CreateMessage(hub *WS.Hub) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		roomID := ctx.Param("roomId")
		userID := ctx.GetString("userID")
		username := ctx.GetString("username")

		var requestBody struct {
			Content string `json:"content" binding:"required"`
		}

		if err := ctx.ShouldBindJSON(&requestBody); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Generate message ID and timestamp immediately
		messageID := uuid.New().String()
		now := time.Now()

		// Create message object
		message := models.Message{
			ID:        messageID,
			RoomID:    roomID,
			UserID:    userID,
			Username:  username,
			Content:   requestBody.Content,
			CreatedAt: now,
			UpdatedAt: now,
		}

		// Create WebSocket message for broadcast
		wsMessage := &WS.Message{
			ID:        messageID,
			RoomID:    roomID,
			UserID:    userID,
			Username:  username,
			Content:   requestBody.Content,
			CreatedAt: now.Format(time.RFC3339),
		}

		// Broadcast via WebSocket immediately (non-blocking)
		if _, ok := hub.Rooms[roomID]; ok {
			hub.Broadcast <- wsMessage
		}

		// Save to database in background (non-blocking goroutine)
		go func() {
			msgCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()

			if err := message.SaveWithID(msgCtx); err != nil {
				// Log error but don't fail the request since message was already broadcast
				// In production, you might want to use a logger here
				_ = err
			}
		}()

		// Return success immediately with message data
		ctx.JSON(http.StatusOK, gin.H{
			"statusOk": true,
			"data":     message,
		})
	}
}

// GetRoomMessages retrieves all messages for a room with pagination
func GetRoomMessages(ctx *gin.Context) {
	roomID := ctx.Param("roomId")
	limit := 50 // default limit
	offset := 0 // default offset

	if l := ctx.Query("limit"); l != "" {
		if parsedLimit, err := strconv.Atoi(l); err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	if o := ctx.Query("offset"); o != "" {
		if parsedOffset, err := strconv.Atoi(o); err == nil && parsedOffset >= 0 {
			offset = parsedOffset
		}
	}

	msgCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	messages, err := models.GetRoomMessages(msgCtx, roomID, limit, offset)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if messages == nil {
		messages = []models.Message{}
	}

	ctx.JSON(http.StatusOK, gin.H{
		"messages": messages,
		"count":    len(messages),
	})
}

// GetUserRoomMessages retrieves messages for a specific user in a room
func GetUserRoomMessages(ctx *gin.Context) {
	roomID := ctx.Param("roomId")
	userID := ctx.Param("userId")
	limit := 50
	offset := 0

	if l := ctx.Query("limit"); l != "" {
		if parsedLimit, err := strconv.Atoi(l); err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	if o := ctx.Query("offset"); o != "" {
		if parsedOffset, err := strconv.Atoi(o); err == nil && parsedOffset >= 0 {
			offset = parsedOffset
		}
	}

	msgCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	messages, err := models.GetUserRoomMessages(msgCtx, roomID, userID, limit, offset)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if messages == nil {
		messages = []models.Message{}
	}

	ctx.JSON(http.StatusOK, gin.H{
		"messages": messages,
		"count":    len(messages),
	})
}

// DeleteMessage deletes a message by ID
func DeleteMessage(ctx *gin.Context) {
	messageID := ctx.Param("messageId")
	userID := ctx.GetString("userID")

	if userID == "" {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "user ID not found"})
		return
	}

	msgCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// First, get the message to check if the user is the creator
	message := &models.Message{
		ID: messageID,
	}
	err := message.GetByID(msgCtx)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "message not found"})
		return
	}

	// Check if the current user is the creator of the message
	if message.UserID != userID {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "you can only delete your own messages"})
		return
	}

	// Delete the message
	err = models.DeleteMessage(msgCtx, messageID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "message deleted successfully"})
}
