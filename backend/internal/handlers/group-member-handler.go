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
