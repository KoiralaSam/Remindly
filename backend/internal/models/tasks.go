package models

import (
	"context"
	"errors"
	"time"

	"github.com/KoiralaSam/Remindly/backend/internal/db"
)

type Task struct {
	ID          string    `json:"id"`
	GroupID     string    `json:"group_id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	DueDate     time.Time `json:"due_date"`
	Status      string    `json:"status"`
	CreatedBy   string    `json:"created_by"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (t *Task) CreateTask(ctx context.Context) error {
	query := `INSERT INTO tasks (group_id, title, description, due_date, created_by, status) 
	          VALUES ($1, $2, $3, $4, $5, $6) 
	          RETURNING id, created_at, updated_at`

	err := db.GetDB().QueryRow(ctx, query,
		t.GroupID,
		t.Title,
		t.Description,
		t.DueDate,
		t.CreatedBy,
		t.Status,
	).Scan(&t.ID, &t.CreatedAt, &t.UpdatedAt)

	if err != nil {
		return errors.New("failed to create task: " + err.Error())
	}

	return nil
}
