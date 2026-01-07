package WS

import (
	"fmt"
	"time"

	"github.com/google/uuid"
)

type Room struct {
	ID      string             `json:"id"`
	Name    string             `json:"name"`
	Clients map[string]*Client `json:"clients"`
}

type Hub struct {
	Rooms      map[string]*Room
	Register   chan *Client
	UnRegister chan *Client
	CreateRoom chan *Room
	Broadcast  chan *Message
}

func NewHub() *Hub {
	return &Hub{
		Rooms:      make(map[string]*Room),
		Register:   make(chan *Client),
		UnRegister: make(chan *Client),
		CreateRoom: make(chan *Room),
		Broadcast:  make(chan *Message),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case room := <-h.CreateRoom:
			if _, exists := h.Rooms[room.ID]; !exists {
				h.Rooms[room.ID] = room
			}

		case cl := <-h.Register:
			if _, ok := h.Rooms[cl.RoomID]; ok {
				room := h.Rooms[cl.RoomID]

				if _, ok := room.Clients[cl.ID]; !ok {
					room.Clients[cl.ID] = cl
				}
			}

		case cl := <-h.UnRegister:
			if _, ok := h.Rooms[cl.RoomID]; ok {
				room := h.Rooms[cl.RoomID]

				message := &Message{
					ID:        uuid.New().String(),
					RoomID:    cl.RoomID,
					UserID:    cl.ID,
					Content:   fmt.Sprintf(`%s has left the chat`, cl.Username),
					Username:  cl.Username,
					CreatedAt: time.Now().Format(time.RFC3339),
				}

				if _, ok := room.Clients[cl.ID]; ok {
					delete(room.Clients, cl.ID)

					if len(h.Rooms[cl.RoomID].Clients) > 0 {
						select {
						case h.Broadcast <- message:
						default:
						}
					}

					close(cl.Message)
				}
			}

		case m := <-h.Broadcast:
			if room, ok := h.Rooms[m.RoomID]; ok {
				for _, cl := range room.Clients {
					select {
					case cl.Message <- m:
					default:
					}
				}
			}
		}
	}
}
