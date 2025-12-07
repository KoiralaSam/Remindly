package handlers

import (
	"net/http"

	"github.com/KoiralaSam/Remindly/backend/internal/models"
	"github.com/gin-gonic/gin"
)

func AssignTask(ctx *gin.Context) {

	assignedBy := ctx.GetString("userID")
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
		UserID string `json:"user_id" binding:"required"`
	}

	err = ctx.ShouldBindJSON(&requestBody)
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
	isMember, err := groupMember.IsMember(ctx.Request.Context())
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

func UnassignTask(ctx *gin.Context) {

	unassignedBy := ctx.GetString("userID")
	taskID := ctx.Param("taskId")
	groupID := ctx.Param("groupID")

	var requestBody struct {
		UserID string `json:"user_id" binding:"required"`
	}

	err := ctx.ShouldBindJSON(&requestBody)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
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

	// Check if the user being unassigned is a member of the group
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
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "user being unassigned is not a member of this group"})
		return
	}

	// Check if the user is owner or admin to unassign the task
	role := ctx.GetString("role")
	// Allow access if user is owner or admin
	if role != "owner" && role != "admin" {

		// If not owner/admin, check if user is assigned to the task
		taskAssignment := models.TaskAssignment{
			TaskID: taskID,
			UserID: unassignedBy,
		}

		err := taskAssignment.Get(ctx.Request.Context())
		if err != nil {
			// User is not assigned to the task, deny access
			ctx.JSON(http.StatusForbidden, gin.H{"error": "you do not have permission to access this task"})
			return
		}

		// User is assigned, allow access (continue)

		//since the user is assigned to the task, they can only unassign themselves since they are not the owner or admin
		if unassignedBy != requestBody.UserID {
			ctx.JSON(http.StatusForbidden, gin.H{"error": "you do not have permission to unassign this task"})
			return
		}
	}

	// Delete the task assignment
	assignment := models.TaskAssignment{
		TaskID: taskID,
		UserID: requestBody.UserID,
	}

	err = assignment.Delete(ctx.Request.Context())
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Assignment removed successfully",
	})
}

func GetTaskAssignments(ctx *gin.Context) {

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

	// Get the task assignments
	taskAssignments, err := models.GetTaskAssignments(ctx.Request.Context(), taskID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"task_assignments": taskAssignments})
}
