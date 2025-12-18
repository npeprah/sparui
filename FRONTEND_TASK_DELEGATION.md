# Frontend Task Delegation - TASK-028: Build Lobby Screen

**Date:** December 18, 2025
**Delegated To:** frontend-tdd-engineer
**Priority:** HIGH (P1)
**Estimated Time:** 4-8 hours
**Status:** READY TO START (UNBLOCKED)

---

## Executive Summary

You are cleared to begin TASK-028: Build Lobby Screen immediately. This task is HIGH PRIORITY and has NO blockers. Week 1 infrastructure is complete and solid. All the foundation you need (React components, Zustand stores, WebSocket client, routing) is in place and working.

The user is continuing card generation in parallel. Your work will NOT be blocked by this. You can proceed at full velocity.

---

## Task: TASK-028 - Build Lobby Screen

### Description

Create a fully functional game lobby screen where players can:
- Create and join game rooms with unique room codes
- See real-time player list with ready/not ready status
- Configure game settings (points to win, surface theme)
- Start games when minimum players are ready (host only)
- Leave rooms gracefully

This is the critical bridge between the Main Menu (already built in TASK-010) and the actual game. The lobby must feel polished, responsive, and arcade-style to match our "Afro-Futurism Meets Arcade Energy" aesthetic.

---

## Acceptance Criteria

Your implementation must meet ALL of these criteria:

### Core Functionality
- [ ] Room creation generates unique 6-character alphanumeric room code
- [ ] Room code can be copied to clipboard with visual feedback
- [ ] Players can join existing rooms by entering room code
- [ ] Player list displays 2-4 slots (current players + empty slots)
- [ ] Each player slot shows: avatar (placeholder OK), username, ready status
- [ ] Host can configure game settings (points to win: 10/15/21, surface theme dropdown)
- [ ] Host sees "Start Game" button (enabled only when 2+ players ready)
- [ ] Non-host players see "Ready" toggle button
- [ ] "Leave Room" button works for all players
- [ ] Leaving room returns player to Main Menu
- [ ] Room closes if host leaves (all players notified and returned to Main Menu)

### Real-Time Updates (WebSocket Integration)
- [ ] Player joins/leaves reflected in player list immediately
- [ ] Ready status updates broadcast to all players in real time
- [ ] Settings changes broadcast to all players (show updated values)
- [ ] Game start triggers navigation to /game for all players
- [ ] Connection state handled (show "Connecting..." during reconnection)

### Visual Design & UX
- [ ] Matches arcade aesthetic from Main Menu (TASK-010)
- [ ] Uses existing UI components (Button, Modal from TASK-009)
- [ ] Responsive layout (mobile, tablet, desktop)
- [ ] Loading states for all async actions (join room, ready toggle)
- [ ] Error handling with clear user feedback (room not found, room full)
- [ ] Smooth animations for player join/leave (Framer Motion optional but encouraged)
- [ ] Visual distinction between host and regular players (crown icon, border, etc.)

### Code Quality
- [ ] TypeScript with strict types
- [ ] Zustand store for lobby state management
- [ ] WebSocket event handlers for lobby events (lobby:create, lobby:join, lobby:leave, lobby:ready, lobby:start)
- [ ] Reusable components (PlayerSlot, GameSettings, RoomCodeDisplay)
- [ ] Unit tests for critical functions (room code generation, player validation)
- [ ] Clean, readable code following project conventions

---

## Technical Requirements

### Routes
Add route to existing React Router configuration:
```typescript
// frontend/src/App.tsx
<Route path="/lobby" element={<LobbyScreen />} />
```

### WebSocket Events

You need to handle these events (backend already supports them from TASK-018):

**Client → Server:**
```typescript
// Create room
socket.emit('lobby:create', {
  hostId: string,
  maxPlayers: number, // 2-4
  pointsToWin: number, // 10, 15, or 21
  surfaceTheme: string, // 'poker', 'street', 'wooden', 'neon', 'beach'
});

// Join room
socket.emit('lobby:join', {
  roomCode: string,
  playerId: string,
  username: string,
});

// Leave room
socket.emit('lobby:leave', {
  roomCode: string,
  playerId: string,
});

// Toggle ready
socket.emit('lobby:ready', {
  roomCode: string,
  playerId: string,
  isReady: boolean,
});

// Start game (host only)
socket.emit('lobby:start', {
  roomCode: string,
  hostId: string,
});
```

