package websocket

import (
	"context"
	"encoding/json"
	"fmt"
	"hash/fnv"
	"log/slog"
	"math/rand"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/npeprah/sparui/backend/common/db"
	"github.com/npeprah/sparui/backend/service/game-server/controller/matchmaking"
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

// Global matchmaking queue manager
var matchmakingQueue *matchmaking.QueueManager

// Global repositories
var userRepository *userrepo.Repository

// Global connection manager
var connectionManager *ConnectionManager

// Global context for matchmaking worker
var matchmakingCtx context.Context
var matchmakingCancel context.CancelFunc

// Global games map stores active game states by room code
var games = make(map[string]*entity.GameState)
var gamesMu sync.RWMutex

// matchScores holds the cumulative MATCH score for each player, keyed by room
// code then player ID. A match is the sequence of 5-round games played in a
// single room: individual games start fresh (see initializeGameState) but the
// match score accumulates across every play-again, so it survives a game
// restart. This is the persistence hook fire-streak (ticket 08) bonuses and
// flag (ticket 07) penalties should adjust once those tickets land.
var matchScores = make(map[string]map[string]int)
var matchScoresMu sync.Mutex

// addMatchScore adds delta to a player's cumulative match score for a room and
// returns the new total. delta may be negative (e.g. a future flag penalty).
func addMatchScore(roomCode, playerID string, delta int) int {
	matchScoresMu.Lock()
	defer matchScoresMu.Unlock()
	room, ok := matchScores[roomCode]
	if !ok {
		room = make(map[string]int)
		matchScores[roomCode] = room
	}
	room[playerID] += delta
	return room[playerID]
}

// getMatchScore returns a player's current cumulative match score for a room
// (0 if the player has never scored in this match).
func getMatchScore(roomCode, playerID string) int {
	matchScoresMu.Lock()
	defer matchScoresMu.Unlock()
	if room, ok := matchScores[roomCode]; ok {
		return room[playerID]
	}
	return 0
}

// matchScoreSnapshot returns a copy of every player's cumulative match score
// for a room, safe to serialize without holding the lock.
func matchScoreSnapshot(roomCode string) map[string]int {
	matchScoresMu.Lock()
	defer matchScoresMu.Unlock()
	snapshot := make(map[string]int)
	for playerID, score := range matchScores[roomCode] {
		snapshot[playerID] = score
	}
	return snapshot
}

func init() {
	go hub.Run()
	// Initialize room manager without repository (will be set later)
	roomManager = room.NewManager()
	// Initialize connection manager with 60 second reconnection timeout
	connectionManager = NewConnectionManager(hub, 60*time.Second)
	// Initialize matchmaking queue manager
	matchmakingQueue = matchmaking.NewQueueManager(roomManager)
}

// InitWebSocket initializes the WebSocket service with dependencies
func InitWebSocket(database *db.DB) {
	// Initialize repositories
	userRepository = userrepo.NewRepository(database)
	roomRepository := roomrepo.NewRepository(database)

	// Initialize room manager with repository
	roomManager = room.NewManagerWithRepository(roomRepository)

	// Re-initialize matchmaking queue with updated room manager
	matchmakingQueue = matchmaking.NewQueueManager(roomManager)

	// Start matchmaking background worker
	matchmakingCtx, matchmakingCancel = context.WithCancel(context.Background())
	go matchmakingQueue.Start(matchmakingCtx)

	slog.Info("WebSocket service initialized with database dependencies")
}

// ShutdownWebSocket gracefully shuts down the WebSocket service
func ShutdownWebSocket() {
	if matchmakingCancel != nil {
		matchmakingCancel()
	}
	slog.Info("WebSocket service shut down")
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
	case "lobby:ready":
		c.handlePlayerReady(msg.Data)
	case "lobby:start_game":
		c.handleStartGame(msg.Data)
	case "lobby:update_settings":
		c.handleUpdateSettings(msg.Data)
	case "game:restart":
		c.handleRestartGame(msg.Data)
	case "matchmaking:join":
		c.handleMatchmakingJoin(msg.Data)
	case "matchmaking:leave":
		c.handleMatchmakingLeave(msg.Data)
	case "matchmaking:status":
		c.handleMatchmakingStatus(msg.Data)
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

	// TEMPORARY: derive a player id from the token (simplified for MVP).
	// In production, use: common/auth.ValidateToken(req.Token).
	// We hash the FULL token rather than slicing its first 8 chars: hashing is
	// stable per token (so a reconnect with the same token maps to the same
	// player) while remaining collision-safe across distinct tokens, so an
	// unauthenticated 2-player test always yields unique player ids.
	playerID := derivePlayerID(req.Token)

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

// derivePlayerID maps an auth token to a stable, collision-safe player id.
// Stable: the same token always yields the same id (reconnection). Unique:
// distinct tokens yield distinct ids (no first-8-chars collisions).
func derivePlayerID(token string) string {
	h := fnv.New64a()
	_, _ = h.Write([]byte(token))
	return fmt.Sprintf("player-%016x", h.Sum64())
}

// mapFrontendRankToBackend converts frontend rank format to backend value format
// Frontend uses: J, Q, K, A (uppercase single letters)
// Backend uses: jack, queen, king, ace (lowercase full words)
func mapFrontendRankToBackend(rank string) string {
	switch rank {
	case "J":
		return "jack"
	case "Q":
		return "queen"
	case "K":
		return "king"
	case "A":
		return "ace"
	default:
		// Numbers (6, 7, 8, 9, 10) are the same in both formats
		return rank
	}
}

func (c *Client) handlePlayCard(data json.RawMessage) {
	slog.Info("Play card event", "clientId", c.ID, "playerId", c.PlayerID)

	// Parse request
	var req struct {
		Card struct {
			Suit  string `json:"suit"`
			Value string `json:"value"` // Backend format
			Rank  string `json:"rank"`  // Frontend format
		} `json:"card"`
	}
	if err := json.Unmarshal(data, &req); err != nil {
		slog.Error("Failed to parse play card request", "error", err)
		c.sendError("game:play_error", "Invalid request format")
		return
	}

	// Handle frontend using "rank" instead of "value"
	cardValue := req.Card.Value
	if cardValue == "" {
		cardValue = req.Card.Rank
	}

	// Map frontend rank format (J, Q, K, A) to backend format (jack, queen, king, ace)
	cardValue = mapFrontendRankToBackend(cardValue)

	// Validate player is authenticated
	if c.PlayerID == "" {
		slog.Warn("Unauthenticated player attempted to play card", "clientId", c.ID)
		c.sendError("game:play_error", "Authentication required")
		return
	}

	// Validate player is in a room
	if c.RoomID == "" {
		c.sendError("game:play_error", "Not in a room")
		return
	}

	// Get game state
	gamesMu.Lock()
	defer gamesMu.Unlock()

	gameState, exists := games[c.RoomID]
	if !exists {
		slog.Error("Game state not found", "roomCode", c.RoomID)
		c.sendError("game:play_error", "Game not found")
		return
	}

	// Validate game is in playing phase
	if gameState.Phase != entity.PhasePlaying {
		c.sendError("game:play_error", "Game is not in playing phase")
		return
	}

	// Get player from game state
	player := gameState.GetPlayer(c.PlayerID)
	if player == nil {
		slog.Error("Player not found in game state", "playerId", c.PlayerID, "roomCode", c.RoomID)
		c.sendError("game:play_error", "Player not found in game")
		return
	}

	// Round-opening rule: only the leader may open a round (play the first card).
	// A follower who tries to play before the leader has opened is rejected
	// harmlessly - no state is mutated. Once the round is open, ANY player may
	// play at any time; strict turn order governs only whose timer is running
	// (handled in a later ticket), not who is permitted to play.
	if len(gameState.PlayedCards) == 0 && !gameState.IsLeader(c.PlayerID) {
		slog.Warn("Non-leader attempted to open the round",
			"playerId", c.PlayerID,
			"leaderId", gameState.LeaderID)
		c.sendError("game:play_error", "Only the leader can open the round")
		return
	}

	// Validate player hasn't already played this round
	if player.HasPlayedCard {
		slog.Warn("Player attempted to play twice in same round", "playerId", c.PlayerID)
		c.sendError("game:play_error", "Already played this round")
		return
	}

	// Parse and validate card
	card := &entity.Card{
		Suit:  entity.Suit(req.Card.Suit),
		Value: entity.Value(cardValue),
	}

	if !card.IsValid() {
		slog.Warn("Invalid card attempted", "playerId", c.PlayerID, "card", card.String())
		c.sendError("game:play_error", "Invalid card")
		return
	}

	// Validate player has this card in their hand
	if !player.HasCard(card) {
		slog.Warn("Player attempted to play card not in hand",
			"playerId", c.PlayerID,
			"card", card.String())
		c.sendError("game:play_error", "Card not in your hand")
		return
	}

	// All validations passed - commit the play. applyPlay is shared with the
	// turn-timer expiry auto-play so both human and auto plays advance the turn,
	// broadcast, resolve round completion, and walk the turn timer identically.
	c.applyPlay(gameState, player, card)
}

// applyPlay commits a validated card play: it records the led suit (if opening),
// removes the card from the player's hand, marks the player played, appends to
// the round's played cards, advances the on-deck seat, broadcasts cardPlayed,
// resolves round completion when everyone has played, and (re)arms or stops the
// turn timer for the next on-deck seat.
//
// The caller MUST hold gamesMu and MUST have already validated the play (correct
// phase, card in hand, opening rule). It is invoked both by handlePlayCard (a
// human play) and by the turn-timer expiry path (an auto-play).
func (c *Client) applyPlay(gameState *entity.GameState, player *entity.GamePlayer, card *entity.Card) {
	// Off-suit freedom: a player MAY break suit even while holding the led suit.
	// Follow-suit is a strategic expectation, not a hard rule - an illegal
	// off-suit play is policed by the flag/challenge mechanic (a later ticket),
	// never rejected inline here. The only suit bookkeeping we do is recording
	// the led suit when the round is opened.
	if gameState.LedSuit == nil {
		gameState.LedSuit = &card.Suit
		slog.Info("Led suit set", "suit", card.Suit, "playerId", player.ID)
	}

	// Remove card from player's hand
	if !player.RemoveCard(card) {
		slog.Error("Failed to remove card from hand", "playerId", player.ID, "card", card.String())
		c.sendError("game:play_error", "Failed to play card")
		return
	}

	// Mark player as having played
	player.HasPlayedCard = true
	player.LastPlayedCard = card
	player.PlayedAt = time.Now()

	// Add card to played cards
	playedCard := entity.PlayedCard{
		Card:     *card,
		PlayerID: player.ID,
		PlayedAt: time.Now(),
		IsOnFire: player.IsOnFire,
		// A card is only known to be "frozen" once a round resolves and an
		// opponent breaks a fire streak; that is set in updateFireStreak, not here.
		IsFrozen: false,
	}
	gameState.PlayedCards = append(gameState.PlayedCards, playedCard)

	// Determine next turn
	nextPlayer := gameState.GetNextPlayer()
	if nextPlayer != nil {
		gameState.CurrentTurn = nextPlayer.ID
		gameState.TurnStartTime = time.Now()
		slog.Info("Turn advanced", "nextPlayer", nextPlayer.ID)
	} else {
		// All players have played - round is complete
		gameState.CurrentTurn = ""
		slog.Info("Round complete - all players have played", "roomCode", gameState.RoomCode)
	}

	gameState.UpdatedAt = time.Now()

	slog.Info("Card played successfully",
		"playerId", player.ID,
		"card", card.String(),
		"playedCardsCount", len(gameState.PlayedCards),
		"allPlayed", gameState.AllPlayersPlayed(),
		"nextTurn", gameState.CurrentTurn,
	)

	// Prepare broadcast payload with frontend-formatted cards
	broadcastPayload := map[string]interface{}{
		"event": "cardPlayed",
		"data": map[string]interface{}{
			"playerId":      player.ID,
			"card":          convertCardToFrontendFormat(card),
			"playedCards":   convertPlayedCardsToFrontendFormat(gameState.PlayedCards),
			"currentTurn":   gameState.CurrentTurn,
			"ledSuit":       gameState.LedSuit,
			"roundComplete": gameState.AllPlayersPlayed(),
		},
	}

	// Broadcast card played event to all players in room (including sender)
	c.broadcastToRoomIncludingSelf(gameState.RoomCode, broadcastPayload)

	// Handle round completion if all players have played
	if gameState.AllPlayersPlayed() {
		c.handleRoundCompletion(gameState)
	}

	// Walk the turn timer: stop it when the game is over, otherwise re-arm it
	// for the new on-deck seat (handleRoundCompletion has already set the next
	// leader/turn for a fresh round; a mid-round play leaves CurrentTurn on the
	// next clockwise seat).
	if gameState.Phase == entity.PhaseGameOver {
		turnTimers.stop(gameState.RoomCode)
	} else {
		turnTimers.reset(gameState.RoomCode, gameState)
	}
}

// handleRoundCompletion calculates the winner, awards points, and prepares for the next round
func (c *Client) handleRoundCompletion(gameState *entity.GameState) {
	slog.Info("Processing round completion", "roomCode", c.RoomID, "round", gameState.CurrentRound)

	// Calculate round winner (highest card of led suit wins)
	winnerID := c.calculateRoundWinner(gameState)
	if winnerID == "" {
		slog.Error("Failed to calculate round winner", "roomCode", c.RoomID)
		return
	}

	// Set round winner
	gameState.RoundWinner = winnerID

	// Capture the just-completed round (led suit + played cards) before any
	// per-round reset below wipes it. A flag WS message can arrive after the
	// round-completing play - by then LedSuit / PlayedCards are gone, so
	// handleFlagPlayer falls back to this snapshot to judge legality.
	roundSnapshot := &entity.LastRoundSnapshot{
		PlayedCards: append([]entity.PlayedCard(nil), gameState.PlayedCards...),
	}
	if gameState.LedSuit != nil {
		led := *gameState.LedSuit
		roundSnapshot.LedSuit = &led
	}
	gameState.LastRound = roundSnapshot

	// Track round wins (NOT accumulating points - just counting tricks won).
	// Points are only scored on the final round, by card value (see below).
	winner := gameState.GetPlayer(winnerID)
	if winner != nil {
		winner.RoundsWon++
		slog.Info("Round won", "winnerId", winnerID, "roundsWon", winner.RoundsWon)
	}

	// Fire streak & freeze counter (ticket 08). State/visual only - NO points
	// are awarded for fire or freeze.
	c.updateFireStreak(gameState, winnerID, winner)

	// Check if the game is over. A Spar game is exactly TotalRounds (5) rounds;
	// the winner of the final round wins the game and scores by the value of
	// their winning card (6 -> 3, 7 -> 2, 8+ -> 1). Those points are added to
	// the player's cumulative match score, which persists across play-again.
	gameOver := false
	gameWinnerID := ""
	gameWinPoints := 0
	var gameWinningCard *entity.Card
	// Dry / show-dry bonus flags (ticket 06). Set only when the final-round
	// winner won by playing their declared card, in which case the dry bonus
	// REPLACES the base value score.
	dryBonusApplied := false
	var dryBonusType entity.DryType

	if gameState.CurrentRound >= gameState.TotalRounds {
		gameOver = true
		gameState.Phase = entity.PhaseGameOver

		// The winner of the final round wins the game.
		gameWinnerID = winnerID

		// The winner's own played card is the trick-winning card of the led
		// suit; score the game by its value.
		if wonCard := gameState.GetPlayedCard(winnerID); wonCard != nil {
			card := wonCard.Card
			gameWinningCard = &card

			// Dry / show-dry bonus (ticket 06): if the winner had declared a
			// dry card AND won the final round by playing that exact card, the
			// dry bonus (dry 6->6, 7->4; show-dry 6->12, 7->8) REPLACES the base
			// value score. Any other outcome falls back to the base value.
			if gw := gameState.GetPlayer(gameWinnerID); gw != nil && gw.DryCard != nil && gw.DryCard.Card.Equals(&card) {
				gameWinPoints = gw.DryCard.BonusPoints()
				dryBonusApplied = true
				dryBonusType = gw.DryCard.Type
			} else {
				gameWinPoints = card.Value.GameWinValue()
			}
		}

		// Only the final round scores points in Spar.
		if gw := gameState.GetPlayer(gameWinnerID); gw != nil {
			gw.Score += gameWinPoints
		}

		// Persist the points onto the cumulative match score (survives
		// play-again) and mirror the fresh totals onto every player so the
		// serialized state reflects the running match standings.
		newTotal := addMatchScore(c.RoomID, gameWinnerID, gameWinPoints)
		for i := range gameState.Players {
			gameState.Players[i].MatchScore = getMatchScore(c.RoomID, gameState.Players[i].ID)
		}

		completedAt := time.Now()
		gameState.CompletedAt = &completedAt

		slog.Info("Game over - final round complete",
			"winnerId", gameWinnerID,
			"gameWinPoints", gameWinPoints,
			"matchScore", newTotal,
			"totalRounds", gameState.CurrentRound,
		)
	}

	// The freeze counter marks the breaker's winning card frozen in
	// PlayedCards, but no delivered event serializes PlayedCards at this point
	// (cardPlayed already fired for that card, and PlayedCards is reset before
	// the next round). Carry the frozen card on the roundWon payload so the
	// client can render which card froze. Present only when a freeze triggered.
	var frozenCard map[string]interface{}
	if gameState.FreezeTriggered {
		for i := range gameState.PlayedCards {
			if gameState.PlayedCards[i].IsFrozen {
				frozenCard = convertCardToFrontendFormat(&gameState.PlayedCards[i].Card)
				break
			}
		}
	}

	// Broadcast roundWon event
	roundWonPayload := map[string]interface{}{
		"event": "roundWon",
		"data": map[string]interface{}{
			"winnerId":     winnerID,
			"isDry":        dryBonusApplied && dryBonusType == entity.DryHidden,
			"isShowDry":    dryBonusApplied && dryBonusType == entity.DryShown,
			"currentRound": gameState.CurrentRound,
			"roundsWon":    c.getPlayerRoundsWon(gameState),
			"gameOver":     gameOver,
			// Fire streak / freeze counter state (ticket 08) for the client to
			// render. State/visual only - no points involved.
			"fireStreakPlayer": gameState.FireStreakPlayer,
			"freezeTriggered":  gameState.FreezeTriggered,
			"frozenCard":       frozenCard,
		},
	}
	c.broadcastToRoomIncludingSelf(c.RoomID, roundWonPayload)

	slog.Info("Round won event broadcast",
		"roomCode", c.RoomID,
		"winnerId", winnerID,
		"round", gameState.CurrentRound,
	)

	// If game is over, broadcast gameEnded event
	if gameOver {
		c.handleGameOver(gameState, gameWinnerID, gameWinPoints, gameWinningCard)
		return
	}

	// Prepare for next round (reset state)
	gameState.CurrentRound++
	gameState.PlayedCards = []entity.PlayedCard{}
	gameState.LedSuit = nil
	gameState.RoundWinner = ""
	// FreezeTriggered is a momentary "just happened" flag; the roundWon broadcast
	// above already carried it, so clear it now that the next round is starting.
	gameState.FreezeTriggered = false

	// Reset player round state
	for i := range gameState.Players {
		gameState.Players[i].HasPlayedCard = false
		gameState.Players[i].LastPlayedCard = nil
	}

	// Winner becomes the new leader and goes first
	gameState.LeaderID = winnerID
	for i := range gameState.Players {
		gameState.Players[i].IsLeader = (gameState.Players[i].ID == winnerID)
	}
	gameState.CurrentTurn = winnerID
	gameState.TurnStartTime = time.Now()
	gameState.UpdatedAt = time.Now()

	slog.Info("Round reset complete - ready for next round",
		"roomCode", c.RoomID,
		"newRound", gameState.CurrentRound,
		"newLeader", winnerID,
		"currentTurn", gameState.CurrentTurn,
	)

	// Broadcast turn changed event so frontend knows who plays next
	turnChangedPayload := map[string]interface{}{
		"event": "turnChanged",
		"data": map[string]interface{}{
			"currentPlayerId": winnerID,
			"timeRemaining":   15, // Leader gets 15 seconds
		},
	}
	c.broadcastToRoomIncludingSelf(c.RoomID, turnChangedPayload)
}

// fireStreakThreshold is the number of consecutive round wins AS LEADER required
// to ignite a fire streak. Once a player reaches this many consecutive
// leader-wins they are "on fire", and the card they open the NEXT round with is
// marked on fire. This is state/visual only - no points are awarded.
const fireStreakThreshold = 3

// updateFireStreak maintains the fire-streak and freeze-counter state after a
// round winner has been determined, but before the round is reset for the next
// round (so gameState.LeaderID still refers to the round that was just played).
//
// A player builds a fire streak by winning consecutive rounds AS THE ROUND'S
// LEADER. The leader is whoever won the previous round (round 1's leader is the
// initial leader), so a run of leader-wins is the same player winning
// consecutive rounds. Reaching fireStreakThreshold (3) consecutive leader-wins
// ignites the streak: player.IsOnFire is set, which is what marks the card that
// player opens the following (4th) round with as on fire (see handlePlayCard).
//
// When an opponent instead wins the round, an ACTIVE fire streak (a leader who
// was on fire) is broken and the freeze counter triggers. Fire and freeze are
// state/visual only - this function never awards points.
func (c *Client) updateFireStreak(gameState *entity.GameState, winnerID string, winner *entity.GamePlayer) {
	if winner == nil {
		return
	}

	roundLeaderID := gameState.LeaderID
	wonAsLeader := winnerID == roundLeaderID

	// Capture whether an active fire streak is being broken, before mutating any
	// streak state below. Only a streak that actually reached the fire threshold
	// (the leader was on fire) can trigger the freeze counter.
	fireStreakBroken := false
	if !wonAsLeader {
		if brokenLeader := gameState.GetPlayer(roundLeaderID); brokenLeader != nil && brokenLeader.IsOnFire {
			fireStreakBroken = true
		}
	}

	// Only the round winner can carry a streak; reset every other player's.
	for i := range gameState.Players {
		p := &gameState.Players[i]
		if p.ID != winnerID {
			p.WinStreak = 0
			p.IsOnFire = false
		}
	}

	// Extend the winner's streak only when they won as the round's leader.
	// Stealing a round as a non-leader starts a fresh streak at 1.
	if wonAsLeader {
		winner.WinStreak++
	} else {
		winner.WinStreak = 1
	}

	// Ignite (or sustain) the fire streak at the 3-consecutive-leader-win
	// threshold.
	if winner.WinStreak >= fireStreakThreshold {
		winner.IsOnFire = true
		gameState.FireStreakPlayer = winnerID
	} else {
		winner.IsOnFire = false
		gameState.FireStreakPlayer = ""
	}

	// Freeze counter: an opponent breaking an active fire streak freezes it.
	gameState.FreezeTriggered = fireStreakBroken
	if fireStreakBroken {
		// Mark the breaker's winning card frozen so a state snapshot can render
		// the freeze; the fire streak is over, so clear its holder.
		for i := range gameState.PlayedCards {
			if gameState.PlayedCards[i].PlayerID == winnerID {
				gameState.PlayedCards[i].IsFrozen = true
			}
		}
		gameState.FireStreakPlayer = ""
		slog.Info("Fire streak broken - freeze triggered",
			"breakerId", winnerID,
			"brokenLeaderId", roundLeaderID,
		)
	}
}

// calculateRoundWinner determines the winner based on highest card of led suit
func (c *Client) calculateRoundWinner(gameState *entity.GameState) string {
	if gameState.LedSuit == nil || len(gameState.PlayedCards) == 0 {
		return gameState.LeaderID // Fallback to leader
	}

	ledSuit := *gameState.LedSuit

	// Find all cards matching the led suit
	var ledSuitCards []entity.PlayedCard
	for _, playedCard := range gameState.PlayedCards {
		if playedCard.Card.Suit == ledSuit {
			ledSuitCards = append(ledSuitCards, playedCard)
		}
	}

	// If no one has the led suit, leader wins by default
	if len(ledSuitCards) == 0 {
		slog.Info("No player has led suit - leader wins by default",
			"leaderID", gameState.LeaderID,
			"ledSuit", ledSuit,
		)
		return gameState.LeaderID
	}

	// Find the highest card of the led suit
	winningCard := ledSuitCards[0]
	for _, playedCard := range ledSuitCards[1:] {
		if playedCard.Card.CompareValue(winningCard.Card) > 0 {
			winningCard = playedCard
		}
	}

	slog.Info("Round winner calculated",
		"winnerID", winningCard.PlayerID,
		"winningCard", winningCard.Card.String(),
		"ledSuit", ledSuit,
	)

	return winningCard.PlayerID
}

// getPlayerRoundsWon returns a map of player IDs to rounds won
func (c *Client) getPlayerRoundsWon(gameState *entity.GameState) map[string]int {
	roundsWon := make(map[string]int)
	for _, player := range gameState.Players {
		roundsWon[player.ID] = player.RoundsWon
	}
	return roundsWon
}

// handleGameOver broadcasts the game ended event. The winner is the final-round
// winner; gameWinPoints is the value they scored this game (added to their match
// score) and winningCard is the card they won the final round with (may be nil
// in the degenerate case where no played card is found).
func (c *Client) handleGameOver(gameState *entity.GameState, winnerID string, gameWinPoints int, winningCard *entity.Card) {
	finalRoundsWon := c.getPlayerRoundsWon(gameState)

	// Get winner details
	winner := gameState.GetPlayer(winnerID)
	winnerName := "Unknown"
	winnerRoundsWon := 0
	if winner != nil {
		winnerName = winner.Username
		winnerRoundsWon = winner.RoundsWon
	}

	matchScores := matchScoreSnapshot(c.RoomID)
	winnerMatchScore := matchScores[winnerID]

	var winningCardPayload interface{}
	if winningCard != nil {
		winningCardPayload = convertCardToFrontendFormat(winningCard)
	}

	slog.Info("Game over",
		"roomCode", c.RoomID,
		"winnerId", winnerID,
		"winnerName", winnerName,
		"gameWinPoints", gameWinPoints,
		"matchScore", winnerMatchScore,
		"roundsWon", winnerRoundsWon,
		"totalRounds", gameState.CurrentRound,
	)

	gameEndedPayload := map[string]interface{}{
		"event": "gameEnded",
		"data": map[string]interface{}{
			"winnerId":         winnerID,
			"winnerName":       winnerName,
			"winnerScore":      gameWinPoints,      // Value points scored this game (6->3, 7->2, 8+->1)
			"winningCard":      winningCardPayload, // The card that won the final round
			"gameWinPoints":    gameWinPoints,
			"winnerMatchScore": winnerMatchScore, // Winner's cumulative match score
			"matchScores":      matchScores,      // playerID -> cumulative match score
			"finalRoundsWon":   finalRoundsWon,
			"totalRounds":      gameState.CurrentRound,
		},
	}
	c.broadcastToRoomIncludingSelf(c.RoomID, gameEndedPayload)
}

// handleDeclareDry records a player's dry / show-dry declaration at game start.
//
// A player may declare exactly one 6 or 7 - either "dry" (face-down) or
// "show dry" (face-up) - or skip entirely (a player who never sends this event
// simply plays on). The declared card STAYS in the player's hand: the bonus is
// only paid if they win the FINAL round by playing that exact card (see the
// final-round scoring block in handleRoundCompletion). The declaring window is
// the opening round, before the declaring player has committed a card.
//
// NOTE (ticket 07 seam): a hidden ("dry") declaration is broadcast to opponents
// as type + player only - the card identity is withheld here and in the game
// state serialization until a successful flag/challenge reveals it. The reveal
// resolution is ticket 07's responsibility; this handler only establishes the
// hidden/shown state and the "declared" fact that a flag can act on.
func (c *Client) handleDeclareDry(data json.RawMessage) {
	slog.Info("Declare dry event", "clientId", c.ID, "playerId", c.PlayerID)

	// Parse request (see contract.go / wireContract.ts - DeclareDryPayload).
	// Accept either backend value ("6") or frontend rank notation.
	var req struct {
		Card struct {
			Suit  string `json:"suit"`
			Value string `json:"value"`
			Rank  string `json:"rank"`
		} `json:"card"`
		IsShown bool `json:"isShown"`
	}
	if err := json.Unmarshal(data, &req); err != nil {
		slog.Error("Failed to parse declare dry request", "error", err)
		c.sendError("game:dry_error", "Invalid request format")
		return
	}

	cardValue := req.Card.Value
	if cardValue == "" {
		cardValue = req.Card.Rank
	}
	cardValue = mapFrontendRankToBackend(cardValue)

	// Validate player is authenticated
	if c.PlayerID == "" {
		slog.Warn("Unauthenticated player attempted to declare dry", "clientId", c.ID)
		c.sendError("game:dry_error", "Authentication required")
		return
	}

	// Validate player is in a room
	if c.RoomID == "" {
		c.sendError("game:dry_error", "Not in a room")
		return
	}

	// The game state is authoritative; operate on it under the games lock.
	gamesMu.Lock()
	defer gamesMu.Unlock()

	gameState, exists := games[c.RoomID]
	if !exists {
		c.sendError("game:dry_error", "Game not found")
		return
	}

	// Declarations are only accepted during the opening round of the game,
	// before the declaring player has played a card. This is the skippable
	// declaring window at game start.
	if gameState.Phase != entity.PhasePlaying {
		c.sendError("game:dry_error", "Game is not in playing phase")
		return
	}
	if gameState.CurrentRound != 1 {
		c.sendError("game:dry_error", "Dry can only be declared at the start of the game")
		return
	}

	player := gameState.GetPlayer(c.PlayerID)
	if player == nil {
		slog.Error("Player not found in game state", "playerId", c.PlayerID, "roomCode", c.RoomID)
		c.sendError("game:dry_error", "Player not found in game")
		return
	}
	if player.HasPlayedCard {
		c.sendError("game:dry_error", "Cannot declare after playing a card")
		return
	}

	// One declaration per game.
	if player.DryCard != nil {
		c.sendError("game:dry_error", "Already declared a dry card")
		return
	}

	card := &entity.Card{
		Suit:  entity.Suit(req.Card.Suit),
		Value: entity.Value(cardValue),
	}
	if !card.IsValid() {
		c.sendError("game:dry_error", "Invalid card")
		return
	}
	// Only a 6 or 7 is eligible.
	if !card.IsLowCard() {
		c.sendError("game:dry_error", "Only a 6 or 7 can be declared as dry")
		return
	}
	// The player must actually hold the card.
	if !player.HasCard(card) {
		c.sendError("game:dry_error", "Card not in your hand")
		return
	}

	// Record the declaration (card is NOT removed from the hand).
	dryType := entity.DryHidden
	if req.IsShown {
		dryType = entity.DryShown
	}
	player.DryCard = &entity.DryCard{
		Card:     *card,
		Type:     dryType,
		PlayerID: c.PlayerID,
	}
	gameState.UpdatedAt = time.Now()

	slog.Info("Dry card declared",
		"playerId", c.PlayerID,
		"roomCode", c.RoomID,
		"card", card.String(),
		"type", dryType,
		"isShown", req.IsShown,
	)

	// Confirm to the declarer, who always sees their own card.
	c.sendJSON(map[string]interface{}{
		"event": "game:dry_declared",
		"data": map[string]interface{}{
			"playerId": c.PlayerID,
			"card":     convertCardToFrontendFormat(card),
			"type":     dryType,
			"isShown":  req.IsShown,
		},
	})

	// Tell the rest of the room. A hidden dry reveals only THAT a declaration
	// was made (type + player); the card identity stays secret until a flag
	// reveals it (ticket 07). A show-dry reveals the card face-up.
	declared := map[string]interface{}{
		"playerId": c.PlayerID,
		"type":     dryType,
		"isShown":  req.IsShown,
	}
	if req.IsShown {
		declared["card"] = convertCardToFrontendFormat(card)
	}
	c.broadcastToRoom(c.RoomID, map[string]interface{}{
		"event": "game:player_declared_dry",
		"data":  declared,
	})
}

// FlagPenaltyPoints is the match-score penalty applied to the losing side of a
// flag resolution. A correct flag charges the offender; a wrong flag charges the
// challenger. Either way the current game is voided (see handleFlagPlayer).
const FlagPenaltyPoints = 3

// handleFlagPlayer resolves a flag: any player may accuse another of an illegal
// move (breaking suit while still holding the led suit). The accusation is
// judged against the accused's ACTUAL holdings:
//
//   - CORRECT flag  -> the offender loses FlagPenaltyPoints on the cumulative
//     match score.
//   - WRONG flag    -> the challenger loses FlagPenaltyPoints instead.
//
// Either way the whole current game is VOIDED and reshuffled into a fresh game
// via the shared new-game path, while the cumulative MATCH score persists across
// the void. The accused's hand is revealed on resolution.
//
// SEAM FOR TICKET 06 (dry-challenge): this handler resolves the ILLEGAL-MOVE
// case only. A dry / show-dry challenge is a related-but-separate flow that
// would branch here on a declared DryCard before the illegal-move check; the
// void/-3/reshuffle machinery below can be reused once that resolution exists.
func (c *Client) handleFlagPlayer(data json.RawMessage) {
	slog.Info("Flag player event", "clientId", c.ID, "playerId", c.PlayerID)

	// Parse request (see contract.go / wireContract.ts - FlagPlayerPayload)
	var req struct {
		TargetPlayerID string `json:"targetPlayerId"`
		RoundIndex     int    `json:"roundIndex"`
		CardIndex      int    `json:"cardIndex"`
	}
	if err := json.Unmarshal(data, &req); err != nil {
		slog.Error("Failed to parse flag player request", "error", err)
		c.sendError("game:flag_error", "Invalid request format")
		return
	}

	// Validate player is authenticated
	if c.PlayerID == "" {
		slog.Warn("Unauthenticated player attempted to flag", "clientId", c.ID)
		c.sendError("game:flag_error", "Authentication required")
		return
	}

	// Validate player is in a room
	if c.RoomID == "" {
		c.sendError("game:flag_error", "Not in a room")
		return
	}

	challengerID := c.PlayerID
	targetID := req.TargetPlayerID

	// All state mutation happens under gamesMu so the read-decide-void-replace
	// sequence is atomic against concurrent plays/flags on the same room.
	gamesMu.Lock()

	gs, exists := games[c.RoomID]
	if !exists {
		gamesMu.Unlock()
		c.sendError("game:flag_error", "Game not found")
		return
	}

	// Flags only make sense while a round is live or just ended.
	if gs.Phase != entity.PhasePlaying && gs.Phase != entity.PhaseRoundEnd {
		gamesMu.Unlock()
		c.sendError("game:flag_error", "Game is not active")
		return
	}

	if targetID == "" {
		gamesMu.Unlock()
		c.sendError("game:flag_error", "No target specified")
		return
	}
	if targetID == challengerID {
		gamesMu.Unlock()
		c.sendError("game:flag_error", "Cannot flag yourself")
		return
	}
	if gs.GetPlayer(challengerID) == nil {
		gamesMu.Unlock()
		c.sendError("game:flag_error", "Challenger not in game")
		return
	}
	accused := gs.GetPlayer(targetID)
	if accused == nil {
		gamesMu.Unlock()
		c.sendError("game:flag_error", "Target not in game")
		return
	}

	// Resolve correctness against the accused's ACTUAL holdings. Illegal move =
	// the accused's most recent play broke suit (played != led) while they still
	// held the led suit. Because a player plays at most once per round and an
	// off-suit play never removes a led-suit card, the accused's current hand is
	// an exact witness of whether they held the led suit when they played.
	//
	// Judge against the live round while one is active (LedSuit set). Once the
	// round-completing play resets LedSuit / PlayedCards, fall back to the
	// last-completed-round snapshot so the player whose card completed the round
	// (in a 2-player game, the follower every round) is still flaggable.
	var effectiveLedSuit *entity.Suit
	var accusedPlayed *entity.PlayedCard
	if gs.LedSuit != nil {
		effectiveLedSuit = gs.LedSuit
		accusedPlayed = gs.GetPlayedCard(targetID)
	} else if gs.LastRound != nil {
		effectiveLedSuit = gs.LastRound.LedSuit
		accusedPlayed = gs.LastRound.GetPlayedCard(targetID)
	}

	illegal := false
	ledSuit := ""
	if effectiveLedSuit != nil {
		ledSuit = string(*effectiveLedSuit)
		if accusedPlayed != nil &&
			accusedPlayed.Card.Suit != *effectiveLedSuit &&
			accused.HasSuit(*effectiveLedSuit) {
			illegal = true
		}
	}

	// Apply the -3 penalty to the losing side.
	penalizedID := challengerID
	if illegal {
		penalizedID = targetID
	}
	penalizedTotal := addMatchScore(c.RoomID, penalizedID, -FlagPenaltyPoints)

	// Reveal the accused's hand (their remaining cards - the evidence of whether
	// they held the led suit) plus the card they played this round.
	revealedHand := convertCardsToFrontendFormat(accused.Hand)
	var accusedCard interface{}
	if accusedPlayed != nil {
		accusedCard = convertCardToFrontendFormat(&accusedPlayed.Card)
	}

	resolutionPayload := map[string]interface{}{
		"event": "game:flag_resolved",
		"data": map[string]interface{}{
			"challengerId":        challengerID,
			"accusedId":           targetID,
			"correct":             illegal,
			"penalizedId":         penalizedID,
			"penalty":             FlagPenaltyPoints,
			"ledSuit":             ledSuit,
			"accusedCard":         accusedCard,
			"revealedHand":        revealedHand,
			"penalizedMatchScore": penalizedTotal,
			"matchScores":         matchScoreSnapshot(c.RoomID),
			"voided":              true,
		},
	}

	// Void -> reshuffle -> fresh game. reshuffleFreshGame re-seeds each player's
	// MatchScore from the persistent store, so the -3 just applied carries over
	// while all per-game state resets.
	freshGame, err := reshuffleFreshGame(gs)
	if err != nil {
		gamesMu.Unlock()
		slog.Error("Failed to reshuffle after flag", "error", err, "roomCode", c.RoomID)
		c.sendError("game:flag_error", "Failed to start fresh game")
		return
	}
	games[c.RoomID] = freshGame

	startedPayload := map[string]interface{}{
		"event": "game:started",
		"data": map[string]interface{}{
			"roomCode":     c.RoomID,
			"gameState":    convertGameStateToFrontendFormat(freshGame),
			"voidedByFlag": true,
		},
	}

	gamesMu.Unlock()

	// Broadcast outside the lock: first the resolution (who was penalized + the
	// revealed hand), then the reshuffled game so every client reloads the table.
	c.broadcastToRoomIncludingSelf(c.RoomID, resolutionPayload)
	c.broadcastToRoomIncludingSelf(c.RoomID, startedPayload)

	slog.Info("Flag resolved",
		"challengerId", challengerID,
		"accusedId", targetID,
		"correct", illegal,
		"penalizedId", penalizedID,
		"penalizedMatchScore", penalizedTotal,
		"roomCode", c.RoomID,
		"newGameId", freshGame.GameID,
	)
}

func (c *Client) handleCreateLobby(data json.RawMessage) {
	slog.Info("Create lobby event", "clientId", c.ID, "playerId", c.PlayerID)

	// Parse request (see contract.go / wireContract.ts - CreateLobbyPayload)
	var req CreateLobbyPayload
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
		"event": "room:created",
		"data": map[string]interface{}{
			"roomCode":   room.RoomCode,
			"hostId":     room.HostID,
			"maxPlayers": room.MaxPlayers,
			"settings":   room.Settings,
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

	// Send success event to joiner with full room data
	c.sendJSON(map[string]interface{}{
		"event": "room:player_joined",
		"data": map[string]interface{}{
			"roomCode": room.RoomCode,
			"players":  room.Players,
			"player":   room.Players[len(room.Players)-1], // The player who just joined
		},
	})

	// Broadcast player joined to all OTHER room members
	c.broadcastToRoom(room.RoomCode, map[string]interface{}{
		"event": "room:player_joined",
		"data": map[string]interface{}{
			"roomCode": room.RoomCode,
			"players":  room.Players,
			"player":   room.Players[len(room.Players)-1],
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
		// Room still exists, broadcast player left to remaining members.
		// Contract: room:player_left carries the updated player list and the
		// (possibly migrated) host id so the lobby UI can resync directly.
		c.broadcastToRoom(roomCode, map[string]interface{}{
			"event": "room:player_left",
			"data": map[string]interface{}{
				"playerId":  c.PlayerID,
				"players":   room.Players,
				"newHostId": room.HostID,
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

func (c *Client) handlePlayerReady(data json.RawMessage) {
	slog.Info("Player ready event", "clientId", c.ID, "playerId", c.PlayerID)

	// Parse request
	var req struct {
		IsReady bool `json:"isReady"`
	}
	if err := json.Unmarshal(data, &req); err != nil {
		slog.Error("Failed to parse player ready request", "error", err)
		c.sendError("lobby:error", "Invalid request format")
		return
	}

	// Validate player is authenticated
	if c.PlayerID == "" {
		slog.Warn("Unauthenticated player attempted to set ready", "clientId", c.ID)
		c.sendError("lobby:error", "Authentication required")
		return
	}

	// Validate player is in a room
	if c.RoomID == "" {
		c.sendError("lobby:error", "Not in a room")
		return
	}

	// Get room
	room, err := roomManager.GetRoom(c.RoomID)
	if err != nil {
		slog.Error("Failed to get room", "error", err, "roomCode", c.RoomID)
		c.sendError("lobby:error", "Room not found")
		return
	}

	// Update player ready state in room
	ctx := context.Background()
	err = roomManager.SetPlayerReady(ctx, c.RoomID, c.PlayerID, req.IsReady)
	if err != nil {
		slog.Error("Failed to set player ready", "error", err, "roomCode", c.RoomID, "playerId", c.PlayerID)
		c.sendError("lobby:error", "Failed to update ready state")
		return
	}

	// Get updated room
	room, err = roomManager.GetRoom(c.RoomID)
	if err != nil {
		slog.Error("Failed to get updated room", "error", err, "roomCode", c.RoomID)
		return
	}

	// Check if all players are ready
	allReady := true
	for _, player := range room.Players {
		if !player.IsReady {
			allReady = false
			break
		}
	}

	// Broadcast ready state to all players in room
	c.broadcastToRoomIncludingSelf(c.RoomID, map[string]interface{}{
		"event": "room:player_ready",
		"data": map[string]interface{}{
			"playerId": c.PlayerID,
			"isReady":  req.IsReady,
			"allReady": allReady,
			"players":  room.Players,
		},
	})

	slog.Info("Player ready state updated", "roomCode", c.RoomID, "playerId", c.PlayerID, "isReady", req.IsReady, "allReady", allReady)
}

func (c *Client) handleStartGame(data json.RawMessage) {
	slog.Info("Start game event", "clientId", c.ID, "playerId", c.PlayerID)

	// Validate player is authenticated
	if c.PlayerID == "" {
		slog.Warn("Unauthenticated player attempted to start game", "clientId", c.ID)
		c.sendError("lobby:error", "Authentication required")
		return
	}

	// Validate player is in a room
	if c.RoomID == "" {
		c.sendError("lobby:error", "Not in a room")
		return
	}

	// Get room
	room, err := roomManager.GetRoom(c.RoomID)
	if err != nil {
		slog.Error("Failed to get room", "error", err, "roomCode", c.RoomID)
		c.sendError("lobby:error", "Room not found")
		return
	}

	// Validate player is host
	if room.HostID != c.PlayerID {
		c.sendError("lobby:error", "Only the host can start the game")
		return
	}

	// Validate all players are ready
	for _, player := range room.Players {
		if !player.IsReady {
			c.sendError("lobby:error", "All players must be ready before starting")
			return
		}
	}

	// Validate minimum players
	if len(room.Players) < 2 {
		c.sendError("lobby:error", "Need at least 2 players to start")
		return
	}

	// Update room status to in-progress
	ctx := context.Background()
	err = roomManager.StartGame(ctx, c.RoomID)
	if err != nil {
		slog.Error("Failed to start game", "error", err, "roomCode", c.RoomID)
		c.sendError("lobby:error", "Failed to start game")
		return
	}

	// Initialize game state with shuffled deck and dealt cards
	gameState, err := initializeGameState(room)
	if err != nil {
		slog.Error("Failed to initialize game state", "error", err, "roomCode", c.RoomID)
		c.sendError("lobby:error", "Failed to initialize game")
		return
	}

	// Store game state in thread-safe map
	gamesMu.Lock()
	games[c.RoomID] = gameState
	gamesMu.Unlock()

	slog.Info("Game state initialized",
		"roomCode", c.RoomID,
		"gameId", gameState.GameID,
		"playerCount", len(gameState.Players),
		"cardsDealt", len(gameState.Players)*5,
	)

	// Broadcast game started with frontend-formatted game state to all players
	c.broadcastToRoomIncludingSelf(c.RoomID, map[string]interface{}{
		"event": "game:started",
		"data": map[string]interface{}{
			"roomCode":  c.RoomID,
			"gameState": convertGameStateToFrontendFormat(gameState),
		},
	})

	// Arm the turn timer for the opening leader (on deck).
	gamesMu.Lock()
	turnTimers.reset(c.RoomID, gameState)
	gamesMu.Unlock()

	slog.Info("Game started successfully",
		"roomCode", c.RoomID,
		"gameId", gameState.GameID,
		"playerCount", len(room.Players),
	)
}

// handleUpdateSettings applies a host-initiated room settings change and
// broadcasts the new settings to the room. The payload may be partial: only
// the provided fields are merged over the room's existing settings.
func (c *Client) handleUpdateSettings(data json.RawMessage) {
	slog.Info("Update settings event", "clientId", c.ID, "playerId", c.PlayerID)

	// Parse request (see contract.go / wireContract.ts - UpdateSettingsPayload)
	var req UpdateSettingsPayload
	if err := json.Unmarshal(data, &req); err != nil {
		slog.Error("Failed to parse update settings request", "error", err)
		c.sendError("lobby:error", "Invalid request format")
		return
	}

	// Validate player is authenticated
	if c.PlayerID == "" {
		slog.Warn("Unauthenticated player attempted to update settings", "clientId", c.ID)
		c.sendError("lobby:error", "Authentication required")
		return
	}

	// Validate player is in a room
	if c.RoomID == "" {
		c.sendError("lobby:error", "Not in a room")
		return
	}

	// Get current room to merge partial settings over existing values
	room, err := roomManager.GetRoom(c.RoomID)
	if err != nil {
		slog.Error("Failed to get room", "error", err, "roomCode", c.RoomID)
		c.sendError("lobby:error", "Room not found")
		return
	}

	// Merge provided fields over the existing settings
	merged := room.Settings
	if req.Settings.PointsToWin != nil {
		merged.PointsToWin = *req.Settings.PointsToWin
	}
	if req.Settings.SurfaceTheme != nil {
		merged.SurfaceTheme = *req.Settings.SurfaceTheme
	}
	if req.Settings.MaxPlayers != nil {
		merged.MaxPlayers = *req.Settings.MaxPlayers
	}

	// Apply (room manager enforces host-only and clamps max players)
	ctx := context.Background()
	updatedRoom, err := roomManager.UpdateRoomSettings(ctx, entity.UpdateRoomSettingsRequest{
		RoomCode: c.RoomID,
		HostID:   c.PlayerID,
		Settings: merged,
	})
	if err != nil {
		slog.Error("Failed to update room settings", "error", err, "roomCode", c.RoomID, "playerId", c.PlayerID)
		c.sendError("lobby:error", err.Error())
		return
	}

	// Broadcast the new settings to everyone in the room (including the host)
	c.broadcastToRoomIncludingSelf(c.RoomID, map[string]interface{}{
		"event": "room:settings_updated",
		"data": map[string]interface{}{
			"settings": updatedRoom.Settings,
		},
	})

	slog.Info("Room settings updated and broadcast", "roomCode", c.RoomID, "playerId", c.PlayerID)
}

func (c *Client) handleRestartGame(data json.RawMessage) {
	slog.Info("Restart game event", "clientId", c.ID, "playerId", c.PlayerID)

	// Validate player is authenticated
	if c.PlayerID == "" {
		slog.Warn("Unauthenticated player attempted to restart game", "clientId", c.ID)
		c.sendError("lobby:error", "Authentication required")
		return
	}

	// Validate player is in a room
	if c.RoomID == "" {
		c.sendError("lobby:error", "Not in a room")
		return
	}

	// Get room
	room, err := roomManager.GetRoom(c.RoomID)
	if err != nil {
		slog.Error("Failed to get room", "error", err, "roomCode", c.RoomID)
		c.sendError("lobby:error", "Room not found")
		return
	}

	// Validate player is host
	if room.HostID != c.PlayerID {
		c.sendError("lobby:error", "Only the host can restart the game")
		return
	}

	// 1. Delete old game state (and stop its turn timer to avoid a leaked
	// goroutine auto-playing into a discarded game).
	turnTimers.stop(c.RoomID)
	gamesMu.Lock()
	delete(games, c.RoomID)
	gamesMu.Unlock()
	slog.Info("Old game state deleted", "roomCode", c.RoomID)

	// 2. Reset room status to allow starting a new game
	room.Status = entity.StatusReady
	room.StartedAt = nil
	room.UpdatedAt = time.Now()

	// 3. Reset all player ready states to true (they were already playing)
	for i := range room.Players {
		room.Players[i].IsReady = true
	}

	slog.Info("Room reset for restart",
		"roomCode", c.RoomID,
		"status", room.Status,
		"playerCount", len(room.Players))

	// 4. Initialize new game state
	gameState, err := initializeGameState(room)
	if err != nil {
		slog.Error("Failed to initialize game state", "error", err, "roomCode", c.RoomID)
		c.sendError("lobby:error", "Failed to initialize game")
		return
	}

	// Update room status to in-progress
	room.Status = entity.StatusInProgress
	now := time.Now()
	room.StartedAt = &now
	room.UpdatedAt = now

	// Store game state
	gamesMu.Lock()
	games[c.RoomID] = gameState
	gamesMu.Unlock()

	slog.Info("Game restarted successfully",
		"roomCode", c.RoomID,
		"gameId", gameState.GameID,
		"playerCount", len(gameState.Players))

	// Broadcast game restarted event with full game state
	c.broadcastToRoomIncludingSelf(c.RoomID, map[string]interface{}{
		"event": "game:restarted",
		"data": map[string]interface{}{
			"roomCode":  c.RoomID,
			"gameState": convertGameStateToFrontendFormat(gameState),
		},
	})

	// Arm the turn timer for the opening leader of the restarted game.
	gamesMu.Lock()
	turnTimers.reset(c.RoomID, gameState)
	gamesMu.Unlock()
}

// pickRandomLeaderIndex returns a uniformly random player index in [0, numPlayers)
// to seat the leader of the very first round. Subsequent rounds are led by the
// prior round's winner (see handleRoundCompletion), not by this function.
func pickRandomLeaderIndex(numPlayers int) int {
	if numPlayers <= 1 {
		return 0
	}
	return rand.Intn(numPlayers)
}

// playerSeed is the minimal per-player identity buildFreshGame needs to seat a
// player into a brand-new game. Per-game state (hand, score, streak) is always
// rebuilt from scratch; only identity carries over.
type playerSeed struct {
	ID       string
	Username string
	Avatar   string
}

// buildFreshGame deals a shuffled deck to the given players and returns a
// pristine PhasePlaying game for the room. Per-game state starts empty for
// everyone, but each player's cumulative MatchScore is seeded from the
// persistent match-score store, so any match-score changes recorded before this
// call (win-streak bonuses, flag penalties) carry into the new game. This is the
// single new-game path shared by game start, play-again, and flag-void reshuffle.
func buildFreshGame(roomCode string, pointsToWin int, seeds []playerSeed) (*entity.GameState, error) {
	// Create and shuffle deck
	deck := entity.NewDeck()
	deck.Shuffle()

	// Deal cards to players
	hands, err := deck.Deal(len(seeds))
	if err != nil {
		return nil, fmt.Errorf("failed to deal cards: %w", err)
	}

	// Pick a random leader for the first round. The winner of each round leads
	// the next one, so this randomness only applies to the opening round.
	leaderIndex := pickRandomLeaderIndex(len(seeds))

	// Convert seeds to game players with dealt hands
	gamePlayers := make([]entity.GamePlayer, len(seeds))
	for i, seed := range seeds {
		gamePlayers[i] = entity.GamePlayer{
			ID:       seed.ID,
			Username: seed.Username,
			Avatar:   seed.Avatar,
			Hand:     hands[i],
			DryCard:  nil,
			// Per-game state starts fresh every game...
			Score:     0,
			RoundsWon: 0,
			WinStreak: 0,
			// ...but the cumulative MATCH score persists across every game
			// (play-again, flag-void reshuffle) played in this room.
			MatchScore:     getMatchScore(roomCode, seed.ID),
			IsLeader:       i == leaderIndex, // Randomly seated initial leader
			IsOnFire:       false,
			HasPlayedCard:  false,
			LastPlayedCard: nil,
		}
	}

	// Generate unique game ID
	now := time.Now()
	gameID := fmt.Sprintf("game-%s-%d", roomCode, now.UnixNano())

	// Create game state
	gameState := &entity.GameState{
		GameID:           gameID,
		RoomCode:         roomCode,
		TotalRounds:      5,
		PointsToWin:      pointsToWin,
		Phase:            entity.PhasePlaying,
		Players:          gamePlayers,
		LeaderID:         gamePlayers[leaderIndex].ID,
		CurrentTurn:      gamePlayers[leaderIndex].ID,
		CurrentRound:     1,
		LedSuit:          nil,
		PlayedCards:      []entity.PlayedCard{},
		RoundWinner:      "",
		TurnStartTime:    now,
		TurnTimeLimit:    30,
		TurnExpired:      false,
		FireStreakPlayer: "",
		FreezeTriggered:  false,
		StartedAt:        now,
		CompletedAt:      nil,
		UpdatedAt:        now,
	}

	return gameState, nil
}

// initializeGameState creates a new game state with shuffled deck and dealt cards
func initializeGameState(room *entity.Room) (*entity.GameState, error) {
	seeds := make([]playerSeed, len(room.Players))
	for i, player := range room.Players {
		seeds[i] = playerSeed{ID: player.ID, Username: player.Username, Avatar: player.Avatar}
	}
	return buildFreshGame(room.RoomCode, room.Settings.PointsToWin, seeds)
}

// reshuffleFreshGame voids the supplied game and returns a brand-new game for the
// same room and the same players. It reuses the exact new-game path
// (buildFreshGame), so per-game state resets while each player's cumulative
// MatchScore is re-seeded from the persistent store. Callers must apply any
// match-score penalty (via addMatchScore) BEFORE calling this so the penalty is
// reflected in the fresh game's seeded MatchScore.
func reshuffleFreshGame(voided *entity.GameState) (*entity.GameState, error) {
	seeds := make([]playerSeed, len(voided.Players))
	for i, player := range voided.Players {
		seeds[i] = playerSeed{ID: player.ID, Username: player.Username, Avatar: player.Avatar}
	}
	return buildFreshGame(voided.RoomCode, voided.PointsToWin, seeds)
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

// broadcastToRoom sends a message to all clients in a specific room (excluding sender)
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

// broadcastToRoomIncludingSelf sends a message to all clients in a room (including sender)
func (c *Client) broadcastToRoomIncludingSelf(roomCode string, data interface{}) {
	message, err := json.Marshal(data)
	if err != nil {
		slog.Error("Failed to marshal room broadcast message", "error", err)
		return
	}

	c.Hub.mu.RLock()
	defer c.Hub.mu.RUnlock()

	sentCount := 0
	failedCount := 0

	for client := range c.Hub.Clients {
		if client.RoomID == roomCode {
			select {
			case client.Send <- message:
				sentCount++
				slog.Debug("Message sent to client",
					"clientId", client.ID,
					"playerId", client.PlayerID,
					"roomCode", roomCode,
				)
			default:
				failedCount++
				slog.Warn("Failed to send message to client",
					"clientId", client.ID,
					"playerId", client.PlayerID,
					"roomCode", roomCode,
				)
			}
		}
	}

	slog.Info("Room broadcast summary",
		"roomCode", roomCode,
		"sentCount", sentCount,
		"failedCount", failedCount,
	)
}

// generateClientID generates a unique client ID
func generateClientID() string {
	// TODO: Use UUID or more robust ID generation
	return time.Now().Format("20060102150405")
}

// Matchmaking event handlers

func (c *Client) handleMatchmakingJoin(data json.RawMessage) {
	slog.Info("Matchmaking join event", "clientId", c.ID, "playerId", c.PlayerID)

	// Validate player is authenticated
	if c.PlayerID == "" {
		slog.Warn("Unauthenticated player attempted to join matchmaking", "clientId", c.ID)
		c.sendError("matchmaking:error", "Authentication required")
		return
	}

	// Check if player is already in a game room
	if c.RoomID != "" {
		c.sendError("matchmaking:error", "Cannot join matchmaking while in a game room")
		return
	}

	// Get username from user repository or use PlayerID as fallback
	username := c.PlayerID
	if userRepository != nil {
		user, err := userRepository.FindByID(context.Background(), c.PlayerID)
		if err == nil && user != nil {
			username = user.Username
		}
	}

	// Join matchmaking queue
	err := matchmakingQueue.JoinQueue(c.PlayerID, username, c)
	if err != nil {
		slog.Error("Failed to join matchmaking queue",
			"playerId", c.PlayerID,
			"error", err)
		c.sendError("matchmaking:error", "Failed to join matchmaking queue: "+err.Error())
		return
	}

	slog.Info("Player joined matchmaking queue successfully",
		"playerId", c.PlayerID,
		"username", username)
}

func (c *Client) handleMatchmakingLeave(data json.RawMessage) {
	slog.Info("Matchmaking leave event", "clientId", c.ID, "playerId", c.PlayerID)

	// Validate player is authenticated
	if c.PlayerID == "" {
		slog.Warn("Unauthenticated player attempted to leave matchmaking", "clientId", c.ID)
		c.sendError("matchmaking:error", "Authentication required")
		return
	}

	// Leave matchmaking queue
	err := matchmakingQueue.LeaveQueue(c.PlayerID)
	if err != nil {
		slog.Error("Failed to leave matchmaking queue",
			"playerId", c.PlayerID,
			"error", err)
		c.sendError("matchmaking:error", "Failed to leave matchmaking queue: "+err.Error())
		return
	}

	slog.Info("Player left matchmaking queue successfully", "playerId", c.PlayerID)
}

func (c *Client) handleMatchmakingStatus(data json.RawMessage) {
	slog.Info("Matchmaking status event", "clientId", c.ID, "playerId", c.PlayerID)

	// Validate player is authenticated
	if c.PlayerID == "" {
		slog.Warn("Unauthenticated player requested matchmaking status", "clientId", c.ID)
		c.sendError("matchmaking:error", "Authentication required")
		return
	}

	// Get queue status
	status := matchmakingQueue.GetQueueStatus(c.PlayerID)

	// Send status response
	c.sendJSON(map[string]interface{}{
		"event": "matchmaking:status",
		"data":  status,
	})

	slog.Info("Sent matchmaking status", "playerId", c.PlayerID, "status", status)
}

// SendJSON sends a JSON message to the client
// This implements the matchmaking.ClientConnection interface
func (c *Client) SendJSON(data interface{}) error {
	message, err := json.Marshal(data)
	if err != nil {
		return err
	}

	select {
	case c.Send <- message:
		return nil
	default:
		return fmt.Errorf("client send channel full")
	}
}
