-- +goose Up
-- +goose StatementBegin
CREATE TABLE invitation_statuses (
    status TEXT PRIMARY KEY,
    description TEXT NOT NULL
);

INSERT INTO invitation_statuses (status, description) VALUES
    ('pending', 'Invitation is pending acceptance'),
    ('accepted', 'Invitation has been accepted'),
    ('declined', 'Invitation has been declined'),
    ('expired', 'Invitation has expired');

CREATE TABLE group_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invitee_email TEXT NOT NULL,
    invitee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    role TEXT NOT NULL REFERENCES group_roles(role) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' REFERENCES invitation_statuses(status),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prevent duplicate pending invitations for same group and email
CREATE UNIQUE INDEX idx_unique_pending_invitation 
    ON group_invitations(group_id, invitee_email) 
    WHERE status = 'pending';

-- Additional indexes for efficient queries
CREATE INDEX idx_group_invitations_invitee_email 
    ON group_invitations(invitee_email) 
    WHERE status = 'pending';

CREATE INDEX idx_group_invitations_invitee_id 
    ON group_invitations(invitee_id) 
    WHERE status = 'pending';

CREATE INDEX idx_group_invitations_group_status 
    ON group_invitations(group_id, status);

CREATE INDEX idx_group_invitations_expires_at 
    ON group_invitations(expires_at)
    WHERE status = 'pending' AND expires_at IS NOT NULL;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP INDEX IF EXISTS idx_group_invitations_expires_at;
DROP INDEX IF EXISTS idx_group_invitations_group_status;
DROP INDEX IF EXISTS idx_group_invitations_invitee_id;
DROP INDEX IF EXISTS idx_group_invitations_invitee_email;
DROP INDEX IF EXISTS idx_unique_pending_invitation;
DROP TABLE IF EXISTS group_invitations;
DROP TABLE IF EXISTS invitation_statuses;
-- +goose StatementEnd
