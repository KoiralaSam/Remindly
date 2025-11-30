package models

import (
	"context"
	"errors"
	"time"

	"github.com/KoiralaSam/Remindly/backend/internal/db"
	"github.com/KoiralaSam/Remindly/backend/internal/utils"
)

type User struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Phone     string    `json:"phone"`
	Password  string    `json:"password"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (u *User) Save() error {
	query := `INSERT INTO users (name, email, phone, password) VALUES ($1, $2, $3, $4) RETURNING id`

	hashedPassword, err := utils.HashPassword(u.Password)

	if err != nil {
		return errors.New("failed to hash password: " + err.Error())
	}

	err = db.GetDB().QueryRow(context.Background(), query, u.Name, u.Email, u.Phone, hashedPassword).Scan(&u.ID)

	if err != nil {
		return errors.New("failed to save user: " + err.Error())
	}

	return nil

}

func (u *User) ValidateCredentials() error {
	query := `SELECT id, name, password FROM users WHERE email = $1`

	var hashedPassword string

	err := db.GetDB().QueryRow(context.Background(), query, u.Email).Scan(&u.ID, &u.Name, &hashedPassword)

	if err != nil {
		return errors.New("invalid credentials")
	}

	err = utils.ComparePassword(hashedPassword, u.Password)

	if err != nil {
		return errors.New("invalid credentials")
	}

	return nil
}

func (u *User) Get() error {
	query := `SELECT id, name, email, phone, created_at FROM users WHERE id = $1`

	err := db.GetDB().QueryRow(context.Background(), query, u.ID).Scan(&u.ID, &u.Name, &u.Email, &u.Phone, &u.CreatedAt)

	if err != nil {
		return errors.New("failed to get user: " + err.Error())
	}

	return nil
}
