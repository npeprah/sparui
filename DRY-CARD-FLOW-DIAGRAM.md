# Dry Card Declaration Flow Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Player UI                                                 │  │
│  │  - Hand display (cards 6 and 7 highlighted)               │  │
│  │  - "Declare Dry" button                                   │  │
│  │  - "Show Card" checkbox (+2x bonus)                       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              │ WebSocket                         │
│                              ▼                                   │
└─────────────────────────────────────────────────────────────────┘
                               │
                               │ game:declare_dry
                               │
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  WebSocket Handler (websocket.go)                         │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │ 1. Parse request                                     │  │  │
│  │  │ 2. Authenticate player                               │  │  │
│  │  │ 3. Validate room membership                          │  │  │
│  │  │ 4. Get room/game state                               │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  DryCardHandler (dry_card_handler.go)                    │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │ DeclareDry(playerID, card, isShown)                 │  │  │
│  │  │                                                       │  │  │
│  │  │ Validations:                                         │  │  │
│  │  │ ✓ Phase == "declaring"                              │  │  │
│  │  │ ✓ Player exists                                      │  │  │
│  │  │ ✓ Card is 6 or 7                                     │  │  │
│  │  │ ✓ Player has card in hand                            │  │  │
│  │  │ ✓ No duplicate declaration                           │  │  │
│  │  │                                                       │  │  │
│  │  │ ⚙️  Creates DryCard struct                            │  │  │
│  │  │ 💾 Stores in GameState.Players[i].DryCard            │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Response & Broadcasting                                  │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │ To Declaring Player:                                 │  │  │
│  │  │   game:dry_declared (with card details)             │  │  │
│  │  │                                                       │  │  │
│  │  │ To Other Players:                                    │  │  │
│  │  │   game:player_declared_dry                          │  │  │
│  │  │   (card = null if hidden)                           │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Sequence Diagram: Declaring a Dry Card

```
Player A         Frontend         WebSocket       DryCardHandler      GameState
   │                │                 │                  │                │
   │  Click "Declare │                │                  │                │
   │  Dry: 6♥"      │                 │                  │                │
   ├───────────────►│                 │                  │                │
   │                │                 │                  │                │
   │                │ game:declare_dry│                  │                │
   │                │ {card: 6♥,      │                  │                │
   │                │  isShown: false}│                  │                │
   │                ├────────────────►│                  │                │
   │                │                 │                  │                │
   │                │                 │ Auth & Validate  │                │
   │                │                 │ Player/Room      │                │
   │                │                 │                  │                │
   │                │                 │ DeclareDry()     │                │
   │                │                 ├─────────────────►│                │
   │                │                 │                  │                │
   │                │                 │                  │ Validate Phase │
   │                │                 │                  ├───────────────►│
   │                │                 │                  │                │
   │                │                 │                  │ Check Player   │
   │                │                 │                  │ Has Card       │
   │                │                 │                  ├───────────────►│
   │                │                 │                  │                │
   │                │                 │                  │ Store DryCard  │
   │                │                 │                  ├───────────────►│
   │                │                 │                  │                │
   │                │                 │  Success         │                │
   │                │                 │◄─────────────────┤                │
   │                │                 │                  │                │
   │                │ game:dry_declared                  │                │
   │                │ {playerId: A,   │                  │                │
   │                │  card: 6♥,      │                  │                │
   │                │  isShown: false}│                  │                │
   │                │◄────────────────┤                  │                │
   │                │                 │                  │                │
   │  Show Success  │                 │                  │                │
   │  "+6 pts!"     │                 │                  │                │
   │◄───────────────┤                 │                  │                │
   │                │                 │                  │                │
   │                │                 │ Broadcast to     │                │
   │                │                 │ Other Players    │                │
   │                │                 │                  │                │

Player B         Frontend         WebSocket
   │                │                 │
   │                │ game:player_    │
   │                │ declared_dry    │
   │                │ {playerId: A,   │
   │                │  isShown: false,│
   │                │  card: null}    │
   │                │◄────────────────┤
   │                │                 │
   │  Show "Player A│                 │
   │  declared dry" │                 │
   │◄───────────────┤                 │
   │  (hidden)      │                 │
```

