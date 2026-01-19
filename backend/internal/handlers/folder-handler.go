package handlers

import (
	"fmt"
	"net/http"

	"github.com/KoiralaSam/Remindly/backend/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// CreateFolder creates a new folder
// POST /api/groups/:groupID/folders
func CreateFolder(ctx *gin.Context) {
	groupID := ctx.Param("groupID")
	userID := ctx.GetString("userID")

	// Validate group ID
	if _, err := uuid.Parse(groupID); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid group ID",
		})
		return
	}

	var req struct {
		Name     string  `json:"name" binding:"required"`
		ParentID *string `json:"parent_id,omitempty"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
		})
		return
	}

	// Sanitize folder name
	folderName := models.SanitizeFolderName(req.Name)
	if folderName == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error": "Folder name cannot be empty",
		})
		return
	}

	// Create folder model
	folder := &models.Folder{
		Name:      folderName,
		ParentID:  req.ParentID,
		GroupID:   &groupID,
		CreatedBy: userID,
	}

	// Save folder
	err := folder.Save(ctx.Request.Context())
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("Failed to create folder: %v", err),
		})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"folder": folder,
	})
}

// GetFolders retrieves all folders for a group
// GET /api/groups/:groupID/folders
func GetFolders(ctx *gin.Context) {
	groupID := ctx.Param("groupID")
	parentID := ctx.Query("parent_id") // Optional

	// Validate group ID
	if _, err := uuid.Parse(groupID); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid group ID",
		})
		return
	}

	var parentIDPtr *string
	if parentID != "" {
		if _, err := uuid.Parse(parentID); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"error": "Invalid parent ID",
			})
			return
		}
		parentIDPtr = &parentID
	}

	folders, err := models.GetFoldersByGroupID(ctx.Request.Context(), groupID, parentIDPtr)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("Failed to fetch folders: %v", err),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"folders": folders,
	})
}

// GetFolder retrieves a single folder by ID
// GET /api/groups/:groupID/folders/:folderID
func GetFolder(ctx *gin.Context) {
	folderID := ctx.Param("folderID")

	// Validate folder ID
	if _, err := uuid.Parse(folderID); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid folder ID",
		})
		return
	}

	folder := &models.Folder{ID: folderID}
	err := folder.GetByID(ctx.Request.Context())
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{
			"error": "Folder not found",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"folder": folder,
	})
}

// DeleteFolder deletes a folder
// DELETE /api/groups/:groupID/folders/:folderID
func DeleteFolder(ctx *gin.Context) {
	folderID := ctx.Param("folderID")
	userID := ctx.GetString("userID")

	// Validate folder ID
	if _, err := uuid.Parse(folderID); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid folder ID",
		})
		return
	}

	// Get folder from database
	folder := &models.Folder{ID: folderID}
	err := folder.GetByID(ctx.Request.Context())
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{
			"error": "Folder not found",
		})
		return
	}

	// Check ownership
	if folder.CreatedBy != userID {
		ctx.JSON(http.StatusForbidden, gin.H{
			"error": "You don't have permission to delete this folder",
		})
		return
	}

	// Delete folder (CASCADE will handle child folders)
	err = folder.Delete(ctx.Request.Context())
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("Failed to delete folder: %v", err),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Folder deleted successfully",
	})
}
