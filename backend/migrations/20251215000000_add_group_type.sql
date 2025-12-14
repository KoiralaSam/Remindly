-- +goose Up
-- +goose StatementBegin
-- Create enum type for group types
CREATE TYPE group_type AS ENUM ('private', 'direct', 'public');

-- Add type column to groups table with default 'private'
ALTER TABLE groups ADD COLUMN type group_type NULL;

-- Function to update group type based on member count (only if type is NULL)
CREATE OR REPLACE FUNCTION update_group_type()
RETURNS TRIGGER AS $$
DECLARE
    member_count INTEGER;
    current_type group_type;
BEGIN
    -- Get the current group type
    SELECT type INTO current_type
    FROM groups
    WHERE id = COALESCE(NEW.group_id, OLD.group_id);
    
    -- Only update if type is NULL (not explicitly set)
    IF current_type IS NULL THEN
        -- Count members in the group
        SELECT COUNT(*) INTO member_count
        FROM group_members
        WHERE group_id = COALESCE(NEW.group_id, OLD.group_id);
        
        -- Update group type based on member count
        UPDATE groups
        SET type = CASE
            WHEN member_count = 1 THEN 'private'::group_type
            WHEN member_count = 2 THEN 'direct'::group_type
            ELSE 'public'::group_type
        END,
        updated_at = NOW()
        WHERE id = COALESCE(NEW.group_id, OLD.group_id);
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update group type when members are added
CREATE TRIGGER update_group_type_on_member_insert
AFTER INSERT ON group_members
FOR EACH ROW
EXECUTE FUNCTION update_group_type();

-- Create trigger to update group type when members are removed
CREATE TRIGGER update_group_type_on_member_delete
AFTER DELETE ON group_members
FOR EACH ROW
EXECUTE FUNCTION update_group_type();

-- Update existing groups based on current member counts
UPDATE groups g
SET type = CASE
    WHEN (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) = 1 THEN 'private'::group_type
    WHEN (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) = 2 THEN 'direct'::group_type
    ELSE 'public'::group_type
END;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TRIGGER IF EXISTS update_group_type_on_member_delete ON group_members;
DROP TRIGGER IF EXISTS update_group_type_on_member_insert ON group_members;
DROP FUNCTION IF EXISTS update_group_type();
ALTER TABLE groups DROP COLUMN IF EXISTS type;
DROP TYPE IF EXISTS group_type;
-- +goose StatementEnd
