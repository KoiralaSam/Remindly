package handlers

import (
	"net/http"

	"github.com/KoiralaSam/Remindly/backend/internal/models"
	"github.com/gin-gonic/gin"
)

func CreateGroup(ctx *gin.Context){
	var group models.Group
	createdByUserId := ctx.GetString("userID")

	err := ctx.ShouldBindJSON(&group)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error": "Couldnot parse request data!", 
		})
		return
	}

	group.CreatedBy = createdByUserId
	err = group.Create()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": "Couldnot create group!", 
		})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"message": "Group created successfully!",
		"group": group,
	})
}