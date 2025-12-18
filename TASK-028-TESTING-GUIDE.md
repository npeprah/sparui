# TASK-028: Lobby Screen Testing Guide

**Date:** December 18, 2025
**Task:** Build Lobby Screen
**Status:** Ready for Testing

---

## Prerequisites

### Backend Server
The backend WebSocket server must be running for full testing:

```bash
# Navigate to backend directory
cd /Users/nana/go/src/github.com/npeprah/sparui/backend

# Start the server (adjust command as needed)
go run cmd/main.go
# OR
./bin/server

# Verify server is running on http://localhost:8080
```

### Frontend Server
Start the frontend development server:

```bash
# Navigate to frontend directory
cd /Users/nana/go/src/github.com/npeprah/sparui/frontend

# Install dependencies (if not done)
npm install

# Start dev server
npm run dev

# Should start on http://localhost:5173
```

### Testing Setup
- Open 2-4 browser tabs for multiplayer testing
- Use Chrome DevTools for network inspection
- Keep browser console open for WebSocket logs

---

## Critical Test Flows (Must Pass)

### Test 1: Create Private Game

**Objective:** Verify room creation and lobby initialization

**Steps:**
1. Open http://localhost:5173
2. Click "Create Private Game" button
3. Wait for navigation to /lobby

**Expected Results:**
- ✅ Navigates to `/lobby` route
- ✅ Room code displayed (6 alphanumeric characters, e.g., "A3X9K2")
- ✅ Current player appears in Player Slot 1
- ✅ Player slot shows:
  - Username (default: "Guest")
  - Crown icon (host indicator)
  - Gold border
  - "HOST" label
- ✅ "Start Game" button is present but **disabled**
- ✅ Game settings are editable (not read-only)
- ✅ Settings show default values:
  - Points to Win: 10 (selected)
  - Surface Theme: Poker Table
  - Max Players: 4
- ✅ "Leave Lobby" button is present
- ✅ Player count shows "1/4"
- ✅ Ready count shows "0 ready"

**Console Logs to Verify:**
```
✅ Socket connected: <socket-id>
Lobby created: { roomCode: "A3X9K2", hostId: "player-..." }
```

**Failure Scenarios:**
- Room code not displayed → Check backend lobby:created event
- Player not in slot 1 → Check lobbyStore.addPlayer()
- Start button enabled → Check canStartGame logic

---

### Test 2: Join Private Game

**Objective:** Verify second player can join existing room

**Setup:**
- Tab 1: Already in lobby with room code "A3X9K2" (from Test 1)
- Tab 2: Fresh browser tab at home page

**Steps (Tab 2):**
1. Click "Join Private Game"
2. Modal appears with input field
3. Enter room code from Tab 1: "A3X9K2"
4. Click "Join Lobby"

**Expected Results (Tab 2):**
- ✅ Modal closes
- ✅ Navigates to `/lobby`
- ✅ Room code displays "A3X9K2"
- ✅ Player count shows "2/4"
- ✅ Player Slot 1 shows host (from Tab 1)
- ✅ Player Slot 2 shows current player (Tab 2)
  - Username: "Guest"
  - No crown icon
  - Gray border (not ready)
  - No "HOST" label
- ✅ Game settings are **read-only** (disabled)
- ✅ "Ready Up" button is present
- ✅ "Start Game" button is **not** present

**Expected Results (Tab 1):**
- ✅ Player count updates to "2/4"
- ✅ Player Slot 2 now shows second player
- ✅ Notification appears: "Guest joined the lobby"

**Console Logs (Tab 2):**
```
Joined lobby: { roomCode: "A3X9K2", players: [...] }
```

**Console Logs (Tab 1):**
```
Player joined: { player: { id: "...", username: "Guest", ... } }
```

**Failure Scenarios:**
- "Room not found" error → Backend room doesn't exist
- Navigation fails → Check socketService.emit('lobby:join')
- Player not added to Tab 1 → Check lobby:player_joined event handler

---

### Test 3: Ready Status Toggle

**Objective:** Verify ready status synchronization across clients

**Setup:**
- Tab 1: Host in lobby
- Tab 2: Second player in lobby (from Test 2)

**Steps (Tab 2):**
1. Click "Ready Up" button

**Expected Results (Tab 2):**
- ✅ Button changes to "✓ Ready" with green background
- ✅ Player Slot 2 border turns **green**
- ✅ Ready count updates to "1 ready"

