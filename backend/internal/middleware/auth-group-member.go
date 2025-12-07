package middleware

import (
	"net/http"

	"github.com/KoiralaSam/Remindly/backend/internal/models"
	"github.com/gin-gonic/gin"
)

func AuthGroupMemberMiddleware(ctx *gin.Context) {
	groupID := ctx.Param("groupID")

	MemberID := ctx.GetString("userID")
	if MemberID == "" {
		ctx.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "user ID not found in token"})
		return
	}

	// Check if the adder is already a member of this group
	checkMember := &models.GroupMember{
		GroupID: groupID,
		UserID:  MemberID,
	}

	isMember, err := checkMember.IsMember(ctx.Request.Context())
	if err != nil {
		ctx.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if !isMember {
		ctx.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "user is not a member of given group"})
		return
	}

	// Fetch the requester's role and set it in the context
	err = checkMember.Get()
	if err != nil {
		ctx.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.Set("role", checkMember.Role)

	ctx.Next()
}
