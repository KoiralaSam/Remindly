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

type TaskWithAssignees struct {
	Task
	Assignees []string `json:"assignees"`
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
	query := `SELECT id, group_id, title, description, due_date, status, created_by, created_at, updated_at FROM tasks` + whereClause + ` ORDER BY created_at DESC LIMIT $` + strconv.Itoa(paramNum) + ` OFFSET $` + strconv.Itoa(paramNum+1)
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

func GetTasksByUserID(ctx context.Context, userID string, status string, assignee string, limit int64, offset int64) ([]Task, int64, error) {
	// Build WHERE clause and arguments for both queries
	whereClause := `WHERE task_assignments.user_id = $1`
	args := []any{userID}
	paramNum := 2

	if status != "" {
		whereClause += ` AND tasks.status = $` + strconv.Itoa(paramNum)
		args = append(args, status)
		paramNum++
	}

	if assignee != "" {
		whereClause += ` AND tasks.created_by = $` + strconv.Itoa(paramNum)
		args = append(args, assignee)
		paramNum++
	}

	// Get total count - need JOIN for task_assignments
	countQuery := `SELECT COUNT(*) FROM tasks JOIN task_assignments ON tasks.id = task_assignments.task_id ` + whereClause
	var total int64
	err := db.GetDB().QueryRow(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, errors.New("failed to get task count: " + err.Error())
	}

	// Get tasks with pagination
	query := `SELECT tasks.id, tasks.group_id, tasks.title, tasks.description, tasks.due_date, tasks.status, tasks.created_by, tasks.created_at, tasks.updated_at FROM tasks JOIN task_assignments ON tasks.id = task_assignments.task_id ` + whereClause + ` ORDER BY tasks.created_at DESC LIMIT $` + strconv.Itoa(paramNum) + ` OFFSET $` + strconv.Itoa(paramNum+1)
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

func GetTaskByIDWithAssignees(ctx context.Context, taskID string) (*TaskWithAssignees, error) {
	// Get the task with all assignees using ARRAY_AGG
	query := `SELECT tasks.id, tasks.group_id, tasks.title, tasks.description, tasks.due_date, tasks.status, tasks.created_by, tasks.created_at, tasks.updated_at, 
	          COALESCE(ARRAY_AGG(task_assignments.user_id) FILTER (WHERE task_assignments.user_id IS NOT NULL), ARRAY[]::uuid[]) AS assignees 
	          FROM tasks 
	          LEFT JOIN task_assignments ON tasks.id = task_assignments.task_id 
	          WHERE tasks.id = $1 
	          GROUP BY tasks.id, tasks.group_id, tasks.title, tasks.description, tasks.due_date, tasks.status, tasks.created_by, tasks.created_at, tasks.updated_at`

	var task Task
	var assignees []string
	err := db.GetDB().QueryRow(ctx, query, taskID).Scan(
		&task.ID,
		&task.GroupID,
		&task.Title,
		&task.Description,
		&task.DueDate,
		&task.Status,
		&task.CreatedBy,
		&task.CreatedAt,
		&task.UpdatedAt,
		&assignees,
	)

	if err != nil {
		return nil, errors.New("failed to get task: " + err.Error())
	}

	taskWithAssignees := &TaskWithAssignees{
		Task:      task,
		Assignees: assignees,
	}

	return taskWithAssignees, nil
}
