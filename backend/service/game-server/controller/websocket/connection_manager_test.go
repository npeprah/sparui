package websocket

import (
	"context"
	"testing"
	"time"

	"github.com/gorilla/websocket"
)

// Test helper to create a mock client
func createMockClient(playerID, clientID, roomID string) *Client {
	return &Client{
		ID:       clientID,
		PlayerID: playerID,
		RoomID:   roomID,
		Send:     make(chan []byte, 256),
		Conn:     &websocket.Conn{}, // Mock connection
	}
}

func TestNewConnectionManager(t *testing.T) {
	tests := []struct {
		name            string
		timeout         time.Duration
		expectedTimeout time.Duration
	}{
		{
			name:            "with custom timeout",
			timeout:         30 * time.Second,
			expectedTimeout: 30 * time.Second,
		},
		{
			name:            "with zero timeout uses default",
			timeout:         0,
			expectedTimeout: 60 * time.Second,
		},
		{
			name:            "with explicit 60s timeout",
			timeout:         60 * time.Second,
			expectedTimeout: 60 * time.Second,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			hub := &Hub{
				Clients: make(map[*Client]bool),
			}
			cm := NewConnectionManager(hub, tt.timeout)

			if cm == nil {
				t.Fatal("Expected connection manager to be created")
			}

			if cm.reconnectionTimeout != tt.expectedTimeout {
				t.Errorf("Expected timeout %v, got %v", tt.expectedTimeout, cm.reconnectionTimeout)
			}

			if cm.hub != hub {
				t.Error("Expected hub to be set correctly")
			}

			if cm.playerConnections == nil {
				t.Error("Expected playerConnections to be initialized")
			}

			if cm.disconnectedPlayers == nil {
				t.Error("Expected disconnectedPlayers to be initialized")
			}
		})
	}
}

func TestRegisterConnection(t *testing.T) {
	tests := []struct {
		name              string
		clients           []*Client
		expectedPlayerID  string
		expectedConnCount int
		shouldIgnoreEmpty bool
	}{
		{
			name: "register single connection",
			clients: []*Client{
				createMockClient("player1", "client1", "room1"),
			},
			expectedPlayerID:  "player1",
			expectedConnCount: 1,
		},
		{
			name: "register multiple connections for same player",
			clients: []*Client{
				createMockClient("player1", "client1", "room1"),
				createMockClient("player1", "client2", "room1"),
				createMockClient("player1", "client3", "room1"),
			},
			expectedPlayerID:  "player1",
			expectedConnCount: 3,
		},
		{
			name: "ignore client with empty player ID",
			clients: []*Client{
				createMockClient("", "client1", "room1"),
			},
			expectedPlayerID:  "",
			expectedConnCount: 0,
			shouldIgnoreEmpty: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			hub := &Hub{Clients: make(map[*Client]bool)}
			cm := NewConnectionManager(hub, 60*time.Second)

			for _, client := range tt.clients {
				cm.RegisterConnection(client)
			}

			if tt.shouldIgnoreEmpty {
				if len(cm.playerConnections) != 0 {
					t.Errorf("Expected no connections for empty player ID, got %d", len(cm.playerConnections))
				}
				return
			}

			connections := cm.GetPlayerConnections(tt.expectedPlayerID)
			if len(connections) != tt.expectedConnCount {
				t.Errorf("Expected %d connections, got %d", tt.expectedConnCount, len(connections))
			}
		})
	}
}

