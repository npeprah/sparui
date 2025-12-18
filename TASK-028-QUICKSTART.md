# TASK-028: Lobby Screen - Quick Start Guide

**Ready to test the lobby?** This guide gets you up and running in 2 minutes.

---

## TL;DR

```bash
# Terminal 1: Start Frontend
cd /Users/nana/go/src/github.com/npeprah/sparui/frontend
npm run dev

# Terminal 2: Start Backend (when ready)
cd /Users/nana/go/src/github.com/npeprah/sparui/backend
go run cmd/main.go

# Open 2 browser tabs:
# Tab 1: http://localhost:5173 → Create Private Game
# Tab 2: http://localhost:5173 → Join Private Game → Enter code from Tab 1
```

---

## Prerequisites

### 1. Dependencies Installed
```bash
cd /Users/nana/go/src/github.com/npeprah/sparui/frontend
npm install
```

### 2. Environment Variables
Verify `frontend/.env` or `frontend/.env.local` has:
```bash
VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080/ws
VITE_BACKEND_URL=http://localhost:8080
```

---

## Start Frontend (Required)

```bash
cd /Users/nana/go/src/github.com/npeprah/sparui/frontend
npm run dev
```

**Output:**
```
VITE v5.4.21  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**Open:** http://localhost:5173

---

## Start Backend (Optional for Full Testing)

The lobby UI works standalone, but WebSocket features require the backend.

```bash
cd /Users/nana/go/src/github.com/npeprah/sparui/backend
go run cmd/main.go
```

**Expected Output:**
```
Server starting on :8080
WebSocket endpoint: /ws
```

**Note:** If backend isn't ready yet, you can still see the UI. WebSocket events just won't work.

---

## Quick Test (2 Minutes)

### Test 1: Create a Lobby (30 seconds)

1. Open http://localhost:5173
2. Click **"Create Private Game"**
3. You should see:
   - Room code (6 characters)
   - Your player in slot 1 with crown
   - "Start Game" button (disabled)
   - Game settings panel

**Success?** ✅ Lobby screen loads

---

### Test 2: Join a Lobby (1 minute)

1. Open **new browser tab** at http://localhost:5173
2. Click **"Join Private Game"**
3. Enter room code from Tab 1
4. Click **"Join Lobby"**

**Expected:**
- Tab 2: Shows lobby with 2 players
- Tab 1: Updates to show second player
- Player count: 2/4

**Success?** ✅ Multiplayer lobby works

---

### Test 3: Ready Up (30 seconds)

**Tab 2:**
1. Click **"Ready Up"** button

**Expected (both tabs):**
- Player 2 slot turns green
- Ready count: 1/2
- "Start Game" still disabled

**Tab 1 (Host):**
2. Click **"Ready Up"** button

**Expected (both tabs):**
- Both players green
- Ready count: 2/2
- "Start Game" enabled in Tab 1

**Success?** ✅ Ready status syncs in real-time

---

## Common Issues

### Issue: Port 5173 already in use
```bash
# Kill the process on port 5173
lsof -ti:5173 | xargs kill -9

# Or change port in vite.config.ts
# server: { port: 3000 }
```

### Issue: "Cannot connect to backend"
This is normal if backend isn't running yet. The lobby UI still works for visual testing.

### Issue: Room code doesn't copy
Make sure you're on `localhost` or `https`. Clipboard API requires secure context.

### Issue: Changes not showing up
```bash
# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

---

## What to Test

### ✅ Visual Testing (No Backend Needed)
- [ ] Home page loads
- [ ] Lobby UI looks good
- [ ] Buttons respond to hover
- [ ] Responsive on mobile
- [ ] Colors match design system

### ✅ Functional Testing (Backend Required)
- [ ] Create room generates unique code
- [ ] Join room by code works
- [ ] Players sync across tabs
- [ ] Ready status updates
- [ ] Settings changes broadcast
- [ ] Leave room works
- [ ] Host closing room kicks all players

---

## File Locations

**Components:**
```
frontend/src/components/lobby/
├── LobbyScreen.tsx       # Main container
├── RoomCodeDisplay.tsx   # Room code with copy
├── PlayerList.tsx        # All player slots
├── PlayerSlot.tsx        # Individual player
├── GameSettings.tsx      # Settings panel
└── LobbyActions.tsx      # Action buttons
```

**Store:**
```
frontend/src/store/
├── lobbyStore.ts         # Lobby state management
└── types.ts              # LobbyPlayer, LobbySettings types
```

**Services:**
```
frontend/src/services/
└── socketService.ts      # WebSocket wrapper
```

---

## Next Steps

### 1. Visual Review
Walk through the lobby and check:
- Does it match the arcade aesthetic?
- Are colors correct (fire red, gold, ice blue)?
- Is it responsive on mobile?

### 2. Functional Review
Follow the [Testing Guide](./TASK-028-TESTING-GUIDE.md) for comprehensive tests.

### 3. Integration Testing
When backend is ready:
- Test all WebSocket events
- Verify real-time sync
- Test error handling

### 4. Code Review
Review code quality:
- TypeScript strict mode
- No console warnings
- Clean component structure
- Proper event cleanup

---

## Development Tips

### Hot Module Replacement (HMR)
Vite supports HMR. Edit any component and see changes instantly.

### Debug Mode
```javascript
// In browser console
localStorage.debug = 'socket.io-client:*'
// Reload page to see WebSocket debug logs
```

### Zustand DevTools
```javascript
// View lobby store state
console.log(useLobbyStore.getState())

// Subscribe to changes
useLobbyStore.subscribe(console.log)
```

### Inspect WebSocket
Chrome DevTools → Network → WS (filter) → Click connection → View messages

---

## Documentation

- **Implementation Details:** [TASK-028-IMPLEMENTATION.md](./TASK-028-IMPLEMENTATION.md)
- **Testing Guide:** [TASK-028-TESTING-GUIDE.md](./TASK-028-TESTING-GUIDE.md)
- **Task Brief:** [FRONTEND_TASK_DELEGATION.md](./FRONTEND_TASK_DELEGATION.md)

---

## Questions?

**UI Issues:** Check component files in `src/components/lobby/`
**State Issues:** Check `src/store/lobbyStore.ts`
**WebSocket Issues:** Check `src/services/socketService.ts`
**Styling Issues:** Check Tailwind classes in components

---

**Quick Start Version:** 1.0
**Last Updated:** December 18, 2025
**Status:** Ready to Go 🚀
