package handlers

import (
	"fmt"
	"net/http"
	"runtime/debug"
	"time"

	"github.com/KoiralaSam/Remindly/backend/internal/WS"
	"github.com/KoiralaSam/Remindly/backend/internal/models"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"

	"github.com/gin-gonic/gin"
)

type WShandler struct {
	hub *WS.Hub
}

func NewHandler(hub *WS.Hub) *WShandler {
	return &WShandler{
		hub: hub,
	}
}

func (h *WShandler) GetHub() *WS.Hub {
	return h.hub
}

type CreateRoomReq struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

func (h *WShandler) CreateRoom(ctx *gin.Context) {
	var req CreateRoomReq

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	h.hub.Rooms[req.ID] = &WS.Room{
		ID:      req.ID,
		Name:    req.Name,
		Clients: make(map[string]*WS.Client),
	}

	ctx.JSON(http.StatusOK, req)
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:   1024,
	WriteBufferSize:  1024,
	HandshakeTimeout: 10 * time.Second,
	CheckOrigin: func(r *http.Request) bool {
		// In development, accept WebSocket connections from any origin.
		// If you want to restrict this, compare r.Header.Get("Origin")
		// to your frontend origin instead of returning true.
		return true
	},
	// Don't check origin in development - accept all
	EnableCompression: false,
}

func (h *WShandler) JoinRoom(ctx *gin.Context) {
	defer func() {
		if r := recover(); r != nil {
			debug.PrintStack()
			ctx.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		}
	}()

	roomID := ctx.Param("roomId")
	groupID := ctx.Param("groupID")

	clientID := ctx.GetString("userID")
	username := ctx.GetString("username")

	if clientID == "" {
		ctx.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "user ID not found - authentication required"})
		return
	}

	if username == "" {
		ctx.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "username not found"})
		return
	}

	// Get group name using group ID (before upgrade so we can return proper errors)
	group, err := models.GetGroupByID(groupID)
	if err != nil {
		ctx.AbortWithStatusJSON(http.StatusNotFound, gin.H{"error": "group not found"})
		return
	}

	// Ensure room exists with group name
	if _, ok := h.hub.Rooms[roomID]; !ok {
		h.hub.Rooms[roomID] = &WS.Room{
			ID:      roomID,
			Name:    group.Name,
			Clients: make(map[string]*WS.Client),
		}
	}

	// Upgrade to WebSocket
	conn, err := upgrader.Upgrade(ctx.Writer, ctx.Request, nil)
	if err != nil {
		return
	}

	// Create client
	cl := &WS.Client{
		Conn:     conn,
		ID:       clientID,
		Username: username,
		RoomID:   roomID,
		Message:  make(chan *WS.Message, 10),
	}

	// Create join message
	m := &WS.Message{
		ID:        uuid.New().String(),
		RoomID:    roomID,
		UserID:    clientID,
		Content:   fmt.Sprintf(`%s has joined the chat`, username),
		Username:  username,
		CreatedAt: time.Now().Format(time.RFC3339),
	}

	// Register a new client through the register channel
	h.hub.Register <- cl

	// Broadcast that message
	h.hub.Broadcast <- m

	// Start write goroutine
	go cl.WriteMessage()

	// Start read loop (blocks until connection closes)
	cl.ReadMessage(h.hub)
}

type RoomRes struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

func (h *WShandler) GetRooms(ctx *gin.Context) {
	rooms := make([]RoomRes, 0)

	for _, r := range h.hub.Rooms {
		rooms = append(rooms, RoomRes{
			ID:   r.ID,
			Name: r.Name,
		})

		ctx.JSON(http.StatusOK, rooms)
	}
}

type ClientRes struct {
	ID       string `json:"id"`
	Username string `json:"username"`
}

func (h *WShandler) GetClients(ctx *gin.Context) {
	var clients []ClientRes
	roomID := ctx.Param("roomId")

	if _, ok := h.hub.Rooms[roomID]; !ok {
		clients = make([]ClientRes, 0)
		ctx.JSON(http.StatusOK, clients)
		return
	}

	for _, c := range h.hub.Rooms[roomID].Clients {
		clients = append(clients, ClientRes{
			ID:       c.ID,
			Username: c.Username,
		})
	}

	ctx.JSON(http.StatusOK, clients)
}
