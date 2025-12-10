package models

import (
	"context"
	"errors"
	"time"

	"github.com/KoiralaSam/Remindly/backend/internal/db"
)

type TaskNotification struct {
	ID               string     `json:"id"`
	TaskID           string     `json:"task_id"`
	UserID           string     `json:"user_id"`
	NotificationType string     `json:"notification_type"`
	ScheduledAt      time.Time  `json:"scheduled_at"`
	SentAt           *time.Time `json:"sent_at,omitempty"`
	Status           string     `json:"status"`
	RetryCount       int        `json:"retry_count"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
}

func (tn *TaskNotification) Save(ctx context.Context) error {
	query := `INSERT INTO task_notifications (task_id, user_id, notification_type, scheduled_at, status) 
	          VALUES ($1, $2, $3, $4, $5) 
	          RETURNING id, sent_at, retry_count, created_at, updated_at`

	err := db.GetDB().QueryRow(ctx, query,
		tn.TaskID,
		tn.UserID,
		tn.NotificationType,
		tn.ScheduledAt,
		tn.Status,
	).Scan(&tn.ID, &tn.SentAt, &tn.RetryCount, &tn.CreatedAt, &tn.UpdatedAt)

	if err != nil {
		return errors.New("failed to create task notification: " + err.Error())
	}

	return nil
}

func (tn *TaskNotification) Get(ctx context.Context) error {
	query := `SELECT id, task_id, user_id, notification_type, scheduled_at, sent_at, status, retry_count, created_at, updated_at 
	          FROM task_notifications 
	          WHERE id = $1`

	err := db.GetDB().QueryRow(ctx, query, tn.ID).Scan(
		&tn.ID,
		&tn.TaskID,
		&tn.UserID,
		&tn.NotificationType,
		&tn.ScheduledAt,
		&tn.SentAt,
		&tn.Status,
		&tn.RetryCount,
		&tn.CreatedAt,
		&tn.UpdatedAt,
	)

	if err != nil {
		return errors.New("failed to get task notification: " + err.Error())
	}

	return nil
}

func GetNotificationsByTaskID(ctx context.Context, taskID string) ([]TaskNotification, error) {
	query := `SELECT id, task_id, user_id, notification_type, scheduled_at, sent_at, status, retry_count, created_at, updated_at 
	          FROM task_notifications 
	          WHERE task_id = $1 
	          ORDER BY scheduled_at ASC`

	rows, err := db.GetDB().Query(ctx, query, taskID)
	if err != nil {
		return nil, errors.New("failed to get task notifications: " + err.Error())
	}
	defer rows.Close()

	var notifications []TaskNotification
	for rows.Next() {
		var notification TaskNotification
		err := rows.Scan(
			&notification.ID,
			&notification.TaskID,
			&notification.UserID,
			&notification.NotificationType,
			&notification.ScheduledAt,
			&notification.SentAt,
			&notification.Status,
			&notification.RetryCount,
			&notification.CreatedAt,
			&notification.UpdatedAt,
		)
		if err != nil {
			return nil, errors.New("failed to scan task notification: " + err.Error())
		}
		notifications = append(notifications, notification)
	}

	return notifications, nil
}

func (tn *TaskNotification) Update(ctx context.Context) error {
	query := `UPDATE task_notifications 
	          SET notification_type = $1, scheduled_at = $2, status = $3, retry_count = $4, updated_at = NOW() 
	          WHERE id = $5 
	          RETURNING sent_at, updated_at`

	err := db.GetDB().QueryRow(ctx, query,
		tn.NotificationType,
		tn.ScheduledAt,
		tn.Status,
		tn.RetryCount,
		tn.ID,
	).Scan(&tn.SentAt, &tn.UpdatedAt)

	if err != nil {
		return errors.New("failed to update task notification: " + err.Error())
	}

	return nil
}

func (tn *TaskNotification) Delete(ctx context.Context) error {
	query := `DELETE FROM task_notifications WHERE id = $1`

	_, err := db.GetDB().Exec(ctx, query, tn.ID)
	if err != nil {
		return errors.New("failed to delete task notification: " + err.Error())
	}

	return nil
}
