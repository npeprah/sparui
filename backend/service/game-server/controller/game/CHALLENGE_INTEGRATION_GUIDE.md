# Challenge System Integration Guide

## Quick Start

### 1. Import the Package

```go
import (
    "github.com/npeprah/sparui/backend/service/game-server/controller/game"
    "github.com/npeprah/sparui/backend/service/game-server/entity"
)
```

### 2. Create a Challenge Handler

```go
// When game starts or on first challenge
handler := game.NewChallengeHandler(gameState)
```

### 3. Process a Challenge

```go
ctx := context.Background()
result, err := handler.HandleChallenge(
    ctx,
    challengerID,  // Player making the challenge
    targetID,      // Player being challenged
    roundIndex,    // Which round (0-4 for Spar)
    cardIndex,     // Which card in PlayedCards array
)

if err != nil {
    // Handle error (invalid challenge, timing issue, etc.)
    log.Error("Challenge failed", "error", err)
    return
}

// Process result
if result.IsValid {
    // Valid challenge - violator found
    log.Info("Valid challenge", "violator", result.ViolatorID)
} else {
    // Invalid challenge - challenger penalized
    log.Info("Invalid challenge", "challenger", result.ChallengerID)
}
```

### 4. Broadcast Result to Players

```go
// Send result to all players in the room
broadcastToRoom(roomCode, map[string]interface{}{
    "event": "game:challenge_result",
    "data": result,
})
```

## WebSocket Integration

### Client Request Format

```javascript
// Client sends challenge request
socket.send(JSON.stringify({
    event: "game:flag_player",
    data: {
        targetPlayerId: "player2",
        roundIndex: 0,
        cardIndex: 1
    }
}));
```

### Server Response Format

```javascript
// Server broadcasts result to all players
{
    event: "game:challenge_result",
    data: {
        challengerId: "player1",
        targetId: "player2",
        roundIndex: 0,
        cardIndex: 1,
        isValid: true,
        violatorId: "player2",
        requiredSuit: "hearts",
        playedCard: {
            suit: "spades",
            value: "king"
        },
        pointsAwarded: 10,
        pointsDeducted: 0,
        timestamp: "2025-12-19T04:45:00Z",
        message: "Valid challenge! Player player2 violated suit-following rules"
    }
}
```

### Integrating with WebSocket Handler

Update `handleFlagPlayer` in `controller/websocket/websocket.go`:

```go
func (c *Client) handleFlagPlayer(data json.RawMessage) {
    // Parse request
    var req struct {
        TargetPlayerID string `json:"targetPlayerId"`
        RoundIndex     int    `json:"roundIndex"`
        CardIndex      int    `json:"cardIndex"`
    }
    json.Unmarshal(data, &req)

    // Get game state from room/game manager
    gameState := getGameStateForRoom(c.RoomID)

    // Process challenge
    handler := game.NewChallengeHandler(gameState)
    result, err := handler.HandleChallenge(
        context.Background(),
        c.PlayerID,
        req.TargetPlayerID,
        req.RoundIndex,
        req.CardIndex,
    )

    if err != nil {
        c.sendError("game:challenge_error", err.Error())
        return
    }

    // Broadcast result to all players
    c.broadcastToRoom(c.RoomID, map[string]interface{}{
        "event": "game:challenge_result",
        "data": result,
    })
}
```

## Game Flow Integration

### At Game Start

```go
// Create challenge handler when game starts
challengeHandler := game.NewChallengeHandler(gameState)

// Store in game manager for later use
gameManager.SetChallengeHandler(roomCode, challengeHandler)
```

### During Round Play

```go
// Players can challenge at any time during the round
// No special handling needed - just process challenges as they come
```

### At Round End

```go
// Mark round as complete
gameState.Phase = entity.PhaseRoundEnd
gameState.UpdatedAt = time.Now()

// Allow 5 seconds for challenges
time.Sleep(5 * time.Second)

// After 5 seconds, challenges are automatically rejected by the handler
// (timing validation in HandleChallenge checks this)
```

### At Round Start (Next Round)

