package room

import (
	"context"
	"testing"
	"time"

	"github.com/npeprah/sparui/backend/service/game-server/entity"
)

func TestNewManager(t *testing.T) {
	manager := NewManager()
	if manager == nil {
		t.Fatal("NewManager() returned nil")
	}
	if manager.rooms == nil {
		t.Error("rooms map not initialized")
	}
}

func TestCreateRoom(t *testing.T) {
	tests := []struct {
		name      string
		req       entity.CreateRoomRequest
		wantErr   bool
		checkFunc func(*testing.T, *entity.Room)
	}{
		{
			name: "create room with default settings",
			req: entity.CreateRoomRequest{
				HostID: "user-123",
			},
			wantErr: false,
			checkFunc: func(t *testing.T, room *entity.Room) {
				if room.HostID != "user-123" {
					t.Errorf("expected hostId user-123, got %s", room.HostID)
				}
				if room.Status != entity.StatusWaiting {
					t.Errorf("expected status waiting, got %s", room.Status)
				}
				if room.MaxPlayers != 4 {
					t.Errorf("expected maxPlayers 4, got %d", room.MaxPlayers)
				}
				if len(room.RoomCode) != 6 {
					t.Errorf("expected room code length 6, got %d", len(room.RoomCode))
				}
				if room.Settings.PointsToWin != 10 {
					t.Errorf("expected pointsToWin 10, got %d", room.Settings.PointsToWin)
				}
				if room.Settings.SurfaceTheme != "poker-table" {
					t.Errorf("expected surfaceTheme poker-table, got %s", room.Settings.SurfaceTheme)
				}
				if len(room.Players) != 1 {
					t.Errorf("expected 1 player (host), got %d", len(room.Players))
				}
				if !room.Players[0].IsHost {
					t.Error("expected first player to be host")
				}
			},
		},
		{
			name: "create room with custom settings",
			req: entity.CreateRoomRequest{
				HostID: "user-456",
				Settings: entity.RoomSettings{
					PointsToWin:  15,
					SurfaceTheme: "neon",
				},
			},
			wantErr: false,
			checkFunc: func(t *testing.T, room *entity.Room) {
				if room.Settings.PointsToWin != 15 {
					t.Errorf("expected pointsToWin 15, got %d", room.Settings.PointsToWin)
				}
				if room.Settings.SurfaceTheme != "neon" {
					t.Errorf("expected surfaceTheme neon, got %s", room.Settings.SurfaceTheme)
				}
			},
		},
		{
			name: "create room with empty hostId",
			req: entity.CreateRoomRequest{
				HostID: "",
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			manager := NewManager()
			ctx := context.Background()

			room, err := manager.CreateRoom(ctx, tt.req)

			if tt.wantErr {
				if err == nil {
					t.Error("expected error, got nil")
				}
				return
			}

			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}

			if room == nil {
				t.Fatal("expected room, got nil")
			}

			if tt.checkFunc != nil {
				tt.checkFunc(t, room)
			}
		})
	}
}

