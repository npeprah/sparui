package websocket

import (
	"context"
	"encoding/json"
	"log/slog"
	"sync"
	"time"

	"github.com/npeprah/sparui/backend/service/game-server/entity"
)

// ConnectionManager manages player connections and handles disconnections/reconnections
type ConnectionManager struct {
	// Map of playerID to list of active client connections (supports multiple devices)
	playerConnections map[string][]*Client

	// Map of playerID to disconnection timestamp (for reconnection window)
	disconnectedPlayers map[string]time.Time

	// Reconnection timeout duration (default: 60 seconds)
	reconnectionTimeout time.Duration

	// Mutex for thread-safe access
	mu sync.RWMutex

	// Hub reference for broadcasting
	hub *Hub
}

// DisconnectedPlayer represents a player who has disconnected
type DisconnectedPlayer struct {
	PlayerID         string
	RoomCode         string
	DisconnectedAt   time.Time
	ReconnectTimeout time.Duration
}

// NewConnectionManager creates a new connection manager
func NewConnectionManager(hub *Hub, timeout time.Duration) *ConnectionManager {
	if timeout == 0 {
		timeout = 60 * time.Second // Default 60 seconds
	}

	cm := &ConnectionManager{
		playerConnections:   make(map[string][]*Client),
		disconnectedPlayers: make(map[string]time.Time),
		reconnectionTimeout: timeout,
		hub:                 hub,
	}

	// Start cleanup goroutine for expired disconnections
	go cm.cleanupExpiredDisconnections()

	return cm
}

// RegisterConnection adds a new client connection for a player
func (cm *ConnectionManager) RegisterConnection(client *Client) {
	cm.mu.Lock()
	defer cm.mu.Unlock()

	if client.PlayerID == "" {
		return
	}

	// Add client to player's connections
	cm.playerConnections[client.PlayerID] = append(cm.playerConnections[client.PlayerID], client)

	// Remove from disconnected players if reconnecting
	if _, wasDisconnected := cm.disconnectedPlayers[client.PlayerID]; wasDisconnected {
		delete(cm.disconnectedPlayers, client.PlayerID)
		slog.Info("Player reconnected within timeout", "playerId", client.PlayerID)
	}

	slog.Info("Connection registered",
		"playerId", client.PlayerID,
		"clientId", client.ID,
		"totalConnections", len(cm.playerConnections[client.PlayerID]))
}

// UnregisterConnection removes a client connection
// Returns true if this was the player's last connection
func (cm *ConnectionManager) UnregisterConnection(client *Client) bool {
	cm.mu.Lock()
	defer cm.mu.Unlock()

	if client.PlayerID == "" {
		return false
	}

	// Remove client from player's connections
	connections := cm.playerConnections[client.PlayerID]
	for i, c := range connections {
		if c.ID == client.ID {
			// Remove this connection
			cm.playerConnections[client.PlayerID] = append(connections[:i], connections[i+1:]...)
			break
		}
	}

	// Check if player has any remaining connections
	remainingConnections := len(cm.playerConnections[client.PlayerID])
	isLastConnection := remainingConnections == 0

	if isLastConnection {
		// Clean up empty slice
		delete(cm.playerConnections, client.PlayerID)

		// Mark player as disconnected with timestamp
		cm.disconnectedPlayers[client.PlayerID] = time.Now()

		slog.Info("Player fully disconnected, starting reconnection window",
			"playerId", client.PlayerID,
			"clientId", client.ID,
			"reconnectionTimeout", cm.reconnectionTimeout)
	} else {
		slog.Info("Connection unregistered, player still has active connections",
			"playerId", client.PlayerID,
			"clientId", client.ID,
			"remainingConnections", remainingConnections)
	}

	return isLastConnection
}

// IsPlayerConnected checks if a player has any active connections
func (cm *ConnectionManager) IsPlayerConnected(playerID string) bool {
	cm.mu.RLock()
	defer cm.mu.RUnlock()

	connections, exists := cm.playerConnections[playerID]
	return exists && len(connections) > 0
}

// GetPlayerConnections returns all active connections for a player
func (cm *ConnectionManager) GetPlayerConnections(playerID string) []*Client {
	cm.mu.RLock()
	defer cm.mu.RUnlock()

	connections := cm.playerConnections[playerID]
	// Return a copy to prevent external modification
	result := make([]*Client, len(connections))
	copy(result, connections)
	return result
}

// GetConnectedPlayers returns a list of all connected player IDs
func (cm *ConnectionManager) GetConnectedPlayers() []string {
	cm.mu.RLock()
	defer cm.mu.RUnlock()

	players := make([]string, 0, len(cm.playerConnections))
	for playerID := range cm.playerConnections {
		players = append(players, playerID)
	}
	return players
}

// GetDisconnectedPlayers returns players in reconnection window
func (cm *ConnectionManager) GetDisconnectedPlayers() []DisconnectedPlayer {
	cm.mu.RLock()
	defer cm.mu.RUnlock()

	players := make([]DisconnectedPlayer, 0, len(cm.disconnectedPlayers))
	for playerID, disconnectedAt := range cm.disconnectedPlayers {
		players = append(players, DisconnectedPlayer{
			PlayerID:         playerID,
			DisconnectedAt:   disconnectedAt,
			ReconnectTimeout: cm.reconnectionTimeout,
		})
	}
	return players
}