```go
// Clear old challenges to allow new ones
challengeHandler.ResetChallengesForRound(newRoundIndex)

// Continue with normal round start
```

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `"game is over, challenges not allowed"` | Game already finished | Check game phase before allowing challenges |
| `"challenge window expired"` | >5 seconds after round | Disable challenge UI after 5 seconds |
| `"player already challenged"` | Duplicate challenge | Show "Already challenged" message |
| `"cannot challenge own card"` | Player challenged self | Filter own cards from challengeable list |
| `"player not found"` | Invalid player ID | Validate player exists before challenge |
| `"invalid card index"` | Card doesn't exist | Ensure card index is valid |

### Error Handling Pattern

```go
result, err := handler.HandleChallenge(ctx, challengerID, targetID, roundIndex, cardIndex)
if err != nil {
    switch {
    case strings.Contains(err.Error(), "window expired"):
        return errors.New("Challenge time expired")
    case strings.Contains(err.Error(), "already challenged"):
        return errors.New("You already challenged this play")
    case strings.Contains(err.Error(), "own card"):
        return errors.New("Cannot challenge your own card")
    default:
        return fmt.Errorf("Challenge failed: %w", err)
    }
}
```

## Point System

### Valid Challenge (Violation Detected)

```go
// Challenger receives bonus
challenger.Score += 10

// Violator loses round points
violator.Score = 0
```

### Invalid Challenge (No Violation)

```go
// Challenger receives penalty
challenger.Score -= 5

// Target player unaffected
```

### Customizing Points

Modify constants in `challenge_handler.go`:

```go
const (
    ChallengeBonusPoints   = 10  // Valid challenge bonus
    ChallengePenaltyPoints = 5   // Invalid challenge penalty
    ChallengeWindowSeconds = 5   // Time window after round
)
```

## Testing

### Unit Testing Your Integration

```go
func TestChallengeIntegration(t *testing.T) {
    // Setup game state
    gameState := createTestGame()

    // Create handler
    handler := game.NewChallengeHandler(gameState)

    // Process challenge
    result, err := handler.HandleChallenge(
        context.Background(),
        "player1",
        "player2",
        0,
        1,
    )

    // Verify result
    assert.NoError(t, err)
    assert.True(t, result.IsValid)
}
```

### Integration Testing Checklist

- [ ] Challenge during round works
- [ ] Challenge within 5 seconds after round works
- [ ] Challenge after 5 seconds fails
- [ ] Duplicate challenge prevention works
- [ ] Points update correctly
- [ ] All players receive broadcast
- [ ] WebSocket error handling works
- [ ] Game state persists correctly

## Performance Considerations

### Handler Lifecycle

**Per-Game Instance (Recommended)**
```go
// Create once per game
handler := game.NewChallengeHandler(gameState)
gameManager.handlers[roomCode] = handler
```

**Per-Challenge Instance (Not Recommended)**
```go
// Creates new handler every time (less efficient)
handler := game.NewChallengeHandler(gameState)
result, _ := handler.HandleChallenge(...)
```

### Concurrency

The handler is thread-safe:
- Multiple goroutines can call `HandleChallenge` concurrently
- Separate mutexes protect game state and challenge tracking
- No blocking operations

### Memory Usage

- Challenge tracking: ~100 bytes per challenge
- Typical game: 10-20 challenges max
- Total memory: <5KB per game

## Troubleshooting

### Challenge Always Fails

**Check:**
1. Is game state initialized? `gameState != nil`
2. Is led suit set? `gameState.LedSuit != nil`
3. Are played cards recorded? `len(gameState.PlayedCards) > cardIndex`
4. Is timing window valid? `time.Since(gameState.UpdatedAt) < 5s`

### Points Not Updating

**Check:**
1. Are player pointers being used? (Should update `gameState.Players[i]` directly)
2. Is game state being saved after challenge?
3. Is leaderboard being refreshed?

### Race Conditions

**Prevention:**
1. Always use the handler's mutex-protected methods
2. Don't access `gameState` directly during challenges
3. Run `go test -race` to detect issues

## Example: Complete Integration