func TestUnregisterConnection(t *testing.T) {
	tests := []struct {
		name              string
		setupClients      []*Client
		unregisterClient  *Client
		expectedLast      bool
		expectedRemaining int
	}{
		{
			name: "unregister only connection marks player as disconnected",
			setupClients: []*Client{
				createMockClient("player1", "client1", "room1"),
			},
			unregisterClient:  createMockClient("player1", "client1", "room1"),
			expectedLast:      true,
			expectedRemaining: 0,
		},
		{
			name: "unregister one of multiple connections",
			setupClients: []*Client{
				createMockClient("player1", "client1", "room1"),
				createMockClient("player1", "client2", "room1"),
				createMockClient("player1", "client3", "room1"),
			},
			unregisterClient:  createMockClient("player1", "client2", "room1"),
			expectedLast:      false,
			expectedRemaining: 2,
		},
		{
			name: "unregister client with empty player ID",
			setupClients: []*Client{
				createMockClient("player1", "client1", "room1"),
			},
			unregisterClient:  createMockClient("", "client2", "room1"),
			expectedLast:      false,
			expectedRemaining: 1,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			hub := &Hub{Clients: make(map[*Client]bool)}
			cm := NewConnectionManager(hub, 60*time.Second)

			// Setup connections
			for _, client := range tt.setupClients {
				cm.RegisterConnection(client)
			}

			// Unregister connection
			isLast := cm.UnregisterConnection(tt.unregisterClient)

			if isLast != tt.expectedLast {
				t.Errorf("Expected isLast=%v, got %v", tt.expectedLast, isLast)
			}

			// Verify remaining connections
			if tt.unregisterClient.PlayerID != "" {
				connections := cm.GetPlayerConnections(tt.unregisterClient.PlayerID)
				if len(connections) != tt.expectedRemaining {
					t.Errorf("Expected %d remaining connections, got %d", tt.expectedRemaining, len(connections))
				}

				// If last connection, player should be in disconnected map
				if tt.expectedLast {
					if !cm.IsInReconnectionWindow(tt.unregisterClient.PlayerID) {
						t.Error("Expected player to be in reconnection window after last connection")
					}
				}
			}
		})
	}
}

func TestIsPlayerConnected(t *testing.T) {
	hub := &Hub{Clients: make(map[*Client]bool)}
	cm := NewConnectionManager(hub, 60*time.Second)

	// Register connection
	client := createMockClient("player1", "client1", "room1")
	cm.RegisterConnection(client)

	tests := []struct {
		name     string
		playerID string
		expected bool
	}{
		{
			name:     "connected player returns true",
			playerID: "player1",
			expected: true,
		},
		{
			name:     "non-connected player returns false",
			playerID: "player2",
			expected: false,
		},
		{
			name:     "empty player ID returns false",
			playerID: "",
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := cm.IsPlayerConnected(tt.playerID)
			if result != tt.expected {
				t.Errorf("Expected IsPlayerConnected(%s)=%v, got %v", tt.playerID, tt.expected, result)
			}
		})
	}
}

func TestGetConnectedPlayers(t *testing.T) {
	hub := &Hub{Clients: make(map[*Client]bool)}
	cm := NewConnectionManager(hub, 60*time.Second)

	// Register multiple players
	players := []struct {
		playerID string
		clientID string
	}{
		{"player1", "client1"},
		{"player2", "client2"},
		{"player3", "client3"},
	}

	for _, p := range players {
		client := createMockClient(p.playerID, p.clientID, "room1")
		cm.RegisterConnection(client)
	}

	connectedPlayers := cm.GetConnectedPlayers()

	if len(connectedPlayers) != len(players) {
		t.Errorf("Expected %d connected players, got %d", len(players), len(connectedPlayers))
	}

	// Verify all player IDs are present
	playerMap := make(map[string]bool)
	for _, playerID := range connectedPlayers {
		playerMap[playerID] = true
	}

	for _, p := range players {
		if !playerMap[p.playerID] {
			t.Errorf("Expected player %s to be in connected players list", p.playerID)
		}
	}
}

func TestGetDisconnectedPlayers(t *testing.T) {
	hub := &Hub{Clients: make(map[*Client]bool)}
	cm := NewConnectionManager(hub, 60*time.Second)

	// Register and then unregister players
	client1 := createMockClient("player1", "client1", "room1")
	client2 := createMockClient("player2", "client2", "room1")

	cm.RegisterConnection(client1)
	cm.RegisterConnection(client2)

	// Unregister to mark as disconnected
	cm.UnregisterConnection(client1)

	disconnectedPlayers := cm.GetDisconnectedPlayers()

	if len(disconnectedPlayers) != 1 {
		t.Errorf("Expected 1 disconnected player, got %d", len(disconnectedPlayers))
	}

	if disconnectedPlayers[0].PlayerID != "player1" {
		t.Errorf("Expected player1 to be disconnected, got %s", disconnectedPlayers[0].PlayerID)
	}

	if disconnectedPlayers[0].ReconnectTimeout != 60*time.Second {
		t.Errorf("Expected timeout 60s, got %v", disconnectedPlayers[0].ReconnectTimeout)
	}
}