**Server → Client:**
```typescript
// Lobby created
socket.on('lobby:created', (data: { roomCode: string, room: Room }) => {
  // Store room code, navigate to lobby screen
});

// Player joined
socket.on('lobby:player_joined', (data: { player: Player }) => {
  // Add player to player list
});

// Player left
socket.on('lobby:player_left', (data: { playerId: string }) => {
  // Remove player from list
});

// Player ready status changed
socket.on('lobby:ready_changed', (data: { playerId: string, isReady: boolean }) => {
  // Update player ready status
});

// Settings changed
socket.on('lobby:settings_changed', (data: { pointsToWin: number, surfaceTheme: string }) => {
  // Update game settings display
});

// Game starting
socket.on('lobby:game_starting', (data: { gameId: string, countdown: number }) => {
  // Show countdown, navigate to /game
});

// Room closed
socket.on('lobby:room_closed', (data: { reason: string }) => {
  // Show message, navigate back to Main Menu
});

// Error
socket.on('lobby:error', (data: { message: string }) => {
  // Show error notification
});
```

### Zustand Store Structure

Extend or create `lobbyStore.ts`:

```typescript
// frontend/src/store/lobbyStore.ts
interface LobbyState {
  // Room data
  roomCode: string | null;
  maxPlayers: number;
  currentPlayers: Player[];
  hostId: string | null;

  // Settings
  pointsToWin: number; // 10, 15, or 21
  surfaceTheme: string; // 'poker', 'street', 'wooden', 'neon', 'beach'

  // Status
  isInLobby: boolean;
  isHost: boolean;
  isReady: boolean;

  // Actions
  setRoomCode: (code: string) => void;
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  updatePlayerReady: (playerId: string, isReady: boolean) => void;
  updateSettings: (settings: { pointsToWin?: number, surfaceTheme?: string }) => void;
  leaveLobby: () => void;
  reset: () => void;
}

interface Player {
  id: string;
  username: string;
  avatar?: string; // Optional for now
  isReady: boolean;
  isHost: boolean;
}
```

### Component Structure

Create these components:

```
frontend/src/components/lobby/
├── LobbyScreen.tsx          # Main lobby container
├── RoomCodeDisplay.tsx      # Room code with copy button
├── PlayerList.tsx           # Player slots container
├── PlayerSlot.tsx           # Individual player slot
├── GameSettings.tsx         # Settings panel (host only)
└── LobbyActions.tsx         # Ready/Start/Leave buttons
```

### Existing Assets to Use

From Week 1 (TASK-009), you already have:
- `Button` component with 5 variants (primary, secondary, danger, success, ghost)
- `Modal` component for error messages
- `NotificationContainer` for toast notifications

From Week 1 (TASK-006):
- `gameStore.ts` (may need to add lobby-related state)
- `playerStore.ts` (current player data)
- `uiStore.ts` (modal state, notifications)

From Week 1 (TASK-007):
- `SocketClient` wrapper class with connection management

---

## Design Reference

### PRD Section 4.2: Game Lobby Screen

Refer to `/Users/nana/go/src/github.com/npeprah/sparui/PRD.md` (Section 4.2) for visual mockup.

Key design elements:
- **Top Bar:** Back button (left), "LOBBY" title (center), Settings icon (right)
- **Room Code Section:** Large display with "Copy" button, prominent for sharing
- **Player List:** 2-4 slots, avatars + usernames + ready status, empty slots shown as placeholders
- **Game Settings Panel:** Host-only controls for points to win and surface theme
- **Action Buttons:** Start Game (host, bottom center) or Ready toggle (non-host)
- **Leave Button:** Always available, typically bottom-left or as part of top bar

### Visual Style: "Afro-Futurism Meets Arcade Energy"

Refer to `/Users/nana/go/src/github.com/npeprah/sparui/CARD_DESIGN_HANDOFF.md` for color palettes and design philosophy.

Key colors:
- **Fire Red:** `#FF4500` (primary action, ready status)
- **Gold:** `#FFD700` (accents, borders, highlights)
- **Deep Purple:** `#8B00FF` (premium UI elements)
- **Ice Blue:** `#00BFFF` (secondary actions, not ready status)

Typography:
- **Headers:** Bold, impactful (Bebas Neue or similar)
- **Body Text:** Clean, readable (Inter or Roboto)

