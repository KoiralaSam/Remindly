package handlers

import (
	"net/http"

	"github.com/KoiralaSam/Remindly/backend/internal/models"
	"github.com/gin-gonic/gin"
)

func AddGroupMember(ctx *gin.Context) {
	groupID := ctx.Param("groupID")
	inviterID := ctx.GetString("userID")

	if inviterID == "" {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "user ID not found"})
		return
	}

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

	// Email is required for invitations
	if requestBody.Email == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "email is required"})
		return
	}

	// Check if the requester's role has permission to add the target role
	requesterRole := ctx.GetString("role")
	canAdd := models.CanModifyRole(requesterRole, requestBody.Role)
	if !canAdd {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "you do not have permission to add this role"})
		return
	}

	reqCtx := ctx.Request.Context()

	// Check if user is already a member of the group
	var inviteeID *string
	if requestBody.UserID != "" {
		inviteeID = &requestBody.UserID
		// Check if user is already a member
		groupMember := &models.GroupMember{
			GroupID: groupID,
			UserID:  requestBody.UserID,
		}
		isMember, err := groupMember.IsMember(reqCtx)
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if isMember {
			ctx.JSON(http.StatusConflict, gin.H{"error": "user is already a member of this group"})
			return
		}
	} else {
		// Try to find user by email
		user := &models.User{
			Email: requestBody.Email,
		}
		err = user.GetByEmail()
		if err == nil {
			// User exists, set invitee_id
			inviteeID = &user.ID
			// Check if user is already a member
			groupMember := &models.GroupMember{
				GroupID: groupID,
				UserID:  user.ID,
			}
			isMember, err := groupMember.IsMember(reqCtx)
			if err != nil {
				ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			if isMember {
				ctx.JSON(http.StatusConflict, gin.H{"error": "user is already a member of this group"})
				return
			}
		}
		// If user doesn't exist, inviteeID remains nil (will be set when they accept)
	}

	// Check if a pending invitation already exists for this group and email
	exists, err := models.CheckPendingInvitationExists(reqCtx, groupID, requestBody.Email)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if exists {
		ctx.JSON(http.StatusConflict, gin.H{"error": "a pending invitation already exists for this email"})
		return
	}

	// Create the invitation
	invitation := &models.GroupInvitation{
		GroupID:      groupID,
		InviterID:    inviterID,
		InviteeEmail: requestBody.Email,
		InviteeID:    inviteeID,
		Role:         requestBody.Role,
		Status:       "pending",
		ExpiresAt:    nil, // Can be set later if needed
	}

	err = invitation.Save(reqCtx)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"message":    "Invitation sent successfully",
		"invitation": invitation,
	})
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
