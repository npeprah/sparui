# Dry Card Declaration API Reference

Frontend integration guide for the Dry Card Declaration system in Spar.

## WebSocket Event: `game:declare_dry`

### When to Use

Players can declare a dry card during the **"declaring"** phase at the start of each round. A dry card must be a low card (6 or 7) that the player has in their hand.

### Request Format

```typescript
interface DeclareDryRequest {
  event: "game:declare_dry";
  data: {
    card: {
      suit: "hearts" | "clubs" | "diamonds" | "spades";
      value: "6" | "7";
    };
    isShown: boolean; // true = shown (6x), false = hidden (3x)
  };
}
```

### Example Request

```json
{
  "event": "game:declare_dry",
  "data": {
    "card": {
      "suit": "hearts",
      "value": "6"
    },
    "isShown": false
  }
}
```

## Success Responses

### Event: `game:dry_declared`

Sent to the player who declared the dry card.

```typescript
interface DryDeclaredResponse {
  event: "game:dry_declared";
  data: {
    playerId: string;
    card: {
      suit: string;
      value: string;
    };
    isShown: boolean;
    message: string;
  };
}
```

```json
{
  "event": "game:dry_declared",
  "data": {
    "playerId": "player-123",
    "card": {
      "suit": "hearts",
      "value": "6"
    },
    "isShown": false,
    "message": "Dry card declared successfully"
  }
}
```

### Event: `game:player_declared_dry`

Broadcast to all other players in the room.

```typescript
interface PlayerDeclaredDryBroadcast {
  event: "game:player_declared_dry";
  data: {
    playerId: string;
    isShown: boolean;
    card: {
      suit: string;
      value: string;
    } | null; // null if isShown = false (hidden)
  };
}
```

```json
// Hidden declaration (card details not shown)
{
  "event": "game:player_declared_dry",
  "data": {
    "playerId": "player-123",
    "isShown": false,
    "card": null
  }
}

// Shown declaration (card details visible)
{
  "event": "game:player_declared_dry",
  "data": {
    "playerId": "player-123",
    "isShown": true,
    "card": {
      "suit": "hearts",
      "value": "6"
    }
  }
}
```

## Error Responses

### Event: `game:dry_error`

```typescript
interface DryErrorResponse {
  event: "game:dry_error";
  data: {
    error: string;
  };
}
```

### Common Errors

#### 1. Not Authenticated
```json
{
  "event": "game:dry_error",
  "data": {
    "error": "Authentication required"
  }
}
```

#### 2. Not in Room
```json
{
  "event": "game:dry_error",
  "data": {
    "error": "Not in a room"
  }
}
```

#### 3. Game Not Active
```json
{
  "event": "game:dry_error",
  "data": {
    "error": "Game is not active"
  }
}
```

#### 4. Invalid Card
```json
{
  "event": "game:dry_error",
  "data": {
    "error": "Invalid card"
  }
}
```

#### 5. Wrong Phase
```json
{
  "event": "game:dry_error",
  "data": {
    "error": "dry cards can only be declared during declaring phase, current phase: playing"
  }
}
```

#### 6. Invalid Card Value
```json
{
  "event": "game:dry_error",
  "data": {
    "error": "only low cards (6 or 7) can be declared as dry, got: 8 of hearts"
  }
}
```

#### 7. Card Not in Hand
```json
{
  "event": "game:dry_error",
  "data": {
    "error": "player does not have card in hand: 6 of hearts"
  }
}
```

#### 8. Already Declared
```json
{
  "event": "game:dry_error",
  "data": {
    "error": "player has already declared a dry card: 7 of clubs"
  }
}
```

## Bonus Points

When a player wins a round with their declared dry card:

| Card | Type | Multiplier | Bonus Points |
|------|------|------------|--------------|
| 6    | Hidden | 3x | 6 points |
| 6    | Shown | 6x | 12 points |
| 7    | Hidden | 3x | 4 points |
| 7    | Shown | 6x | 8 points |