Animations:
- Button hover: Scale + glow
- Player join: Slide in with bounce
- Player leave: Fade out
- Ready toggle: Color shift with pulse

---

## Implementation Guidance

### Step 1: Set Up Routing
Add `/lobby` route to `App.tsx` or your routing file. Test navigation from Main Menu.

### Step 2: Create Zustand Store
Create or extend `lobbyStore.ts` with state and actions. Test store methods in isolation.

### Step 3: Build Static UI
Create `LobbyScreen.tsx` with hard-coded placeholder data. Get the layout right first before adding WebSocket.

### Step 4: Integrate WebSocket
Wire up WebSocket event handlers in `LobbyScreen.tsx`. Use existing `SocketClient` from TASK-007.

### Step 5: Add Real-Time Updates
Connect Zustand store to WebSocket events. Test with multiple browser tabs simulating multiple players.

### Step 6: Error Handling
Add error states for: room not found, room full, connection lost, invalid room code.

### Step 7: Polish
Add animations, loading states, and final visual polish.

### Step 8: Testing
Write unit tests for critical functions. Manual test all flows.

---

## Testing Requirements

### Manual Test Cases
1. **Create Room Flow:**
   - Click "Private Game" on Main Menu → Should create room and navigate to lobby
   - Room code should be displayed and copyable
   - Host should see settings controls and "Start Game" button (disabled initially)

2. **Join Room Flow:**
   - Player 2 opens app, enters room code → Should join room successfully
   - Player 1's lobby should update immediately with Player 2 in list
   - Player 2 should see "Ready" toggle, not settings controls

3. **Ready Toggle Flow:**
   - Player 2 clicks "Ready" → Status changes to green checkmark
   - Player 1 sees Player 2's ready status update
   - Player 1 (host) clicks "Ready" → "Start Game" button becomes enabled
   - Player 2 clicks "Ready" again → Status toggles off, "Start Game" button disables

4. **Start Game Flow:**
   - With 2+ players ready, host clicks "Start Game"
   - All players navigate to `/game` route
   - Game ID passed to game screen

5. **Leave Room Flow:**
   - Non-host clicks "Leave Room" → Returns to Main Menu, room still exists
   - Host clicks "Leave Room" → All players notified, room closes, everyone returns to Main Menu

6. **Error Handling:**
   - Try joining non-existent room → Error message shown
   - Try joining full room (4 players already) → Error message shown
   - Disconnect WebSocket mid-lobby → Reconnection logic kicks in

