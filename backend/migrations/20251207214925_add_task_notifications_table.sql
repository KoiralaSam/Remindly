-- +goose Up
-- +goose StatementBegin
CREATE TABLE notification_statuses (
    status TEXT PRIMARY KEY,
    description TEXT NOT NULL
);

INSERT INTO notification_statuses (status, description) VALUES
    ('pending', 'Notification is scheduled and waiting to be sent'),
    ('sent', 'Notification has been successfully sent'),
    ('failed', 'Notification failed to send'),
    ('cancelled', 'Notification was cancelled');

CREATE TABLE notification_types (
    type TEXT PRIMARY KEY,
    description TEXT NOT NULL
);

INSERT INTO notification_types (type, description) VALUES
    ('assignment', 'User was assigned to a task'),
    ('reminder', 'Reminder before task due date'),
    ('due_date', 'Task is due'),
    ('status_change', 'Task status changed'),
    ('update', 'Task was updated');

CREATE TABLE task_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL REFERENCES notification_types(type),
    scheduled_at TIMESTAMPTZ NOT NULL,
    sent_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'pending' REFERENCES notification_statuses(status),
    retry_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient cron job queries
CREATE INDEX idx_task_notifications_scheduled_status 
    ON task_notifications(scheduled_at, status) 
    WHERE status = 'pending';

CREATE INDEX idx_task_notifications_task_user 
    ON task_notifications(task_id, user_id);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP INDEX IF EXISTS idx_task_notifications_task_user;
DROP INDEX IF EXISTS idx_task_notifications_scheduled_status;
DROP TABLE IF EXISTS task_notifications;
DROP TABLE IF EXISTS notification_types;
DROP TABLE IF EXISTS notification_statuses;
-- +goose StatementEnd