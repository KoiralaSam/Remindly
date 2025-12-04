-- +goose Up
-- +goose StatementBegin
CREATE TABLE task_statuses (
    status TEXT PRIMARY KEY,
    description TEXT NOT NULL
);

INSERT INTO task_statuses (status, description) VALUES
    ('pending', 'Task is waiting for approval'),
    ('rejected', 'Task has been rejected'),
    ('active', 'Task is currently active'),
    ('completed', 'Task has been completed'),
    ('cancelled', 'Task has been cancelled');

ALTER TABLE tasks ADD COLUMN status TEXT NOT NULL DEFAULT 'pending' REFERENCES task_statuses(status);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE tasks DROP COLUMN status;
DROP TABLE task_statuses;
-- +goose StatementEnd
