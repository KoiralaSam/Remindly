package models

import (
	"context"
	"errors"
	"time"

	"github.com/KoiralaSam/Remindly/backend/internal/db"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type File struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Size      int64     `json:"size"`
	MimeType  string    `json:"mime_type"`
	S3Bucket  string    `json:"s3_bucket"`
	S3Key     string    `json:"s3_key"`
	S3URL     *string   `json:"s3_url,omitempty"`
	FolderID  *string   `json:"folder_id,omitempty"`
	GroupID   *string   `json:"group_id,omitempty"`
	CreatedBy string    `json:"created_by"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Save saves a file record to the database
func (f *File) Save(ctx context.Context) error {
	if f.ID == "" {
		f.ID = uuid.New().String()
	}

	now := time.Now()
	if f.CreatedAt.IsZero() {
		f.CreatedAt = now
	}
	f.UpdatedAt = now

	query := `
		INSERT INTO files (id, name, size, mime_type, s3_bucket, s3_key, s3_url, folder_id, group_id, created_by, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		ON CONFLICT (s3_bucket, s3_key) DO UPDATE SET
			name = EXCLUDED.name,
			size = EXCLUDED.size,
			mime_type = EXCLUDED.mime_type,
			s3_url = EXCLUDED.s3_url,
			folder_id = EXCLUDED.folder_id,
			updated_at = EXCLUDED.updated_at
		RETURNING id, created_at, updated_at
	`

	err := db.GetDB().QueryRow(ctx, query,
		f.ID, f.Name, f.Size, f.MimeType, f.S3Bucket, f.S3Key, f.S3URL,
		f.FolderID, f.GroupID, f.CreatedBy, f.CreatedAt, f.UpdatedAt,
	).Scan(&f.ID, &f.CreatedAt, &f.UpdatedAt)

	if err != nil {
		return errors.New("failed to save file: " + err.Error())
	}

	return nil
}

// GetByID retrieves a file by ID
func (f *File) GetByID(ctx context.Context) error {
	query := `
		SELECT id, name, size, mime_type, s3_bucket, s3_key, s3_url, folder_id, group_id, created_by, created_at, updated_at
		FROM files
		WHERE id = $1
	`

	err := db.GetDB().QueryRow(ctx, query, f.ID).Scan(
		&f.ID, &f.Name, &f.Size, &f.MimeType, &f.S3Bucket, &f.S3Key,
		&f.S3URL, &f.FolderID, &f.GroupID, &f.CreatedBy, &f.CreatedAt, &f.UpdatedAt,
	)

	if err != nil {
		return errors.New("file not found: " + err.Error())
	}

	return nil
}

// GetFilesByGroupID retrieves all files for a group
func GetFilesByGroupID(ctx context.Context, groupID string, folderID *string) ([]File, error) {
	var query string
	var rows pgx.Rows
	var err error

	if folderID != nil {
		query = `
			SELECT id, name, size, mime_type, s3_bucket, s3_key, s3_url, folder_id, group_id, created_by, created_at, updated_at
			FROM files
			WHERE group_id = $1 AND folder_id = $2
			ORDER BY created_at DESC
		`
		rows, err = db.GetDB().Query(ctx, query, groupID, folderID)
	} else {
		query = `
			SELECT id, name, size, mime_type, s3_bucket, s3_key, s3_url, folder_id, group_id, created_by, created_at, updated_at
			FROM files
			WHERE group_id = $1 AND folder_id IS NULL
			ORDER BY created_at DESC
		`
		rows, err = db.GetDB().Query(ctx, query, groupID)
	}

	if err != nil {
		return nil, errors.New("failed to fetch files: " + err.Error())
	}
	defer rows.Close()

	var files []File
	for rows.Next() {
		var file File
		err := rows.Scan(
			&file.ID, &file.Name, &file.Size, &file.MimeType, &file.S3Bucket, &file.S3Key,
			&file.S3URL, &file.FolderID, &file.GroupID, &file.CreatedBy, &file.CreatedAt, &file.UpdatedAt,
		)
		if err != nil {
			return nil, errors.New("failed to scan file: " + err.Error())
		}
		files = append(files, file)
	}

	return files, nil
}

// Delete deletes a file record from the database
func (f *File) Delete(ctx context.Context) error {
	query := `DELETE FROM files WHERE id = $1`
	result, err := db.GetDB().Exec(ctx, query, f.ID)
	if err != nil {
		return errors.New("failed to delete file: " + err.Error())
	}

	rowsAffected := result.RowsAffected()
	if rowsAffected == 0 {
		return errors.New("file not found")
	}

	return nil
}
