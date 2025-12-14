package handlers

import (
	"net/http"

	"github.com/KoiralaSam/Remindly/backend/internal/WS"
	"github.com/KoiralaSam/Remindly/backend/internal/models"
	"github.com/gin-gonic/gin"
)

func CreateGroup(wsHandler *WShandler) func(*gin.Context) {
	return func(ctx *gin.Context) {
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

		// Automatically add the creator as an owner member
		groupMember := &models.GroupMember{
			GroupID: group.ID,
			UserID:  createdByUserId,
			Role:    "owner",
		}
		err = groupMember.Save()
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{
				"error": "Group created but failed to add creator as member!",
			})
			return
		}

		// Automatically create a room for the group
		wsHandler.hub.Rooms[group.ID] = &WS.Room{
			ID:      group.ID,
			Name:    group.Name,
			Clients: make(map[string]*WS.Client),
		}

		ctx.JSON(http.StatusCreated, gin.H{
			"message": "Group created successfully!",
			"group":   group,
		})
	}
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

	ctx.JSON(http.StatusOK, gin.H{
		"group": groupDetail,
	})
}

func GetGroups(ctx *gin.Context) {
	userID := ctx.GetString("userID")

	groups, err := models.GetAllGroups(userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch groups",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"groups": groups,
	})
}

func UpdateGroup(ctx *gin.Context) {
	groupID := ctx.Param("groupID")

	var requestBody struct {
		Name        string `json:"name"`
		Description string `json:"description"`
	}

	err := ctx.ShouldBindJSON(&requestBody)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error": "Could not parse request data!",
		})
		return
	}

	// Get the existing group to preserve fields not being updated
	groupDetail, err := models.GetGroupByID(groupID)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{
			"error": "Group not found!",
		})
		return
	}

	// Check if user has permission to update (owner or admin)
	role := ctx.GetString("role")
	if role != "owner" && role != "admin" {
		ctx.JSON(http.StatusForbidden, gin.H{
			"error": "You do not have permission to update this group!",
		})
		return
	}

	// Update only provided fields
	group := models.Group{
		ID:          groupID,
		Name:        requestBody.Name,
		Description: requestBody.Description,
		Type:        groupDetail.Type, // Preserve existing type (automatically managed by triggers)
	}

	// If name is not provided, keep the existing name
	if group.Name == "" {
		group.Name = groupDetail.Name
	}

	// If description is not provided, keep the existing description
	if group.Description == "" {
		group.Description = groupDetail.Description
	}

	err = group.Update()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": "Could not update group!",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Group updated successfully!",
		"group":   group,
	})
}

func DeleteGroup(ctx *gin.Context) {
	groupID := ctx.Param("groupID")

	// Get the existing group to verify it exists
	_, err := models.GetGroupByID(groupID)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{
			"error": "Group not found!",
		})
		return
	}

	// Check if user has permission to delete (only owner)
	role := ctx.GetString("role")
	if role != "owner" {
		ctx.JSON(http.StatusForbidden, gin.H{
			"error": "Only group owners can delete groups!",
		})
		return
	}

	err = models.DeleteGroup(groupID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": "Could not delete group!",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Group deleted successfully!",
	})
}
