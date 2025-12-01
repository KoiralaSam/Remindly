package models

import (
	"context"
	"time"

	"github.com/KoiralaSam/Remindly/backend/internal/db"
)

type Group struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	CreatedBy   string    `json:"created_by"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (group *Group) Create() error {
	query := `
		INSERT INTO groups (name, description, created_by)
		VALUES ($1, $2, $3)
	`

	_, err := db.GetDB().Exec(context.Background(), query, group.Name, group.Description, group.CreatedBy)
	if err != nil {
		return err
	}
	return nil
}