func TestJoinRoom(t *testing.T) {
	tests := []struct {
		name        string
		setupFunc   func(*Manager) string
		req         entity.JoinRoomRequest
		playerInfo  entity.User
		wantErr     bool
		errContains string
		checkFunc   func(*testing.T, *entity.Room)
	}{
		{
			name: "join room successfully",
			setupFunc: func(m *Manager) string {
				room, _ := m.CreateRoom(context.Background(), entity.CreateRoomRequest{
					HostID: "host-123",
				})
				return room.RoomCode
			},
			req: entity.JoinRoomRequest{
				PlayerID: "player-456",
			},
			playerInfo: entity.User{
				ID:       "player-456",
				Username: "player456",
				Avatar:   "avatar2.png",
			},
			wantErr: false,
			checkFunc: func(t *testing.T, room *entity.Room) {
				if len(room.Players) != 2 {
					t.Errorf("expected 2 players, got %d", len(room.Players))
				}
				if room.Players[1].ID != "player-456" {
					t.Errorf("expected player-456, got %s", room.Players[1].ID)
				}
				if room.Players[1].IsHost {
					t.Error("expected new player not to be host")
				}
			},
		},
		{
			name: "join room that doesn't exist",
			setupFunc: func(m *Manager) string {
				return "INVALID"
			},
			req: entity.JoinRoomRequest{
				PlayerID: "player-456",
			},
			playerInfo: entity.User{
				ID:       "player-456",
				Username: "player456",
				Avatar:   "avatar2.png",
			},
			wantErr:     true,
			errContains: "not found",
		},
		{
			name: "join full room",
			setupFunc: func(m *Manager) string {
				room, _ := m.CreateRoom(context.Background(), entity.CreateRoomRequest{
					HostID: "host-123",
				})
				// Fill the room to capacity
				for i := 0; i < 3; i++ {
					room.Players = append(room.Players, entity.Player{
						ID:       "player-" + string(rune('1'+i)),
						Username: "player" + string(rune('1'+i)),
						Avatar:   "avatar.png",
						IsHost:   false,
						IsReady:  false,
						JoinedAt: time.Now(),
					})
				}
				return room.RoomCode
			},
			req: entity.JoinRoomRequest{
				PlayerID: "player-new",
			},
			playerInfo: entity.User{
				ID:       "player-new",
				Username: "playernew",
				Avatar:   "avatar.png",
			},
			wantErr:     true,
			errContains: "full",
		},
		{
			name: "join room already in progress",
			setupFunc: func(m *Manager) string {
				room, _ := m.CreateRoom(context.Background(), entity.CreateRoomRequest{
					HostID: "host-123",
				})
				room.Status = entity.StatusInProgress
				return room.RoomCode
			},
			req: entity.JoinRoomRequest{
				PlayerID: "player-456",
			},
			playerInfo: entity.User{
				ID:       "player-456",
				Username: "player456",
				Avatar:   "avatar2.png",
			},
			wantErr:     true,
			errContains: "cannot join",
		},
		{
			name: "join room already joined",
			setupFunc: func(m *Manager) string {
				room, _ := m.CreateRoom(context.Background(), entity.CreateRoomRequest{
					HostID: "host-123",
				})
				room.Players = append(room.Players, entity.Player{
					ID:       "player-456",
					Username: "player456",
					Avatar:   "avatar.png",
					IsHost:   false,
					IsReady:  false,
					JoinedAt: time.Now(),
				})
				return room.RoomCode
			},
			req: entity.JoinRoomRequest{
				PlayerID: "player-456",
			},
			playerInfo: entity.User{
				ID:       "player-456",
				Username: "player456",
				Avatar:   "avatar2.png",
			},
			wantErr:     true,
			errContains: "already in room",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			manager := NewManager()
			ctx := context.Background()

			roomCode := tt.setupFunc(manager)
			tt.req.RoomCode = roomCode

			room, err := manager.JoinRoom(ctx, tt.req, tt.playerInfo)

			if tt.wantErr {
				if err == nil {
					t.Error("expected error, got nil")
					return
				}
				if tt.errContains != "" && !contains(err.Error(), tt.errContains) {
					t.Errorf("expected error containing %q, got %q", tt.errContains, err.Error())
				}
				return
			}

			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}

			if room == nil {
				t.Fatal("expected room, got nil")
			}

			if tt.checkFunc != nil {
				tt.checkFunc(t, room)
			}
		})
	}
}

