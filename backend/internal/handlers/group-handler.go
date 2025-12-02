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

func GetGroupByID(ctx *gin.Context) {
	groupID := ctx.Param("groupID")

	groupDetail, err := models.GetGroupByID(groupID)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{
			"error": "Group not found!",
		})
		return
	}

	ctx.JSON(http.StatusOK, groupDetail)
}

func GetGroups(ctx *gin.Context) {
	// TODO: Implement GetGroups
	ctx.JSON(http.StatusNotImplemented, gin.H{
		"error": "Not implemented yet",
	})
}

func UpdateGroup(ctx *gin.Context) {
	// TODO: Implement UpdateGroup
	ctx.JSON(http.StatusNotImplemented, gin.H{
		"error": "Not implemented yet",
	})
}

func DeleteGroup(ctx *gin.Context) {
	// TODO: Implement DeleteGroup
	ctx.JSON(http.StatusNotImplemented, gin.H{
		"error": "Not implemented yet",
	})
}