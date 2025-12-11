package WS

import (
	"context"
	"log"
	"time"

	"github.com/KoiralaSam/Remindly/backend/internal/db"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

type Client struct {
	Conn     *websocket.Conn
	Message  chan *Message
	ID       string `json:"id"`
	RoomID   string `json:"roomId"`
	Username string `json:"username"`
}

type Message struct {
	ID        string `json:"id"`
	RoomID    string `json:"room_id"`
	UserID    string `json:"user_id"`
	Content   string `json:"content"`
	Username  string `json:"username"`
	CreatedAt string `json:"created_at,omitempty"`
}

func (c *Client) WriteMessage() {
	defer c.Conn.Close()

	for {
		message, ok := <-c.Message
		if !ok {
			return
		}
		c.Conn.WriteJSON(message)
	}
}

func (c *Client) ReadMessage(h *Hub) {

	defer func() {
		h.UnRegister <- c
		c.Conn.Close()
	}()

	for {
		_, m, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}

		msg := &Message{
			ID:       uuid.New().String(),
			RoomID:   c.RoomID,
			UserID:   c.ID,
			Content:  string(m),
			Username: c.Username,
		}

		// Persist message to database
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		err = persistMessage(ctx, msg)
		cancel()
		if err != nil {
			log.Printf("failed to persist message: %v", err)
			// Still broadcast even if persistence fails
		}

		msg.CreatedAt = time.Now().Format(time.RFC3339)
		h.Broadcast <- msg
	}

}

// persistMessage saves the message to the database
func persistMessage(ctx context.Context, msg *Message) error {
	query := `INSERT INTO messages (id, room_id, user_id, content, created_at, updated_at) 
	          VALUES ($1, $2, $3, $4, $5, $6)`

	_, err := db.GetDB().Exec(ctx, query,
		msg.ID,
		msg.RoomID,
		msg.UserID,
		msg.Content,
		time.Now(),
		time.Now(),
	)

	if err != nil {
		return err
	}

	return nil
}
