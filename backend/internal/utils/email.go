package utils

import (
	"fmt"
	"os"
	"time"

	"github.com/sendgrid/sendgrid-go"
	"github.com/sendgrid/sendgrid-go/helpers/mail"
)

type EmailService struct {
	client    *sendgrid.Client
	fromEmail string
	fromName  string
}

var emailService *EmailService

func InitEmailService() error {
	apiKey := os.Getenv("SENDGRID_EMAIL_API_KEY")
	fromEmail := os.Getenv("SENDGRID_FROM_EMAIL")
	fromName := os.Getenv("SENDGRID_FROM_NAME")
	if apiKey == "" {
		return fmt.Errorf("SENDGRID_EMAIL_API_KEY is not set")
	}

	if fromEmail == "" {
		return fmt.Errorf("SENDGRID_FROM_EMAIL is not set")
	}

	if fromName == "" {
		return fmt.Errorf("SENDGRID_FROM_NAME is not set")
	}

	client := sendgrid.NewSendClient(apiKey)
	emailService = &EmailService{
		client:    client,
		fromEmail: fromEmail,
		fromName:  fromName,
	}
	return nil
}

func GetEmailService() *EmailService {
	return emailService
}

func (es *EmailService) SendNotificationEmail(toEmail string, toName string, subject, content string) error {
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
		return fmt.Errorf("failed to send email with status %d", response.StatusCode)
	}

	return nil

}

// NotificationTaskData holds task information for building dynamic notifications
type NotificationTaskData struct {
	ID          string
	Title       string
	Description string
	DueDate     time.Time
	Status      string
	GroupID     string
}

func (es *EmailService) BuildNotificationContent(notificationType string, taskData NotificationTaskData, userName string) (subject, body string) {
	baseURL := os.Getenv("APP_URL")
	if baseURL == "" {
		baseURL = "http://localhost:5173"
	}
	
	// Build task-specific URL
	taskURL := fmt.Sprintf("%s/groups/%s/tasks/%s", baseURL, taskData.GroupID, taskData.ID)
	
	// Format due date
	dueDateStr := taskData.DueDate.Format("January 2, 2006 at 3:04 PM")
	dueDateShort := taskData.DueDate.Format("Jan 2, 2006")
	
	// Calculate time until due date
	now := time.Now()
	timeUntilDue := taskData.DueDate.Sub(now)
	var timeUntilDueStr string
	if timeUntilDue < 0 {
		timeUntilDueStr = "Overdue"
	} else if timeUntilDue < 24*time.Hour {
		hours := int(timeUntilDue.Hours())
		minutes := int(timeUntilDue.Minutes()) % 60
		if hours > 0 {
			timeUntilDueStr = fmt.Sprintf("%d hour%s", hours, pluralS(hours))
			if minutes > 0 {
				timeUntilDueStr += fmt.Sprintf(" and %d minute%s", minutes, pluralS(minutes))
			}
		} else {
			timeUntilDueStr = fmt.Sprintf("%d minute%s", minutes, pluralS(minutes))
		}
	} else {
		days := int(timeUntilDue.Hours() / 24)
		timeUntilDueStr = fmt.Sprintf("%d day%s", days, pluralS(days))
	}
	
	// Format status with capitalization
	statusFormatted := capitalizeFirst(taskData.Status)

	// Build dynamic subject based on notification type
	subject = buildSubject(notificationType, taskData.Title, taskData.Status, timeUntilDueStr)
	
	// Build dynamic body based on notification type
	body = buildBody(notificationType, userName, taskData, taskURL, dueDateStr, dueDateShort, timeUntilDueStr, statusFormatted)

	return subject, body
}

func pluralS(n int) string {
	if n == 1 {
		return ""
	}
	return "s"
}

func capitalizeFirst(s string) string {
	if len(s) == 0 {
		return s
	}
	if s[0] >= 'a' && s[0] <= 'z' {
		return string(s[0]-32) + s[1:]
	}
	return s
}

func buildSubject(notificationType, taskTitle, status, timeUntilDue string) string {
	switch notificationType {
	case "assignment":
		return fmt.Sprintf("📋 New Task Assignment: %s", taskTitle)
	case "reminder":
		return fmt.Sprintf("⏰ Reminder: %s (due in %s)", taskTitle, timeUntilDue)
	case "due_date":
		return fmt.Sprintf("⚠️ Task Due Today: %s", taskTitle)
	case "status_change":
		return fmt.Sprintf("🔄 Task Status Changed: %s is now %s", taskTitle, status)
	case "update":
		return fmt.Sprintf("✏️ Task Updated: %s", taskTitle)
	default:
		return fmt.Sprintf("Remindly Notification: %s", taskTitle)
	}
}

func buildBody(notificationType, userName string, taskData NotificationTaskData, taskURL, dueDateStr, dueDateShort, timeUntilDue, statusFormatted string) string {
	baseBody := fmt.Sprintf("Hi %s,\n\n", userName)
	
	// Description section (if exists)
	descriptionSection := ""
	if taskData.Description != "" {
		descriptionSection = fmt.Sprintf("Description: %s\n\n", taskData.Description)
	}
	
	// Task details section
	detailsSection := fmt.Sprintf("Task Details:\n")
	detailsSection += fmt.Sprintf("- Status: %s\n", statusFormatted)
	detailsSection += fmt.Sprintf("- Due Date: %s\n", dueDateStr)
	if notificationType == "reminder" || notificationType == "due_date" {
		detailsSection += fmt.Sprintf("- Time Remaining: %s\n", timeUntilDue)
	}
	detailsSection += "\n"
	
	// Notification-specific message
	messageSection := buildNotificationMessage(notificationType, taskData.Title, statusFormatted, timeUntilDue)
	
	// Footer with link
	footer := fmt.Sprintf("\nView and manage this task: %s\n\n", taskURL)
	footer += "---\n"
	footer += "This is an automated notification from Remindly."
	
	return baseBody + messageSection + "\n\n" + descriptionSection + detailsSection + footer
}

func buildNotificationMessage(notificationType, taskTitle, statusFormatted, timeUntilDue string) string {
	switch notificationType {
	case "assignment":
		return fmt.Sprintf("You have been assigned to a new task: %s", taskTitle)
	case "reminder":
		return fmt.Sprintf("This is a friendly reminder that your task \"%s\" is due in %s.", taskTitle, timeUntilDue)
	case "due_date":
		if timeUntilDue == "Overdue" {
			return fmt.Sprintf("⚠️ Your task \"%s\" is overdue. Please complete it as soon as possible.", taskTitle)
		}
		return fmt.Sprintf("Your task \"%s\" is due today. Make sure to complete it!", taskTitle)
	case "status_change":
		return fmt.Sprintf("The status of your task \"%s\" has been updated to: %s", taskTitle, statusFormatted)
	case "update":
		return fmt.Sprintf("Your task \"%s\" has been updated. Please review the changes below.", taskTitle)
	default:
		return fmt.Sprintf("You have a notification about: %s", taskTitle)
	}
}
