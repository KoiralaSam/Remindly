package services

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/KoiralaSam/Remindly/backend/internal/db"
	"github.com/KoiralaSam/Remindly/backend/internal/models"
	"github.com/KoiralaSam/Remindly/backend/internal/utils"
)

func SendPendingNotifications(ctx context.Context) error {
	emailService := utils.GetEmailService()
	if emailService == nil {
		return fmt.Errorf("email service not initialized")
	}

	// Get all pending notifications scheduled for now or earlier
	now := time.Now()
	notifications, err := models.GetPendingNotifications(ctx, now)
	if err != nil {
		return fmt.Errorf("failed to fetch pending notifications: %w", err)
	}

	log.Printf("Found %d pending notifications to send", len(notifications))

	for _, notification := range notifications {
		// Skip if max retries exceeded
		if notification.RetryCount >= 3 {
			log.Printf("Skipping notification %s: max retries exceeded", notification.ID)
			notification.Status = "failed"
			notification.Update(ctx)
			continue
		}

		// Get task details
		task, err := models.GetTaskByID(ctx, notification.TaskID)
		if err != nil {
			log.Printf("Error fetching task %s: %v", notification.TaskID, err)
			notification.MarkAsFailed(ctx)
			continue
		}

		// Get user details
		user := &models.User{ID: notification.UserID}
		err = user.Get()
		if err != nil {
			log.Printf("Error fetching user %s: %v", notification.UserID, err)
			notification.MarkAsFailed(ctx)
			continue
		}

		// Build email content with full task data
		taskData := utils.NotificationTaskData{
			ID:          task.ID,
			Title:       task.Title,
			Description: task.Description,
			DueDate:     task.DueDate,
			Status:      task.Status,
			GroupID:     task.GroupID,
		}
		subject, body := emailService.BuildNotificationContent(
			notification.NotificationType,
			taskData,
			user.Name,
		)

		// Send email
		err = emailService.SendNotificationEmail(
			user.Email,
			user.Name,
			subject,
			body,
		)

		// Update notification status
		if err != nil {
			log.Printf("Failed to send notification %s: %v", notification.ID, err)
			notification.MarkAsFailed(ctx)
		} else {
			log.Printf("Successfully sent notification %s to %s", notification.ID, user.Email)
			notification.MarkAsSent(ctx)
		}
	}

	return nil
}

