# Phase 1: Connection & Authentication - Testing Guide

## Overview

Phase 1 has been completed. This guide will help you verify that WebSocket connection and authentication are working correctly between the frontend and backend.

## What Was Implemented

### Frontend Changes

1. **Environment Configuration** (`.env.local`)
   - Added `VITE_WS_URL=ws://localhost:8080/ws`
   - Backend URL already configured: `VITE_BACKEND_URL=http://localhost:8080`

2. **JWT Token Storage** (`playerStore.ts`)
   - Added `token` field to persist JWT tokens
   - Added `setToken()` and `clearAuth()` actions
   - Token persists across sessions via localStorage

3. **Native WebSocket Service** (`socketService.ts`)
   - Replaced Socket.IO client with native WebSocket implementation
   - Compatible with Gorilla WebSocket backend (native protocol)
   - Features:
     - Auto-authentication on connect (if token provided)
     - Message queueing when disconnected
     - Exponential backoff reconnection (5 attempts)
     - Type-safe event emission and handling

4. **Updated LobbyScreen** (`LobbyScreen.tsx`)
   - Uses new native WebSocket API
   - Handles auth success/error events
   - Connects with JWT token automatically

5. **Test Page** (`/test-connection`)
   - Simple UI to test WebSocket connection
   - View real-time event log
   - Test authentication flow

6. **Unit Tests** (`socketService.test.ts`)
   - 19 tests passing
   - Verifies API surface and type safety

## Prerequisites

### Backend Must Be Running

```bash
cd /Users/nana/go/src/github.com/npeprah/sparui/backend
make run
```

Verify backend is running:
```bash
curl http://localhost:8080/health
# Should return: {"status":"healthy","service":"game-server"}
```

### Frontend Dev Server

```bash
cd /Users/nana/go/src/github.com/npeprah/sparui/frontend
npm run dev
```

Frontend should be available at: `http://localhost:5173`

## Testing Methods

### Method 1: Automated Test Page (Recommended)

This is the easiest way to test the WebSocket connection and authentication.

**Steps:**

1. **Navigate to test page:**
   ```
   http://localhost:5173/test-connection
   ```

2. **Enter a test token:**
   - Use any string (e.g., "test-token-123")
   - Backend currently accepts any non-empty token for testing

3. **Click "Connect & Authenticate"**

4. **Expected Results:**
   - Status changes: disconnected → connecting → connected → authenticated
   - Event log shows:
     ```json
     [time] connected
     { "playerId": "" }

     [time] auth:success
     { "playerId": "player-test-tok", "message": "Authenticated successfully" }
     ```

5. **Verify in Browser DevTools:**
   - Open DevTools (F12) → Network → WS tab
   - Should see: `ws://localhost:8080/ws` with status "101 Switching Protocols"
   - Click the connection to see frames:
     - Outgoing: `{"event":"auth","data":{"token":"test-token-123"}}`
     - Incoming: `{"event":"auth:success","data":{"playerId":"player-test-tok",...}}`

**Success Criteria:**
- Green status indicator showing "Authenticated"
- Two events in log: `connected` and `auth:success`
- WebSocket connection visible in DevTools
- No console errors

### Method 2: Browser DevTools Console

If you prefer manual testing, you can use the browser console directly.

**Steps:**

1. **Navigate to any page:**
   ```
   http://localhost:5173
   ```

2. **Open Browser Console (F12)**

3. **Import and test the socket service:**
   ```javascript
   // Connect to WebSocket with a test token
   import('/src/services/socketService.js').then(({ socketService }) => {
     // Register event listener
     socketService.on('auth:success', (data) => {
       console.log('✅ Authenticated!', data)
     })

     socketService.on('auth:error', (data) => {
       console.error('❌ Auth failed:', data)
     })

     // Connect with test token
     socketService.connect('my-test-token-123')
   })
   ```

4. **Expected Console Output:**
   ```
   Connecting to WebSocket: ws://localhost:8080/ws
   WebSocket connected successfully
   Sending authentication on connect
   Sent WebSocket message: auth { token: 'my-test-token-123' }
   Received WebSocket message: auth:success { playerId: 'player-my-test', message: '...' }
   ✅ Authenticated! { playerId: 'player-my-test', message: 'Authenticated successfully' }
   ```

### Method 3: Unit Tests

Run the automated unit tests:

```bash
cd /Users/nana/go/src/github.com/npeprah/sparui/frontend
npm test -- socketService.test.ts
```

**Expected Output:**
```
✓ src/services/socketService.test.ts (19 tests) 35ms
  Test Files  1 passed (1)
  Tests  19 passed (19)
```

## Troubleshooting

### Issue: WebSocket connection fails

**Symptoms:**
- "Connection refused" error
- No WebSocket in DevTools Network tab

**Solutions:**

1. **Check backend is running:**
   ```bash
   curl http://localhost:8080/health
   ```
   If this fails, backend is not running. Start it with `make run`.

2. **Check WebSocket URL:**
   - Open `frontend/.env.local`
   - Verify: `VITE_WS_URL=ws://localhost:8080/ws`

3. **Check CORS settings:**
   - Backend should allow `localhost:5173`
   - Check backend logs for CORS errors

4. **Check firewall:**
   - Ensure port 8080 is not blocked
   - Try: `telnet localhost 8080`

### Issue: Connection succeeds but auth fails

**Symptoms:**
- WebSocket connects
- Receive `auth:error` event

**Solutions:**

