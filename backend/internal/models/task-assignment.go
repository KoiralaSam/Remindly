package models

import (
	"context"
	"errors"
	"time"

	"github.com/KoiralaSam/Remindly/backend/internal/db"
)

type TaskAssignment struct {
	ID         string    `json:"id"`
	TaskID     string    `json:"task_id"`
	UserID     string    `json:"user_id"`
	AssignedBy string    `json:"assigned_by"`
	AssignedAt time.Time `json:"assigned_at"`
}

func (ta *TaskAssignment) Save(ctx context.Context) error {
	query := `INSERT INTO task_assignments (task_id, user_id, assigned_by) 
	          VALUES ($1, $2, $3) 
	          RETURNING id, assigned_at`

	err := db.GetDB().QueryRow(ctx, query,
		ta.TaskID,
		ta.UserID,
		ta.AssignedBy,
	).Scan(&ta.ID, &ta.AssignedAt)

	if err != nil {
		return errors.New("failed to create task assignment: " + err.Error())
	}

	return nil
}

func (ta *TaskAssignment) Get(ctx context.Context) error {
	query := `SELECT id, task_id, user_id, assigned_by, assigned_at 
	          FROM task_assignments 
	          WHERE task_id = $1 AND user_id = $2`

	err := db.GetDB().QueryRow(ctx, query, ta.TaskID, ta.UserID).Scan(
		&ta.ID,
		&ta.TaskID,
		&ta.UserID,
		&ta.AssignedBy,
		&ta.AssignedAt,
	)

	if err != nil {
		return errors.New("failed to get task assignment: " + err.Error())
	}

	return nil
}

func (ta *TaskAssignment) GetByTaskID(ctx context.Context) ([]TaskAssignment, error) {
	query := `SELECT id, task_id, user_id, assigned_by, assigned_at 
	          FROM task_assignments 
	          WHERE task_id = $1`

	rows, err := db.GetDB().Query(ctx, query, ta.TaskID)
	if err != nil {
		return nil, errors.New("failed to get task assignments: " + err.Error())
	}
	defer rows.Close()

	var assignments []TaskAssignment
	for rows.Next() {
		var assignment TaskAssignment
		err := rows.Scan(
			&assignment.ID,
			&assignment.TaskID,
			&assignment.UserID,
			&assignment.AssignedBy,
			&assignment.AssignedAt,
		)
		if err != nil {
			return nil, errors.New("failed to scan task assignment: " + err.Error())
		}
		assignments = append(assignments, assignment)
	}

	return assignments, nil
}

func (ta *TaskAssignment) Delete(ctx context.Context) error {
	query := `DELETE FROM task_assignments WHERE task_id = $1 AND user_id = $2`

	_, err := db.GetDB().Exec(ctx, query, ta.TaskID, ta.UserID)
	if err != nil {
		return errors.New("failed to delete task assignment: " + err.Error())
	}

	return nil
}