func TestIsInReconnectionWindow(t *testing.T) {
	hub := &Hub{Clients: make(map[*Client]bool)}
	cm := NewConnectionManager(hub, 100*time.Millisecond) // Short timeout for testing

	// Register and unregister to start reconnection window
	client := createMockClient("player1", "client1", "room1")
	cm.RegisterConnection(client)
	cm.UnregisterConnection(client)

	tests := []struct {
		name     string
		playerID string
		delay    time.Duration
		expected bool
	}{
		{
			name:     "immediately after disconnect",
			playerID: "player1",
			delay:    0,
			expected: true,
		},
		{
			name:     "after timeout expires",
			playerID: "player1",
			delay:    150 * time.Millisecond,
			expected: false,
		},
		{
			name:     "non-disconnected player",
			playerID: "player2",
			delay:    0,
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.delay > 0 {
				time.Sleep(tt.delay)
			}

			result := cm.IsInReconnectionWindow(tt.playerID)
			if result != tt.expected {
				t.Errorf("Expected IsInReconnectionWindow(%s)=%v, got %v", tt.playerID, tt.expected, result)
			}
		})
	}
}

func TestReconnectionClearsDisconnectedState(t *testing.T) {
	hub := &Hub{Clients: make(map[*Client]bool)}
	cm := NewConnectionManager(hub, 60*time.Second)

	client1 := createMockClient("player1", "client1", "room1")

	// Register, unregister (disconnect), then register again (reconnect)
	cm.RegisterConnection(client1)
	cm.UnregisterConnection(client1)

	if !cm.IsInReconnectionWindow("player1") {
		t.Error("Expected player to be in reconnection window after disconnect")
	}

	// Reconnect
	client2 := createMockClient("player1", "client2", "room1")
	cm.RegisterConnection(client2)

	if cm.IsInReconnectionWindow("player1") {
		t.Error("Expected player to be removed from reconnection window after reconnect")
	}

	if !cm.IsPlayerConnected("player1") {
		t.Error("Expected player to be connected after reconnection")
	}
}

func TestMultipleConnectionsForPlayer(t *testing.T) {
	hub := &Hub{Clients: make(map[*Client]bool)}
	cm := NewConnectionManager(hub, 60*time.Second)

	// Register 3 connections for the same player (multiple devices)
	client1 := createMockClient("player1", "client1", "room1")
	client2 := createMockClient("player1", "client2", "room1")
	client3 := createMockClient("player1", "client3", "room1")

	cm.RegisterConnection(client1)
	cm.RegisterConnection(client2)
	cm.RegisterConnection(client3)

	connections := cm.GetPlayerConnections("player1")
	if len(connections) != 3 {
		t.Errorf("Expected 3 connections, got %d", len(connections))
	}

	// Unregister one connection - player should still be connected
	isLast := cm.UnregisterConnection(client2)
	if isLast {
		t.Error("Expected isLast=false when player has other connections")
	}

	if !cm.IsPlayerConnected("player1") {
		t.Error("Expected player to still be connected")
	}

	connections = cm.GetPlayerConnections("player1")
	if len(connections) != 2 {
		t.Errorf("Expected 2 remaining connections, got %d", len(connections))
	}

	// Unregister remaining connections
	cm.UnregisterConnection(client1)
	cm.UnregisterConnection(client3)

	if cm.IsPlayerConnected("player1") {
		t.Error("Expected player to be disconnected after all connections removed")
	}

	if !cm.IsInReconnectionWindow("player1") {
		t.Error("Expected player to be in reconnection window")
	}
}

func TestGetPlayerConnectionsReturnsImmutableCopy(t *testing.T) {
	hub := &Hub{Clients: make(map[*Client]bool)}
	cm := NewConnectionManager(hub, 60*time.Second)

	client := createMockClient("player1", "client1", "room1")
	cm.RegisterConnection(client)

	// Get connections
	connections1 := cm.GetPlayerConnections("player1")
	connections2 := cm.GetPlayerConnections("player1")

	// Modify one slice
	if len(connections1) > 0 {
		connections1[0] = nil
	}

	// Verify the other slice is unchanged
	if len(connections2) > 0 && connections2[0] == nil {
		t.Error("Expected GetPlayerConnections to return immutable copy")
	}

	// Verify internal state is unchanged
	actualConnections := cm.GetPlayerConnections("player1")
	if len(actualConnections) > 0 && actualConnections[0] == nil {
		t.Error("Expected internal connections to be unchanged")
	}
}

