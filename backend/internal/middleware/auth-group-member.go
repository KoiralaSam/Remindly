package middleware

import (
	"net/http"

	"github.com/KoiralaSam/Remindly/backend/internal/models"
	"github.com/gin-gonic/gin"
)

func AuthGroupMemberMiddleware(ctx *gin.Context) {
	groupID := ctx.Param("groupID")

	var MemberID string = ctx.GetString("userID")

	var groupMembers []models.GroupMember

	// Check if the adder is already a member of this group
	checkMember := &models.GroupMember{
		GroupID: groupID,
	}
	groupMembers, err := checkMember.GetByGroupID()

	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var isMember bool = false

	for _, member := range groupMembers {
		if member.UserID == MemberID {
			isMember = true
			break
		}
	}

	if !isMember {
		ctx.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "user is not a member of given group"})
		return
	}

	ctx.Next()
}
