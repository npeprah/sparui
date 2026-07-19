package websocket

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	"github.com/npeprah/sparui/backend/service/game-server/entity"
)

// readClientEvent reads a single JSON envelope from a client's Send channel,
// failing the test if none arrives promptly.
func readClientEvent(t *testing.T, client *Client) (string, map[string]interface{}) {
	t.Helper()
	select {
	case msg := <-client.Send:
		var env struct {
			Event string                 `json:"event"`
			Data  map[string]interface{} `json:"data"`
		}
		if err := json.Unmarshal(msg, &env); err != nil {
			t.Fatalf("failed to unmarshal event: %v", err)
		}
		return env.Event, env.Data
	case <-time.After(time.Second):
		t.Fatal("timed out waiting for client event")
		return "", nil
	}
}

// registerClient wires a mock client into the global hub and returns a cleanup.
func registerClient(t *testing.T, client *Client) func() {
	t.Helper()
	hub.mu.Lock()
	hub.Clients[client] = true
	hub.mu.Unlock()
	return func() {
		hub.mu.Lock()
		delete(hub.Clients, client)
		hub.mu.Unlock()
	}
}

// TestDerivePlayerID verifies the auth handshake yields stable, unique ids.
func TestDerivePlayerID(t *testing.T) {
	// Stable: same token -> same id (so reconnection maps back to one player).
	a := derivePlayerID("some-token-abc")
	b := derivePlayerID("some-token-abc")
	if a != b {
		t.Errorf("expected stable id for identical tokens, got %q and %q", a, b)
	}

	// Unique: two unauthenticated players whose tokens share the first 8 chars
	// must still resolve to distinct ids (the old token[:8] scheme collided).
	t1 := "sharedpx-1111111111111"
	t2 := "sharedpx-2222222222222"
	if derivePlayerID(t1) == derivePlayerID(t2) {
		t.Errorf("expected distinct ids for tokens sharing a prefix, both gave %q", derivePlayerID(t1))
	}

	if got := derivePlayerID("x"); len(got) == 0 || got[:7] != "player-" {
		t.Errorf("expected id to be prefixed with 'player-', got %q", got)
	}
}

// TestHandleUpdateSettings covers the previously-unhandled lobby:update_settings
// event: partial merge, host-only enforcement, and the room:settings_updated
// broadcast shape.
func TestHandleUpdateSettings(t *testing.T) {
	ctx := context.Background()

	tests := []struct {
		name             string
		asHost           bool
		payload          map[string]interface{}
		expectEvent      string
		validate         func(t *testing.T, data map[string]interface{})
		expectNoRoomLink bool // client not in a room
	}{
		{
			name:        "host updates pointsToWin - other fields preserved",
			asHost:      true,
			payload:     map[string]interface{}{"settings": map[string]interface{}{"pointsToWin": 21}},
			expectEvent: "room:settings_updated",
			validate: func(t *testing.T, data map[string]interface{}) {
				settings, ok := data["settings"].(map[string]interface{})
				if !ok {
					t.Fatalf("expected settings object, got %T", data["settings"])
				}
				if settings["pointsToWin"].(float64) != 21 {
					t.Errorf("expected pointsToWin 21, got %v", settings["pointsToWin"])
				}
				// surfaceTheme was set at create time and must survive a partial update
				if settings["surfaceTheme"].(string) != "neon-arcade" {
					t.Errorf("expected surfaceTheme preserved as neon-arcade, got %v", settings["surfaceTheme"])
				}
			},
		},
		{
			name:        "non-host is rejected",
			asHost:      false,
			payload:     map[string]interface{}{"settings": map[string]interface{}{"pointsToWin": 15}},
			expectEvent: "lobby:error",
			validate: func(t *testing.T, data map[string]interface{}) {
				if data["error"] == nil {
					t.Error("expected an error message")
				}
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create a room with the host and known initial settings.
			room, err := roomManager.CreateRoom(ctx, entity.CreateRoomRequest{
				HostID: "host-player",
				Settings: entity.RoomSettings{
					PointsToWin:  10,
					SurfaceTheme: "neon-arcade",
				},
			})
			if err != nil {
				t.Fatalf("failed to create room: %v", err)
			}

			actingPlayer := "host-player"
			if !tt.asHost {
				actingPlayer = "other-player"
				// Join a second, non-host player so they're a legitimate member.
				_, err := roomManager.JoinRoom(ctx, entity.JoinRoomRequest{
					RoomCode: room.RoomCode,
					PlayerID: actingPlayer,
				}, entity.User{ID: actingPlayer, Username: "Other"})
				if err != nil {
					t.Fatalf("failed to join room: %v", err)
				}
			}

			client := &Client{
				ID:       "client-" + actingPlayer,
				PlayerID: actingPlayer,
				RoomID:   room.RoomCode,
				Send:     make(chan []byte, 10),
				Hub:      hub,
			}
			cleanup := registerClient(t, client)
			defer cleanup()

			data, err := json.Marshal(tt.payload)
			if err != nil {
				t.Fatalf("failed to marshal payload: %v", err)
			}

			client.handleUpdateSettings(json.RawMessage(data))

			event, payload := readClientEvent(t, client)
			if event != tt.expectEvent {
				t.Fatalf("expected event %q, got %q", tt.expectEvent, event)
			}
			if tt.validate != nil {
				tt.validate(t, payload)
			}
		})
	}
}

