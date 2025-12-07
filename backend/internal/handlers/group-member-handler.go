package handlers

import (
	"net/http"

	"github.com/KoiralaSam/Remindly/backend/internal/models"
	"github.com/gin-gonic/gin"
)

func AddGroupMember(ctx *gin.Context) {
	groupID := ctx.Param("groupID")

	var requestBody struct {
		UserID string `json:"user_id"`
		Email  string `json:"email"`
		Role   string `json:"role" binding:"required"`
	}

	err := ctx.ShouldBindJSON(&requestBody)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var userID string

	if requestBody.UserID != "" {
		userID = requestBody.UserID
	} else if requestBody.Email != "" {
		user := &models.User{
			Email: requestBody.Email,
		}
		err = user.GetByEmail()
		if err != nil {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "user not found with the provided email"})
			return
		}
		userID = user.ID
	} else {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "either user_id or email must be provided"})
		return
	}

	// Check if the requester's role has permission to add the target role
	requesterRole := ctx.GetString("role")
	canAdd := models.CanModifyRole(requesterRole, requestBody.Role)
	if !canAdd {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "you do not have permission to add this role"})
		return
	}

	groupMember := &models.GroupMember{
		GroupID: groupID,
		UserID:  userID,
		Role:    requestBody.Role,
	}

	err = groupMember.Save()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{"message": "Group member added successfully"})
}

func GetGroupMembers(ctx *gin.Context) {
	groupID := ctx.Param("groupID")

	groupMember := &models.GroupMember{
		GroupID: groupID,
	}

	groupMembers, err := groupMember.GetByGroupID()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"group_members": groupMembers})

}

func UpdateGroupMemberRole(ctx *gin.Context) {
	groupID := ctx.Param("groupID")
	userID := ctx.Param("userId")

	var requestBody struct {
		Role string `json:"role" binding:"required"`
	}

	err := ctx.ShouldBindJSON(&requestBody)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	groupMember := &models.GroupMember{
		GroupID: groupID,
		UserID:  userID,
	}
	// Check if the updater is a member of the group
	isMember, err := groupMember.IsMember(ctx.Request.Context())
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	// If the user is not a member of the group, return an unauthorized error
	if !isMember {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Non-member cannot update role"})
		return
	}

	// Check if the requester's role has permission to update the target role
	requesterRole := ctx.GetString("role")
	canUpdate := models.CanModifyRole(requesterRole, requestBody.Role)
	if !canUpdate {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "you do not have permission to update this role"})
		return
	}

	err = groupMember.UpdateRole(requestBody.Role)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Group member role updated successfully"})
}

func DeleteGroupMember(ctx *gin.Context) {
	groupID := ctx.Param("groupID")
	userID := ctx.Param("userId")

	// Get the requester's role from context (set by middleware)
	requesterRole := ctx.GetString("role")

	// Get the target member to check their role and verify they exist
	targetMember := &models.GroupMember{
		GroupID: groupID,
		UserID:  userID,
	}
	err := targetMember.Get()
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "group member not found"})
		return
	}

	// Check if requester has permission to delete the target member's role
	canDelete := models.CanModifyRole(requesterRole, targetMember.Role)
	if !canDelete {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "you do not have permission to delete this member"})
		return
	}

	// Delete the member
	err = targetMember.Delete()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Group member deleted successfully"})
}