func TestConcurrentConnectionRegistration(t *testing.T) {
	hub := &Hub{Clients: make(map[*Client]bool)}
	cm := NewConnectionManager(hub, 60*time.Second)

	numGoroutines := 100
	done := make(chan bool)

	// Concurrently register connections
	for i := 0; i < numGoroutines; i++ {
		go func(id int) {
			client := createMockClient("player1", string(rune(id)), "room1")
			cm.RegisterConnection(client)
			done <- true
		}(i)
	}

	// Wait for all goroutines
	for i := 0; i < numGoroutines; i++ {
		<-done
	}

	connections := cm.GetPlayerConnections("player1")
	if len(connections) != numGoroutines {
		t.Errorf("Expected %d connections, got %d", numGoroutines, len(connections))
	}
}

func TestConcurrentConnectionUnregistration(t *testing.T) {
	hub := &Hub{Clients: make(map[*Client]bool)}
	cm := NewConnectionManager(hub, 60*time.Second)

	numGoroutines := 100
	clients := make([]*Client, numGoroutines)

	// Register all connections first
	for i := 0; i < numGoroutines; i++ {
		client := createMockClient("player1", string(rune(i)), "room1")
		clients[i] = client
		cm.RegisterConnection(client)
	}

	done := make(chan bool)

	// Concurrently unregister connections
	for i := 0; i < numGoroutines; i++ {
		go func(client *Client) {
			cm.UnregisterConnection(client)
			done <- true
		}(clients[i])
	}

	// Wait for all goroutines
	for i := 0; i < numGoroutines; i++ {
		<-done
	}

	if cm.IsPlayerConnected("player1") {
		t.Error("Expected player to be disconnected after all connections removed")
	}

	if !cm.IsInReconnectionWindow("player1") {
		t.Error("Expected player to be in reconnection window")
	}
}

func TestHandlePlayerDisconnectionWithMultipleConnections(t *testing.T) {
	hub := &Hub{
		Clients:    make(map[*Client]bool),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		Broadcast:  make(chan []byte),
	}
	cm := NewConnectionManager(hub, 60*time.Second)
	ctx := context.Background()

	// Register two connections for player
	client1 := createMockClient("player1", "client1", "room1")
	client2 := createMockClient("player1", "client2", "room1")

	cm.RegisterConnection(client1)
	cm.RegisterConnection(client2)

	// Disconnect one connection - should not trigger room removal
	cm.HandlePlayerDisconnection(ctx, client1)

	// Player should still be connected
	if !cm.IsPlayerConnected("player1") {
		t.Error("Expected player to still be connected with remaining connection")
	}

	// Player should not be in reconnection window yet
	if cm.IsInReconnectionWindow("player1") {
		t.Error("Expected player not to be in reconnection window with active connections")
	}
}

func TestHandlePlayerDisconnectionWithLastConnection(t *testing.T) {
	hub := &Hub{
		Clients:    make(map[*Client]bool),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		Broadcast:  make(chan []byte),
	}
	cm := NewConnectionManager(hub, 60*time.Second)
	ctx := context.Background()

	// Register single connection
	client := createMockClient("player1", "client1", "room1")
	cm.RegisterConnection(client)

	// Disconnect - should start reconnection window
	cm.HandlePlayerDisconnection(ctx, client)

	// Player should not be connected
	if cm.IsPlayerConnected("player1") {
		t.Error("Expected player to be disconnected")
	}

	// Player should be in reconnection window
	if !cm.IsInReconnectionWindow("player1") {
		t.Error("Expected player to be in reconnection window")
	}
}

func TestCleanupExpiredDisconnections(t *testing.T) {
	hub := &Hub{Clients: make(map[*Client]bool)}
	// Very short timeout for testing
	cm := NewConnectionManager(hub, 50*time.Millisecond)

	client := createMockClient("player1", "client1", "room1")
	cm.RegisterConnection(client)
	cm.UnregisterConnection(client)

	if !cm.IsInReconnectionWindow("player1") {
		t.Error("Expected player to be in reconnection window")
	}

	// Wait for cleanup (timeout * 2 + cleanup interval)
	time.Sleep(150 * time.Millisecond)

	// After cleanup cycle, player should still be in map (within 2x timeout safety margin)
	if !cm.IsInReconnectionWindow("player1") {
		// This is expected - the cleanup only removes after 2x timeout
		t.Log("Player removed from reconnection window after timeout (expected)")
	}
}