### Unit Tests (Optional but Encouraged)
- Room code generation produces valid 6-char alphanumeric codes
- Player validation (max 4 players)
- Ready state logic (can't start with <2 players, must have 2+ ready)
- Settings validation (points to win: 10/15/21 only)

---

## Backend Context

The backend WebSocket hub is operational from Week 1 (TASK-017, TASK-018). All the events you need are already implemented and tested.

**Backend Endpoints Available:**
- `POST /api/v1/auth/register` - Create new user
- `POST /api/v1/auth/login` - Login and get JWT token
- `GET /api/v1/auth/me` - Get current user (requires JWT)
- `WS /ws` - WebSocket connection endpoint

**WebSocket Message Format:**
```json
{
  "event": "lobby:create",
  "data": { ... }
}
```

The backend expects this format. Your `SocketClient` from TASK-007 should handle this.

---

## Environment Variables

Already configured in Week 1 (TASK-008):
```bash
# frontend/.env.local
VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080/ws
VITE_BACKEND_URL=http://localhost:8080
```

Backend runs on `http://localhost:8080` by default.

---

## File Locations

### Existing Code (Week 1)
- **UI Components:** `/Users/nana/go/src/github.com/npeprah/sparui/frontend/src/components/ui/`
- **Stores:** `/Users/nana/go/src/github.com/npeprah/sparui/frontend/src/store/`
- **Socket Client:** `/Users/nana/go/src/github.com/npeprah/sparui/frontend/src/multiplayer/SocketClient.ts` (or similar path)
- **Main Menu:** `/Users/nana/go/src/github.com/npeprah/sparui/frontend/src/components/menu/MainMenu.tsx` (or pages/)

### New Files to Create
- **Lobby Screen:** `/Users/nana/go/src/github.com/npeprah/sparui/frontend/src/components/lobby/LobbyScreen.tsx`
- **Lobby Store:** `/Users/nana/go/src/github.com/npeprah/sparui/frontend/src/store/lobbyStore.ts`
- **Lobby Components:** `/Users/nana/go/src/github.com/npeprah/sparui/frontend/src/components/lobby/` (RoomCodeDisplay, PlayerList, etc.)

---

## Dependencies Already Installed

From Week 1:
- **React:** 18.3
- **TypeScript:** 5.6
- **Vite:** 5.4
- **Tailwind CSS:** 4.1
- **Zustand:** 4.5
- **Socket.io-client:** 4.7
- **React Router:** v7
- **Framer Motion:** 11.x (for animations)

No additional installations needed. You're good to go.

---

## Success Criteria

Your implementation is successful when:

1. **Functional:** All acceptance criteria checked off
2. **Real-Time:** WebSocket updates work smoothly with no lag
3. **Visual:** Matches arcade aesthetic, looks polished and professional
4. **Robust:** Error handling covers edge cases, no crashes
5. **Tested:** Manual testing complete, critical flows work 100%
6. **Code Quality:** Clean TypeScript, reusable components, follows conventions

---

## Timeline

**Estimated Time:** 4-8 hours

Suggested breakdown:
- **Hour 1-2:** Set up routing, create static UI layout
- **Hour 3-4:** Implement Zustand store, wire up basic WebSocket events
- **Hour 5-6:** Add real-time updates, test multi-player flows
- **Hour 7:** Error handling, edge cases
- **Hour 8:** Polish animations, final testing

Take your time to do it right. Quality matters more than speed.

---

## Questions or Blockers?

If you encounter any issues:

1. **Check existing code:** Week 1 implementation is solid, refer to TASK-009 (UI components), TASK-007 (WebSocket), TASK-006 (Zustand)
2. **Review PRD:** Section 4.2 for lobby mockup, Section 2 for game rules context
3. **Backend logs:** If WebSocket events aren't working, check backend logs (backend is tested and working from TASK-019)
4. **Ask for clarification:** If requirements are unclear, ask before implementing

---

## What Happens Next

After you complete TASK-028, the next high-priority frontend tasks are:

1. **TASK-029:** Responsive layout system (2-4 hours) - Mobile/tablet/desktop breakpoints
2. **TASK-031:** Framer Motion animations (2-4 hours) - Page transitions, UI effects
3. **TASK-027:** Enhanced Main Menu (2-4 hours) - Avatar selection, better visual polish

But focus on TASK-028 first. One task at a time, done well.

---

## Additional Context

### Week 1 Completion Status

Week 1 is 93% complete. Here's what's solid:

**Frontend (10/11 tasks done):**
- React + Vite + TypeScript setup
- Tailwind CSS configured
- ESLint + Prettier
- React Router with routes
- Phaser 3 integrated
- Zustand stores created
- Socket.io client wrapper
- Environment variables
- UI component library (Button, Modal, Card, Timer, NotificationContainer)
- Main Menu screen with navigation

**Backend (8/8 tasks done):**
- Go server with Chi router
- PostgreSQL database with schema (users, user_stats, game_rooms, game_history)
- JWT authentication (register, login, /auth/me endpoints)
- WebSocket hub operational
- WebSocket message routing (lobby, game events)
- 28 comprehensive tests (100% pass rate)
- Complete API documentation

**Only 1 Task Blocked:**
- TASK-011: Integration test between frontend and backend (deferred to Week 3, not blocking you)

**Week 2 Status:**
- Card generation in progress (4/35 done, user continuing)
- Automation pipeline complete (post-processing takes 5 seconds per card)
- Parallel work UNBLOCKED (you can start immediately)

### Coordination

The user is generating cards. The designer can start on particles and avatars. The backend engineer is planning Week 3. You are cleared to work on lobby without any dependencies.

This is a critical milestone. The lobby is the first real multiplayer experience. Make it smooth, make it polished, make it feel exciting.

---

## Final Notes

You have everything you need:
- Solid Week 1 foundation
- Complete PRD with mockups
- Design system specifications
- Backend API ready and tested
- No blockers

Go build an amazing lobby screen. This is a key piece of the MVP. Take pride in the work.

When you're done, update PROJECT_STATE.md with your progress and mark TASK-028 as DONE.

Good luck, and have fun building this!

---

**Task Delegation Complete**
**Status:** READY TO START
**Priority:** HIGH (P1)
**Estimated Time:** 4-8 hours
**Blocking:** No blockers, proceed immediately
**Next Update:** After TASK-028 completion
