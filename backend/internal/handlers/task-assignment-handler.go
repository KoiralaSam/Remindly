package handlers

import (
	"net/http"

	"github.com/KoiralaSam/Remindly/backend/internal/models"
	"github.com/gin-gonic/gin"
)

func AssignTask(ctx *gin.Context) {
	groupID := ctx.Param("groupID")
	taskID := ctx.Param("taskId")
	assignedBy := ctx.GetString("userID")

	var requestBody struct {
		UserID string `json:"user_id" binding:"required"`
	}

	err := ctx.ShouldBindJSON(&requestBody)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if assignee is a member of the group (application-level check)
	// Note: The database trigger will also validate membership, but this provides
	// better error messages and fails fast
	groupMember := &models.GroupMember{
		GroupID: groupID,
		UserID:  requestBody.UserID,
	}
	isMember, err := groupMember.IsMember()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if !isMember {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "user is not a member of this group"})
		return
	}

	// Create the task assignment
	assignment := models.TaskAssignment{
		TaskID:     taskID,
		UserID:     requestBody.UserID,
		AssignedBy: assignedBy,
	}

	err = assignment.Save(ctx.Request.Context())
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"message":    "Task assigned successfully",
		"assignment": assignment,
	})
}
