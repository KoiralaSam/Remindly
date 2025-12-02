-- +goose Up
-- +goose StatementBegin
CREATE TABLE group_roles (
    role TEXT PRIMARY KEY,
    description TEXT
);

INSERT INTO group_roles (role, description) VALUES
    ('owner', 'Full control over the group'),
    ('admin', 'Can manage members and group settings'),
    ('member', 'Can create and view reminders'),
    ('viewer', 'Read-only access to reminders');
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE group_roles;
-- +goose StatementEnd
