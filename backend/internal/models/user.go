package models

import (
	"context"
	"errors"
	"time"

	"github.com/KoiralaSam/Remindly/backend/internal/db"
	"github.com/KoiralaSam/Remindly/backend/internal/utils"
)

type User struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	Email        string    `json:"email"`
	Phone        string    `json:"phone"`
	PasswordHash string    `json:"password_hash"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func (u *User) Save() (string, error) {
	query := `INSERT INTO users (name, email, phone, password_hash) VALUES ($1, $2, $3, $4) RETURNING id`

	hashedPassword, err := utils.HashPassword(u.PasswordHash)

	if err != nil {
		return "", errors.New("failed to save user")
	}

	err = db.GetDB().QueryRow(context.Background(), query, u.Name, u.Email, u.Phone, hashedPassword).Scan(&u.ID)

	if err != nil {
		return "", errors.New("failed to save user")
	}

	return u.ID, nil

}
