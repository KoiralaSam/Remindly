package handlers

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/KoiralaSam/Remindly/backend/internal/models"
	"github.com/gin-gonic/gin"
)

// CreateMessage creates a new message in a room
func CreateMessage(ctx *gin.Context) {
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

	message := models.Message{
		RoomID:   roomID,
		UserID:   userID,
		Username: username,
		Content:  requestBody.Content,
	}

	msgCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := message.Save(msgCtx); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"statusOk": false,
			"error":    err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"statusOk": true,
		"data":     message,
	})
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

	msgCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	err := models.DeleteMessage(msgCtx, messageID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "message deleted successfully"})
}