func TestLeaveRoom(t *testing.T) {
	tests := []struct {
		name        string
		setupFunc   func(*Manager) (string, string)
		req         entity.LeaveRoomRequest
		wantErr     bool
		errContains string
		checkFunc   func(*testing.T, *Manager, string)
	}{
		{
			name: "leave room successfully as non-host",
			setupFunc: func(m *Manager) (string, string) {
				room, _ := m.CreateRoom(context.Background(), entity.CreateRoomRequest{
					HostID: "host-123",
				})
				room.Players = append(room.Players, entity.Player{
					ID:       "player-456",
					Username: "player456",
					Avatar:   "avatar.png",
					IsHost:   false,
					IsReady:  false,
					JoinedAt: time.Now(),
				})
				return room.RoomCode, "player-456"
			},
			wantErr: false,
			checkFunc: func(t *testing.T, m *Manager, roomCode string) {
				room, _ := m.GetRoom(roomCode)
				if room == nil {
					t.Error("room should still exist")
					return
				}
				if len(room.Players) != 1 {
					t.Errorf("expected 1 player remaining, got %d", len(room.Players))
				}
			},
		},
		{
			name: "leave room as host with other players - host migration",
			setupFunc: func(m *Manager) (string, string) {
				room, _ := m.CreateRoom(context.Background(), entity.CreateRoomRequest{
					HostID: "host-123",
				})
				room.Players = append(room.Players, entity.Player{
					ID:       "player-456",
					Username: "player456",
					Avatar:   "avatar.png",
					IsHost:   false,
					IsReady:  false,
					JoinedAt: time.Now(),
				})
				return room.RoomCode, "host-123"
			},
			wantErr: false,
			checkFunc: func(t *testing.T, m *Manager, roomCode string) {
				room, _ := m.GetRoom(roomCode)
				if room == nil {
					t.Error("room should still exist")
					return
				}
				if room.HostID != "player-456" {
					t.Errorf("expected new host player-456, got %s", room.HostID)
				}
				if len(room.Players) != 1 {
					t.Errorf("expected 1 player remaining, got %d", len(room.Players))
				}
				if !room.Players[0].IsHost {
					t.Error("new host should have IsHost flag set")
				}
			},
		},
		{
			name: "leave room as last player - room deleted",
			setupFunc: func(m *Manager) (string, string) {
				room, _ := m.CreateRoom(context.Background(), entity.CreateRoomRequest{
					HostID: "host-123",
				})
				return room.RoomCode, "host-123"
			},
			wantErr: false,
			checkFunc: func(t *testing.T, m *Manager, roomCode string) {
				room, _ := m.GetRoom(roomCode)
				if room != nil {
					t.Error("room should be deleted when last player leaves")
				}
			},
		},
		{
			name: "leave room that doesn't exist",
			setupFunc: func(m *Manager) (string, string) {
				return "INVALID", "player-123"
			},
			wantErr:     true,
			errContains: "not found",
		},
		{
			name: "leave room not in",
			setupFunc: func(m *Manager) (string, string) {
				room, _ := m.CreateRoom(context.Background(), entity.CreateRoomRequest{
					HostID: "host-123",
				})
				return room.RoomCode, "player-999"
			},
			wantErr:     true,
			errContains: "not in room",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			manager := NewManager()
			ctx := context.Background()

			roomCode, playerID := tt.setupFunc(manager)
			tt.req = entity.LeaveRoomRequest{
				RoomCode: roomCode,
				PlayerID: playerID,
			}

			err := manager.LeaveRoom(ctx, tt.req)

			if tt.wantErr {
				if err == nil {
					t.Error("expected error, got nil")
					return
				}
				if tt.errContains != "" && !contains(err.Error(), tt.errContains) {
					t.Errorf("expected error containing %q, got %q", tt.errContains, err.Error())
				}
				return
			}

			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}

			if tt.checkFunc != nil {
				tt.checkFunc(t, manager, roomCode)
			}
		})
	}
}

func TestGetRoom(t *testing.T) {
	manager := NewManager()
	ctx := context.Background()

	// Create a room
	room, err := manager.CreateRoom(ctx, entity.CreateRoomRequest{
		HostID: "host-123",
	})
	if err != nil {
		t.Fatalf("failed to create room: %v", err)
	}

	tests := []struct {
		name     string
		roomCode string
		wantRoom bool
	}{
		{
			name:     "get existing room",
			roomCode: room.RoomCode,
			wantRoom: true,
		},
		{
			name:     "get non-existent room",
			roomCode: "INVALID",
			wantRoom: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotRoom, err := manager.GetRoom(tt.roomCode)

			if tt.wantRoom {
				if err != nil {
					t.Errorf("expected no error, got %v", err)
				}
				if gotRoom == nil {
					t.Error("expected room, got nil")
				}
				if gotRoom.RoomCode != tt.roomCode {
					t.Errorf("expected room code %s, got %s", tt.roomCode, gotRoom.RoomCode)
				}
			} else {
				if err == nil {
					t.Error("expected error, got nil")
				}
				if gotRoom != nil {
					t.Error("expected nil room, got room")
				}
			}
		})
	}
}

