package handlers

import (
	"net/http"
	"time"

	"github.com/KoiralaSam/Remindly/backend/internal/models"
	"github.com/gin-gonic/gin"
)

func CreateTask(ctx *gin.Context) {
	groupID := ctx.Param("groupID")
	userID := ctx.GetString("userID")
	role := ctx.GetString("role")

	var requestBody struct {
		Title       string   `json:"title" binding:"required"`
		Description string   `json:"description" binding:"required"`
		DueDate     string   `json:"due_date" binding:"required"`
		Assignees   []string `json:"assignees" binding:"required"`
	}

	err := ctx.ShouldBindJSON(&requestBody)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Parse due_date string to time.Time
	dueDate, err := time.Parse(time.RFC3339, requestBody.DueDate)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid due_date format. Use RFC3339 format (e.g., 2025-12-31T23:59:59Z)"})
		return
	}

	// Set status based on role: owners and admins get "active", members and viewers get "pending"
	status := "pending"
	if role == "owner" || role == "admin" {
		status = "active"
	}

	task := models.Task{
		GroupID:     groupID,
		Title:       requestBody.Title,
		Description: requestBody.Description,
		DueDate:     dueDate,
		CreatedBy:   userID,
		Status:      status,
	}

	err = task.CreateTask(ctx.Request.Context())
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	for _, assignee := range requestBody.Assignees {
		assignment := models.TaskAssignment{
			TaskID:     task.ID,
			UserID:     assignee,
			AssignedBy: userID,
		}
		err = assignment.Save(ctx.Request.Context())
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

	}

	ctx.JSON(http.StatusCreated, gin.H{"task": task})
}
