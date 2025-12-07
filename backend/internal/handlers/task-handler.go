package handlers

import (
	"net/http"
	"strconv"
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

func GetGroupTasks(ctx *gin.Context) {
	groupID := ctx.Param("groupID")
	var limit int64 = 10
	var offset int64 = 0
	var err error

	status, provided := ctx.GetQuery("status")
	if !provided {
		status = ""
	}
	assignee, provided := ctx.GetQuery("assignee")
	if !provided {
		assignee = ""
	}

	limitStr, provided := ctx.GetQuery("limit")
	if provided {
		limit, err = strconv.ParseInt(limitStr, 10, 64)
		if err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid limit format. Use integer"})
			return
		}
	}

	offsetStr, provided := ctx.GetQuery("offset")
	if provided {
		offset, err = strconv.ParseInt(offsetStr, 10, 64)
		if err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid offset format. Use integer"})
			return
		}
	}

	tasks, total, err := models.GetTasksByGroupID(ctx.Request.Context(), groupID, status, assignee, limit, offset)

	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"tasks": tasks, "total": total})
}

func GetUserTasks(ctx *gin.Context) {
	user_id := ctx.GetString("userID")

	var limit int64 = 10
	var offset int64 = 0
	var err error

	status, provided := ctx.GetQuery("status")
	if !provided {
		status = ""
	}
	assignee, provided := ctx.GetQuery("assignee")
	if !provided {
		assignee = ""
	}

	limitStr, provided := ctx.GetQuery("limit")
	if provided {
		limit, err = strconv.ParseInt(limitStr, 10, 64)
		if err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid limit format. Use integer"})
			return
		}
	}

	offsetStr, provided := ctx.GetQuery("offset")
	if provided {
		offset, err = strconv.ParseInt(offsetStr, 10, 64)
		if err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid offset format. Use integer"})
			return
		}
	}

	tasks, total, err := models.GetTasksByUserID(ctx.Request.Context(), user_id, status, assignee, limit, offset)

	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"tasks": tasks, "total": total})
}

func GetTaskByIDWithAssignees(ctx *gin.Context) {
	taskID := ctx.Param("taskId")

	task, err := models.GetTaskByIDWithAssignees(ctx.Request.Context(), taskID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"task": task})
}