**Expected Results (Tab 1):**
- ✅ Player Slot 2 border turns **green**
- ✅ Ready count updates to "1 ready"
- ✅ "Start Game" button remains **disabled** (host not ready)

**Steps (Tab 1):**
2. Click "Ready Up" button (host readies)

**Expected Results (Both Tabs):**
- ✅ Player Slot 1 border turns **green**
- ✅ Ready count updates to "2 ready"
- ✅ "Start Game" button in Tab 1 becomes **enabled**

**Steps (Tab 2):**
3. Click "Ready Up" again (toggle off)

**Expected Results (Both Tabs):**
- ✅ Player Slot 2 border returns to **gray**
- ✅ Ready count updates to "1 ready"
- ✅ "Start Game" button in Tab 1 becomes **disabled**

**Console Logs:**
```
Ready changed: { playerId: "...", isReady: true }
Ready changed: { playerId: "...", isReady: false }
```

**Failure Scenarios:**
- Ready status not syncing → Check lobby:ready_changed event
- Start button logic wrong → Check canStartGame calculation
- Border color not changing → Check PlayerSlot component styling

---

### Test 4: Host Settings Changes

**Objective:** Verify settings updates broadcast to all players

**Setup:**
- Tab 1: Host in lobby
- Tab 2: Second player in lobby

**Steps (Tab 1):**
1. Click "15" button in "Points to Win" section
2. Select "Neon Lounge" from Surface Theme dropdown

**Expected Results (Tab 1):**
- ✅ "15" button is selected (fire red background)
- ✅ "10" and "21" buttons are unselected (gray background)
- ✅ Dropdown shows "Neon Lounge"
- ✅ Notification appears: "Game settings updated"

**Expected Results (Tab 2):**
- ✅ "15" button is selected
- ✅ Dropdown shows "Neon Lounge"
- ✅ Notification appears: "Game settings updated"
- ✅ Settings remain read-only (disabled)

**Steps (Tab 2):**
3. Try clicking "10" button or changing dropdown

**Expected Results:**
- ✅ No changes occur (settings are disabled)
- ✅ Cursor shows "not-allowed" on hover

**Console Logs (Both Tabs):**
```
Settings changed: { settings: { pointsToWin: 15, surfaceTheme: "neon" } }
```

**Failure Scenarios:**
- Settings not syncing → Check lobby:settings_changed event
- Non-host can edit → Check isHost prop in GameSettings
- Notification not appearing → Check addNotification in event handler

---

### Test 5: Leave Room (Non-Host)

**Objective:** Verify non-host player can leave without closing room

**Setup:**
- Tab 1: Host in lobby
- Tab 2: Second player in lobby

**Steps (Tab 2):**
1. Click "Leave Lobby" button

**Expected Results (Tab 2):**
- ✅ Navigates back to home page (/)
- ✅ Room state is cleared

**Expected Results (Tab 1):**
- ✅ Player count updates to "1/4"
- ✅ Player Slot 2 is now empty (gray placeholder)
- ✅ Notification appears: "Guest left the lobby"
- ✅ Lobby remains open

**Console Logs (Tab 1):**
```
Player left: { playerId: "..." }
```

**Failure Scenarios:**
- Room closes → Backend should only close room when host leaves
- Player not removed from Tab 1 → Check lobby:player_left event handler
- Navigation fails in Tab 2 → Check leaveLobby() function

---

### Test 6: Leave Room (Host Closes Room)

**Objective:** Verify room closes when host leaves

**Setup:**
- Tab 1: Host in lobby
- Tab 2: Second player in lobby (rejoined after Test 5)

**Steps (Tab 1):**
1. Click "Leave Lobby" button

**Expected Results (Tab 1):**
- ✅ Navigates back to home page (/)
- ✅ Room state is cleared

**Expected Results (Tab 2):**
- ✅ Notification appears: "Lobby closed" or "Host left the room"
- ✅ Navigates back to home page (/)
- ✅ Room state is cleared

**Console Logs (Tab 2):**
```
Room closed: { reason: "Host left the room" }
```

**Failure Scenarios:**
- Tab 2 doesn't get notification → Check lobby:room_closed event
- Tab 2 doesn't navigate → Check navigation in event handler
- Room persists on backend → Backend should delete room when host leaves

---

### Test 7: Copy Room Code

**Objective:** Verify room code can be copied to clipboard

**Setup:**
- Tab 1: In lobby with room code "A3X9K2"

**Steps:**
1. Click "📋 Copy" button next to room code

