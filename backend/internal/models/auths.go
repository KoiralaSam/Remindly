package models

import (
	"context"
	"errors"

	"github.com/KoiralaSam/Remindly/backend/internal/db"
	"github.com/KoiralaSam/Remindly/backend/internal/utils"
)

type Auth struct {
	ID       uint64
	UserID   string
	AuthUUID string
}

func (a *Auth) Create() (*Auth, error) {
	query := `INSERT INTO auths (user_id) VALUES ($1) RETURNING id, user_id, auth_uuid`

	err := db.GetDB().QueryRow(context.Background(), query, a.UserID).Scan(&a.ID, &a.UserID, &a.AuthUUID)

	if err != nil {
		return nil, errors.New("failed to create auth: " + err.Error())
	}

	return a, nil
}

func FetchAuth(authD *utils.AuthDetails) (*Auth, error) {
	query := `SELECT id, user_id, auth_uuid FROM auths WHERE user_id = $1 AND auth_uuid = $2`

	var auth Auth

	err := db.GetDB().QueryRow(context.Background(), query, authD.UserID, authD.AuthUuid).Scan(&auth.ID, &auth.UserID, &auth.AuthUUID)

	if err != nil {
		return nil, errors.New("failed to fetch auth: " + err.Error())
	}

	return &auth, nil
}

func DeleteAuth(authD *utils.AuthDetails) error {
	query := `DELETE FROM auths WHERE user_id = $1 AND auth_uuid = $2`

	_, err := db.GetDB().Exec(context.Background(), query, authD.UserID, authD.AuthUuid)

	if err != nil {
		return errors.New("failed to delete auth: " + err.Error())
	}

	return nil
}
