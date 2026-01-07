package handlers

import (
	"log"
	"net/http"
	"runtime/debug"
	"time"

	"github.com/KoiralaSam/Remindly/backend/internal/WS"
	"github.com/KoiralaSam/Remindly/backend/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

type SignalingHandler struct {
	hub *WS.SignalingHub
}

func NewSignalingHandler(hub *WS.SignalingHub) *SignalingHandler {
	return &SignalingHandler{
		hub: hub,
	}
}

var signalingUpgrader = websocket.Upgrader{
	ReadBufferSize:   1024,
	WriteBufferSize:  1024,
	HandshakeTimeout: 10 * time.Second,
	CheckOrigin: func(r *http.Request) bool {
		return true // Configure properly in production
	},
	EnableCompression: false,
}

func (h *SignalingHandler) JoinSignaling(ctx *gin.Context) {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("❌ PANIC in JoinSignaling: %v", r)
			debug.PrintStack()
			ctx.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		}
	}()

	roomID := ctx.Param("roomId")
	groupID := ctx.Param("groupID")
	clientID := ctx.GetString("userID")
	username := ctx.GetString("username")

	log.Printf("🎥 JoinSignaling attempt - GroupID: %s, RoomID: %s, UserID: %s, Username: %s",
		groupID, roomID, clientID, username)

	if clientID == "" {
		log.Printf("❌ Signaling: Authentication failed - userID not found")
		ctx.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "user ID not found"})
		return
	}

	if username == "" {
		log.Printf("❌ Signaling: Username not found for user: %s", clientID)
		ctx.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "username not found"})
		return
	}

	// Verify group exists
	_, err := models.GetGroupByID(groupID)
	if err != nil {
		log.Printf("❌ Signaling: Group not found: %s", groupID)
		ctx.AbortWithStatusJSON(http.StatusNotFound, gin.H{"error": "group not found"})
		return
	}

	// Upgrade to WebSocket
	conn, err := signalingUpgrader.Upgrade(ctx.Writer, ctx.Request, nil)
	if err != nil {
		log.Printf("❌ Signaling: WebSocket upgrade failed for user %s: %v", clientID, err)
		return
	}

	log.Printf("✅ Signaling: WebSocket upgraded for user %s in room %s", clientID, roomID)

	// Create signaling client
	client := &WS.SignalingClient{
		Conn:     conn,
		ID:       clientID,
		Username: username,
		RoomID:   roomID,
		Message:  make(chan *WS.SignalingMessage, 10),
	}

	// Register client
	log.Printf("📝 Signaling: Registering client %s", clientID)
	h.hub.Register <- client

	log.Printf("✅ Signaling: Client %s registered", clientID)

	// Start write goroutine
	log.Printf("🚀 Signaling: Starting WriteMessage goroutine for client %s", clientID)
	go client.WriteMessage()

	// Start read loop (blocks until connection closes)
	log.Printf("🚀 Signaling: Starting ReadMessage for client %s", clientID)
	client.ReadMessage(h.hub)

	log.Printf("👋 Signaling: Client %s fully disconnected from room %s", clientID, roomID)
}

func (h *SignalingHandler) GetHub() *WS.SignalingHub {
	return h.hub
}
