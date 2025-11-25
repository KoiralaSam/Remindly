-- +goose Up
-- +goose StatementBegin
ALTER TABLE users DROP COLUMN phone;
ALTER TABLE users ADD COLUMN phone TEXT UNIQUE NULL;
ALTER TABLE users DROP COLUMN email;
ALTER TABLE users ADD COLUMN email TEXT UNIQUE NOT NULL;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE users;
-- +goose StatementEnd
