package middleware

import (
	"net/http"

	"github.com/KoiralaSam/Remindly/backend/internal/models"
	"github.com/gin-gonic/gin"
)

func AuthGroupMemberMiddleware(ctx *gin.Context) {
	groupID := ctx.Param("groupID")

	var MemberID string = ctx.GetString("userID")

	// Check if the adder is already a member of this group
	checkMember := &models.GroupMember{
		GroupID: groupID,
		UserID:  MemberID,
	}

	isMember, err := checkMember.IsMember()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if !isMember {
		ctx.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "user is not a member of given group"})
		return
	}
	ctx.Next()
}
