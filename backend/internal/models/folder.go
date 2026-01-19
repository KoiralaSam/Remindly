package models

import (
	"context"
	"errors"
	"path/filepath"
	"strings"
	"time"

	"github.com/KoiralaSam/Remindly/backend/internal/db"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type Folder struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	ParentID  *string   `json:"parent_id,omitempty"`
	Path      string    `json:"path"`
	GroupID   *string   `json:"group_id,omitempty"`
	CreatedBy string    `json:"created_by"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Save saves a folder record to the database
func (f *Folder) Save(ctx context.Context) error {
	if f.ID == "" {
		f.ID = uuid.New().String()
	}

	// Generate path if not provided
	if f.Path == "" {
		f.Path = f.generatePath()
	}

	now := time.Now()
	if f.CreatedAt.IsZero() {
		f.CreatedAt = now
	}
	f.UpdatedAt = now

	query := `
		INSERT INTO folders (id, name, parent_id, path, group_id, created_by, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		ON CONFLICT (path, group_id) DO UPDATE SET
			name = EXCLUDED.name,
			parent_id = EXCLUDED.parent_id,
			updated_at = EXCLUDED.updated_at
		RETURNING created_at, updated_at
	`

	err := db.GetDB().QueryRow(ctx, query,
		f.ID, f.Name, f.ParentID, f.Path, f.GroupID, f.CreatedBy, f.CreatedAt, f.UpdatedAt,
	).Scan(&f.CreatedAt, &f.UpdatedAt)

	if err != nil {
		return errors.New("failed to save folder: " + err.Error())
	}

	return nil
}

// generatePath generates a folder path based on parent and name
func (f *Folder) generatePath() string {
	if f.ParentID == nil {
		return "/" + f.Name
	}

	// Get parent folder to build path
	parent := &Folder{ID: *f.ParentID}
	if err := parent.GetByID(context.Background()); err != nil {
		// If parent not found, use name as root
		return "/" + f.Name
	}

	return filepath.Join(parent.Path, f.Name)
}

// GetByID retrieves a folder by ID
func (f *Folder) GetByID(ctx context.Context) error {
	query := `
		SELECT id, name, parent_id, path, group_id, created_by, created_at, updated_at
		FROM folders
		WHERE id = $1
	`

	err := db.GetDB().QueryRow(ctx, query, f.ID).Scan(
		&f.ID, &f.Name, &f.ParentID, &f.Path, &f.GroupID, &f.CreatedBy, &f.CreatedAt, &f.UpdatedAt,
	)

	if err != nil {
		return errors.New("folder not found: " + err.Error())
	}

	return nil
}

// GetFoldersByGroupID retrieves all folders for a group
func GetFoldersByGroupID(ctx context.Context, groupID string, parentID *string) ([]Folder, error) {
	var query string
	var rows pgx.Rows
	var err error

	if parentID != nil {
		query = `
			SELECT id, name, parent_id, path, group_id, created_by, created_at, updated_at
			FROM folders
			WHERE group_id = $1 AND parent_id = $2
			ORDER BY name ASC
		`
		rows, err = db.GetDB().Query(ctx, query, groupID, parentID)
	} else {
		query = `
			SELECT id, name, parent_id, path, group_id, created_by, created_at, updated_at
			FROM folders
			WHERE group_id = $1 AND parent_id IS NULL
			ORDER BY name ASC
		`
		rows, err = db.GetDB().Query(ctx, query, groupID)
	}

	if err != nil {
		return nil, errors.New("failed to fetch folders: " + err.Error())
	}
	defer rows.Close()

	var folders []Folder
	for rows.Next() {
		var folder Folder
		err := rows.Scan(
			&folder.ID, &folder.Name, &folder.ParentID, &folder.Path, &folder.GroupID, &folder.CreatedBy, &folder.CreatedAt, &folder.UpdatedAt,
		)
		if err != nil {
			return nil, errors.New("failed to scan folder: " + err.Error())
		}
		folders = append(folders, folder)
	}

	return folders, nil
}

// Delete deletes a folder record from the database
func (f *Folder) Delete(ctx context.Context) error {
	query := `DELETE FROM folders WHERE id = $1`

	result, err := db.GetDB().Exec(ctx, query, f.ID)
	if err != nil {
		return errors.New("failed to delete folder: " + err.Error())
	}

	if result.RowsAffected() == 0 {
		return errors.New("folder not found")
	}

	return nil
}

// SanitizeName sanitizes folder name to prevent path traversal
func SanitizeFolderName(name string) string {
	// Remove path separators and other dangerous characters
	name = strings.ReplaceAll(name, "/", "")
	name = strings.ReplaceAll(name, "\\", "")
	name = strings.ReplaceAll(name, "..", "")
	name = strings.TrimSpace(name)
	return name
}
