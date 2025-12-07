package models

import (
	"context"
	"errors"
	"strconv"
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

func GetTasksByGroupID(ctx context.Context, groupID string, status string, assignee string, limit int64, offset int64) ([]Task, int64, error) {
	// Build WHERE clause and arguments for both queries
	whereClause := `WHERE group_id = $1`
	args := []any{groupID}
	paramNum := 2

	if status != "" {
		whereClause += ` AND status = $` + strconv.Itoa(paramNum)
		args = append(args, status)
		paramNum++
	}

	if assignee != "" {
		whereClause += ` AND created_by = $` + strconv.Itoa(paramNum)
		args = append(args, assignee)
		paramNum++
	}

	// Get total count
	countQuery := `SELECT COUNT(*) FROM tasks ` + whereClause
	var total int64
	err := db.GetDB().QueryRow(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, errors.New("failed to get task count: " + err.Error())
	}

	// Get tasks with pagination
	query := `SELECT id, group_id, title, description, due_date, status, created_by, created_at, updated_at FROM tasks ` + whereClause + ` ORDER BY created_at DESC LIMIT $` + strconv.Itoa(paramNum) + ` OFFSET $` + strconv.Itoa(paramNum+1)
	queryArgs := append(args, limit, offset)

	rows, err := db.GetDB().Query(ctx, query, queryArgs...)
	if err != nil {
		return nil, 0, errors.New("failed to get tasks: " + err.Error())
	}
	defer rows.Close()

	tasks := []Task{}

	for rows.Next() {
		var task Task
		err := rows.Scan(&task.ID, &task.GroupID, &task.Title, &task.Description, &task.DueDate, &task.Status, &task.CreatedBy, &task.CreatedAt, &task.UpdatedAt)
		if err != nil {
			return nil, 0, errors.New("failed to scan task: " + err.Error())
		}
		tasks = append(tasks, task)
	}

	return tasks, total, nil
}