// TestHandleLeaveLobby_PlayerLeftShape verifies the aligned room:player_left
// event: it carries the updated player list and the (possibly migrated) host id
// to the remaining members.
func TestHandleLeaveLobby_PlayerLeftShape(t *testing.T) {
	ctx := context.Background()

	// Room with a host and one more member.
	room, err := roomManager.CreateRoom(ctx, entity.CreateRoomRequest{
		HostID:   "leaver-host",
		Settings: entity.RoomSettings{PointsToWin: 10, SurfaceTheme: "poker-table"},
	})
	if err != nil {
		t.Fatalf("failed to create room: %v", err)
	}
	if _, err := roomManager.JoinRoom(ctx, entity.JoinRoomRequest{
		RoomCode: room.RoomCode,
		PlayerID: "stayer",
	}, entity.User{ID: "stayer", Username: "Stayer"}); err != nil {
		t.Fatalf("failed to join room: %v", err)
	}

	// The host leaves; the remaining member should be broadcast the new state.
	hostClient := &Client{ID: "c-host", PlayerID: "leaver-host", RoomID: room.RoomCode, Send: make(chan []byte, 10), Hub: hub}
	stayClient := &Client{ID: "c-stay", PlayerID: "stayer", RoomID: room.RoomCode, Send: make(chan []byte, 10), Hub: hub}
	defer registerClient(t, hostClient)()
	defer registerClient(t, stayClient)()

	hostClient.handleLeaveLobby(json.RawMessage(`{}`))

	// The remaining client receives room:player_left (broadcast excludes sender).
	event, data := readClientEvent(t, stayClient)
	if event != "room:player_left" {
		t.Fatalf("expected room:player_left, got %q", event)
	}
	if data["playerId"].(string) != "leaver-host" {
		t.Errorf("expected playerId leaver-host, got %v", data["playerId"])
	}
	players, ok := data["players"].([]interface{})
	if !ok {
		t.Fatalf("expected players array, got %T", data["players"])
	}
	if len(players) != 1 {
		t.Errorf("expected 1 remaining player, got %d", len(players))
	}
	// Host migrated to the remaining player.
	if data["newHostId"].(string) != "stayer" {
		t.Errorf("expected newHostId to migrate to stayer, got %v", data["newHostId"])
	}
}

// TestHandleCreateLobby_NestedSettingsApply verifies the fixed lobby:create
// payload shape: nested settings decode (not to zero values) and are echoed on
// room:created, including the honored max-players choice.
func TestHandleCreateLobby_NestedSettingsApply(t *testing.T) {
	payload := CreateLobbyPayload{
		Settings: entity.RoomSettings{
			PointsToWin:  15,
			SurfaceTheme: "beach-sunset",
			MaxPlayers:   3,
		},
	}
	data, err := json.Marshal(payload)
	if err != nil {
		t.Fatalf("failed to marshal payload: %v", err)
	}

	client := &Client{ID: "c-create", PlayerID: "creator", Send: make(chan []byte, 10), Hub: hub}
	defer registerClient(t, client)()

	client.handleCreateLobby(json.RawMessage(data))

	event, respData := readClientEvent(t, client)
	if event != "room:created" {
		t.Fatalf("expected room:created, got %q", event)
	}
	settings, ok := respData["settings"].(map[string]interface{})
	if !ok {
		t.Fatalf("expected settings object, got %T", respData["settings"])
	}
	if settings["pointsToWin"].(float64) != 15 {
		t.Errorf("expected pointsToWin 15 (not decoded to zero), got %v", settings["pointsToWin"])
	}
	if settings["surfaceTheme"].(string) != "beach-sunset" {
		t.Errorf("expected surfaceTheme beach-sunset, got %v", settings["surfaceTheme"])
	}
	if respData["maxPlayers"].(float64) != 3 {
		t.Errorf("expected room maxPlayers to honor setting (3), got %v", respData["maxPlayers"])
	}
}
