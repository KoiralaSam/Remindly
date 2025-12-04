-- +goose Up
-- +goose StatementBegin
-- Function to check if user is a member of the group that owns the task
CREATE OR REPLACE FUNCTION check_task_assignment_membership()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the user being assigned is a member of the group that owns the task
    IF NOT EXISTS (
        SELECT 1
        FROM tasks t
        JOIN group_members gm ON t.group_id = gm.group_id
        WHERE t.id = NEW.task_id
          AND gm.user_id = NEW.user_id
    ) THEN
        RAISE EXCEPTION 'User % is not a member of the group that owns task %', NEW.user_id, NEW.task_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that runs before insert or update
CREATE TRIGGER task_assignment_membership_check
    BEFORE INSERT OR UPDATE ON task_assignments
    FOR EACH ROW
    EXECUTE FUNCTION check_task_assignment_membership();
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TRIGGER IF EXISTS task_assignment_membership_check ON task_assignments;
DROP FUNCTION IF EXISTS check_task_assignment_membership();
-- +goose StatementEnd
