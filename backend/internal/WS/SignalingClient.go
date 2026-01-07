package WS

import (
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

type SignalingClient struct {
	Conn     *websocket.Conn
	Message  chan *SignalingMessage
	ID       string `json:"id"`
	RoomID   string `json:"roomId"`
	Username string `json:"username"`
}

type SignalingMessage struct {
	ID        string `json:"id"`
	Type      string `json:"type"`
	RoomID    string `json:"room_id"`
	SenderID  string `json:"sender_id"`
	TargetID  string `json:"target_id"`
	Data      any    `json:"data"`
	Username  string `json:"username"`
	CreatedAt string `json:"created_at,omitempty"`
}

func (c *SignalingClient) WriteMessage() {
	defer c.Conn.Close()

	ticker := time.NewTicker(54 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case message, ok := <-c.Message:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.Conn.WriteJSON(message); err != nil {
				if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
					log.Printf("signaling write error: %v", err)
				}
				return
			}

		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func (c *SignalingClient) ReadMessage(h *SignalingHub) {
	defer func() {
		log.Printf("🎥 Signaling ReadMessage cleanup for client %s in room %s", c.ID, c.RoomID)
		h.UnRegister <- c
		c.Conn.Close()
	}()

	c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	log.Printf("🎥 Signaling ReadMessage started for client %s in room %s", c.ID, c.RoomID)

	for {
		var msg SignalingMessage
		err := c.Conn.ReadJSON(&msg)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseAbnormalClosure, websocket.CloseGoingAway) {
				log.Printf("signaling read error for client %s: %v", c.ID, err)
			} else {
				log.Printf("signaling connection closed for client %s", c.ID)
			}
			break
		}

		c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))

		// Set message metadata
		msg.ID = uuid.New().String()
		msg.RoomID = c.RoomID
		msg.SenderID = c.ID
		msg.Username = c.Username
		msg.CreatedAt = time.Now().Format(time.RFC3339)

		log.Printf("🎥 Signaling message: type=%s, from=%s, to=%s", msg.Type, c.ID, msg.TargetID)

		// Validate target ID exists
		if msg.TargetID == "" {
			log.Printf("⚠️ Signaling message missing target_id, ignoring")
			continue
		}

		// Route to specific client
		h.DirectMessage <- &msg
	}
}