**Expected Results:**
- ✅ Button text changes to "✓ Copied!" with green background
- ✅ Room code "A3X9K2" is in clipboard
- ✅ After 2 seconds, button reverts to "📋 Copy"

**Manual Verification:**
1. Open a text editor
2. Paste (Cmd+V or Ctrl+V)
3. Verify pasted text is "A3X9K2"

**Failure Scenarios:**
- Copy fails → Check browser clipboard permissions
- Button doesn't revert → Check setTimeout in RoomCodeDisplay
- Wrong text copied → Check roomCode prop value

---

### Test 8: Invalid Room Code

**Objective:** Verify error handling for non-existent room

**Steps:**
1. Click "Join Private Game"
2. Enter invalid room code: "XXXXXX"
3. Click "Join Lobby"

**Expected Results:**
- ✅ Error notification appears: "Room not found" or similar
- ✅ Stays on home page (doesn't navigate)
- ✅ Modal remains open OR closes with error shown

**Console Logs:**
```
Lobby error: { message: "Room not found" }
```

**Failure Scenarios:**
- No error shown → Check lobby:error event handler
- Navigates to lobby → Backend should reject invalid room codes
- App crashes → Add error boundary

---

### Test 9: Start Game

**Objective:** Verify game starts and players navigate to game screen

**Setup:**
- Tab 1: Host in lobby, ready
- Tab 2: Second player in lobby, ready
- Both players ready (green borders)

**Steps (Tab 1):**
1. Click "Start Game" button

**Expected Results (Both Tabs):**
- ✅ Notification appears: "Game starting in X seconds..."
- ✅ After countdown, navigates to `/game` route
- ✅ Game ID passed to game screen

**Console Logs (Both Tabs):**
```
Game starting: { gameId: "...", countdown: 3 }
```

**Failure Scenarios:**
- Navigation doesn't happen → Check lobby:game_starting event handler
- Game ID not passed → Check navigate('/game', { state: { gameId } })
- Only one player navigates → Check event broadcasting on backend

---

### Test 10: Connection Reconnection

**Objective:** Verify reconnection handling when connection drops

**Steps:**
1. Open lobby in Tab 1
2. Open browser DevTools → Network tab
3. Filter for WebSocket (WS)
4. Right-click on WebSocket connection → Close connection

**Expected Results:**
- ✅ Yellow banner appears: "Reconnecting to server..."
- ✅ After 1-5 seconds, reconnects automatically
- ✅ Banner disappears
- ✅ Lobby state persists (room code, players)

**Console Logs:**
```
❌ Socket disconnected: transport close
✅ Socket connected: <new-socket-id>
```

**Failure Scenarios:**
- Doesn't reconnect → Check socketService reconnection config
- State lost on reconnect → Backend should maintain room state
- Infinite reconnection loop → Check reconnectionAttempts limit

---

## Edge Case Tests

### Edge 1: Maximum Players (4/4)

**Setup:**
- Open 4 browser tabs
- Tab 1-3: Successfully joined room
- Tab 4: At home page

**Steps (Tab 4):**
1. Try joining the full room

**Expected Results:**
- ✅ Error notification: "Room is full"
- ✅ Stays on home page

---

### Edge 2: Room Code Validation

**Test invalid room codes:**
1. "12345" (only 5 characters) → Error before emit
2. "ABCDEFG" (7 characters) → Error before emit
3. "" (empty) → Error before emit
4. "ABC 123" (contains space) → Error before emit

**Expected:**
- ✅ All show error: "Please enter a valid 6-character room code"
- ✅ No WebSocket emit occurs

---

### Edge 3: Multiple Ready Toggles

**Steps:**
1. Click Ready/Not Ready 10 times rapidly

**Expected Results:**
- ✅ No crashes
- ✅ Final state is correct
- ✅ All tabs synchronized

---

### Edge 4: Host Ready Status

**Requirement:** Host must be ready for game to start

**Steps:**
1. Host readies up
2. Player 2 readies up
3. Host toggles ready off
4. Verify "Start Game" button disables

**Expected:**
- ✅ Button disabled when host is not ready

---

## Visual/UI Tests

### Responsive Design

**Desktop (> 1024px):**
- ✅ 3-column layout (player list 2/3, settings 1/3)
- ✅ Room code and player names clearly visible

**Tablet (640px - 1024px):**
- ✅ Layout adjusts gracefully
- ✅ Settings stack below player list on smaller tablets

**Mobile (< 640px):**
- ✅ Single column layout
- ✅ Player slots stack vertically
- ✅ Buttons are touch-friendly (min 44x44px)
- ✅ Room code remains prominent

**Test Devices:**
- iPhone 12/13/14 (390x844)
- iPad (768x1024)
- Android phone (360x800)

---

### Color and Styling

**Host Indicator:**
- ✅ Gold border (#FFD700)
- ✅ Crown emoji visible
- ✅ "HOST" label in gold text

**Ready Status:**
- ✅ Ready: Green border (#10B981), green checkmark
- ✅ Not Ready: Gray border, "Not Ready" text

**Current Player:**
- ✅ Ice blue ring around avatar (#00BCD4)

**Buttons:**
- ✅ Hover: Scale 105%
- ✅ Disabled: Opacity 50%, cursor not-allowed
- ✅ Loading: Disabled with loading text

---

### Accessibility

**Keyboard Navigation:**
- ✅ Tab through all interactive elements
- ✅ Enter/Space activates buttons
- ✅ Focus visible (outline)

**Screen Reader:**
- ✅ Button labels are descriptive
- ✅ Player slots have semantic structure
- ✅ Settings have labels

**Color Contrast:**
- ✅ Text on backgrounds meets WCAG AA
- ✅ Button text readable

---

## Performance Tests

### Load Time
- ✅ Initial page load < 2 seconds
- ✅ Lobby page renders instantly

### WebSocket Latency
- ✅ Events received within 100-500ms
- ✅ UI updates feel instant

### Memory Leaks
- ✅ No memory growth after 10+ lobby join/leave cycles
- ✅ Event listeners properly cleaned up on unmount

---

## Testing Checklist

### Functional Tests
- [ ] Test 1: Create Private Game
- [ ] Test 2: Join Private Game
- [ ] Test 3: Ready Status Toggle
- [ ] Test 4: Host Settings Changes
- [ ] Test 5: Leave Room (Non-Host)
- [ ] Test 6: Leave Room (Host Closes)
- [ ] Test 7: Copy Room Code
- [ ] Test 8: Invalid Room Code
- [ ] Test 9: Start Game
- [ ] Test 10: Connection Reconnection

### Edge Cases
- [ ] Maximum Players (4/4)
- [ ] Room Code Validation
- [ ] Multiple Ready Toggles
- [ ] Host Ready Status

### Visual/UI
- [ ] Desktop responsive
- [ ] Tablet responsive
- [ ] Mobile responsive
- [ ] Color and styling correct
- [ ] Accessibility (keyboard, screen reader)

### Performance
- [ ] Load time acceptable
- [ ] WebSocket latency acceptable
- [ ] No memory leaks

---

## Bug Reporting Template

If you find a bug, report using this format:

```markdown
### Bug: [Short Description]

**Severity:** Critical / High / Medium / Low

**Test Case:** Test X: [Name]

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Result:**
What should happen

**Actual Result:**
What actually happened

**Screenshots/Logs:**
[Paste console logs or attach screenshots]

**Environment:**
- Browser: Chrome 120
- OS: macOS 14
- Frontend: localhost:5173
- Backend: localhost:8080

**Reproducibility:** Always / Sometimes / Rare
```

---

## Success Criteria

All tests must pass before marking TASK-028 as COMPLETE:

- ✅ All 10 critical test flows pass
- ✅ All edge cases handled
- ✅ UI matches design system
- ✅ Responsive on mobile, tablet, desktop
- ✅ Accessibility requirements met
- ✅ Performance acceptable
- ✅ No console errors
- ✅ TypeScript compiles without errors
- ✅ Build succeeds (`npm run build`)

---

## Notes

### Backend Debugging

If events aren't working, check backend logs:

```bash
# In backend terminal
# Look for WebSocket connection logs
# Look for lobby event handling logs
```

### Frontend Debugging

```javascript
// In browser console
// View lobby store state
console.log(window.__ZUSTAND_LOBBY_STATE__)

// Check socket connection
console.log(socketService.isConnected())
```

### Common Issues

**Issue:** "Socket not connected" warning
**Fix:** Verify backend is running on port 8080

**Issue:** Room code not copying
**Fix:** HTTPS required for clipboard API (or localhost)

**Issue:** Players not syncing
**Fix:** Check both tabs have same room code

---

**Testing Guide Version:** 1.0
**Last Updated:** December 18, 2025
**Status:** Ready for QA