## Data Structures

### Request (Frontend → Backend)
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

### GameState (Backend Storage)
```go
type GameState struct {
    Players []GamePlayer
    Phase   GamePhase  // Must be "declaring"
    ...
}

type GamePlayer struct {
    ID       string
    Hand     []Card
    DryCard  *DryCard  // ← Stored here
    ...
}

type DryCard struct {
    Card     Card     // The declared card (6 or 7)
    Type     DryType  // "dry" (hidden) or "show_dry" (shown)
    PlayerID string
}
```

### Response (Backend → Frontend)
```json
// To declaring player
{
  "event": "game:dry_declared",
  "data": {
    "playerId": "player-123",
    "card": { "suit": "hearts", "value": "6" },
    "isShown": false,
    "message": "Dry card declared successfully"
  }
}

// To other players (hidden)
{
  "event": "game:player_declared_dry",
  "data": {
    "playerId": "player-123",
    "isShown": false,
    "card": null  // Hidden from others
  }
}

// To other players (shown)
{
  "event": "game:player_declared_dry",
  "data": {
    "playerId": "player-123",
    "isShown": true,
    "card": { "suit": "hearts", "value": "6" }  // Visible to all
  }
}
```

## Validation Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   DeclareDry() Validation                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────┐
         │   Is GameState initialized?        │
         │   ✗ → "game state not initialized" │
         └────────────────────────────────────┘
                              │ ✓
                              ▼
         ┌────────────────────────────────────┐
         │   Is card != nil?                  │
         │   ✗ → "card cannot be nil"         │
         └────────────────────────────────────┘
                              │ ✓
                              ▼
         ┌────────────────────────────────────┐
         │   Is card valid (IsValid())?       │
         │   ✗ → "invalid card"               │
         └────────────────────────────────────┘
                              │ ✓
                              ▼
         ┌────────────────────────────────────┐
         │   Phase == "declaring"?            │
         │   ✗ → "can only declare during     │
         │        declaring phase"            │
         └────────────────────────────────────┘
                              │ ✓
                              ▼
         ┌────────────────────────────────────┐
         │   Does player exist?               │
         │   ✗ → "player not found"           │
         └────────────────────────────────────┘
                              │ ✓
                              ▼
         ┌────────────────────────────────────┐
         │   Is card low (6 or 7)?            │
         │   ✗ → "only low cards can be dry"  │
         └────────────────────────────────────┘
                              │ ✓
                              ▼
         ┌────────────────────────────────────┐
         │   Player has card in hand?         │
         │   ✗ → "does not have card"         │
         └────────────────────────────────────┘
                              │ ✓
                              ▼
         ┌────────────────────────────────────┐
         │   Player.DryCard == nil?           │
         │   ✗ → "already declared a dry card"│
         └────────────────────────────────────┘
                              │ ✓
                              ▼
         ┌────────────────────────────────────┐
         │         ✅ ALL VALIDATIONS PASS     │
         │                                    │
         │   Create DryCard                   │
         │   Store in Player.DryCard          │
         │   Return success                   │
         └────────────────────────────────────┘
```

## Bonus Calculation Flow

```
┌─────────────────────────────────────────────────────────────┐
│              CalculateDryBonus(playerID)                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────┐
         │   Get player from GameState        │
         └────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────┐
         │   Player has DryCard?              │
         │   ✗ → Error                        │
         └────────────────────────────────────┘
                              │ ✓
                              ▼
         ┌────────────────────────────────────┐
         │   DryCard.BonusPoints()            │
         │                                    │
         │   Switch on Type and Card:         │
         │   - DryHidden + Six    → 6 pts     │
         │   - DryHidden + Seven  → 4 pts     │
         │   - DryShown  + Six    → 12 pts    │
         │   - DryShown  + Seven  → 8 pts     │
         └────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────┐
         │   Return bonus points              │
         └────────────────────────────────────┘
