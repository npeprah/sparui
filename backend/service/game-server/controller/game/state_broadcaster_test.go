package game

import (
	"context"
	"fmt"
	"sync"
	"testing"
	"time"

	"github.com/npeprah/sparui/backend/service/game-server/entity"
)

// TestStateBroadcasterStartAndStop tests starting and stopping broadcasters
func TestStateBroadcasterStartAndStop(t *testing.T) {
	var mu sync.Mutex
	broadcastCount := 0

	broadcastFunc := func(roomCode, event string, data interface{}) error {
		mu.Lock()
		defer mu.Unlock()
		broadcastCount++
		return nil
	}

	sb := NewStateBroadcaster(broadcastFunc, 100*time.Millisecond)
	defer sb.Cleanup()

	ctx := context.Background()

	// Mock state getter
	getState := func() *entity.GameState {
		return &entity.GameState{
			GameID:       "game-1",
			RoomCode:     "ROOM01",
			Phase:        entity.PhasePlaying,
			CurrentRound: 1,
			Players:      []entity.GamePlayer{},
		}
	}

	getTurnRemaining := func() int { return 10 }

	// Start broadcasting
	err := sb.StartBroadcasting(ctx, "game-1", "ROOM01", getState, getTurnRemaining)
	if err != nil {
		t.Fatalf("StartBroadcasting failed: %v", err)
	}

	// Verify broadcaster is active
	if !sb.IsActive("game-1") {
		t.Error("Broadcaster should be active")
	}

	// Wait for a few broadcasts
	time.Sleep(350 * time.Millisecond)

	// Stop broadcasting
	sb.StopBroadcasting("game-1")

	// Verify broadcaster is stopped
	if sb.IsActive("game-1") {
		t.Error("Broadcaster should not be active after stop")
	}

	// Verify at least a few broadcasts happened
	mu.Lock()
	defer mu.Unlock()
	if broadcastCount < 2 {
		t.Errorf("Expected at least 2 broadcasts, got %d", broadcastCount)
	}
}

// TestStateBroadcasterMultipleGames tests managing multiple game broadcasters
func TestStateBroadcasterMultipleGames(t *testing.T) {
	var mu sync.Mutex
	broadcastData := make(map[string]int)

	broadcastFunc := func(roomCode, event string, data interface{}) error {
		mu.Lock()
		defer mu.Unlock()
		broadcastData[roomCode]++
		return nil
	}

	sb := NewStateBroadcaster(broadcastFunc, 100*time.Millisecond)
	defer sb.Cleanup()

	ctx := context.Background()

	// Start broadcasters for multiple games
	for i := 1; i <= 3; i++ {
		gameID := fmt.Sprintf("game-%d", i)
		roomCode := fmt.Sprintf("ROOM%02d", i)

		getState := func(gid, rc string) func() *entity.GameState {
			return func() *entity.GameState {
				return &entity.GameState{
					GameID:   gid,
					RoomCode: rc,
					Phase:    entity.PhasePlaying,
				}
			}
		}(gameID, roomCode)

		getTurnRemaining := func() int { return 10 }

		err := sb.StartBroadcasting(ctx, gameID, roomCode, getState, getTurnRemaining)
		if err != nil {
			t.Fatalf("StartBroadcasting failed for %s: %v", gameID, err)
		}
	}

	// Verify all broadcasters are active
	for i := 1; i <= 3; i++ {
		gameID := fmt.Sprintf("game-%d", i)
		if !sb.IsActive(gameID) {
			t.Errorf("Broadcaster for %s should be active", gameID)
		}
	}

	// Wait for broadcasts
	time.Sleep(350 * time.Millisecond)

	// Stop one broadcaster
	sb.StopBroadcasting("game-2")

	// Verify correct broadcaster was stopped
	if sb.IsActive("game-2") {
		t.Error("game-2 broadcaster should not be active")
	}
	if !sb.IsActive("game-1") || !sb.IsActive("game-3") {
		t.Error("game-1 and game-3 broadcasters should still be active")
	}

	// Verify all rooms received broadcasts
	mu.Lock()
	defer mu.Unlock()
	if broadcastData["ROOM01"] < 2 || broadcastData["ROOM03"] < 2 {
		t.Errorf("Expected at least 2 broadcasts per room, got %v", broadcastData)
	}
}

