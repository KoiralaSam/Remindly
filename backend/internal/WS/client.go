package WS

import (
	"context"
	"time"

	"github.com/KoiralaSam/Remindly/backend/internal/models"
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

	// Set up ping ticker to keep connection alive
	ticker := time.NewTicker(54 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case message, ok := <-c.Message:
			// Set write deadline
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				// Channel closed
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			if err := c.Conn.WriteJSON(message); err != nil {
				// Connection closed or broken - exit gracefully
				if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
					// Error writing message
				}
				return
			}
		case <-ticker.C:
			// Send ping to keep connection alive
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				// Connection closed or broken - exit gracefully without logging as error
				// This is expected when client disconnects
				return
			}
		}
	}
}

func (c *Client) ReadMessage(h *Hub) {
	defer func() {
		h.UnRegister <- c
		c.Conn.Close()
	}()

	// Set up pong handler to respond to ping messages
	c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, m, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseAbnormalClosure, websocket.CloseGoingAway) {
				// WebSocket read error
			}
			break
		}

		// Reset read deadline after successful read
		c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))

		now := time.Now()
		msg := &models.Message{
			ID:        uuid.New().String(),
			RoomID:    c.RoomID,
			UserID:    c.ID,
			Content:   string(m),
			Username:  c.Username,
			CreatedAt: now,
			UpdatedAt: now,
		}

		// Persist message to database
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		err = msg.SaveWithID(ctx)
		cancel()
		if err != nil {
			// Still broadcast even if persistence fails
		}

		// Convert to WS.Message for broadcasting (CreatedAt as string)
		wsMsg := &Message{
			ID:        msg.ID,
			RoomID:    msg.RoomID,
			UserID:    msg.UserID,
			Content:   msg.Content,
			Username:  msg.Username,
			CreatedAt: msg.CreatedAt.Format(time.RFC3339),
		}

		h.Broadcast <- wsMsg
	}
}
