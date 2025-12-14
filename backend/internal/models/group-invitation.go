package models

import (
	"context"
	"errors"
	"time"

	"github.com/KoiralaSam/Remindly/backend/internal/db"
)

type GroupInvitation struct {
	ID           string     `json:"id"`
	GroupID      string     `json:"group_id"`
	InviterID    string     `json:"inviter_id"`
	InviteeEmail string     `json:"invitee_email"`
	InviteeID    *string    `json:"invitee_id,omitempty"`
	Role         string     `json:"role"`
	Status       string     `json:"status"`
	ExpiresAt    *time.Time `json:"expires_at,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
	GroupName    *string    `json:"group_name,omitempty"` // Optional field populated when joining with groups table
}

// Save creates a new group invitation
func (gi *GroupInvitation) Save(ctx context.Context) error {
	query := `INSERT INTO group_invitations (group_id, inviter_id, invitee_email, invitee_id, role, status, expires_at) 
	          VALUES ($1, $2, $3, $4, $5, $6, $7) 
	          RETURNING id, created_at, updated_at`

	var inviteeID interface{}
	if gi.InviteeID != nil {
		inviteeID = *gi.InviteeID
	}

	var expiresAt interface{}
	if gi.ExpiresAt != nil {
		expiresAt = *gi.ExpiresAt
	}

	err := db.GetDB().QueryRow(ctx, query,
		gi.GroupID,
		gi.InviterID,
		gi.InviteeEmail,
		inviteeID,
		gi.Role,
		gi.Status,
		expiresAt,
	).Scan(&gi.ID, &gi.CreatedAt, &gi.UpdatedAt)

	if err != nil {
		return errors.New("failed to create group invitation: " + err.Error())
	}

	return nil
}

// GetByID retrieves an invitation by its ID
func (gi *GroupInvitation) GetByID(ctx context.Context) error {
	query := `SELECT id, group_id, inviter_id, invitee_email, invitee_id, role, status, expires_at, created_at, updated_at 
	          FROM group_invitations 
	          WHERE id = $1`

	var inviteeID *string
	var expiresAt *time.Time

	err := db.GetDB().QueryRow(ctx, query, gi.ID).Scan(
		&gi.ID,
		&gi.GroupID,
		&gi.InviterID,
		&gi.InviteeEmail,
		&inviteeID,
		&gi.Role,
		&gi.Status,
		&expiresAt,
		&gi.CreatedAt,
		&gi.UpdatedAt,
	)

	if err != nil {
		return errors.New("invitation not found: " + err.Error())
	}

	gi.InviteeID = inviteeID
	gi.ExpiresAt = expiresAt

	return nil
}

// GetPendingByEmail retrieves pending invitations for a given email
func GetPendingInvitationsByEmail(ctx context.Context, email string) ([]GroupInvitation, error) {
	query := `SELECT id, group_id, inviter_id, invitee_email, invitee_id, role, status, expires_at, created_at, updated_at 
	          FROM group_invitations 
	          WHERE invitee_email = $1 AND status = 'pending' 
	          ORDER BY created_at DESC`

	rows, err := db.GetDB().Query(ctx, query, email)
	if err != nil {
		return nil, errors.New("failed to fetch invitations: " + err.Error())
	}
	defer rows.Close()

	var invitations []GroupInvitation
	for rows.Next() {
		var inv GroupInvitation
		var inviteeID *string
		var expiresAt *time.Time

		err := rows.Scan(
			&inv.ID,
			&inv.GroupID,
			&inv.InviterID,
			&inv.InviteeEmail,
			&inviteeID,
			&inv.Role,
			&inv.Status,
			&expiresAt,
			&inv.CreatedAt,
			&inv.UpdatedAt,
		)
		if err != nil {
			return nil, errors.New("failed to scan invitation: " + err.Error())
		}

		inv.InviteeID = inviteeID
		inv.ExpiresAt = expiresAt
		invitations = append(invitations, inv)
	}

	return invitations, nil
}

// GetPendingByUserID retrieves pending invitations for a given user ID
func GetPendingInvitationsByUserID(ctx context.Context, userID string) ([]GroupInvitation, error) {
	query := `SELECT id, group_id, inviter_id, invitee_email, invitee_id, role, status, expires_at, created_at, updated_at 
	          FROM group_invitations 
	          WHERE invitee_id = $1 AND status = 'pending' 
	          ORDER BY created_at DESC`

	rows, err := db.GetDB().Query(ctx, query, userID)
	if err != nil {
		return nil, errors.New("failed to fetch invitations: " + err.Error())
	}
	defer rows.Close()

	var invitations []GroupInvitation
	for rows.Next() {
		var inv GroupInvitation
		var inviteeID *string
		var expiresAt *time.Time

		err := rows.Scan(
			&inv.ID,
			&inv.GroupID,
			&inv.InviterID,
			&inv.InviteeEmail,
			&inviteeID,
			&inv.Role,
			&inv.Status,
			&expiresAt,
			&inv.CreatedAt,
			&inv.UpdatedAt,
		)
		if err != nil {
			return nil, errors.New("failed to scan invitation: " + err.Error())
		}

		inv.InviteeID = inviteeID
		inv.ExpiresAt = expiresAt
		invitations = append(invitations, inv)
	}

	return invitations, nil
}

// GetAllInvitationsByEmail retrieves all invitations for a given email (all statuses)
func GetAllInvitationsByEmail(ctx context.Context, email string) ([]GroupInvitation, error) {
	query := `SELECT gi.id, gi.group_id, gi.inviter_id, gi.invitee_email, gi.invitee_id, gi.role, gi.status, gi.expires_at, gi.created_at, gi.updated_at, g.name as group_name
	          FROM group_invitations gi
	          JOIN groups g ON gi.group_id = g.id  
	          WHERE gi.invitee_email = $1 
	          ORDER BY gi.created_at DESC`

	rows, err := db.GetDB().Query(ctx, query, email)
	if err != nil {
		return nil, errors.New("failed to fetch invitations: " + err.Error())
	}
	defer rows.Close()

	var invitations []GroupInvitation
	for rows.Next() {
		var inv GroupInvitation
		var inviteeID *string
		var expiresAt *time.Time
		var groupName *string

		err := rows.Scan(
			&inv.ID,
			&inv.GroupID,
			&inv.InviterID,
			&inv.InviteeEmail,
			&inviteeID,
			&inv.Role,
			&inv.Status,
			&expiresAt,
			&inv.CreatedAt,
			&inv.UpdatedAt,
			&groupName,
		)
		if err != nil {
			return nil, errors.New("failed to scan invitation: " + err.Error())
		}

		inv.InviteeID = inviteeID
		inv.ExpiresAt = expiresAt
		inv.GroupName = groupName
		invitations = append(invitations, inv)
	}

	return invitations, nil
}

// GetAllInvitationsByUserID retrieves all invitations for a given user ID (all statuses)
func GetAllInvitationsByUserID(ctx context.Context, userID string) ([]GroupInvitation, error) {
	query := `SELECT gi.id, gi.group_id, gi.inviter_id, gi.invitee_email, gi.invitee_id, gi.role, gi.status, gi.expires_at, gi.created_at, gi.updated_at, g.name as group_name
	          FROM group_invitations gi
	          JOIN groups g ON gi.group_id = g.id  
	          WHERE gi.invitee_id = $1 
	          ORDER BY gi.created_at DESC`

	rows, err := db.GetDB().Query(ctx, query, userID)
	if err != nil {
		return nil, errors.New("failed to fetch invitations: " + err.Error())
	}
	defer rows.Close()

	var invitations []GroupInvitation
	for rows.Next() {
		var inv GroupInvitation
		var inviteeID *string
		var expiresAt *time.Time
		var groupName *string

		err := rows.Scan(
			&inv.ID,
			&inv.GroupID,
			&inv.InviterID,
			&inv.InviteeEmail,
			&inviteeID,
			&inv.Role,
			&inv.Status,
			&expiresAt,
			&inv.CreatedAt,
			&inv.UpdatedAt,
			&groupName,
		)
		if err != nil {
			return nil, errors.New("failed to scan invitation: " + err.Error())
		}

		inv.InviteeID = inviteeID
		inv.ExpiresAt = expiresAt
		inv.GroupName = groupName
		invitations = append(invitations, inv)
	}

	return invitations, nil
}

// CheckPendingInvitationExists checks if a pending invitation already exists for group and email
func CheckPendingInvitationExists(ctx context.Context, groupID, email string) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM group_invitations WHERE group_id = $1 AND invitee_email = $2 AND status = 'pending')`

	var exists bool
	err := db.GetDB().QueryRow(ctx, query, groupID, email).Scan(&exists)
	if err != nil {
		return false, errors.New("failed to check pending invitation: " + err.Error())
	}

	return exists, nil
}

// UpdateStatus updates the invitation status
func (gi *GroupInvitation) UpdateStatus(ctx context.Context, status string) error {
	query := `UPDATE group_invitations 
	          SET status = $1, updated_at = NOW() 
	          WHERE id = $2 
	          RETURNING updated_at`

	err := db.GetDB().QueryRow(ctx, query, status, gi.ID).Scan(&gi.UpdatedAt)
	if err != nil {
		return errors.New("failed to update invitation status: " + err.Error())
	}

	gi.Status = status
	return nil
}

// SetInviteeID sets the invitee_id for an invitation (used when user accepts)
func (gi *GroupInvitation) SetInviteeID(ctx context.Context, userID string) error {
	query := `UPDATE group_invitations 
	          SET invitee_id = $1, updated_at = NOW() 
	          WHERE id = $2 
	          RETURNING updated_at`

	err := db.GetDB().QueryRow(ctx, query, userID, gi.ID).Scan(&gi.UpdatedAt)
	if err != nil {
		return errors.New("failed to set invitee ID: " + err.Error())
	}

	userIDPtr := &userID
	gi.InviteeID = userIDPtr
	return nil
}