func TestListRooms(t *testing.T) {
	manager := NewManager()
	ctx := context.Background()

	// Initially empty
	rooms := manager.ListRooms()
	if len(rooms) != 0 {
		t.Errorf("expected 0 rooms initially, got %d", len(rooms))
	}

	// Create multiple rooms
	for i := 0; i < 3; i++ {
		_, err := manager.CreateRoom(ctx, entity.CreateRoomRequest{
			HostID: "host-" + string(rune('1'+i)),
		})
		if err != nil {
			t.Fatalf("failed to create room: %v", err)
		}
	}

	rooms = manager.ListRooms()
	if len(rooms) != 3 {
		t.Errorf("expected 3 rooms, got %d", len(rooms))
	}
}

func TestRoomCodeUniqueness(t *testing.T) {
	manager := NewManager()
	ctx := context.Background()

	codes := make(map[string]bool)
	for i := 0; i < 50; i++ {
		room, err := manager.CreateRoom(ctx, entity.CreateRoomRequest{
			HostID: "host-" + string(rune('1'+i)),
		})
		if err != nil {
			t.Fatalf("failed to create room: %v", err)
		}

		if codes[room.RoomCode] {
			t.Errorf("duplicate room code generated: %s", room.RoomCode)
		}
		codes[room.RoomCode] = true
	}
}

func TestConcurrentAccess(t *testing.T) {
	manager := NewManager()
	ctx := context.Background()

	// Create initial room
	room, err := manager.CreateRoom(ctx, entity.CreateRoomRequest{
		HostID: "host-123",
	})
	if err != nil {
		t.Fatalf("failed to create room: %v", err)
	}

	// Concurrent joins
	done := make(chan bool)
	for i := 0; i < 3; i++ {
		go func(id int) {
			playerInfo := entity.User{
				ID:       "player-" + string(rune('1'+id)),
				Username: "player" + string(rune('1'+id)),
				Avatar:   "avatar.png",
			}
			_, err := manager.JoinRoom(ctx, entity.JoinRoomRequest{
				RoomCode: room.RoomCode,
				PlayerID: playerInfo.ID,
			}, playerInfo)
			if err != nil {
				t.Logf("join error (acceptable for capacity test): %v", err)
			}
			done <- true
		}(i)
	}

	// Wait for all goroutines
	for i := 0; i < 3; i++ {
		<-done
	}

	// Verify room state
	finalRoom, err := manager.GetRoom(room.RoomCode)
	if err != nil {
		t.Fatalf("failed to get room: %v", err)
	}

	if finalRoom.PlayerCount() > 4 {
		t.Errorf("room capacity exceeded: got %d players", finalRoom.PlayerCount())
	}
}

// TestSetPlayerReady tests setting player ready state
func TestSetPlayerReady(t *testing.T) {
	tests := []struct {
		name          string
		setupFunc     func(*Manager) (string, string) // returns roomCode, playerID
		playerID      string
		ready         bool
		wantErr       bool
		errorContains string
	}{
		{
			name: "set player ready success",
			setupFunc: func(m *Manager) (string, string) {
				req := entity.CreateRoomRequest{HostID: "player-1"}
				room, _ := m.CreateRoom(context.Background(), req)
				return room.RoomCode, "player-1"
			},
			ready:   true,
			wantErr: false,
		},
		{
			name: "set player not ready",
			setupFunc: func(m *Manager) (string, string) {
				req := entity.CreateRoomRequest{HostID: "player-1"}
				room, _ := m.CreateRoom(context.Background(), req)
				return room.RoomCode, "player-1"
			},
			ready:   false,
			wantErr: false,
		},
		{
			name: "player not in room",
			setupFunc: func(m *Manager) (string, string) {
				req := entity.CreateRoomRequest{HostID: "player-1"}
				room, _ := m.CreateRoom(context.Background(), req)
				return room.RoomCode, "player-2"
			},
			playerID:      "player-2",
			ready:         true,
			wantErr:       true,
			errorContains: "not in room",
		},
		{
			name: "empty room code",
			setupFunc: func(m *Manager) (string, string) {
				return "", "player-1"
			},
			ready:         true,
			wantErr:       true,
			errorContains: "roomCode is required",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			manager := NewManager()
			roomCode, playerID := tt.setupFunc(manager)
			if tt.playerID != "" {
				playerID = tt.playerID
			}

			err := manager.SetPlayerReady(context.Background(), roomCode, playerID, tt.ready)

			if tt.wantErr {
				if err == nil {
					t.Errorf("Expected error but got none")
				} else if tt.errorContains != "" && !contains(err.Error(), tt.errorContains) {
					t.Errorf("Error should contain '%s', got: %v", tt.errorContains, err)
				}
			} else {
				if err != nil {
					t.Errorf("Unexpected error: %v", err)
				} else {
					// Verify ready state
					room, _ := manager.GetRoom(roomCode)
					player := room.GetPlayer(playerID)
					if player.IsReady != tt.ready {
						t.Errorf("Expected IsReady=%v, got %v", tt.ready, player.IsReady)
					}
				}
			}
		})
	}
}