// TestStateBroadcasterReplaceExisting tests replacing an existing broadcaster
func TestStateBroadcasterReplaceExisting(t *testing.T) {
	var mu sync.Mutex
	broadcastCount := 0

	broadcastFunc := func(roomCode, event string, data interface{}) error {
		mu.Lock()
		defer mu.Unlock()
		broadcastCount++
		return nil
	}

	sb := NewStateBroadcaster(broadcastFunc, 100*time.Millisecond)
	defer sb.Cleanup()

	ctx := context.Background()

	getState := func() *entity.GameState {
		return &entity.GameState{
			GameID:   "game-1",
			RoomCode: "ROOM01",
			Phase:    entity.PhasePlaying,
		}
	}

	getTurnRemaining := func() int { return 10 }

	// Start first broadcaster
	err := sb.StartBroadcasting(ctx, "game-1", "ROOM01", getState, getTurnRemaining)
	if err != nil {
		t.Fatalf("StartBroadcasting failed: %v", err)
	}

	// Wait for a broadcast
	time.Sleep(150 * time.Millisecond)

	mu.Lock()
	firstCount := broadcastCount
	mu.Unlock()

	// Start second broadcaster for same game (should replace)
	err = sb.StartBroadcasting(ctx, "game-1", "ROOM01", getState, getTurnRemaining)
	if err != nil {
		t.Fatalf("StartBroadcasting replace failed: %v", err)
	}

	// Wait for more broadcasts
	time.Sleep(150 * time.Millisecond)

	mu.Lock()
	secondCount := broadcastCount
	mu.Unlock()

	// Verify broadcasts continued with new broadcaster
	if secondCount <= firstCount {
		t.Errorf("Expected broadcasts to continue after replacement, got %d -> %d", firstCount, secondCount)
	}
}

