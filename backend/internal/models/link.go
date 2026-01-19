package models

import (
	"context"
	"errors"
	"time"

	"github.com/KoiralaSam/Remindly/backend/internal/db"
	"github.com/google/uuid"
)

type Link struct {
	ID              string    `json:"id"`
	URL             string    `json:"url"`
	Title           *string   `json:"title,omitempty"`
	Description     *string   `json:"description,omitempty"`
	PreviewImageURL *string   `json:"preview_image_url,omitempty"`
	PreviewImageS3Key *string `json:"preview_image_s3_key,omitempty"`
	GroupID         *string   `json:"group_id,omitempty"`
	CreatedBy       string    `json:"created_by"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

// Save saves a link record to the database
func (l *Link) Save(ctx context.Context) error {
	if l.ID == "" {
		l.ID = uuid.New().String()
	}

	now := time.Now()
	if l.CreatedAt.IsZero() {
		l.CreatedAt = now
	}
	l.UpdatedAt = now

	query := `
		INSERT INTO links (id, url, title, description, preview_image_url, preview_image_s3_key, group_id, created_by, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING created_at, updated_at
	`

	err := db.GetDB().QueryRow(ctx, query,
		l.ID, l.URL, l.Title, l.Description, l.PreviewImageURL, l.PreviewImageS3Key, l.GroupID, l.CreatedBy, l.CreatedAt, l.UpdatedAt,
	).Scan(&l.CreatedAt, &l.UpdatedAt)

	if err != nil {
		return errors.New("failed to save link: " + err.Error())
	}

	return nil
}

// GetByID retrieves a link by ID
func (l *Link) GetByID(ctx context.Context) error {
	query := `
		SELECT id, url, title, description, preview_image_url, preview_image_s3_key, group_id, created_by, created_at, updated_at
		FROM links
		WHERE id = $1
	`

	err := db.GetDB().QueryRow(ctx, query, l.ID).Scan(
		&l.ID, &l.URL, &l.Title, &l.Description, &l.PreviewImageURL, &l.PreviewImageS3Key, &l.GroupID, &l.CreatedBy, &l.CreatedAt, &l.UpdatedAt,
	)

	if err != nil {
		return errors.New("link not found: " + err.Error())
	}

	return nil
}

// GetLinksByGroupID retrieves all links for a group
func GetLinksByGroupID(ctx context.Context, groupID string) ([]Link, error) {
	query := `
		SELECT id, url, title, description, preview_image_url, preview_image_s3_key, group_id, created_by, created_at, updated_at
		FROM links
		WHERE group_id = $1
		ORDER BY created_at DESC
	`

	rows, err := db.GetDB().Query(ctx, query, groupID)
	if err != nil {
		return nil, errors.New("failed to fetch links: " + err.Error())
	}
	defer rows.Close()

	var links []Link
	for rows.Next() {
		var link Link
		err := rows.Scan(
			&link.ID, &link.URL, &link.Title, &link.Description, &link.PreviewImageURL, &link.PreviewImageS3Key, &link.GroupID, &link.CreatedBy, &link.CreatedAt, &link.UpdatedAt,
		)
		if err != nil {
			return nil, errors.New("failed to scan link: " + err.Error())
		}
		links = append(links, link)
	}

	return links, nil
}

// Delete deletes a link record from the database
func (l *Link) Delete(ctx context.Context) error {
	query := `DELETE FROM links WHERE id = $1`

	result, err := db.GetDB().Exec(ctx, query, l.ID)
	if err != nil {
		return errors.New("failed to delete link: " + err.Error())
	}

	if result.RowsAffected() == 0 {
		return errors.New("link not found")
	}

	return nil
}
