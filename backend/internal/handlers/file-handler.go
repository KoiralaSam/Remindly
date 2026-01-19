package handlers

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/KoiralaSam/Remindly/backend/internal/models"
	"github.com/KoiralaSam/Remindly/backend/internal/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// Package-level S3 service
var s3Service *utils.S3Service

// InitS3Service initializes the S3 service for file uploads
func InitS3Service() error {
	service, err := utils.NewS3Service()
	if err != nil {
		return fmt.Errorf("failed to initialize S3 service: %w", err)
	}
	s3Service = service
	return nil
}

// UploadFile handles file uploads to S3
// POST /api/groups/:groupID/files
func UploadFile(ctx *gin.Context) {
	if s3Service == nil {
		ctx.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "S3 service not initialized",
		})
		return
	}

	// Get parameters
	groupID := ctx.Param("groupID")
	userID := ctx.GetString("userID")
	folderID := ctx.Query("folder_id") // Optional

	// Validate group ID
	if _, err := uuid.Parse(groupID); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid group ID",
		})
		return
	}

	// Get file from form
	fileHeader, err := ctx.FormFile("file")
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error": "No file provided",
		})
		return
	}

	// Open file
	src, err := fileHeader.Open()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to open file",
		})
		return
	}
	defer src.Close()

	// Generate S3 key
	s3Key := utils.GenerateS3Key(groupID, userID, fileHeader.Filename)

	// Upload to S3
	err = s3Service.UploadFile(ctx, s3Key, src, fileHeader.Header.Get("Content-Type"))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("Failed to upload file to S3: %v", err),
		})
		return
	}

	// Generate presigned URL (1 hour expiry)
	presignedURL, err := s3Service.GetPresignedURL(ctx, s3Key, 1*time.Hour)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("Failed to generate presigned URL: %v", err),
		})
		return
	}

	// Create file model
	file := &models.File{
		ID:        uuid.New().String(),
		Name:      fileHeader.Filename,
		Size:      fileHeader.Size,
		MimeType:  fileHeader.Header.Get("Content-Type"),
		S3Bucket:  s3Service.GetBucket(),
		S3Key:     s3Key,
		GroupID:   &groupID,
		CreatedBy: userID,
		S3URL:     &presignedURL,
	}

	// Set folder ID if provided
	if folderID != "" {
		if _, err := uuid.Parse(folderID); err == nil {
			file.FolderID = &folderID
		}
	}

	// Save to database
	err = file.Save(ctx)
	if err != nil {
		// Try to delete from S3 if DB save fails
		_ = s3Service.DeleteFile(ctx, s3Key)
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("Failed to save file metadata: %v", err),
		})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"message": "File uploaded successfully",
		"file":    file,
	})
}

// GetFiles retrieves all files for a group
// GET /api/groups/:groupID/files
func GetFiles(ctx *gin.Context) {
	groupID := ctx.Param("groupID")
	folderID := ctx.Query("folder_id") // Optional

	// Validate group ID
	if _, err := uuid.Parse(groupID); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid group ID",
		})
		return
	}

	// Validate folder ID if provided
	var folderIDPtr *string
	if folderID != "" {
		if _, err := uuid.Parse(folderID); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"error": "Invalid folder ID",
			})
			return
		}
		folderIDPtr = &folderID
	}

	// Get files from database
	files, err := models.GetFilesByGroupID(ctx, groupID, folderIDPtr)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("Failed to retrieve files: %v", err),
		})
		return
	}

	// Generate fresh presigned URLs for each file
	if s3Service != nil {
		for i := range files {
			presignedURL, err := s3Service.GetPresignedURL(ctx, files[i].S3Key, 1*time.Hour)
			if err == nil {
				files[i].S3URL = &presignedURL
			}
		}
	}

	ctx.JSON(http.StatusOK, gin.H{
		"files": files,
	})
}

// GetFileInfo retrieves file metadata by ID
// GET /api/groups/:groupID/files/:fileID
func GetFileInfo(ctx *gin.Context) {
	fileID := ctx.Param("fileID")

	// Validate file ID
	if _, err := uuid.Parse(fileID); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid file ID",
		})
		return
	}

	// Get file from database
	file := &models.File{ID: fileID}
	err := file.GetByID(ctx)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{
			"error": "File not found",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"file": file,
	})
}

// GetFileDownloadURL generates a presigned URL for downloading a file
// GET /api/groups/:groupID/files/:fileID/download
func GetFileDownloadURL(ctx *gin.Context) {
	if s3Service == nil {
		ctx.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "S3 service not initialized",
		})
		return
	}

	fileID := ctx.Param("fileID")
	expiresParam := ctx.DefaultQuery("expires", "3600") // Default 1 hour

	// Validate file ID
	if _, err := uuid.Parse(fileID); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid file ID",
		})
		return
	}

	// Parse expires parameter
	var err error
	expiresSeconds, err := strconv.ParseInt(expiresParam, 10, 64)
	if err != nil || expiresSeconds <= 0 {
		expiresSeconds = 3600 // Default to 1 hour
	}
	expires := time.Duration(expiresSeconds) * time.Second

	// Get file from database
	file := &models.File{ID: fileID}
	err = file.GetByID(ctx)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{
			"error": "File not found",
		})
		return
	}

	// Generate presigned URL
	presignedURL, err := s3Service.GetPresignedURL(ctx, file.S3Key, expires)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("Failed to generate download URL: %v", err),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"download_url": presignedURL,
		"expires_in":   expiresSeconds,
	})
}

// DeleteFile deletes a file from S3 and database
// DELETE /api/groups/:groupID/files/:fileID
func DeleteFile(ctx *gin.Context) {
	if s3Service == nil {
		ctx.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "S3 service not initialized",
		})
		return
	}

	fileID := ctx.Param("fileID")
	userID := ctx.GetString("userID")

	// Validate file ID
	if _, err := uuid.Parse(fileID); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid file ID",
		})
		return
	}

	// Get file from database
	var err error
	file := &models.File{ID: fileID}
	err = file.GetByID(ctx)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{
			"error": "File not found",
		})
		return
	}

	// Check ownership
	if file.CreatedBy != userID {
		ctx.JSON(http.StatusForbidden, gin.H{
			"error": "You don't have permission to delete this file",
		})
		return
	}

	// Delete from S3 first
	err = s3Service.DeleteFile(context.Background(), file.S3Key)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("Failed to delete file from S3: %v", err),
		})
		return
	}

	// Delete from database
	err = file.Delete(ctx)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": fmt.Sprintf("Failed to delete file metadata: %v", err),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "File deleted successfully",
	})
}