// TestStateBroadcasterBuildStateUpdate tests state update building
func TestStateBroadcasterBuildStateUpdate(t *testing.T) {
	broadcastFunc := func(roomCode, event string, data interface{}) error { return nil }
	sb := NewStateBroadcaster(broadcastFunc, 2*time.Second)

	ledSuit := entity.Hearts
	state := &entity.GameState{
		GameID:       "game-1",
		RoomCode:     "ROOM01",
		Phase:        entity.PhasePlaying,
		CurrentRound: 3,
		TotalRounds:  5,
		LeaderID:     "player-1",
		CurrentTurn:  "player-2",
		LedSuit:      &ledSuit,
		Players: []entity.GamePlayer{
			{
				ID:       "player-1",
				Username: "Alice",
				Avatar:   "avatar1",
				Hand: []entity.Card{
					{Suit: entity.Hearts, Value: entity.Ace},
					{Suit: entity.Clubs, Value: entity.King},
				},
				Score:         5,
				RoundsWon:     2,
				WinStreak:     1,
				IsLeader:      true,
				IsOnFire:      false,
				HasPlayedCard: true,
			},
			{
				ID:            "player-2",
				Username:      "Bob",
				Avatar:        "avatar2",
				Hand:          []entity.Card{{Suit: entity.Diamonds, Value: entity.Queen}},
				Score:         3,
				RoundsWon:     1,
				WinStreak:     0,
				IsLeader:      false,
				IsOnFire:      false,
				HasPlayedCard: false,
			},
		},
		PlayedCards: []entity.PlayedCard{
			{
				Card:     entity.Card{Suit: entity.Hearts, Value: entity.King},
				PlayerID: "player-1",
				PlayedAt: time.Now(),
			},
		},
	}

	turnRemaining := 7
	update := sb.buildStateUpdate(state, turnRemaining)

	// Verify update structure
	if update.GameID != "game-1" {
		t.Errorf("Expected gameID=game-1, got %s", update.GameID)
	}
	if update.RoomCode != "ROOM01" {
		t.Errorf("Expected roomCode=ROOM01, got %s", update.RoomCode)
	}
	if update.Phase != entity.PhasePlaying {
		t.Errorf("Expected phase=playing, got %s", update.Phase)
	}
	if update.CurrentRound != 3 {
		t.Errorf("Expected currentRound=3, got %d", update.CurrentRound)
	}
	if update.LeaderID != "player-1" {
		t.Errorf("Expected leaderId=player-1, got %s", update.LeaderID)
	}
	if update.CurrentTurn != "player-2" {
		t.Errorf("Expected currentTurn=player-2, got %s", update.CurrentTurn)
	}
	if update.TurnRemaining != 7 {
		t.Errorf("Expected turnRemaining=7, got %d", update.TurnRemaining)
	}

	// Verify player updates (should only have card counts, not actual cards)
	if len(update.Players) != 2 {
		t.Errorf("Expected 2 players, got %d", len(update.Players))
	}

	p1 := update.Players[0]
	if p1.ID != "player-1" {
		t.Errorf("Expected player ID=player-1, got %s", p1.ID)
	}
	if p1.HandCount != 2 {
		t.Errorf("Expected handCount=2, got %d", p1.HandCount)
	}
	if p1.Score != 5 {
		t.Errorf("Expected score=5, got %d", p1.Score)
	}
	if !p1.HasPlayedCard {
		t.Error("Expected hasPlayedCard=true")
	}

	p2 := update.Players[1]
	if p2.HandCount != 1 {
		t.Errorf("Expected handCount=1, got %d", p2.HandCount)
	}
	if p2.HasPlayedCard {
		t.Error("Expected hasPlayedCard=false")
	}

	// Verify played cards
	if len(update.PlayedCards) != 1 {
		t.Errorf("Expected 1 played card, got %d", len(update.PlayedCards))
	}
}

// TestStateBroadcasterBroadcastNow tests immediate broadcasting
func TestStateBroadcasterBroadcastNow(t *testing.T) {
	var mu sync.Mutex
	var lastEvent string
	var lastData interface{}

	broadcastFunc := func(roomCode, event string, data interface{}) error {
		mu.Lock()
		defer mu.Unlock()
		lastEvent = event
		lastData = data
		return nil
	}

	sb := NewStateBroadcaster(broadcastFunc, 2*time.Second)

	state := &entity.GameState{
		GameID:       "game-1",
		RoomCode:     "ROOM01",
		Phase:        entity.PhasePlaying,
		CurrentRound: 1,
	}

	err := sb.BroadcastNow("game-1", "ROOM01", state, 10)
	if err != nil {
		t.Fatalf("BroadcastNow failed: %v", err)
	}

	// Verify broadcast occurred
	mu.Lock()
	defer mu.Unlock()

	if lastEvent != "game:state_update" {
		t.Errorf("Expected event=game:state_update, got %s", lastEvent)
	}

	if lastData == nil {
		t.Error("Expected data to be set")
	}
}