1. **Check token format:**
   - Token should be non-empty string
   - Backend accepts any non-empty token for now

2. **Check backend logs:**
   ```bash
   # In backend terminal, look for:
   Auth event clientId=...
   Client authenticated clientId=... playerId=...
   ```

3. **Verify message format:**
   - Check DevTools → Network → WS → Frames
   - Outgoing message should be:
     ```json
     {"event":"auth","data":{"token":"your-token"}}
     ```

### Issue: "No handlers registered for event: X"

**Symptom:**
- Console warning: "No handlers registered for event: auth:success"

**Solution:**
- This is just a warning, not an error
- Register a handler before connecting:
  ```javascript
  socketService.on('auth:success', (data) => console.log(data))
  socketService.connect('token')
  ```

### Issue: Reconnection loop

**Symptoms:**
- Console shows repeated "Reconnecting in Xms" messages
- Connection never stabilizes

**Solutions:**

1. **Check backend is actually running and accessible**

2. **Check for WebSocket protocol mismatch:**
   - Frontend uses native WebSocket
   - Backend uses Gorilla WebSocket (native)
   - These should be compatible

3. **Check browser console for detailed errors:**
   - Look for "WebSocket error:" messages
   - Check the error details

## Backend Logs

When testing, you should see these logs in the backend terminal:

```
INFO Client registered clientId=20250102150405 playerId=
INFO Received message event=auth clientId=20250102150405
INFO Auth event clientId=20250102150405
INFO Client authenticated clientId=20250102150405 playerId=player-test-tok
```

If you don't see these logs:
1. Backend might not be running
2. WebSocket connection might not be established
3. Auth event might not be sent correctly

## Next Steps

Once Phase 1 is verified working:

1. **Phase 2: Room/Lobby Integration**
   - Test `lobby:create` event
   - Test `lobby:join` event with room codes
   - Verify player list synchronization

2. **Phase 3: Game Start & Deal**
   - Test game initialization
   - Verify 5 cards dealt per player

3. **Phase 4: Card Play & Turn Management**
   - Test card play events
   - Verify turn management

... (Phases 5-7 follow)

## Files Modified

### Configuration
- `/Users/nana/go/src/github.com/npeprah/sparui/frontend/.env.local`

### Core Implementation
- `/Users/nana/go/src/github.com/npeprah/sparui/frontend/src/services/socketService.ts` (complete rewrite)
- `/Users/nana/go/src/github.com/npeprah/sparui/frontend/src/store/playerStore.ts` (added token)
- `/Users/nana/go/src/github.com/npeprah/sparui/frontend/src/components/lobby/LobbyScreen.tsx` (updated for new API)

### Testing & Development
- `/Users/nana/go/src/github.com/npeprah/sparui/frontend/src/pages/ConnectionTest.tsx` (new)
- `/Users/nana/go/src/github.com/npeprah/sparui/frontend/src/App.tsx` (added test route)
- `/Users/nana/go/src/github.com/npeprah/sparui/frontend/src/services/socketService.test.ts` (new)

## Success Criteria Checklist

Phase 1 is complete when all of these are verified:

- [ ] Backend server running on port 8080
- [ ] Frontend dev server running on port 5173
- [ ] WebSocket connection established to `ws://localhost:8080/ws`
- [ ] Auth event sent automatically on connection
- [ ] Backend validates token and responds with `auth:success`
- [ ] Frontend receives and handles `auth:success` event
- [ ] Connection status tracked correctly (disconnected → connected → authenticated)
- [ ] Test page works correctly (`/test-connection`)
- [ ] Unit tests pass (19/19)
- [ ] No console errors during normal operation
- [ ] Reconnection works after network interruption
- [ ] Manual disconnect works correctly

## Architecture Notes

### Why We Switched from Socket.IO

The backend uses Gorilla WebSocket, which is a native WebSocket implementation. Socket.IO uses its own protocol on top of WebSocket, which is incompatible with native WebSocket servers.

**Before:**
```
Frontend (Socket.IO client) ❌ Backend (Gorilla WebSocket)
            Incompatible protocols
```

**After:**
```
Frontend (Native WebSocket) ✅ Backend (Gorilla WebSocket)
            Both use native WebSocket protocol
```

### Message Format

All messages follow this structure:

```typescript
{
  "event": "event_name",
  "data": { /* event-specific data */ }
}
```

Example auth message:
```json
{
  "event": "auth",
  "data": {
    "token": "jwt-token-here"
  }
}
```

Example auth response:
```json
{
  "event": "auth:success",
  "data": {
    "playerId": "player-abc123",
    "message": "Authenticated successfully"
  }
}
```

## Known Limitations (MVP)

1. **Backend token validation is simplified:**
   - Currently accepts any non-empty token
   - Production should use proper JWT validation
   - See comment in `backend/service/game-server/controller/websocket/websocket.go:286`

2. **No connection status UI indicator:**
   - LobbyScreen shows reconnecting banner
   - Global connection indicator could be added to header

3. **Token refresh not implemented:**
   - Tokens expire after 24 hours (backend default)
   - User must re-login after expiration

4. **No session resumption:**
   - After disconnect, must re-authenticate
   - Game state not automatically restored

These limitations are acceptable for MVP and will be addressed post-launch.

## Contact

If you encounter issues not covered in this guide:

1. Check backend logs for detailed error messages
2. Check browser console for frontend errors
3. Verify all prerequisites are met
4. Review the "Troubleshooting" section above

Good luck with Phase 2 integration!
