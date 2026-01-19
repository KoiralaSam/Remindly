# Notification Setup Guide: SendGrid + gocron

This guide shows how to create scheduled notifications and send them via SendGrid using your existing notification routes and the gocron library.

## Table of Contents

1. [Creating Notifications via API](#1-creating-notifications-via-api)
2. [Setting Up SendGrid Service](#2-setting-up-sendgrid-service)
3. [Setting Up gocron Job](#3-setting-up-gocron-job)
4. [Complete Implementation](#4-complete-implementation)

---

## 1. Creating Notifications via API

### Current Route

```
POST /api/groups/:groupID/tasks/:taskId/notifications
```

### Example Request

```bash
curl -X POST http://localhost:8080/api/groups/{groupID}/tasks/{taskId}/notifications \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-uuid",
    "notification_type": "reminder",
    "scheduled_at": "2025-01-20T10:00:00Z"
  }'
```

### Notification Types

- `assignment` - User was assigned to a task
- `reminder` - Reminder before task due date
- `due_date` - Task is due
- `status_change` - Task status changed
- `update` - Task was updated

### Status Flow

1. **pending** - Notification scheduled (default)
2. **sent** - Successfully sent via SendGrid
3. **failed** - Failed to send (can retry)
4. **cancelled** - Cancelled before sending

---

## 2. Setting Up SendGrid Service

### Step 1: Add SendGrid to go.mod

Add SendGrid as a direct dependency (it's currently indirect):

```go
// In go.mod, move sendgrid to direct dependencies
require (
    // ... existing dependencies
    github.com/sendgrid/sendgrid-go v3.16.1+incompatible
)
```

Run: `go mod tidy`

### Step 2: Create SendGrid Service

Create `backend/internal/utils/email.go`:

```go
package utils

import (
    "fmt"
    "os"

    "github.com/sendgrid/sendgrid-go"
    "github.com/sendgrid/sendgrid-go/helpers/mail"
)

type EmailService struct {
    client      *sendgrid.Client
    fromEmail   string
    fromName    string
}

var emailService *EmailService

func InitEmailService() error {
    apiKey := os.Getenv("SENDGRID_API_KEY")
    fromEmail := os.Getenv("SENDGRID_FROM_EMAIL")
    fromName := os.Getenv("SENDGRID_FROM_NAME")

    if apiKey == "" {
        return fmt.Errorf("SENDGRID_API_KEY not set")
    }
    if fromEmail == "" {
        return fmt.Errorf("SENDGRID_FROM_EMAIL not set")
    }
    if fromName == "" {
        fromName = "Remindly"
    }

    emailService = &EmailService{
        client:    sendgrid.NewSendClient(apiKey),
        fromEmail: fromEmail,
        fromName:  fromName,
    }

    return nil
}

func GetEmailService() *EmailService {
    return emailService
}

func (es *EmailService) SendNotificationEmail(toEmail, toName, subject, content string) error {
    if es == nil || es.client == nil {
        return fmt.Errorf("email service not initialized")
    }

    from := mail.NewEmail(es.fromName, es.fromEmail)
    to := mail.NewEmail(toName, toEmail)

    message := mail.NewSingleEmail(from, subject, to, content, content)

    response, err := es.client.Send(message)
    if err != nil {
        return fmt.Errorf("failed to send email: %w", err)
    }

    if response.StatusCode >= 400 {
        return fmt.Errorf("email send failed with status %d: %s",
            response.StatusCode, response.Body)
    }

    return nil
}

func (es *EmailService) BuildNotificationContent(notificationType, taskTitle, userName string) (subject, body string) {
    baseURL := os.Getenv("APP_URL")
    if baseURL == "" {
        baseURL = "http://localhost:5173"
    }

    subjectTemplates := map[string]string{
        "assignment":    "New Task Assignment: " + taskTitle,
        "reminder":      "Task Reminder: " + taskTitle,
        "due_date":      "Task Due Today: " + taskTitle,
        "status_change": "Task Status Updated: " + taskTitle,
        "update":        "Task Updated: " + taskTitle,
    }

    bodyTemplates := map[string]string{
        "assignment":    fmt.Sprintf("Hi %s,\n\nYou have been assigned to a new task: %s\n\nView task: %s", userName, taskTitle, baseURL),
        "reminder":      fmt.Sprintf("Hi %s,\n\nThis is a reminder about your task: %s\n\nView task: %s", userName, taskTitle, baseURL),
        "due_date":      fmt.Sprintf("Hi %s,\n\nYour task is due today: %s\n\nView task: %s", userName, taskTitle, baseURL),
        "status_change": fmt.Sprintf("Hi %s,\n\nThe status of your task has changed: %s\n\nView task: %s", userName, taskTitle, baseURL),
        "update":        fmt.Sprintf("Hi %s,\n\nYour task has been updated: %s\n\nView task: %s", userName, taskTitle, baseURL),
    }

    subject = subjectTemplates[notificationType]
    if subject == "" {
        subject = "Remindly Notification"
    }

    body = bodyTemplates[notificationType]
    if body == "" {
        body = fmt.Sprintf("Hi %s,\n\nYou have a notification about: %s\n\nView: %s", userName, taskTitle, baseURL)
    }

    return subject, body
}
```

### Step 3: Environment Variables

Add to `.env`:

```env
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=Remindly
APP_URL=http://localhost:5173  # or your production URL
```

---

## 3. Setting Up gocron Job

### Add Helper Function to Query Pending Notifications

Add to `backend/internal/models/task-notification.go`:

```go
// GetPendingNotifications returns all notifications that are due to be sent
func GetPendingNotifications(ctx context.Context, beforeTime time.Time) ([]TaskNotification, error) {
    query := `
        SELECT id, task_id, user_id, notification_type, scheduled_at, sent_at, status, retry_count, created_at, updated_at
        FROM task_notifications
        WHERE status = 'pending'
          AND scheduled_at <= $1
        ORDER BY scheduled_at ASC
        LIMIT 100`

    rows, err := db.GetDB().Query(ctx, query, beforeTime)
    if err != nil {
        return nil, errors.New("failed to get pending notifications: " + err.Error())
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
            return nil, errors.New("failed to scan notification: " + err.Error())
        }
        notifications = append(notifications, notification)
    }

    return notifications, nil
}

// MarkAsSent updates notification status to sent
func (tn *TaskNotification) MarkAsSent(ctx context.Context) error {
    now := time.Now()
    query := `
        UPDATE task_notifications
        SET status = 'sent', sent_at = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING sent_at, updated_at`

    err := db.GetDB().QueryRow(ctx, query, now, tn.ID).Scan(&tn.SentAt, &tn.UpdatedAt)
    if err != nil {
        return errors.New("failed to mark notification as sent: " + err.Error())
    }
    tn.Status = "sent"
    return nil
}

// MarkAsFailed updates notification status to failed and increments retry count
func (tn *TaskNotification) MarkAsFailed(ctx context.Context) error {
    query := `
        UPDATE task_notifications
        SET status = 'failed', retry_count = retry_count + 1, updated_at = NOW()
        WHERE id = $1
        RETURNING retry_count, updated_at`

    err := db.GetDB().QueryRow(ctx, query, tn.ID).Scan(&tn.RetryCount, &tn.UpdatedAt)
    if err != nil {
        return errors.New("failed to mark notification as failed: " + err.Error())
    }
    tn.Status = "failed"
    return nil
}
```

### Create Notification Sender Service

Create `backend/internal/services/notification-sender.go`:

```go
package services

import (
    "context"
    "log"
    "time"

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

        // Build email content
        subject, body := emailService.BuildNotificationContent(
            notification.NotificationType,
            task.Title,
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
```

---

## 4. Complete Implementation

### Update main.go

Add the cron job to your `main.go`:

```go
// ... existing imports ...
import (
    "github.com/KoiralaSam/Remindly/backend/internal/services"
    // ... other imports
)

func main() {
    // ... existing initialization code ...

    // Initialize Email Service (optional - only if SendGrid credentials are set)
    if err := utils.InitEmailService(); err != nil {
        log.Printf("Warning: Email service not initialized: %v (notifications will not be sent)", err)
    } else {
        log.Println("Email service initialized successfully")
    }

    // Initialize scheduler
    scheduler, err := gocron.NewScheduler()
    if err != nil {
        log.Fatalf("Error initializing scheduler: %v", err)
    }
    defer scheduler.Shutdown()

    // Schedule notification sender job to run every minute
    job, err := scheduler.NewJob(
        gocron.DurationJob(time.Minute),
        gocron.NewTask(func() {
            ctx := context.Background()
            if err := services.SendPendingNotifications(ctx); err != nil {
                log.Printf("Error sending pending notifications: %v", err)
            }
        }),
    )
    if err != nil {
        log.Fatalf("Error scheduling notification job: %v", err)
    }

    log.Printf("Notification sender job scheduled: %s", job.ID())

    // Start the scheduler
    scheduler.Start()

    // ... rest of your server setup ...
}
```

### Job Scheduling Options

You can customize the schedule:

```go
// Run every 5 minutes
scheduler.NewJob(
    gocron.DurationJob(5*time.Minute),
    gocron.NewTask(services.SendPendingNotifications),
)

// Run every hour
scheduler.NewJob(
    gocron.DurationJob(time.Hour),
    gocron.NewTask(services.SendPendingNotifications),
)

// Run at specific times (cron syntax)
scheduler.NewJob(
    gocron.CronJob("0 * * * *", false), // Every hour at minute 0
    gocron.NewTask(services.SendPendingNotifications),
)
```

---

## Testing

### 1. Create a Test Notification

```bash
# Schedule a notification for 1 minute from now
SCHEDULED_TIME=$(date -u -v+1M '+%Y-%m-%dT%H:%M:%SZ')

curl -X POST http://localhost:8080/api/groups/{groupID}/tasks/{taskId}/notifications \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"user_id\": \"user-uuid\",
    \"notification_type\": \"reminder\",
    \"scheduled_at\": \"$SCHEDULED_TIME\"
  }"
```

### 2. Check Logs

Watch your server logs for:

```
Found 1 pending notifications to send
Successfully sent notification {id} to user@example.com
```

### 3. Verify Status

Check notification status via:

```
GET /api/notifications/:id
```

---

## Summary

1. **Create notifications** using the existing API route
2. **SendGrid service** handles email sending
3. **gocron job** runs every minute to check for pending notifications
4. **Notifications update** their status after sending (sent/failed)
5. **Retry logic** handles temporary failures (max 3 retries)

This setup allows you to schedule notifications in advance and have them automatically sent via SendGrid when the scheduled time arrives!
