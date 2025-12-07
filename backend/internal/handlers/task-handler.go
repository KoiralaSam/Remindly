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
		// Check if assignee is a member of the group before assigning
		groupMember := &models.GroupMember{
			GroupID: groupID,
			UserID:  assignee,
		}
		isMember, err := groupMember.IsMember(ctx.Request.Context())
		if err != nil {
			// Skip this assignee if there's an error checking membership
			continue
		}
		if !isMember {
			// Skip non-members - do not assign to users who are not group members
			continue
		}

		// Assign only if the user is a member
		assignment := models.TaskAssignment{
			TaskID:     task.ID,
			UserID:     assignee,
			AssignedBy: userID,
		}
		err = assignment.Save(ctx.Request.Context())
		if err != nil {
			// Skip this assignee if assignment fails (e.g., duplicate assignment)
			continue
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

	role := ctx.GetString("role")
	// Allow access if user is owner or admin
	if role != "owner" && role != "admin" {
		// If not owner/admin, check if user is assigned to the task
		taskAssignment := models.TaskAssignment{
			TaskID: taskID,
			UserID: ctx.GetString("userID"),
		}
		err := taskAssignment.Get(ctx.Request.Context())
		if err != nil {
			// User is not assigned to the task, deny access
			ctx.JSON(http.StatusForbidden, gin.H{"error": "you do not have permission to access this task"})
			return
		}
		// User is assigned, allow access (continue)
	}

	task, err := models.GetTaskByIDWithAssignees(ctx.Request.Context(), taskID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"task": task})
}

func UpdateTask(ctx *gin.Context) {
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

	role := ctx.GetString("role")
	// Allow access if user is owner or admin
	if role != "owner" && role != "admin" {
		// If not owner/admin, check if user is assigned to the task
		taskAssignment := models.TaskAssignment{
			TaskID: taskID,
			UserID: ctx.GetString("userID"),
		}
		err := taskAssignment.Get(ctx.Request.Context())
		if err != nil {
			// User is not assigned to the task, deny access
			ctx.JSON(http.StatusForbidden, gin.H{"error": "you do not have permission to update this task"})
			return
		}
		// User is assigned, allow access (continue)
	}

	var requestBody struct {
		Title       string `json:"title" binding:"required"`
		Description string `json:"description" binding:"required"`
		DueDate     string `json:"due_date" binding:"required"`
		Status      string `json:"status" binding:"required"`
	}

	err = ctx.ShouldBindJSON(&requestBody)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// If user is not owner or admin, set status to pending (requires approval)
	status := requestBody.Status
	if role != "owner" && role != "admin" {
		status = "pending"
	}

	err = models.UpdateTask(ctx.Request.Context(), taskID, requestBody.Title, requestBody.Description, requestBody.DueDate, status)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Task updated successfully"})
}

func DeleteTask(ctx *gin.Context) {
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

	role := ctx.GetString("role")
	// If user is not owner or admin, set status to cancelled instead of deleting
	if role != "owner" && role != "admin" {
		// Check if user is assigned to the task
		taskAssignment := models.TaskAssignment{
			TaskID: taskID,
			UserID: ctx.GetString("userID"),
		}
		err := taskAssignment.Get(ctx.Request.Context())
		if err != nil {
			// User is not assigned to the task, deny access
			ctx.JSON(http.StatusForbidden, gin.H{"error": "you do not have permission to delete this task"})
			return
		}
		// User is assigned, cancel the task instead of deleting
		// Get the task to preserve existing values
		task, err := models.GetTaskByID(ctx.Request.Context(), taskID)
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		// Update task status to cancelled
		err = models.UpdateTask(ctx.Request.Context(), taskID, task.Title, task.Description, task.DueDate.Format(time.RFC3339), "cancelled")
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		ctx.JSON(http.StatusOK, gin.H{"message": "Task cancelled successfully"})
		return
	}

	// Owner or admin can actually delete the task
	err = models.DeleteTask(ctx.Request.Context(), taskID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Task deleted successfully"})
}
