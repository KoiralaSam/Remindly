package models

import (
	"context"
	"errors"
	"time"

	"github.com/KoiralaSam/Remindly/backend/internal/db"
)

type GroupMember struct {
	ID        string    `json:"id"`
	GroupID   string    `json:"group_id"`
	UserID    string    `json:"user_id"`
	Role      string    `json:"role" binding:"required"`
	CreatedAt time.Time `json:"created_at"`
}

type GroupMemberWithUser struct {
	GroupMember
	User struct {
		Name  string `json:"name"`
		Email string `json:"email"`
		Phone string `json:"phone"`
	} `json:"user"`
}

func (gm *GroupMember) Save() error {
	query := `INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, $3) RETURNING id, group_id, user_id, role, created_at`
	err := db.GetDB().QueryRow(context.Background(), query, gm.GroupID, gm.UserID, gm.Role).Scan(&gm.ID, &gm.GroupID, &gm.UserID, &gm.Role, &gm.CreatedAt)
	if err != nil {
		return errors.New("failed to save group member: " + err.Error())
	}
	return nil
}

func (gm *GroupMember) Get() error {
	query := `SELECT id, group_id, user_id, role, created_at FROM group_members WHERE group_id = $1 AND user_id = $2`
	err := db.GetDB().QueryRow(context.Background(), query, gm.GroupID, gm.UserID).Scan(&gm.ID, &gm.GroupID, &gm.UserID, &gm.Role, &gm.CreatedAt)
	if err != nil {
		return errors.New("failed to get group member: " + err.Error())
	}
	return nil
}

func (gm *GroupMember) GetByGroupID() ([]GroupMemberWithUser, error) {
	query := `SELECT gm.id, gm.group_id, gm.user_id, gm.role, gm.created_at, u.name, u.email, u.phone 
	          FROM group_members gm 
	          LEFT JOIN users u ON gm.user_id = u.id 
	          WHERE gm.group_id = $1`
	rows, err := db.GetDB().Query(context.Background(), query, gm.GroupID)
	if err != nil {
		return nil, errors.New("failed to get group members: " + err.Error())
	}
	defer rows.Close()
	groupMembers := []GroupMemberWithUser{}
	for rows.Next() {
		var member GroupMemberWithUser
		err := rows.Scan(
			&member.GroupMember.ID,
			&member.GroupMember.GroupID,
			&member.GroupMember.UserID,
			&member.GroupMember.Role,
			&member.GroupMember.CreatedAt,
			&member.User.Name,
			&member.User.Email,
			&member.User.Phone,
		)
		if err != nil {
			return nil, errors.New("failed to scan group member: " + err.Error())
		}
		groupMembers = append(groupMembers, member)
	}
	return groupMembers, nil
}

func (gm *GroupMember) GetByUserID() ([]GroupMember, error) {
	query := `SELECT id, group_id, user_id, role, created_at FROM group_members WHERE user_id = $1`
	rows, err := db.GetDB().Query(context.Background(), query, gm.UserID)
	if err != nil {
		return nil, errors.New("failed to get group members: " + err.Error())
	}
	defer rows.Close()
	groupMembers := []GroupMember{}
	for rows.Next() {
		var member GroupMember
		err := rows.Scan(&member.ID, &member.GroupID, &member.UserID, &member.Role, &member.CreatedAt)
		if err != nil {
			return nil, errors.New("failed to scan group member: " + err.Error())
		}
		groupMembers = append(groupMembers, member)
	}
	return groupMembers, nil
}

// GetUsersFromUserGroups returns all unique users from groups that the specified user is a member of
func GetUsersFromUserGroups(ctx context.Context, userID string) ([]struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}, error) {
	query := `SELECT DISTINCT u.id, u.name, u.email
	          FROM users u
	          INNER JOIN group_members gm ON u.id = gm.user_id
	          WHERE gm.group_id IN (
	              SELECT group_id FROM group_members WHERE user_id = $1
	          )
	          AND u.id != $1
	          ORDER BY u.name`

	rows, err := db.GetDB().Query(ctx, query, userID)
	if err != nil {
		return nil, errors.New("failed to get users from user groups: " + err.Error())
	}
	defer rows.Close()

	users := []struct {
		ID    string `json:"id"`
		Name  string `json:"name"`
		Email string `json:"email"`
	}{}

	for rows.Next() {
		var user struct {
			ID    string `json:"id"`
			Name  string `json:"name"`
			Email string `json:"email"`
		}
		err := rows.Scan(&user.ID, &user.Name, &user.Email)
		if err != nil {
			return nil, errors.New("failed to scan user: " + err.Error())
		}
		users = append(users, user)
	}

	return users, nil
}

func (gm *GroupMember) UpdateRole(role string) error {
	query := `UPDATE group_members SET role = $1 WHERE group_id = $2 AND user_id = $3`
	_, err := db.GetDB().Exec(context.Background(), query, role, gm.GroupID, gm.UserID)
	if err != nil {
		return errors.New("failed to update group member role: " + err.Error())
	}
	return nil
}

func (gm *GroupMember) Delete() error {
	query := `DELETE FROM group_members WHERE group_id = $1 AND user_id = $2`
	_, err := db.GetDB().Exec(context.Background(), query, gm.GroupID, gm.UserID)
	if err != nil {
		return errors.New("failed to delete group member: " + err.Error())
	}
	return nil
}

func (gm *GroupMember) IsMember(ctx context.Context) (bool, error) {
	query := `SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2`
	var id string
	err := db.GetDB().QueryRow(ctx, query, gm.GroupID, gm.UserID).Scan(&id)
	if err != nil {
		// If no rows found, user is not a member
		if err.Error() == "no rows in result set" || err.Error() == "sql: no rows in result set" {
			return false, nil
		}
		return false, errors.New("failed to check if group member is a member: " + err.Error())
	}
	return true, nil
}
