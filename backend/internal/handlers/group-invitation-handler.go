package handlers

import (
	"net/http"

	"github.com/KoiralaSam/Remindly/backend/internal/models"
	"github.com/gin-gonic/gin"
)

// GetInvitations retrieves all pending invitations for the current user
func GetInvitations(ctx *gin.Context) {
	userID := ctx.GetString("userID")

	if userID == "" {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "user ID not found"})
		return
	}

	reqCtx := ctx.Request.Context()

	// Get user to fetch email
	user := &models.User{ID: userID}
	err := user.Get()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get user information"})
		return
	}

	var invitations []models.GroupInvitation
	invitationMap := make(map[string]models.GroupInvitation)

	// Get all invitations by user ID
	userIDInvitations, err := models.GetAllInvitationsByUserID(reqCtx, userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	for _, inv := range userIDInvitations {
		invitationMap[inv.ID] = inv
	}

	// Also get invitations by email (for users who were invited before they had an account)
	emailInvitations, err := models.GetAllInvitationsByEmail(reqCtx, user.Email)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	for _, inv := range emailInvitations {
		if _, exists := invitationMap[inv.ID]; !exists {
			invitationMap[inv.ID] = inv
		}
	}

	// Convert map to slice
	invitations = make([]models.GroupInvitation, 0, len(invitationMap))
	for _, inv := range invitationMap {
		invitations = append(invitations, inv)
	}

	if invitations == nil {
		invitations = []models.GroupInvitation{}
	}

	ctx.JSON(http.StatusOK, gin.H{"invitations": invitations})
}

// AcceptInvitation accepts a group invitation
func AcceptInvitation(ctx *gin.Context) {
	invitationID := ctx.Param("invitationID")
	userID := ctx.GetString("userID")

	if userID == "" {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "user ID not found"})
		return
	}

	reqCtx := ctx.Request.Context()

	// Get user to verify email matches invitation
	user := &models.User{ID: userID}
	err := user.Get()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get user information"})
		return
	}

	// Get the invitation (which contains the group ID)
	invitation := &models.GroupInvitation{
		ID: invitationID,
	}
	err = invitation.GetByID(reqCtx)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "invitation not found"})
		return
	}

	// Verify invitation is pending
	if invitation.Status != "pending" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invitation is not pending"})
		return
	}

	// Verify the invitation is for this user (by email or user ID)
	isForUser := false
	if invitation.InviteeID != nil && *invitation.InviteeID == userID {
		isForUser = true
	}
	if !isForUser && invitation.InviteeEmail == user.Email {
		isForUser = true
	}

	if !isForUser {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "this invitation is not for you"})
		return
	}

	// Check if user is already a member (shouldn't happen, but safety check)
	groupMember := &models.GroupMember{
		GroupID: invitation.GroupID,
		UserID:  userID,
	}
	isMember, err := groupMember.IsMember(reqCtx)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if isMember {
		// User is already a member, mark invitation as accepted anyway
		invitation.UpdateStatus(reqCtx, "accepted")
		ctx.JSON(http.StatusOK, gin.H{"message": "You are already a member of this group"})
		return
	}

	// Update invitation to set invitee_id if not set
	if invitation.InviteeID == nil {
		err = invitation.SetInviteeID(reqCtx, userID)
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	// Create group member with the role from invitation
	newMember := &models.GroupMember{
		GroupID: invitation.GroupID,
		UserID:  userID,
		Role:    invitation.Role,
	}

	err = newMember.Save()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to add member: " + err.Error()})
		return
	}

	// Update invitation status to accepted
	err = invitation.UpdateStatus(reqCtx, "accepted")
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update invitation status: " + err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Invitation accepted successfully",
		"member":  newMember,
	})
}

// DeclineInvitation declines or cancels a group invitation
func DeclineInvitation(ctx *gin.Context) {
	invitationID := ctx.Param("invitationID")
	userID := ctx.GetString("userID")

	if userID == "" {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "user ID not found"})
		return
	}

	reqCtx := ctx.Request.Context()

	// Get user to verify email matches invitation
	user := &models.User{ID: userID}
	err := user.Get()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get user information"})
		return
	}

	// Get the invitation (which contains the group ID)
	invitation := &models.GroupInvitation{
		ID: invitationID,
	}
	err = invitation.GetByID(reqCtx)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "invitation not found"})
		return
	}

	// Verify invitation is pending
	if invitation.Status != "pending" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invitation is not pending"})
		return
	}

	// Check if current user is the invitee (can decline) or inviter (can cancel)
	isInvitee := false
	if invitation.InviteeID != nil && *invitation.InviteeID == userID {
		isInvitee = true
	}
	if !isInvitee && invitation.InviteeEmail == user.Email {
		isInvitee = true
	}

	isInviter := invitation.InviterID == userID

	if !isInvitee && !isInviter {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "you can only decline/cancel your own invitations"})
		return
	}

	// Update invitation status to declined
	err = invitation.UpdateStatus(reqCtx, "declined")
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	action := "declined"
	if isInviter {
		action = "cancelled"
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Invitation " + action + " successfully"})
}
