package WS

import "fmt"

type Room struct {
	ID      string             `json:"id"`
	Name    string             `json:"name"`
	Clients map[string]*Client `json:"clients"`
}

type Hub struct {
	Rooms      map[string]*Room
	Register   chan *Client
	UnRegister chan *Client
	Broadcast  chan *Message
}

func NewHub() *Hub {
	return &Hub{
		Rooms:      make(map[string]*Room),
		Register:   make(chan *Client),
		UnRegister: make(chan *Client),
		Broadcast:  make(chan *Message),
	}
}

func (h *Hub) Run() {
	for {
		select {
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
					ID:       "",
					RoomID:   cl.RoomID,
					Content:  fmt.Sprintf(`%s has left the chat`, cl.Username),
					Username: cl.Username,
					UserID:   cl.ID,
				}

				if _, ok := room.Clients[cl.ID]; ok {
					delete(room.Clients, cl.ID)
					if len(h.Rooms[cl.RoomID].Clients) > 0 {
						h.Broadcast <- message
					}

					close(cl.Message)
				}
			}

		case m := <-h.Broadcast:
			if _, ok := h.Rooms[m.RoomID]; ok {
				for _, cl := range h.Rooms[m.RoomID].Clients {
					cl.Message <- m
				}
			}
		}
	}
}