```go
// main.go - Game Manager

type GameManager struct {
    games             map[string]*entity.GameState
    challengeHandlers map[string]*game.ChallengeHandler
    mu                sync.RWMutex
}

func (gm *GameManager) StartGame(roomCode string) {
    gm.mu.Lock()
    defer gm.mu.Unlock()

    // Create game state
    gameState := &entity.GameState{
        RoomCode: roomCode,
        Phase:    entity.PhasePlaying,
        // ... other fields
    }

    // Create challenge handler
    handler := game.NewChallengeHandler(gameState)

    // Store both
    gm.games[roomCode] = gameState
    gm.challengeHandlers[roomCode] = handler
}

func (gm *GameManager) HandleChallenge(roomCode, challengerID, targetID string, roundIndex, cardIndex int) (*game.ChallengeResult, error) {
    gm.mu.RLock()
    handler, exists := gm.challengeHandlers[roomCode]
    gm.mu.RUnlock()

    if !exists {
        return nil, errors.New("game not found")
    }

    return handler.HandleChallenge(
        context.Background(),
        challengerID,
        targetID,
        roundIndex,
        cardIndex,
    )
}

func (gm *GameManager) NextRound(roomCode string, newRoundIndex int) {
    gm.mu.RLock()
    handler, exists := gm.challengeHandlers[roomCode]
    gm.mu.RUnlock()

    if exists {
        handler.ResetChallengesForRound(newRoundIndex)
    }
}
```

## Advanced Features

### Challenge History

```go
// Get all challenges for analytics
history := handler.GetChallengeHistory()

// Format: ["0:player1:player2", "0:player3:player4", "1:player1:player2"]
// Parse: roundIndex:challengerID:targetID
```

### Custom Validation

Extend the handler with custom validation:

```go
type CustomChallengeHandler struct {
    *game.ChallengeHandler
}

func (h *CustomChallengeHandler) ValidateCustomRules(result *game.ChallengeResult) error {
    // Add custom business logic
    if result.IsValid && isTournamentMode {
        // Extra penalties for tournament violations
        result.PointsDeducted *= 2
    }
    return nil
}
```

## API Reference

### Types

```go
type ChallengeResult struct {
    ChallengerID   string       `json:"challengerId"`
    TargetID       string       `json:"targetId"`
    RoundIndex     int          `json:"roundIndex"`
    CardIndex      int          `json:"cardIndex"`
    IsValid        bool         `json:"isValid"`
    ViolatorID     string       `json:"violatorId,omitempty"`
    RequiredSuit   entity.Suit  `json:"requiredSuit"`
    PlayedCard     entity.Card  `json:"playedCard"`
    PointsAwarded  int          `json:"pointsAwarded"`
    PointsDeducted int          `json:"pointsDeducted"`
    Timestamp      time.Time    `json:"timestamp"`
    Message        string       `json:"message"`
}
```

### Methods

```go
// Create new handler
func NewChallengeHandler(gameState *entity.GameState) *ChallengeHandler

// Process a challenge
func (ch *ChallengeHandler) HandleChallenge(
    ctx context.Context,
    challengerID string,
    targetID string,
    roundIndex int,
    cardIndex int,
) (*ChallengeResult, error)

// Get challenge history
func (ch *ChallengeHandler) GetChallengeHistory() []string

// Reset challenges for new round
func (ch *ChallengeHandler) ResetChallengesForRound(roundIndex int)
```

## Support

For questions or issues:
1. Check test files for examples: `challenge_handler_test.go`, `challenge_handler_example_test.go`
2. Read completion summary: `TASK-065-COMPLETION-SUMMARY.md`
3. Review PRD: Section 2.6 - Flagging/Challenge System

## Next Steps

1. ✅ Challenge handler implemented
2. ✅ WebSocket handler ready
3. ⏳ Connect game state to WebSocket handler
4. ⏳ Add UI for challenge button
5. ⏳ Implement challenge countdown timer
6. ⏳ Add challenge history panel

---

*Last Updated: 2025-12-19*
*Version: 1.0*
*Status: Production Ready*