// TestStateBroadcasterBroadcastError tests error handling during broadcast
func TestStateBroadcasterBroadcastError(t *testing.T) {
	broadcastFunc := func(roomCode, event string, data interface{}) error {
		return fmt.Errorf("broadcast error")
	}

	sb := NewStateBroadcaster(broadcastFunc, 100*time.Millisecond)
	defer sb.Cleanup()

	ctx := context.Background()

	getState := func() *entity.GameState {
		return &entity.GameState{
			GameID:   "game-1",
			RoomCode: "ROOM01",
			Phase:    entity.PhasePlaying,
		}
	}

	getTurnRemaining := func() int { return 10 }

	// Start broadcasting (errors should be logged but not crash)
	err := sb.StartBroadcasting(ctx, "game-1", "ROOM01", getState, getTurnRemaining)
	if err != nil {
		t.Fatalf("StartBroadcasting failed: %v", err)
	}

	// Wait for broadcasts with errors
	time.Sleep(250 * time.Millisecond)

	// Broadcaster should still be active despite errors
	if !sb.IsActive("game-1") {
		t.Error("Broadcaster should still be active despite broadcast errors")
	}

	sb.StopBroadcasting("game-1")
}

// TestStateBroadcasterNilState tests handling of nil state
func TestStateBroadcasterNilState(t *testing.T) {
	var mu sync.Mutex
	broadcastCount := 0

	broadcastFunc := func(roomCode, event string, data interface{}) error {
		mu.Lock()
		defer mu.Unlock()
		broadcastCount++
		return nil
	}

	sb := NewStateBroadcaster(broadcastFunc, 100*time.Millisecond)
	defer sb.Cleanup()

	ctx := context.Background()

	// Mock state getter that returns nil
	getState := func() *entity.GameState {
		return nil
	}

	getTurnRemaining := func() int { return 10 }

	// Start broadcasting
	err := sb.StartBroadcasting(ctx, "game-1", "ROOM01", getState, getTurnRemaining)
	if err != nil {
		t.Fatalf("StartBroadcasting failed: %v", err)
	}

	// Wait for potential broadcasts
	time.Sleep(250 * time.Millisecond)

	// No broadcasts should occur with nil state
	mu.Lock()
	defer mu.Unlock()
	if broadcastCount > 0 {
		t.Errorf("Expected 0 broadcasts with nil state, got %d", broadcastCount)
	}

	sb.StopBroadcasting("game-1")
}

// TestBroadcastCardPlayed tests card played event broadcasting
func TestBroadcastCardPlayed(t *testing.T) {
	var mu sync.Mutex
	var lastEvent string
	var lastData *entity.PlayedCard

	broadcastFunc := func(roomCode, event string, data interface{}) error {
		mu.Lock()
		defer mu.Unlock()
		lastEvent = event
		if pc, ok := data.(*entity.PlayedCard); ok {
			lastData = pc
		}
		return nil
	}

	playedCard := &entity.PlayedCard{
		Card:     entity.Card{Suit: entity.Hearts, Value: entity.Ace},
		PlayerID: "player-1",
		PlayedAt: time.Now(),
	}

	err := BroadcastCardPlayed(broadcastFunc, "ROOM01", playedCard)
	if err != nil {
		t.Fatalf("BroadcastCardPlayed failed: %v", err)
	}

	// Verify broadcast
	mu.Lock()
	defer mu.Unlock()

	if lastEvent != "game:card_played" {
		t.Errorf("Expected event=game:card_played, got %s", lastEvent)
	}

	if lastData == nil {
		t.Error("Expected data to be set")
	} else {
		if lastData.PlayerID != "player-1" {
			t.Errorf("Expected playerId=player-1, got %s", lastData.PlayerID)
		}
		if lastData.Card.Suit != entity.Hearts {
			t.Errorf("Expected suit=hearts, got %s", lastData.Card.Suit)
		}
	}
}

// TestBroadcastRoundWinner tests round winner event broadcasting
func TestBroadcastRoundWinner(t *testing.T) {
	var mu sync.Mutex
	var lastEvent string

	broadcastFunc := func(roomCode, event string, data interface{}) error {
		mu.Lock()
		defer mu.Unlock()
		lastEvent = event
		return nil
	}

	data := map[string]interface{}{
		"winnerId":   "player-1",
		"winningCard": "ace of hearts",
		"points":      3,
	}

	err := BroadcastRoundWinner(broadcastFunc, "ROOM01", data)
	if err != nil {
		t.Fatalf("BroadcastRoundWinner failed: %v", err)
	}

	// Verify broadcast
	mu.Lock()
	defer mu.Unlock()

	if lastEvent != "game:round_winner" {
		t.Errorf("Expected event=game:round_winner, got %s", lastEvent)
	}
}

