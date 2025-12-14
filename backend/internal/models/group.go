package models

import (
	"context"
	"time"

	"github.com/KoiralaSam/Remindly/backend/internal/db"
)

type Group struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Type        string    `json:"type"` // "private", "direct", or "public"
	CreatedBy   string    `json:"created_by"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (group *Group) Create() error {
	// If type is not explicitly set, pass NULL so trigger can set it based on member count
	var typeValue interface{}
	if group.Type == "" {
		typeValue = nil
	} else {
		typeValue = group.Type
	}

	query := `
		INSERT INTO groups (name, description, created_by, type)
		VALUES ($1, $2, $3, $4)
		RETURNING id, type, created_at, updated_at
	`

	err := db.GetDB().QueryRow(context.Background(), query, group.Name, group.Description, group.CreatedBy, typeValue).Scan(
		&group.ID,
		&group.Type,
		&group.CreatedAt,
		&group.UpdatedAt,
	)
	if err != nil {
		return err
	}
	return nil
}

type GroupDetail struct {
	Group
	MemberCount int `json:"member_count"`
}

func GetGroupByID(groupID string) (*GroupDetail, error) {
	query := `
		SELECT 
			g.id,
			g.name,
			g.description,
			g.type,
			g.created_by,
			g.created_at,
			g.updated_at,
			COUNT(gm.id) as member_count
		FROM groups g
		LEFT JOIN group_members gm ON g.id = gm.group_id
		WHERE g.id = $1
		GROUP BY g.id
	`

	var groupDetail GroupDetail
	err := db.GetDB().QueryRow(context.Background(), query, groupID).Scan(
		&groupDetail.ID,
		&groupDetail.Name,
		&groupDetail.Description,
		&groupDetail.Type,
		&groupDetail.CreatedBy,
		&groupDetail.CreatedAt,
		&groupDetail.UpdatedAt,
		&groupDetail.MemberCount,
	)
	if err != nil {
		return nil, err
	}

	return &groupDetail, nil
}

func (group *Group) Update() error {
	query := `UPDATE groups SET name = $1, description = $2, updated_at = NOW() WHERE id = $3 RETURNING type, updated_at`

	err := db.GetDB().QueryRow(context.Background(), query, group.Name, group.Description, group.ID).Scan(&group.Type, &group.UpdatedAt)
	if err != nil {
		return err
	}

	return nil
}

func GetAllGroups(userID string) ([]Group, error) {
	query := `
		SELECT DISTINCT g.id, g.name, g.description, g.type, g.created_by, g.created_at, g.updated_at
		FROM groups g
		INNER JOIN group_members gm ON g.id = gm.group_id
		WHERE gm.user_id = $1
		ORDER BY g.created_at DESC
	`

	rows, err := db.GetDB().Query(context.Background(), query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var groups []Group
	for rows.Next() {
		var group Group
		err := rows.Scan(&group.ID, &group.Name, &group.Description, &group.Type, &group.CreatedBy, &group.CreatedAt, &group.UpdatedAt)
		if err != nil {
			return nil, err
		}
		groups = append(groups, group)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return groups, nil
}

func DeleteGroup(groupID string) error {
	query := `DELETE FROM groups WHERE id = $1`

	_, err := db.GetDB().Exec(context.Background(), query, groupID)
	if err != nil {
		return err
	}

	return nil
}
