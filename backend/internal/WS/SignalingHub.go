package WS

import (
	"log"
	"time"

	"github.com/google/uuid"
)

type SignalingRoom struct {
	ID      string                      `json:"id"`
	Clients map[string]*SignalingClient `json:"clients"`
}

type SignalingHub struct {
	Rooms         map[string]*SignalingRoom
	Register      chan *SignalingClient
	UnRegister    chan *SignalingClient
	DirectMessage chan *SignalingMessage
}

func NewSignalingHub() *SignalingHub {
	return &SignalingHub{
		Rooms:         make(map[string]*SignalingRoom),
		Register:      make(chan *SignalingClient),
		UnRegister:    make(chan *SignalingClient),
		DirectMessage: make(chan *SignalingMessage, 256), // Buffered for high throughput
	}
}

func (h *SignalingHub) Run() {
	log.Println("🎥 SignalingHub.Run() started - listening for WebRTC signals")

	for {
		select {
		case client := <-h.Register:
			log.Printf("🎥 Signaling: Register received for client %s in room %s", client.ID, client.RoomID)

			// Create room if doesn't exist
			if _, ok := h.Rooms[client.RoomID]; !ok {
				h.Rooms[client.RoomID] = &SignalingRoom{
					ID:      client.RoomID,
					Clients: make(map[string]*SignalingClient),
				}
				log.Printf("🎥 Signaling: Created room %s", client.RoomID)
			}

			room := h.Rooms[client.RoomID]

			// Register client
			if _, exists := room.Clients[client.ID]; !exists {
				room.Clients[client.ID] = client
				log.Printf("✅ Signaling: Client %s registered to room %s (total: %d)",
					client.ID, client.RoomID, len(room.Clients))
			} else {
				log.Printf("⚠️ Signaling: Client %s already registered in room %s", client.ID, client.RoomID)
			}

		case client := <-h.UnRegister:
			log.Printf("🎥 Signaling: UnRegister received for client %s in room %s", client.ID, client.RoomID)

			if room, ok := h.Rooms[client.RoomID]; ok {
				if _, exists := room.Clients[client.ID]; exists {
					delete(room.Clients, client.ID)
					close(client.Message)

					log.Printf("✅ Signaling: Client %s unregistered from room %s (remaining: %d)",
						client.ID, client.RoomID, len(room.Clients))

					// Notify other clients that this user disconnected (for active calls)
					disconnectMsg := &SignalingMessage{
						ID:        uuid.New().String(),
						Type:      "peer-disconnected",
						RoomID:    client.RoomID,
						SenderID:  client.ID,
						Username:  client.Username,
						CreatedAt: time.Now().Format(time.RFC3339),
					}

					// Notify all other clients in room
					for _, otherClient := range room.Clients {
						select {
						case otherClient.Message <- disconnectMsg:
						default:
							log.Printf("⚠️ Failed to send disconnect notification to %s", otherClient.ID)
						}
					}

					// Clean up empty rooms
					if len(room.Clients) == 0 {
						delete(h.Rooms, client.RoomID)
						log.Printf("🎥 Signaling: Room %s deleted (empty)", client.RoomID)
					}
				}
			}

		case msg := <-h.DirectMessage:
			log.Printf("🎥 Signaling: DirectMessage type=%s, from=%s to=%s", msg.Type, msg.SenderID, msg.TargetID)

			if room, ok := h.Rooms[msg.RoomID]; ok {
				// Find target client
				if targetClient, ok := room.Clients[msg.TargetID]; ok {
					// Non-blocking send
					select {
					case targetClient.Message <- msg:
						log.Printf("✅ Signaling: Message delivered from %s to %s", msg.SenderID, msg.TargetID)
					default:
						log.Printf("⚠️ Signaling: Failed to deliver to %s (channel full)", msg.TargetID)
					}
				} else {
					log.Printf("❌ Signaling: Target client %s not found in room %s", msg.TargetID, msg.RoomID)

					// Send error back to sender
					if senderClient, ok := room.Clients[msg.SenderID]; ok {
						errorMsg := &SignalingMessage{
							ID:       uuid.New().String(),
							Type:     "error",
							RoomID:   msg.RoomID,
							SenderID: "system",
							TargetID: msg.SenderID,
							Data: map[string]string{
								"error":   "target_not_found",
								"message": "Target user is not connected",
							},
							CreatedAt: time.Now().Format(time.RFC3339),
						}

						select {
						case senderClient.Message <- errorMsg:
						default:
						}
					}
				}
			} else {
				log.Printf("❌ Signaling: Room %s not found", msg.RoomID)
			}
		}
	}
}