// TestAllPlayersReady tests checking if all players are ready
func TestAllPlayersReady(t *testing.T) {
	tests := []struct {
		name      string
		setupFunc func(*Manager) string // returns roomCode
		wantReady bool
	}{
		{
			name: "all players ready",
			setupFunc: func(m *Manager) string {
				req := entity.CreateRoomRequest{HostID: "player-1"}
				room, _ := m.CreateRoom(context.Background(), req)

				// Add second player
				joinReq := entity.JoinRoomRequest{RoomCode: room.RoomCode, PlayerID: "player-2"}
				user := entity.User{ID: "player-2", Username: "Player2", Avatar: "avatar.png"}
				m.JoinRoom(context.Background(), joinReq, user)

				// Set both ready
				m.SetPlayerReady(context.Background(), room.RoomCode, "player-1", true)
				m.SetPlayerReady(context.Background(), room.RoomCode, "player-2", true)

				return room.RoomCode
			},
			wantReady: true,
		},
		{
			name: "not all players ready",
			setupFunc: func(m *Manager) string {
				req := entity.CreateRoomRequest{HostID: "player-1"}
				room, _ := m.CreateRoom(context.Background(), req)

				joinReq := entity.JoinRoomRequest{RoomCode: room.RoomCode, PlayerID: "player-2"}
				user := entity.User{ID: "player-2", Username: "Player2", Avatar: "avatar.png"}
				m.JoinRoom(context.Background(), joinReq, user)

				// Only set one player ready
				m.SetPlayerReady(context.Background(), room.RoomCode, "player-1", true)

				return room.RoomCode
			},
			wantReady: false,
		},
		{
			name: "room not found",
			setupFunc: func(m *Manager) string {
				return "INVALID"
			},
			wantReady: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			manager := NewManager()
			roomCode := tt.setupFunc(manager)

			ready := manager.AllPlayersReady(roomCode)

			if ready != tt.wantReady {
				t.Errorf("Expected AllPlayersReady=%v, got %v", tt.wantReady, ready)
			}
		})
	}
}

