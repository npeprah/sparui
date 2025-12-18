package websocket

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/npeprah/sparui/backend/common/db"
	"github.com/npeprah/sparui/backend/service/game-server/controller/room"
	"github.com/npeprah/sparui/backend/service/game-server/entity"
	roomrepo "github.com/npeprah/sparui/backend/service/game-server/repository/room"
	userrepo "github.com/npeprah/sparui/backend/service/game-server/repository/user"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// Allow connections from frontend origins
		origin := r.Header.Get("Origin")
		return origin == "http://localhost:5173" || origin == "http://localhost:5174"
	},
}

// Client represents a connected WebSocket client
type Client struct {
	ID       string
	Conn     *websocket.Conn
	Send     chan []byte
	Hub      *Hub
	PlayerID string
	RoomID   string
}

// Hub maintains active clients and broadcasts messages
type Hub struct {
	// Registered clients
	Clients map[*Client]bool

	// Inbound messages from clients
	Broadcast chan []byte

	// Register requests from clients
	Register chan *Client

	// Unregister requests from clients
	Unregister chan *Client

	// Mutex for thread-safe access
	mu sync.RWMutex
}

// Message represents a WebSocket message
type Message struct {
	Event string          `json:"event"`
	Data  json.RawMessage `json:"data"`
}

// Global hub instance
var hub = &Hub{
	Broadcast:  make(chan []byte),
	Register:   make(chan *Client),
	Unregister: make(chan *Client),
	Clients:    make(map[*Client]bool),
}

// Global room manager
var roomManager *room.Manager

// Global repositories
var userRepository *userrepo.Repository

// Global connection manager
var connectionManager *ConnectionManager

func init() {
	go hub.Run()
	// Initialize room manager without repository (will be set later)
	roomManager = room.NewManager()
	// Initialize connection manager with 60 second reconnection timeout
	connectionManager = NewConnectionManager(hub, 60*time.Second)
}

// InitWebSocket initializes the WebSocket service with dependencies
func InitWebSocket(database *db.DB) {
	// Initialize repositories
	userRepository = userrepo.NewRepository(database)
	roomRepository := roomrepo.NewRepository(database)

	// Initialize room manager with repository
	roomManager = room.NewManagerWithRepository(roomRepository)

	slog.Info("WebSocket service initialized with database dependencies")
}

// Run starts the hub's main loop
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.mu.Lock()
			h.Clients[client] = true
			h.mu.Unlock()

			// Register with connection manager if player is authenticated
			if connectionManager != nil && client.PlayerID != "" {
				connectionManager.RegisterConnection(client)
			}

			slog.Info("Client registered", "clientId", client.ID, "playerId", client.PlayerID)

		case client := <-h.Unregister:
			h.mu.Lock()
			if _, ok := h.Clients[client]; ok {
				delete(h.Clients, client)
				close(client.Send)
				h.mu.Unlock()

				// Handle disconnection through connection manager
				if connectionManager != nil && client.PlayerID != "" {
					ctx := context.Background()
					connectionManager.HandlePlayerDisconnection(ctx, client)
				}

				slog.Info("Client unregistered", "clientId", client.ID, "playerId", client.PlayerID)
			} else {
				h.mu.Unlock()
			}

		case message := <-h.Broadcast:
			h.mu.RLock()
			for client := range h.Clients {
				select {
				case client.Send <- message:
				default:
					close(client.Send)
					delete(h.Clients, client)
				}
			}
			h.mu.RUnlock()
		}
	}
}

// HandleWebSocket handles WebSocket upgrade requests
func HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		slog.Error("Failed to upgrade connection", "error", err)
		return
	}

	client := &Client{
		ID:   generateClientID(),
		Conn: conn,
		Send: make(chan []byte, 256),
		Hub:  hub,
	}

	client.Hub.Register <- client

	// Start goroutines for reading and writing
	go client.writePump()
	go client.readPump()
}

// readPump reads messages from the WebSocket connection
func (c *Client) readPump() {
	defer func() {
		c.Hub.Unregister <- c
		c.Conn.Close()
	}()

	c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				slog.Error("WebSocket error", "error", err)
			}
			break
		}

		// Parse message
		var msg Message
		if err := json.Unmarshal(message, &msg); err != nil {
			slog.Error("Failed to parse message", "error", err)
			continue
		}

		// Route message based on event type
		c.handleMessage(msg)
	}
}

