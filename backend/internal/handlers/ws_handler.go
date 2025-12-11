package handlers

import (
	"fmt"
	"net/http"

	"github.com/KoiralaSam/Remindly/backend/internal/WS"
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
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		origin := r.Header.Get("Origin")
		return origin == "http://localhost:5173"
	},
}

func (h *WShandler) JoinRoom(ctx *gin.Context) {
	conn, err := upgrader.Upgrade(ctx.Writer, ctx.Request, nil)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	roomID := ctx.Param("roomId")
	clientID := ctx.Query("clientId")
	username := ctx.Query("username")

	cl := &WS.Client{
		Conn:     conn,
		ID:       clientID,
		Username: username,
		RoomID:   roomID,
		Message:  make(chan *WS.Message, 10),
	}

	m := &WS.Message{
		Content:  fmt.Sprintf(`%s has joined the chat`, username),
		RoomID:   roomID,
		Username: username,
		UserID:   clientID,
	}

	//Register a new client through the register channel
	h.hub.Register <- cl
	//broadcast that message
	h.hub.Broadcast <- m

	//write Message
	go cl.WriteMessage()
	//read message
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
