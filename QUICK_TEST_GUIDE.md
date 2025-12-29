# Phase 2 - Quick Test Guide

## Prerequisites
- Backend running: `cd backend && go run cmd/main.go`
- Frontend running: `cd frontend && npm run dev`
- Two browser tabs ready (use incognito for 2nd player)

## 5-Minute Smoke Test

### Test 1: Basic Flow (2 min)
1. **Tab 1:** Create Private Game → See room code
2. **Tab 2:** Join with room code → Both see 2 players
3. **Both:** Click Ready → See green checkmarks
4. **Tab 1 (Host):** Click Start Game → Both navigate to /game

✅ **Pass Criteria:** All 4 steps work without errors

### Test 2: Host Migration (1 min)
1. Create room with 2 players
2. Host leaves
3. Player 2 sees "You are now the host"

✅ **Pass Criteria:** HOST badge transfers correctly

### Test 3: Settings (1 min)
1. Host changes Points to Win
2. Player 2 sees update
3. Player 2 cannot change settings

✅ **Pass Criteria:** Settings sync, non-host read-only

### Test 4: Validation (1 min)
1. Try to start with 1 player → Warning
2. Try to start with not all ready → Warning
3. Non-host tries to change settings → Disabled

✅ **Pass Criteria:** All validations block invalid actions

## What to Check in Console

**Good Signs:**
```
Room created: { roomCode: 'ABC123', ... }
Player joined room: { player: {...}, players: [...] }
✅ Connected to server
```

**Bad Signs:**
```
❌ Authentication failed
❌ Room not found
❌ WebSocket error
```

## Expected Backend Logs
```
[INFO] WebSocket connection established
[INFO] Player authenticated: player-123
[INFO] Room created: ABC123
[INFO] Player joined room: ABC123
[INFO] Broadcasting room:player_joined to 2 clients
```

## Quick Fixes

**Room code not showing:**
- Refresh and try again
- Check backend is running
- Check console for auth:success

**Player not appearing:**
- Check room code is correct (case sensitive)
- Verify 6 characters exactly
- Check backend logs for join event

**Can't start game:**
- Verify all players ready (green checkmarks)
- Verify you are host
- Verify at least 2 players

## Success = All 4 Tests Pass

If all tests pass, Phase 2 is fully working!

Report results to continue to Phase 3.
