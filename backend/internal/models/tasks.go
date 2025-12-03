package models

import (
	"context"
	"time"

	"github.com/KoiralaSam/Remindly/backend/internal/db"
)

type Task struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	DueDate     time.Time `json:"due_date"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (t *Task) CreateTask(ctx context.Context, task Task) error {
	query := `INSERT INTO tasks (title, description, due_date) VALUES ($1, $2, $3, $4)`
	rows, err := db.GetDB().Query(ctx, query, task.Title, task.Description, task.DueDate)
	if err != nil {
		return err
	}
	defer rows.Close()
	return nil
}
