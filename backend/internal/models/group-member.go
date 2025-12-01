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
	query := `SELECT id, group_id, user_id, role, created_at FROM group_members WHERE id = $1`
	err := db.GetDB().QueryRow(context.Background(), query, gm.ID).Scan(&gm.ID, &gm.GroupID, &gm.UserID, &gm.Role, &gm.CreatedAt)
	if err != nil {
		return errors.New("failed to get group member: " + err.Error())
	}
	return nil
}

func (gm *GroupMember) GetByGroupID(groupID string) ([]GroupMember, error) {
	query := `SELECT id, group_id, user_id, role, created_at FROM group_members WHERE group_id = $1`
	rows, err := db.GetDB().Query(context.Background(), query, groupID)
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

func (gm *GroupMember) GetByUserID(userID string) ([]GroupMember, error) {
	query := `SELECT id, group_id, user_id, role, created_at FROM group_members WHERE user_id = $1`
	rows, err := db.GetDB().Query(context.Background(), query, userID)
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