// writePump writes messages to the WebSocket connection
func (c *Client) writePump() {
	ticker := time.NewTicker(30 * time.Second)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// Add queued messages to current message
			n := len(c.Send)
			for i := 0; i < n; i++ {
				w.Write([]byte{'\n'})
				w.Write(<-c.Send)
			}

			if err := w.Close(); err != nil {
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

// handleMessage routes messages based on event type
func (c *Client) handleMessage(msg Message) {
	slog.Info("Received message", "event", msg.Event, "clientId", c.ID)

	switch msg.Event {
	case "auth":
		c.handleAuth(msg.Data)
	case "game:play_card":
		c.handlePlayCard(msg.Data)
	case "game:declare_dry":
		c.handleDeclareDry(msg.Data)
	case "game:flag_player":
		c.handleFlagPlayer(msg.Data)
	case "lobby:create":
		c.handleCreateLobby(msg.Data)
	case "lobby:join":
		c.handleJoinLobby(msg.Data)
	case "lobby:leave":
		c.handleLeaveLobby(msg.Data)
	default:
		slog.Warn("Unknown event type", "event", msg.Event)
	}
}

// Placeholder handler functions
func (c *Client) handleAuth(data json.RawMessage) {
	slog.Info("Auth event", "clientId", c.ID)

	// Parse auth data
	var req struct {
		Token string `json:"token"`
	}
	if err := json.Unmarshal(data, &req); err != nil {
		slog.Error("Failed to parse auth request", "error", err)
		c.sendError("auth:error", "Invalid auth request format")
		return
	}

	// TODO: Validate JWT token properly using auth middleware functions
	// For now, we'll accept any non-empty token and extract player ID from it
	// In production, this should use the JWT validation from common/auth package

	if req.Token == "" {
		c.sendError("auth:error", "Authentication token required")
		return
	}

	// TEMPORARY: Extract playerID from token (simplified for MVP)
	// In production, use: common/auth.ValidateToken(req.Token)
	playerID := "player-" + req.Token[:min(8, len(req.Token))]

	// Assign player ID to client
	oldPlayerID := c.PlayerID
	c.PlayerID = playerID

	// Register with connection manager if this is a new authenticated connection
	if oldPlayerID == "" && connectionManager != nil {
		connectionManager.RegisterConnection(c)
	}

	response := map[string]interface{}{
		"event": "auth:success",
		"data": map[string]string{
			"playerId": playerID,
			"message":  "Authenticated successfully",
		},
	}
	c.sendJSON(response)

	slog.Info("Client authenticated", "clientId", c.ID, "playerId", playerID)
}

// Helper function for min
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func (c *Client) handlePlayCard(data json.RawMessage) {
	// TODO: Parse card data, validate, update game state, broadcast to room
	slog.Info("Play card event", "clientId", c.ID)
}

func (c *Client) handleDeclareDry(data json.RawMessage) {
	// TODO: Parse dry declaration, validate, update game state
	slog.Info("Declare dry event", "clientId", c.ID)
}

func (c *Client) handleFlagPlayer(data json.RawMessage) {
	// TODO: Parse flag data, validate challenge, resolve
	slog.Info("Flag player event", "clientId", c.ID)
}

func (c *Client) handleCreateLobby(data json.RawMessage) {
	slog.Info("Create lobby event", "clientId", c.ID, "playerId", c.PlayerID)

	// Parse request
	var req struct {
		Settings entity.RoomSettings `json:"settings"`
	}
	if err := json.Unmarshal(data, &req); err != nil {
		slog.Error("Failed to parse create lobby request", "error", err)
		c.sendError("lobby:error", "Invalid request format")
		return
	}

	// Validate player is authenticated
	if c.PlayerID == "" {
		slog.Warn("Unauthenticated player attempted to create lobby", "clientId", c.ID)
		c.sendError("lobby:error", "Authentication required")
		return
	}

	// Create room
	ctx := context.Background()
	createReq := entity.CreateRoomRequest{
		HostID:   c.PlayerID,
		Settings: req.Settings,
	}

	room, err := roomManager.CreateRoom(ctx, createReq)
	if err != nil {
		slog.Error("Failed to create room", "error", err, "playerId", c.PlayerID)
		c.sendError("lobby:error", "Failed to create room")
		return
	}

	// Assign client to room
	c.RoomID = room.RoomCode

	// Send success response to creator
	c.sendJSON(map[string]interface{}{
		"event": "lobby:room_created",
		"data": map[string]interface{}{
			"room": room,
		},
	})

	slog.Info("Lobby created successfully", "roomCode", room.RoomCode, "playerId", c.PlayerID)
}

func (c *Client) handleJoinLobby(data json.RawMessage) {
	slog.Info("Join lobby event", "clientId", c.ID, "playerId", c.PlayerID)

	// Parse request
	var req struct {
		RoomCode string `json:"roomCode"`
	}
	if err := json.Unmarshal(data, &req); err != nil {
		slog.Error("Failed to parse join lobby request", "error", err)
		c.sendError("lobby:error", "Invalid request format")
		return
	}

	// Validate player is authenticated
	if c.PlayerID == "" {
		slog.Warn("Unauthenticated player attempted to join lobby", "clientId", c.ID)
		c.sendError("lobby:error", "Authentication required")
		return
	}

	// Validate room code
	if req.RoomCode == "" {
		c.sendError("lobby:error", "Room code is required")
		return
	}

	// Get player info
	ctx := context.Background()
	var playerInfo entity.User
	if userRepository != nil {
		user, err := userRepository.FindByID(ctx, c.PlayerID)
		if err != nil {
			slog.Error("Failed to fetch user info", "error", err, "playerId", c.PlayerID)
			// Use fallback player info
			playerInfo = entity.User{
				ID:       c.PlayerID,
				Username: "Player",
				Avatar:   "default-avatar.png",
			}
		} else {
			playerInfo = *user
		}
	} else {
		// Fallback if repository not initialized
		playerInfo = entity.User{
			ID:       c.PlayerID,
			Username: "Player",
			Avatar:   "default-avatar.png",
		}
	}

	// Join room
	joinReq := entity.JoinRoomRequest{
		RoomCode: req.RoomCode,
		PlayerID: c.PlayerID,
	}

	room, err := roomManager.JoinRoom(ctx, joinReq, playerInfo)
	if err != nil {
		slog.Error("Failed to join room", "error", err, "playerId", c.PlayerID, "roomCode", req.RoomCode)
		c.sendError("lobby:error", err.Error())
		return
	}

	// Assign client to room
	c.RoomID = room.RoomCode

	// Send room state to joiner
	c.sendJSON(map[string]interface{}{
		"event": "lobby:room_state",
		"data": map[string]interface{}{
			"room": room,
		},
	})

	// Broadcast player joined to all room members
	c.broadcastToRoom(room.RoomCode, map[string]interface{}{
		"event": "lobby:player_joined",
		"data": map[string]interface{}{
			"player": room.Players[len(room.Players)-1], // Last player added
			"room":   room,
		},
	})

	slog.Info("Player joined lobby successfully", "roomCode", room.RoomCode, "playerId", c.PlayerID)
}

func (c *Client) handleLeaveLobby(data json.RawMessage) {
	slog.Info("Leave lobby event", "clientId", c.ID, "playerId", c.PlayerID)

	// Validate player is authenticated
	if c.PlayerID == "" {
		slog.Warn("Unauthenticated player attempted to leave lobby", "clientId", c.ID)
		c.sendError("lobby:error", "Authentication required")
		return
	}

	// Validate player is in a room
	if c.RoomID == "" {
		c.sendError("lobby:error", "Not in a room")
		return
	}

	roomCode := c.RoomID

	// Leave room
	ctx := context.Background()
	leaveReq := entity.LeaveRoomRequest{
		RoomCode: roomCode,
		PlayerID: c.PlayerID,
	}

	err := roomManager.LeaveRoom(ctx, leaveReq)
	if err != nil {
		slog.Error("Failed to leave room", "error", err, "playerId", c.PlayerID, "roomCode", roomCode)
		c.sendError("lobby:error", err.Error())
		return
	}

	// Clear client's room assignment
	c.RoomID = ""

	// Check if room still exists (might have been deleted if empty)
	room, err := roomManager.GetRoom(roomCode)
	if err == nil && room != nil {
		// Room still exists, broadcast player left to remaining members
		c.broadcastToRoom(roomCode, map[string]interface{}{
			"event": "lobby:player_left",
			"data": map[string]interface{}{
				"playerId": c.PlayerID,
				"room":     room,
			},
		})
	}

	// Send confirmation to leaving player
	c.sendJSON(map[string]interface{}{
		"event": "lobby:left",
		"data": map[string]interface{}{
			"message": "Successfully left the room",
		},
	})

	slog.Info("Player left lobby successfully", "roomCode", roomCode, "playerId", c.PlayerID)
}

// sendJSON sends a JSON message to the client
func (c *Client) sendJSON(data interface{}) {
	message, err := json.Marshal(data)
	if err != nil {
		slog.Error("Failed to marshal message", "error", err)
		return
	}
	c.Send <- message
}

// sendError sends an error message to the client
func (c *Client) sendError(event string, errorMsg string) {
	c.sendJSON(map[string]interface{}{
		"event": event,
		"data": map[string]string{
			"error": errorMsg,
		},
	})
}

// broadcastToRoom sends a message to all clients in a specific room
func (c *Client) broadcastToRoom(roomCode string, data interface{}) {
	message, err := json.Marshal(data)
	if err != nil {
		slog.Error("Failed to marshal room broadcast message", "error", err)
		return
	}

	c.Hub.mu.RLock()
	defer c.Hub.mu.RUnlock()

	for client := range c.Hub.Clients {
		if client.RoomID == roomCode && client.ID != c.ID {
			select {
			case client.Send <- message:
			default:
				slog.Warn("Failed to send message to client", "clientId", client.ID, "roomCode", roomCode)
			}
		}
	}
}

// generateClientID generates a unique client ID
func generateClientID() string {
	// TODO: Use UUID or more robust ID generation
	return time.Now().Format("20060102150405")
}
