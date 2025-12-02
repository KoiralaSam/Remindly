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

func (gm *GroupMember) GetByGroupID() ([]GroupMember, error) {
	query := `SELECT id, group_id, user_id, role, created_at FROM group_members WHERE group_id = $1`
	rows, err := db.GetDB().Query(context.Background(), query, gm.GroupID)
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

func (gm *GroupMember) IsMember() (bool, error) {
	query := `SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2`
	rows, err := db.GetDB().Query(context.Background(), query, gm.GroupID, gm.UserID)
	if err != nil {
		return false, errors.New("failed to check if group member is a member: " + err.Error())
	}
	defer rows.Close()
	for rows.Next() {
		return true, nil
	}
	return false, nil
}
