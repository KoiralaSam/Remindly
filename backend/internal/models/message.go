package models

import (
	"context"
	"errors"
	"time"

	"github.com/KoiralaSam/Remindly/backend/internal/db"
)

type Message struct {
	ID        string    `json:"id"`
	RoomID    string    `json:"room_id"`
	UserID    string    `json:"user_id"`
	Username  string    `json:"username"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Save persists a message to the database
func (m *Message) Save(ctx context.Context) error {

	query := `INSERT INTO messages (room_id, user_id, username, content) 
	          VALUES ($1, $2, $3, $4) 
	          RETURNING id, created_at, updated_at`

	err := db.GetDB().QueryRow(ctx, query,
		m.RoomID,
		m.UserID,
		m.Username,
		m.Content,
	).Scan(&m.ID, &m.CreatedAt, &m.UpdatedAt)

	if err != nil {
		return errors.New("failed to save message: " + err.Error())
	}

	return nil
}

// GetByID retrieves a message by its ID
func (m *Message) GetByID(ctx context.Context) error {
	query := `SELECT id, room_id, user_id, username, content, created_at, updated_at 
	          FROM messages 
	          WHERE id = $1`

	err := db.GetDB().QueryRow(ctx, query, m.ID).Scan(
		&m.ID,
		&m.RoomID,
		&m.UserID,
		&m.Username,
		&m.Content,
		&m.CreatedAt,
		&m.UpdatedAt,
	)

	if err != nil {
		return errors.New("message not found: " + err.Error())
	}

	return nil
}

// GetRoomMessages retrieves all messages for a room with pagination
func GetRoomMessages(ctx context.Context, roomID string, limit int, offset int) ([]Message, error) {
	query := `SELECT id, room_id, user_id, username, content, created_at, updated_at 
	          FROM messages 
	          WHERE room_id = $1 
	          ORDER BY created_at DESC 
	          LIMIT $2 OFFSET $3`

	rows, err := db.GetDB().Query(ctx, query, roomID, limit, offset)
	if err != nil {
		return nil, errors.New("failed to fetch room messages: " + err.Error())
	}
	defer rows.Close()

	var messages []Message
	for rows.Next() {
		var msg Message
		if err := rows.Scan(&msg.ID, &msg.RoomID, &msg.UserID, &msg.Username, &msg.Content, &msg.CreatedAt, &msg.UpdatedAt); err != nil {
			return nil, errors.New("failed to scan message: " + err.Error())
		}
		messages = append(messages, msg)
	}

	// Reverse to get chronological order (oldest first)
	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}

	return messages, nil
}

// GetUserRoomMessages retrieves messages for a specific user in a room
func GetUserRoomMessages(ctx context.Context, roomID string, userID string, limit int, offset int) ([]Message, error) {
	query := `SELECT id, room_id, user_id, username, content, created_at, updated_at 
	          FROM messages 
	          WHERE room_id = $1 AND user_id = $2 
	          ORDER BY created_at DESC 
	          LIMIT $3 OFFSET $4`

	rows, err := db.GetDB().Query(ctx, query, roomID, userID, limit, offset)
	if err != nil {
		return nil, errors.New("failed to fetch user room messages: " + err.Error())
	}
	defer rows.Close()

	var messages []Message
	for rows.Next() {
		var msg Message
		if err := rows.Scan(&msg.ID, &msg.RoomID, &msg.UserID, &msg.Username, &msg.Content, &msg.CreatedAt, &msg.UpdatedAt); err != nil {
			return nil, errors.New("failed to scan message: " + err.Error())
		}
		messages = append(messages, msg)
	}

	// Reverse to get chronological order (oldest first)
	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}

	return messages, nil
}

// DeleteMessage deletes a message by its ID
func DeleteMessage(ctx context.Context, messageID string) error {
	query := `DELETE FROM messages WHERE id = $1`

	result, err := db.GetDB().Exec(ctx, query, messageID)
	if err != nil {
		return errors.New("failed to delete message: " + err.Error())
	}

	if result.RowsAffected() == 0 {
		return errors.New("message not found")
	}

	return nil
}
