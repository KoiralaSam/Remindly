package handlers

import (
	"fmt"
	"net/http"

	"github.com/KoiralaSam/Remindly/backend/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// CreateLink creates a new link
// POST /api/groups/:groupID/links
func CreateLink(ctx *gin.Context) {
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
		URL             string  `json:"url" binding:"required"`
		Title           *string `json:"title,omitempty"`
		Description     *string `json:"description,omitempty"`
		PreviewImageURL *string `json:"preview_image_url,omitempty"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
		})
		return
	}

	// Create link model
	link := &models.Link{
		URL:             req.URL,
		Title:           req.Title,
		Description:     req.Description,
		PreviewImageURL: req.PreviewImageURL,
		GroupID:         &groupID,
		CreatedBy:       userID,
	}

	// Save link
	err := link.Save(ctx.Request.Context())
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("Failed to create link: %v", err),
		})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"link": link,
	})
}

// GetLinks retrieves all links for a group
// GET /api/groups/:groupID/links
func GetLinks(ctx *gin.Context) {
	groupID := ctx.Param("groupID")

	// Validate group ID
	if _, err := uuid.Parse(groupID); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid group ID",
		})
		return
	}

	links, err := models.GetLinksByGroupID(ctx.Request.Context(), groupID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("Failed to fetch links: %v", err),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"links": links,
	})
}

// GetLink retrieves a single link by ID
// GET /api/groups/:groupID/links/:linkID
func GetLink(ctx *gin.Context) {
	linkID := ctx.Param("linkID")

	// Validate link ID
	if _, err := uuid.Parse(linkID); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid link ID",
		})
		return
	}

	link := &models.Link{ID: linkID}
	err := link.GetByID(ctx.Request.Context())
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{
			"error": "Link not found",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"link": link,
	})
}

// DeleteLink deletes a link
// DELETE /api/groups/:groupID/links/:linkID
func DeleteLink(ctx *gin.Context) {
	linkID := ctx.Param("linkID")
	userID := ctx.GetString("userID")

	// Validate link ID
	if _, err := uuid.Parse(linkID); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid link ID",
		})
		return
	}

	// Get link from database
	link := &models.Link{ID: linkID}
	err := link.GetByID(ctx.Request.Context())
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{
			"error": "Link not found",
		})
		return
	}

	// Check ownership
	if link.CreatedBy != userID {
		ctx.JSON(http.StatusForbidden, gin.H{
			"error": "You don't have permission to delete this link",
		})
		return
	}

	// Delete link
	err = link.Delete(ctx.Request.Context())
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("Failed to delete link: %v", err),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Link deleted successfully",
	})
}
