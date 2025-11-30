package handlers

import (
	"net/http"

	"github.com/KoiralaSam/Remindly/backend/internal/models"
	"github.com/gin-gonic/gin"
)

func CreateGroup(ctx *gin.Context){
	var group models.Group
	// createdByUserId := ctx.GetInt64("created_by")

	err := ctx.ShouldBindJSON(&group)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error": "Couldnot parse request data!", 
		})
		return
	}

	group.CreatedBy = "0460f3d4-d480-49b0-b5dd-970f220e13d8"
	err = group.Create()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": "Couldnot create group!", 
		})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"message": "Group created successfully!",
	})
}