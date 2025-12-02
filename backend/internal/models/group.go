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
	CreatedBy   string    `json:"created_by"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (group *Group) Create() error {
	query := `
		INSERT INTO groups (name, description, created_by)
		VALUES ($1, $2, $3)
		RETURNING id, created_at, updated_at
	`

	err := db.GetDB().QueryRow(context.Background(), query, group.Name, group.Description, group.CreatedBy).Scan(
		&group.ID,
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