// TestStartGame tests starting a game
func TestStartGame(t *testing.T) {
	tests := []struct {
		name          string
		setupFunc     func(*Manager) string // returns roomCode
		wantErr       bool
		errorContains string
	}{
		{
			name: "start game success",
			setupFunc: func(m *Manager) string {
				req := entity.CreateRoomRequest{HostID: "player-1"}
				room, _ := m.CreateRoom(context.Background(), req)

				joinReq := entity.JoinRoomRequest{RoomCode: room.RoomCode, PlayerID: "player-2"}
				user := entity.User{ID: "player-2", Username: "Player2", Avatar: "avatar.png"}
				m.JoinRoom(context.Background(), joinReq, user)

				m.SetPlayerReady(context.Background(), room.RoomCode, "player-1", true)
				m.SetPlayerReady(context.Background(), room.RoomCode, "player-2", true)

				return room.RoomCode
			},
			wantErr: false,
		},
		{
			name: "not enough players",
			setupFunc: func(m *Manager) string {
				req := entity.CreateRoomRequest{HostID: "player-1"}
				room, _ := m.CreateRoom(context.Background(), req)
				m.SetPlayerReady(context.Background(), room.RoomCode, "player-1", true)
				return room.RoomCode
			},
			wantErr:       true,
			errorContains: "not enough players",
		},
		{
			name: "not all players ready",
			setupFunc: func(m *Manager) string {
				req := entity.CreateRoomRequest{HostID: "player-1"}
				room, _ := m.CreateRoom(context.Background(), req)

				joinReq := entity.JoinRoomRequest{RoomCode: room.RoomCode, PlayerID: "player-2"}
				user := entity.User{ID: "player-2", Username: "Player2", Avatar: "avatar.png"}
				m.JoinRoom(context.Background(), joinReq, user)

				m.SetPlayerReady(context.Background(), room.RoomCode, "player-1", true)
				// player-2 not ready

				return room.RoomCode
			},
			wantErr:       true,
			errorContains: "not all players are ready",
		},
		{
			name: "game already in progress",
			setupFunc: func(m *Manager) string {
				req := entity.CreateRoomRequest{HostID: "player-1"}
				room, _ := m.CreateRoom(context.Background(), req)

				joinReq := entity.JoinRoomRequest{RoomCode: room.RoomCode, PlayerID: "player-2"}
				user := entity.User{ID: "player-2", Username: "Player2", Avatar: "avatar.png"}
				m.JoinRoom(context.Background(), joinReq, user)

				m.SetPlayerReady(context.Background(), room.RoomCode, "player-1", true)
				m.SetPlayerReady(context.Background(), room.RoomCode, "player-2", true)
				m.StartGame(context.Background(), room.RoomCode)

				return room.RoomCode
			},
			wantErr:       true,
			errorContains: "already in progress",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			manager := NewManager()
			roomCode := tt.setupFunc(manager)

			err := manager.StartGame(context.Background(), roomCode)

			if tt.wantErr {
				if err == nil {
					t.Errorf("Expected error but got none")
				} else if tt.errorContains != "" && !contains(err.Error(), tt.errorContains) {
					t.Errorf("Error should contain '%s', got: %v", tt.errorContains, err)
				}
			} else {
				if err != nil {
					t.Errorf("Unexpected error: %v", err)
				} else {
					// Verify game started
					room, _ := manager.GetRoom(roomCode)
					if room.Status != entity.StatusInProgress {
						t.Errorf("Expected status in_progress, got %s", room.Status)
					}
					if room.StartedAt == nil {
						t.Error("Expected StartedAt to be set")
					}
				}
			}
		})
	}
}

// TestIsPlayerInAnyRoom tests checking if player is in any room
func TestIsPlayerInAnyRoom(t *testing.T) {
	manager := NewManager()

	// Player not in any room
	if manager.IsPlayerInAnyRoom("player-1") {
		t.Error("Expected player to not be in any room")
	}

	// Create room with player
	req := entity.CreateRoomRequest{HostID: "player-1"}
	room, err := manager.CreateRoom(context.Background(), req)
	if err != nil {
		t.Fatalf("Failed to create room: %v", err)
	}

	// Player should be in room now
	if !manager.IsPlayerInAnyRoom("player-1") {
		t.Error("Expected player to be in room")
	}

	// Different player not in room
	if manager.IsPlayerInAnyRoom("player-2") {
		t.Error("Expected player-2 to not be in any room")
	}

	// Player leaves room
	leaveReq := entity.LeaveRoomRequest{RoomCode: room.RoomCode, PlayerID: "player-1"}
	err = manager.LeaveRoom(context.Background(), leaveReq)
	if err != nil {
		t.Fatalf("Failed to leave room: %v", err)
	}

	// Player should not be in room anymore
	if manager.IsPlayerInAnyRoom("player-1") {
		t.Error("Expected player to not be in any room after leaving")
	}
}

// TestGetPlayerRoom tests getting the room a player is in
func TestGetPlayerRoom(t *testing.T) {
	manager := NewManager()

	// Player not in any room
	_, err := manager.GetPlayerRoom("player-1")
	if err == nil {
		t.Error("Expected error for player not in room")
	}

	// Create room with player
	req := entity.CreateRoomRequest{HostID: "player-1"}
	room, err := manager.CreateRoom(context.Background(), req)
	if err != nil {
		t.Fatalf("Failed to create room: %v", err)
	}

	// Get player's room
	roomCode, err := manager.GetPlayerRoom("player-1")
	if err != nil {
		t.Errorf("Unexpected error: %v", err)
	}
	if roomCode != room.RoomCode {
		t.Errorf("Expected room code %s, got %s", room.RoomCode, roomCode)
	}

	// Different player not in room
	_, err = manager.GetPlayerRoom("player-2")
	if err == nil {
		t.Error("Expected error for player-2 not in room")
	}
}

// Helper function
func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > len(substr) && containsSubstring(s, substr))
}

func containsSubstring(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