## UI/UX Recommendations

### During Declaring Phase

1. **Show Declaration Button**
   - Display "Declare Dry" button for cards 6 and 7
   - Highlight eligible cards in player's hand

2. **Show/Hide Toggle**
   - Checkbox: "Show card for 2x bonus" (unchecked = hidden)
   - Explain difference in tooltip

3. **Visual Feedback**
   - On successful declaration: Show confirmation animation
   - Mark declared card with special badge/glow

### After Declaration

1. **Own Card**
   - Show dry card with badge: "Dry (Hidden)" or "Dry (Shown)"
   - Display potential bonus: "+6 pts" or "+12 pts"

2. **Other Players**
   - Hidden: Show generic dry card back with "?" icon
   - Shown: Show actual card with "Dry" badge

3. **Status Bar**
   - Display count: "2/4 players declared dry"

### During Game

1. **When Playing Dry Card**
   - Highlight that bonus will be applied if round is won
   - Show animation when dry card wins round

2. **Bonus Application**
   - When player wins with dry card: Show bonus points animation
   - Display: "Dry Bonus: +12 points!"

## Frontend State Management

### Player State
```typescript
interface PlayerState {
  id: string;
  username: string;
  dryCard?: {
    isShown: boolean;
    card?: {
      suit: string;
      value: string;
    }; // Only present if isShown = true
  };
}
```

### Game State
```typescript
interface GameState {
  phase: "waiting" | "declaring" | "playing" | "round_end" | "game_over";
  players: PlayerState[];
  currentPlayer: string; // ID of current player
}
```

## Example Flow

### Player Declares Hidden Dry

1. **Frontend sends:**
```json
{
  "event": "game:declare_dry",
  "data": {
    "card": { "suit": "hearts", "value": "6" },
    "isShown": false
  }
}
```

2. **Player receives confirmation:**
```json
{
  "event": "game:dry_declared",
  "data": {
    "playerId": "player-123",
    "card": { "suit": "hearts", "value": "6" },
    "isShown": false,
    "message": "Dry card declared successfully"
  }
}
```

3. **Other players receive:**
```json
{
  "event": "game:player_declared_dry",
  "data": {
    "playerId": "player-123",
    "isShown": false,
    "card": null
  }
}
```

4. **Frontend updates:**
   - Mark player's 6 of hearts with "Dry (Hidden)" badge
   - Show "+6 pts if win" tooltip
   - For other players: Show "Player 1 declared dry (hidden)"

## Validation Before Sending

Frontend should validate before sending request:

```typescript
function canDeclareDry(
  gamePhase: string,
  playerHand: Card[],
  card: Card,
  alreadyDeclared: boolean
): string | null {
  if (gamePhase !== "declaring") {
    return "Can only declare dry during declaring phase";
  }

  if (alreadyDeclared) {
    return "Already declared a dry card";
  }

  if (card.value !== "6" && card.value !== "7") {
    return "Can only declare 6 or 7 as dry";
  }

  if (!playerHand.some(c => c.suit === card.suit && c.value === card.value)) {
    return "Don't have this card in hand";
  }

  return null; // Valid
}
```

## Testing Recommendations

### Unit Tests
- Parse request/response JSON correctly
- Handle all error cases gracefully
- Update UI state correctly

### Integration Tests
- WebSocket connection maintained
- Events received in correct order
- Multiple players can declare simultaneously

### Edge Cases
- Network disconnection during declaration
- Rapid-fire declaration attempts
- Declaration after phase change

## Notes

1. **One Declaration Per Player:** Each player can only declare one dry card per game
2. **Phase Timing:** Declaration must happen during "declaring" phase (before cards are played)
3. **Privacy:** Hidden cards are not revealed to other players until played
4. **Bonus Applied:** Bonus points only applied if player wins the round with their dry card

---

For implementation details, see: `TASK-064-DRY-CARD-IMPLEMENTATION.md`