// TestBroadcastGameOver tests game over event broadcasting
func TestBroadcastGameOver(t *testing.T) {
	var mu sync.Mutex
	var lastEvent string

	broadcastFunc := func(roomCode, event string, data interface{}) error {
		mu.Lock()
		defer mu.Unlock()
		lastEvent = event
		return nil
	}

	data := map[string]interface{}{
		"winnerId":    "player-1",
		"finalScore":  15,
		"totalRounds": 5,
	}

	err := BroadcastGameOver(broadcastFunc, "ROOM01", data)
	if err != nil {
		t.Fatalf("BroadcastGameOver failed: %v", err)
	}

	// Verify broadcast
	mu.Lock()
	defer mu.Unlock()

	if lastEvent != "game:over" {
		t.Errorf("Expected event=game:over, got %s", lastEvent)
	}
}

// TestStateBroadcasterDefaultInterval tests default interval setting
func TestStateBroadcasterDefaultInterval(t *testing.T) {
	broadcastFunc := func(roomCode, event string, data interface{}) error { return nil }

	// Create broadcaster with zero interval (should use default)
	sb := NewStateBroadcaster(broadcastFunc, 0)

	if sb.interval != 2*time.Second {
		t.Errorf("Expected default interval=2s, got %v", sb.interval)
	}
}

// TestStateBroadcasterConcurrency tests concurrent operations
func TestStateBroadcasterConcurrency(t *testing.T) {
	var mu sync.Mutex
	broadcastCount := 0

	broadcastFunc := func(roomCode, event string, data interface{}) error {
		mu.Lock()
		defer mu.Unlock()
		broadcastCount++
		return nil
	}

	sb := NewStateBroadcaster(broadcastFunc, 100*time.Millisecond)
	defer sb.Cleanup()

	ctx := context.Background()

	var wg sync.WaitGroup

	// Start multiple broadcasters concurrently
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			gameID := fmt.Sprintf("game-%d", id)
			roomCode := fmt.Sprintf("ROOM%02d", id)

			getState := func() *entity.GameState {
				return &entity.GameState{
					GameID:   gameID,
					RoomCode: roomCode,
					Phase:    entity.PhasePlaying,
				}
			}

			getTurnRemaining := func() int { return 10 }

			err := sb.StartBroadcasting(ctx, gameID, roomCode, getState, getTurnRemaining)
			if err != nil {
				t.Errorf("StartBroadcasting failed: %v", err)
			}
		}(i)
	}

	wg.Wait()

	// Verify all broadcasters are active
	for i := 0; i < 10; i++ {
		gameID := fmt.Sprintf("game-%d", i)
		if !sb.IsActive(gameID) {
			t.Errorf("Broadcaster for %s should be active", gameID)
		}
	}

	// Wait for broadcasts
	time.Sleep(250 * time.Millisecond)

	// Stop all broadcasters concurrently
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			gameID := fmt.Sprintf("game-%d", id)
			sb.StopBroadcasting(gameID)
		}(i)
	}

	wg.Wait()

	// Verify all broadcasters are stopped
	for i := 0; i < 10; i++ {
		gameID := fmt.Sprintf("game-%d", i)
		if sb.IsActive(gameID) {
			t.Errorf("Broadcaster for %s should be stopped", gameID)
		}
	}

	// Verify broadcasts occurred
	mu.Lock()
	defer mu.Unlock()
	if broadcastCount < 10 {
		t.Errorf("Expected at least 10 broadcasts, got %d", broadcastCount)
	}
}