// IsInReconnectionWindow checks if a player is in the reconnection window
func (cm *ConnectionManager) IsInReconnectionWindow(playerID string) bool {
	cm.mu.RLock()
	defer cm.mu.RUnlock()

	disconnectedAt, exists := cm.disconnectedPlayers[playerID]
	if !exists {
		return false
	}

	return time.Since(disconnectedAt) < cm.reconnectionTimeout
}

// HandlePlayerDisconnection handles cleanup when a player disconnects
// This includes broadcasting to the room and potentially removing from room
func (cm *ConnectionManager) HandlePlayerDisconnection(ctx context.Context, client *Client) {
	isLastConnection := cm.UnregisterConnection(client)

	if !isLastConnection {
		// Player still has other active connections, no need for further action
		return
	}

	// Player is fully disconnected, start reconnection window
	roomCode := client.RoomID

	if roomCode == "" {
		// Player wasn't in a room, nothing more to do
		return
	}

	// Broadcast disconnection to room members
	cm.broadcastPlayerDisconnected(roomCode, client.PlayerID)

	// Start goroutine to handle cleanup after reconnection timeout
	go cm.handleReconnectionTimeout(ctx, client.PlayerID, roomCode)
}

// broadcastPlayerDisconnected broadcasts that a player has disconnected
func (cm *ConnectionManager) broadcastPlayerDisconnected(roomCode, playerID string) {
	message := map[string]interface{}{
		"event": "lobby:player_disconnected",
		"data": map[string]interface{}{
			"playerId": playerID,
			"message":  "Player disconnected, reconnection window active",
		},
	}

	cm.broadcastToRoomExcept(roomCode, playerID, message)
}

// handleReconnectionTimeout waits for reconnection timeout and removes player if not reconnected
func (cm *ConnectionManager) handleReconnectionTimeout(ctx context.Context, playerID, roomCode string) {
	// Wait for reconnection timeout
	timer := time.NewTimer(cm.reconnectionTimeout)
	defer timer.Stop()

	select {
	case <-timer.C:
		// Timeout expired, check if player reconnected
		if !cm.IsPlayerConnected(playerID) {
			// Player did not reconnect, remove from room
			cm.removePlayerFromRoom(ctx, playerID, roomCode)
		}
	case <-ctx.Done():
		// Context cancelled, exit
		return
	}
}

// removePlayerFromRoom removes a player from a room after disconnect timeout
func (cm *ConnectionManager) removePlayerFromRoom(ctx context.Context, playerID, roomCode string) {
	cm.mu.Lock()
	// Remove from disconnected players map
	delete(cm.disconnectedPlayers, playerID)
	cm.mu.Unlock()

	// Call room manager to remove player
	leaveReq := entity.LeaveRoomRequest{
		RoomCode: roomCode,
		PlayerID: playerID,
	}

	err := roomManager.LeaveRoom(ctx, leaveReq)
	if err != nil {
		slog.Error("Failed to remove disconnected player from room",
			"error", err,
			"playerId", playerID,
			"roomCode", roomCode)
		return
	}

	// Broadcast permanent removal to room
	cm.broadcastPlayerRemoved(roomCode, playerID)

	slog.Info("Removed disconnected player from room after timeout",
		"playerId", playerID,
		"roomCode", roomCode)
}

// broadcastPlayerRemoved broadcasts that a player has been removed after timeout
func (cm *ConnectionManager) broadcastPlayerRemoved(roomCode, playerID string) {
	// Get updated room state
	room, err := roomManager.GetRoom(roomCode)
	if err != nil {
		// Room might have been deleted
		return
	}

	message := map[string]interface{}{
		"event": "lobby:player_removed",
		"data": map[string]interface{}{
			"playerId": playerID,
			"reason":   "Reconnection timeout expired",
			"room":     room,
		},
	}

	cm.broadcastToRoomExcept(roomCode, playerID, message)
}

// broadcastToRoomExcept broadcasts a message to all clients in a room except specified player
func (cm *ConnectionManager) broadcastToRoomExcept(roomCode, exceptPlayerID string, data interface{}) {
	cm.hub.mu.RLock()
	defer cm.hub.mu.RUnlock()

	for client := range cm.hub.Clients {
		if client.RoomID == roomCode && client.PlayerID != exceptPlayerID {
			message, err := marshalJSON(data)
			if err != nil {
				continue
			}

			select {
			case client.Send <- message:
			default:
				slog.Warn("Failed to send message to client",
					"clientId", client.ID,
					"roomCode", roomCode)
			}
		}
	}
}

// cleanupExpiredDisconnections periodically cleans up expired disconnection records
func (cm *ConnectionManager) cleanupExpiredDisconnections() {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		cm.mu.Lock()
		now := time.Now()
		for playerID, disconnectedAt := range cm.disconnectedPlayers {
			// Clean up entries that are way past the timeout (2x timeout for safety)
			if now.Sub(disconnectedAt) > cm.reconnectionTimeout*2 {
				delete(cm.disconnectedPlayers, playerID)
				slog.Debug("Cleaned up expired disconnection record", "playerId", playerID)
			}
		}
		cm.mu.Unlock()
	}
}

// Helper function to marshal JSON
func marshalJSON(data interface{}) ([]byte, error) {
	// Implementation moved to separate function for easier testing
	return json.Marshal(data)
}