// CheckDueDatesAndReminders checks for tasks with due dates coming up and creates pending notifications
func CheckDueDatesAndReminders(ctx context.Context) error {
	now := time.Now()

	// Query for tasks that need reminder notifications (24 hours before due date)
	// Tasks where due_date is between now+23 hours and now+25 hours (to account for cron running every minute)
	reminderStart := now.Add(23 * time.Hour)
	reminderEnd := now.Add(25 * time.Hour)

	reminderQuery := `
		SELECT DISTINCT t.id, t.due_date
		FROM tasks t
		JOIN task_assignments ta ON t.id = ta.task_id
		WHERE t.due_date >= $1 AND t.due_date <= $2
		  AND t.status NOT IN ('completed', 'cancelled')
	`

	reminderRows, err := db.GetDB().Query(ctx, reminderQuery, reminderStart, reminderEnd)
	if err != nil {
		return fmt.Errorf("failed to query reminder tasks: %w", err)
	}
	defer reminderRows.Close()

	type TaskDueInfo struct {
		TaskID  string
		DueDate time.Time
	}

	var reminderTasks []TaskDueInfo
	for reminderRows.Next() {
		var taskInfo TaskDueInfo
		if err := reminderRows.Scan(&taskInfo.TaskID, &taskInfo.DueDate); err != nil {
			log.Printf("Error scanning reminder task: %v", err)
			continue
		}
		reminderTasks = append(reminderTasks, taskInfo)
	}

	// Query for tasks that need due_date notifications (on the due date)
	// Tasks where due_date is today (between start of today and end of today)
	startOfDay := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	endOfDay := startOfDay.Add(24 * time.Hour)

	dueDateQuery := `
		SELECT DISTINCT t.id, t.due_date
		FROM tasks t
		JOIN task_assignments ta ON t.id = ta.task_id
		WHERE t.due_date >= $1 AND t.due_date < $2
		  AND t.status NOT IN ('completed', 'cancelled')
	`

	dueDateRows, err := db.GetDB().Query(ctx, dueDateQuery, startOfDay, endOfDay)
	if err != nil {
		return fmt.Errorf("failed to query due date tasks: %w", err)
	}
	defer dueDateRows.Close()

	var dueDateTasks []TaskDueInfo
	for dueDateRows.Next() {
		var taskInfo TaskDueInfo
		if err := dueDateRows.Scan(&taskInfo.TaskID, &taskInfo.DueDate); err != nil {
			log.Printf("Error scanning due date task: %v", err)
			continue
		}
		dueDateTasks = append(dueDateTasks, taskInfo)
	}

	// Create reminder notifications (scheduled for 24 hours before due date)
	for _, taskInfo := range reminderTasks {
		// Get all assignees for this task
		assignments, err := models.GetTaskAssignments(ctx, taskInfo.TaskID)
		if err != nil {
			log.Printf("Error getting assignments for task %s: %v", taskInfo.TaskID, err)
			continue
		}

		// Schedule reminder for 24 hours before due date
		reminderTime := taskInfo.DueDate.Add(-24 * time.Hour)

		for _, assignment := range assignments {
			// Check if notification already exists
			exists, err := models.NotificationExists(ctx, taskInfo.TaskID, assignment.UserID, "reminder")
			if err != nil {
				log.Printf("Error checking notification existence: %v", err)
				continue
			}
			if exists {
				continue // Skip if notification already exists
			}

			// Only create notification if reminder time is in the future (or very recent past)
			if reminderTime.Before(now.Add(-1 * time.Minute)) {
				continue
			}

			notification := models.TaskNotification{
				TaskID:           taskInfo.TaskID,
				UserID:           assignment.UserID,
				NotificationType: "reminder",
				ScheduledAt:      reminderTime,
				Status:           "pending",
			}

			if err := notification.Save(ctx); err != nil {
				log.Printf("Error creating reminder notification for task %s, user %s: %v", taskInfo.TaskID, assignment.UserID, err)
				continue
			}
			log.Printf("Created reminder notification for task %s, user %s, scheduled for %v", taskInfo.TaskID, assignment.UserID, reminderTime)
		}
	}

	// Create due_date notifications (scheduled for the due date itself, at start of day)
	for _, taskInfo := range dueDateTasks {
		// Get all assignees for this task
		assignments, err := models.GetTaskAssignments(ctx, taskInfo.TaskID)
		if err != nil {
			log.Printf("Error getting assignments for task %s: %v", taskInfo.TaskID, err)
			continue
		}

		// Schedule due_date notification for the start of the due date
		dueDateNotificationTime := time.Date(taskInfo.DueDate.Year(), taskInfo.DueDate.Month(), taskInfo.DueDate.Day(), 0, 0, 0, 0, taskInfo.DueDate.Location())

		for _, assignment := range assignments {
			// Check if notification already exists
			exists, err := models.NotificationExists(ctx, taskInfo.TaskID, assignment.UserID, "due_date")
			if err != nil {
				log.Printf("Error checking notification existence: %v", err)
				continue
			}
			if exists {
				continue // Skip if notification already exists
			}

			// Only create notification if it's today or in the past (within last hour)
			if dueDateNotificationTime.After(now.Add(1 * time.Hour)) {
				continue
			}

			notification := models.TaskNotification{
				TaskID:           taskInfo.TaskID,
				UserID:           assignment.UserID,
				NotificationType: "due_date",
				ScheduledAt:      dueDateNotificationTime,
				Status:           "pending",
			}

			if err := notification.Save(ctx); err != nil {
				log.Printf("Error creating due_date notification for task %s, user %s: %v", taskInfo.TaskID, assignment.UserID, err)
				continue
			}
			log.Printf("Created due_date notification for task %s, user %s, scheduled for %v", taskInfo.TaskID, assignment.UserID, dueDateNotificationTime)
		}
	}

	return nil
}