```

## State Transitions

```
Game Phases:
┌─────────┐       ┌───────────┐       ┌─────────┐       ┌───────────┐
│ Waiting │──────►│ Declaring │──────►│ Playing │──────►│ Round End │
└─────────┘       └───────────┘       └─────────┘       └───────────┘
                       │ ▲                                     │
                       │ │                                     │
                       │ └─────────────────────────────────────┘
                       │           (Next Round)
                       │
                   [Dry Cards
                    Can Be
                    Declared
                    Here]

Player DryCard State:
┌────────────┐  DeclareDry()   ┌────────────┐  ClearDryCard()  ┌────────────┐
│ DryCard =  │────────────────►│ DryCard =  │─────────────────►│ DryCard =  │
│ nil        │                 │ {Card,     │                  │ nil        │
│            │                 │  Type,     │                  │            │
│            │                 │  PlayerID} │                  │            │
└────────────┘                 └────────────┘                  └────────────┘
    ▲                                                                │
    │                                                                │
    └────────────────────────────────────────────────────────────────┘
                          (New Game/Reset)
```

## Concurrency Model

```
Multiple Clients (Goroutines)
    │         │         │         │
    │         │         │         │
    ▼         ▼         ▼         ▼
┌───────────────────────────────────────┐
│      DryCardHandler                   │
│                                       │
│   ┌───────────────────────────────┐   │
│   │   sync.RWMutex                │   │
│   │                               │   │
│   │   Read Operations:            │   │
│   │   - GetGameState()            │   │
│   │   - CalculateDryBonus()       │   │
│   │   - HasDryCard()              │   │
│   │   - GetDryCard()              │   │
│   │   - ValidateDryDeclaration()  │   │
│   │                               │   │
│   │   Write Operations:           │   │
│   │   - DeclareDry() ◄── Lock     │   │
│   │   - ClearDryCard()            │   │
│   │   - SetGameState()            │   │
│   └───────────────────────────────┘   │
│                                       │
│   ┌───────────────────────────────┐   │
│   │   GameState                   │   │
│   │   └─► Players[]               │   │
│   │        └─► DryCard            │   │
│   └───────────────────────────────┘   │
└───────────────────────────────────────┘
```

## Error Handling Flow

```
          Request Received
                │
                ▼
       ┌────────────────┐
       │  Try to Parse  │
       └────────────────┘
         │           │
         │ Error     │ Success
         ▼           ▼
    ┌────────┐  ┌──────────────┐
    │ Send   │  │  Validate    │
    │ Error  │  │  Auth/Room   │
    └────────┘  └──────────────┘
                   │         │
                   │ Error   │ Success
                   ▼         ▼
              ┌────────┐  ┌──────────────┐
              │ Send   │  │ Call         │
              │ Error  │  │ DeclareDry() │
              └────────┘  └──────────────┘
                             │         │
                             │ Error   │ Success
                             ▼         ▼
                        ┌────────┐  ┌──────────┐
                        │ Send   │  │ Send     │
                        │ Error  │  │ Success  │
                        └────────┘  │ &        │
                                    │ Broadcast│
                                    └──────────┘
```

## Integration Points

```
┌─────────────────────────────────────────────────────────────┐
│                     Current System                           │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Room       │    │   Game       │    │   Score      │  │
│  │   Manager    │    │   Engine     │    │   Manager    │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                    │                    │         │
│         └────────────────────┼────────────────────┘         │
│                              │                              │
│                              ▼                              │
│                   ┌──────────────────────┐                  │
│                   │   GameState          │                  │
│                   │   (Central Store)    │                  │
│                   └──────────────────────┘                  │
│                              │                              │
│                              │                              │
│  ┌───────────────────────────┼───────────────────────────┐  │
│  │                           ▼                           │  │
│  │              ┌──────────────────────┐                 │  │
│  │              │   DryCardHandler     │ ◄── NEW        │  │
│  │              │   (TASK-064)         │                 │  │
│  │              └──────────────────────┘                 │  │
│  │                           │                           │  │
│  │                           ▼                           │  │
│  │              ┌──────────────────────┐                 │  │
│  │              │   WebSocket Handler  │                 │  │
│  │              │   (handleDeclareDry) │                 │  │
│  │              └──────────────────────┘                 │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

For implementation details, see `TASK-064-COMPLETION-SUMMARY.md`
