package game

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
)

// CreateRoomRequest represents a room creation request
type CreateRoomRequest struct {
	HostID       string `json:"hostId"`
	MaxPlayers   int    `json:"maxPlayers"`
	PointsToWin  int    `json:"pointsToWin"`
	SurfaceTheme string `json:"surfaceTheme"`
}

// JoinRoomRequest represents a room join request
type JoinRoomRequest struct {
	RoomCode string `json:"roomCode"`
	PlayerID string `json:"playerId"`
}

// Room represents a game room
type Room struct {
	ID           string   `json:"id"`
	RoomCode     string   `json:"roomCode"`
	HostID       string   `json:"hostId"`
	Players      []Player `json:"players"`
	MaxPlayers   int      `json:"maxPlayers"`
	PointsToWin  int      `json:"pointsToWin"`
	SurfaceTheme string   `json:"surfaceTheme"`
	Status       string   `json:"status"` // "waiting", "playing", "completed"
}

// Player represents a player in the game
type Player struct {
	ID       string `json:"id"`
	Username string `json:"username"`
	Avatar   string `json:"avatar"`
	IsReady  bool   `json:"isReady"`
}

// GameState represents the current game state
type GameState struct {
	RoomID       string         `json:"roomId"`
	CurrentRound int            `json:"currentRound"`
	TotalRounds  int            `json:"totalRounds"`
	LeaderID     string         `json:"leaderId"`
	Players      []Player       `json:"players"`
	Scores       map[string]int `json:"scores"`
	PlayedCards  []PlayedCard   `json:"playedCards"`
	Phase        string         `json:"phase"` // "lobby", "declaring", "playing", "game_over"
}

// PlayedCard represents a card played by a player
type PlayedCard struct {
	PlayerID string `json:"playerId"`
	Card     Card   `json:"card"`
}

// Card represents a playing card
type Card struct {
	Suit  string `json:"suit"`  // "hearts", "clubs", "diamonds", "spades"
	Value int    `json:"value"` // 6-10, 11=Jack, 12=Queen, 13=King, 14=Ace
}

// Routes returns the game router
func Routes() chi.Router {
	r := chi.NewRouter()

	// Room management
	r.Post("/rooms", handleCreateRoom)
	r.Get("/rooms/{roomCode}", handleGetRoom)
	r.Post("/rooms/{roomCode}/join", handleJoinRoom)
	r.Delete("/rooms/{roomCode}/leave", handleLeaveRoom)
	r.Post("/rooms/{roomCode}/start", handleStartGame)

	// Game state
	r.Get("/games/{gameId}/state", handleGetGameState)

	// Player stats
	r.Get("/players/{playerId}/stats", handleGetPlayerStats)

	return r
}

// handleCreateRoom creates a new game room
func handleCreateRoom(w http.ResponseWriter, r *http.Request) {
	var req CreateRoomRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// TODO: Validate input
	// TODO: Generate unique room code
	// TODO: Store room in memory or database

	// Placeholder response
	room := Room{
		ID:           "room-123",
		RoomCode:     "ABC123",
		HostID:       req.HostID,
		Players:      []Player{},
		MaxPlayers:   req.MaxPlayers,
		PointsToWin:  req.PointsToWin,
		SurfaceTheme: req.SurfaceTheme,
		Status:       "waiting",
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(room)
}

// handleGetRoom retrieves room details
func handleGetRoom(w http.ResponseWriter, r *http.Request) {
	roomCode := chi.URLParam(r, "roomCode")

	// TODO: Fetch room from database/memory

	// Placeholder response
	room := Room{
		ID:           "room-123",
		RoomCode:     roomCode,
		HostID:       "user-123",
		Players:      []Player{},
		MaxPlayers:   4,
		PointsToWin:  10,
		SurfaceTheme: "poker-table",
		Status:       "waiting",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(room)
}

// handleJoinRoom adds a player to a room
func handleJoinRoom(w http.ResponseWriter, r *http.Request) {
	roomCode := chi.URLParam(r, "roomCode")

	var req JoinRoomRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// TODO: Validate room exists
	// TODO: Check if room is full
	// TODO: Add player to room

	// Placeholder response
	room := Room{
		ID:       "room-123",
		RoomCode: roomCode,
		HostID:   "user-123",
		Players: []Player{
			{ID: req.PlayerID, Username: "Player 1", IsReady: false},
		},
		MaxPlayers:   4,
		PointsToWin:  10,
		SurfaceTheme: "poker-table",
		Status:       "waiting",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(room)
}

// handleLeaveRoom removes a player from a room
func handleLeaveRoom(w http.ResponseWriter, r *http.Request) {
	roomCode := chi.URLParam(r, "roomCode")

	// TODO: Remove player from room
	// TODO: Handle host migration if host leaves

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Left room " + roomCode,
	})
}

// handleStartGame starts the game in a room
func handleStartGame(w http.ResponseWriter, r *http.Request) {
	roomCode := chi.URLParam(r, "roomCode")

	// TODO: Validate minimum players (2)
	// TODO: Check all players are ready
	// TODO: Initialize game state
	// TODO: Deal cards

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message":  "Game started",
		"roomCode": roomCode,
	})
}

// handleGetGameState returns the current game state
func handleGetGameState(w http.ResponseWriter, r *http.Request) {
	gameID := chi.URLParam(r, "gameId")

	// TODO: Fetch game state from memory/database

	// Placeholder response
	gameState := GameState{
		RoomID:       gameID,
		CurrentRound: 1,
		TotalRounds:  5,
		LeaderID:     "user-123",
		Players:      []Player{},
		Scores:       map[string]int{},
		PlayedCards:  []PlayedCard{},
		Phase:        "lobby",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(gameState)
}

// handleGetPlayerStats returns player statistics
func handleGetPlayerStats(w http.ResponseWriter, r *http.Request) {
	playerID := chi.URLParam(r, "playerId")

	// TODO: Fetch player stats from database

	// Placeholder response
	stats := map[string]interface{}{
		"playerId":    playerID,
		"totalGames":  10,
		"wins":        6,
		"losses":      4,
		"winRate":     0.6,
		"totalPoints": 85,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}
