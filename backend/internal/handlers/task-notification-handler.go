package handlers

import (
	"net/http"
	"time"

	"github.com/KoiralaSam/Remindly/backend/internal/models"
	"github.com/gin-gonic/gin"
)

func CreateTaskNotification(ctx *gin.Context) {
	taskID := ctx.Param("taskId")
	groupID := ctx.Param("groupID")

	// First, verify that the task belongs to the group
	taskCheck, err := models.GetTaskByID(ctx.Request.Context(), taskID)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "task not found"})
		return
	}

	// Verify the task belongs to the group from the URL
	if taskCheck.GroupID != groupID {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "task does not belong to this group"})
		return
	}

	var requestBody struct {
		UserID           string `json:"user_id" binding:"required"`
		NotificationType string `json:"notification_type" binding:"required"`
		ScheduledAt      string `json:"scheduled_at" binding:"required"`
	}

	err = ctx.ShouldBindJSON(&requestBody)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate notification type
	validTypes := map[string]bool{
		"assignment":    true,
		"reminder":      true,
		"due_date":      true,
		"status_change": true,
		"update":        true,
	}
	if !validTypes[requestBody.NotificationType] {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid notification_type. Must be one of: assignment, reminder, due_date, status_change, update"})
		return
	}

	// Check if user is a member of the group
	groupMember := &models.GroupMember{
		GroupID: groupID,
		UserID:  requestBody.UserID,
	}
	isMember, err := groupMember.IsMember(ctx.Request.Context())
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if !isMember {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "user is not a member of this group"})
		return
	}

	// Parse scheduled_at string to time.Time
	scheduledAt, err := time.Parse(time.RFC3339, requestBody.ScheduledAt)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid scheduled_at format. Use RFC3339 format (e.g., 2025-12-31T23:59:59Z)"})
		return
	}

	// Create the notification
	notification := models.TaskNotification{
		TaskID:           taskID,
		UserID:           requestBody.UserID,
		NotificationType: requestBody.NotificationType,
		ScheduledAt:      scheduledAt,
		Status:           "pending",
	}

	err = notification.Save(ctx.Request.Context())
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{"notification": notification})
}

func GetTaskNotifications(ctx *gin.Context) {
	taskID := ctx.Param("taskId")
	groupID := ctx.Param("groupID")

	// First, verify that the task belongs to the group
	taskCheck, err := models.GetTaskByID(ctx.Request.Context(), taskID)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "task not found"})
		return
	}
	if taskCheck.GroupID != groupID {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "task does not belong to this group"})
		return
	}

	role := ctx.GetString("role")
	// Allow access if user is owner or admin
	if role != "owner" && role != "admin" {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "you do not have permission to access this task"})
		return
	}

	// Get the task notifications
	notifications, err := models.GetNotificationsByTaskID(ctx.Request.Context(), taskID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"notifications": notifications})
}

func UpdateNotification(ctx *gin.Context) {
	notificationID := ctx.Param("id")
	userID := ctx.GetString("userID")

	// Get the notification to verify it exists and get the task_id
	notification := models.TaskNotification{
		ID: notificationID,
	}
	err := notification.Get(ctx.Request.Context())
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "notification not found"})
		return
	}

	// Get the task to verify user has access
	task, err := models.GetTaskByID(ctx.Request.Context(), notification.TaskID)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "task not found"})
		return
	}

	// Check if user is a member of the group that owns the task
	groupMember := &models.GroupMember{
		GroupID: task.GroupID,
		UserID:  userID,
	}
	isMember, err := groupMember.IsMember(ctx.Request.Context())
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if !isMember {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "you do not have permission to access this notification"})
		return
	}

	var requestBody struct {
		NotificationType string `json:"notification_type"`
		ScheduledAt      string `json:"scheduled_at"`
		Status           string `json:"status"`
		RetryCount       int    `json:"retry_count"`
	}

	err = ctx.ShouldBindJSON(&requestBody)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update only provided fields
	if requestBody.NotificationType != "" {
		// Validate notification type
		validTypes := map[string]bool{
			"assignment":    true,
			"reminder":      true,
			"due_date":      true,
			"status_change": true,
			"update":        true,
		}
		if !validTypes[requestBody.NotificationType] {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid notification_type. Must be one of: assignment, reminder, due_date, status_change, update"})
			return
		}
		notification.NotificationType = requestBody.NotificationType
	}

	if requestBody.ScheduledAt != "" {
		scheduledAt, err := time.Parse(time.RFC3339, requestBody.ScheduledAt)
		if err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid scheduled_at format. Use RFC3339 format (e.g., 2025-12-31T23:59:59Z)"})
			return
		}
		notification.ScheduledAt = scheduledAt
	}

	if requestBody.Status != "" {
		notification.Status = requestBody.Status
	}

	if requestBody.RetryCount >= 0 {
		notification.RetryCount = requestBody.RetryCount
	}

	err = notification.Update(ctx.Request.Context())
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"notification": notification})
}

func DeleteNotification(ctx *gin.Context) {
	notificationID := ctx.Param("id")
	userID := ctx.GetString("userID")

	// Get the notification to verify it exists and get the task_id
	notification := models.TaskNotification{
		ID: notificationID,
	}
	err := notification.Get(ctx.Request.Context())
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "notification not found"})
		return
	}

	// Get the task to verify user has access
	task, err := models.GetTaskByID(ctx.Request.Context(), notification.TaskID)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "task not found"})
		return
	}

	// Check if user is a member of the group that owns the task
	groupMember := &models.GroupMember{
		GroupID: task.GroupID,
		UserID:  userID,
	}
	isMember, err := groupMember.IsMember(ctx.Request.Context())
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if !isMember {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "you do not have permission to delete this notification"})
		return
	}

	err = notification.Delete(ctx.Request.Context())
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Notification deleted successfully"})
}
