# TASK-039: Room Manager - Frontend Integration Guide

Quick start guide for frontend engineers integrating with the room management system.

## Prerequisites

1. Backend server running on `http://localhost:8080`
2. Valid JWT token from authentication
3. WebSocket library (e.g., socket.io-client, native WebSocket API)

## WebSocket Connection Setup

### 1. Establish Connection

```javascript
// Using native WebSocket API
const ws = new WebSocket('ws://localhost:8080/ws', {
  headers: {
    'Origin': 'http://localhost:5173'
  }
});

ws.onopen = () => {
  console.log('WebSocket connected');
  authenticateWebSocket();
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  handleWebSocketMessage(message);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('WebSocket disconnected');
};
```

### 2. Authenticate WebSocket

```javascript
function authenticateWebSocket() {
  const token = localStorage.getItem('jwt_token');

  ws.send(JSON.stringify({
    event: 'auth',
    data: { token }
  }));
}
```

## Room Management API

### Create Room

```javascript
function createRoom(settings = {}) {
  const message = {
    event: 'lobby:create',
    data: {
      settings: {
        pointsToWin: settings.pointsToWin || 10,
        surfaceTheme: settings.surfaceTheme || 'poker-table'
      }
    }
  };

  ws.send(JSON.stringify(message));
}

// Usage
createRoom({ pointsToWin: 15, surfaceTheme: 'neon' });
```

**Expected Response:**
```javascript
{
  event: 'lobby:room_created',
  data: {
    room: {
      id: 'uuid',
      roomCode: 'ABC123',    // Display this to user
      hostId: 'user-uuid',
      players: [
        {
          id: 'user-uuid',
          username: 'YourUsername',
          avatar: 'avatar.png',
          isHost: true,
          isReady: false,
          joinedAt: '2025-12-18T10:30:00Z'
        }
      ],
      maxPlayers: 4,
      settings: { pointsToWin: 15, surfaceTheme: 'neon' },
      status: 'waiting',
      createdAt: '2025-12-18T10:30:00Z'
    }
  }
}
```

### Join Room

```javascript
function joinRoom(roomCode) {
  const message = {
    event: 'lobby:join',
    data: { roomCode }
  };

  ws.send(JSON.stringify(message));
}

// Usage
joinRoom('ABC123');
```

**Expected Response:**
```javascript
// You receive:
{
  event: 'lobby:room_state',
  data: {
    room: {
      roomCode: 'ABC123',
      players: [...], // All current players
      ...
    }
  }
}

// Other players receive:
{
  event: 'lobby:player_joined',
  data: {
    player: {
      id: 'new-player-uuid',
      username: 'NewPlayer',
      avatar: 'avatar.png',
      isHost: false,
      isReady: false,
      joinedAt: '2025-12-18T10:31:00Z'
    },
    room: { ... }
  }
}
```

### Leave Room

```javascript
function leaveRoom() {
  const message = {
    event: 'lobby:leave',
    data: {}
  };

  ws.send(JSON.stringify(message));
}

// Usage
leaveRoom();
```

**Expected Response:**
```javascript
// You receive:
{
  event: 'lobby:left',
  data: {
    message: 'Successfully left the room'
  }
}

// Other players receive:
{
  event: 'lobby:player_left',
  data: {
    playerId: 'your-uuid',
    room: { ... } // Updated room state with you removed
  }
}
```

## Event Handlers

### Complete Message Handler

```javascript
function handleWebSocketMessage(message) {
  const { event, data } = message;

  switch (event) {
    case 'auth:success':
      handleAuthSuccess(data);
      break;

    case 'lobby:room_created':
      handleRoomCreated(data.room);
      break;

    case 'lobby:room_state':
      handleRoomState(data.room);
      break;

    case 'lobby:player_joined':
      handlePlayerJoined(data.player, data.room);
      break;

    case 'lobby:player_left':
      handlePlayerLeft(data.playerId, data.room);
      break;

    case 'lobby:left':
      handleLeftRoom(data.message);
      break;

    case 'lobby:error':
      handleLobbyError(data.error);
      break;

    default:
      console.warn('Unknown event:', event);
  }
}
```

### Individual Event Handlers

```javascript
function handleAuthSuccess(data) {
  console.log('Authenticated:', data.playerId);
  // Enable lobby features
}

function handleRoomCreated(room) {
  console.log('Room created:', room.roomCode);
  // Display room code to user
  // Navigate to lobby screen
  displayRoomCode(room.roomCode);
  updateRoomState(room);
}

function handleRoomState(room) {
  console.log('Joined room:', room.roomCode);
  // Update UI with full room state
  updateRoomState(room);
  displayPlayers(room.players);
}

function handlePlayerJoined(player, room) {
  console.log('Player joined:', player.username);
  // Add player to UI
  // Show notification
  addPlayerToList(player);
  updateRoomState(room);
  showNotification(`${player.username} joined the room`);
}

function handlePlayerLeft(playerId, room) {
  console.log('Player left:', playerId);
  // Remove player from UI
  // Check if new host
  removePlayerFromList(playerId);
  updateRoomState(room);

  if (room.hostId === getCurrentUserId()) {
    showNotification('You are now the host');
  }
}

function handleLeftRoom(message) {
  console.log('Left room:', message);
  // Clear room state
  // Navigate to home/lobby list
  clearRoomState();
  navigateToHome();
}

function handleLobbyError(error) {
  console.error('Lobby error:', error);
  // Show error to user
  showErrorNotification(error);
}
```

## UI Component Examples

### Room Creation Form

```javascript
// React example
function CreateRoomForm() {
  const [pointsToWin, setPointsToWin] = useState(10);
  const [surfaceTheme, setSurfaceTheme] = useState('poker-table');

  const handleSubmit = (e) => {
    e.preventDefault();
    createRoom({ pointsToWin, surfaceTheme });
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Points to Win:
        <input
          type="number"
          value={pointsToWin}
          onChange={(e) => setPointsToWin(e.target.value)}
          min={5}
          max={20}
        />
      </label>

      <label>
        Theme:
        <select
          value={surfaceTheme}
          onChange={(e) => setSurfaceTheme(e.target.value)}
        >
          <option value="poker-table">Poker Table</option>
          <option value="neon">Neon</option>
          <option value="wood">Wood</option>
        </select>
      </label>

      <button type="submit">Create Room</button>
    </form>
  );
}
```

### Join Room Form

```javascript
function JoinRoomForm() {
  const [roomCode, setRoomCode] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    joinRoom(roomCode.toUpperCase());
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Room Code:
        <input
          type="text"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
          placeholder="ABC123"
          maxLength={6}
          pattern="[A-Z0-9]{6}"
        />
      </label>

      <button type="submit" disabled={roomCode.length !== 6}>
        Join Room
      </button>
    </form>
  );
}
```

### Room Display Component

```javascript
function RoomDisplay({ room, currentUserId }) {
  const isHost = room.hostId === currentUserId;

  return (
    <div className="room-display">
      <h2>Room: {room.roomCode}</h2>
      <p>Status: {room.status}</p>
      <p>Players: {room.players.length}/{room.maxPlayers}</p>

      <div className="room-settings">
        <p>Points to Win: {room.settings.pointsToWin}</p>
        <p>Theme: {room.settings.surfaceTheme}</p>
      </div>

      <div className="players-list">
        <h3>Players:</h3>
        {room.players.map(player => (
          <div key={player.id} className="player-item">
            <img src={player.avatar} alt={player.username} />
            <span>{player.username}</span>
            {player.isHost && <span className="host-badge">Host</span>}
            {player.isReady && <span className="ready-badge">Ready</span>}
          </div>
        ))}
      </div>

      {isHost && (
        <div className="host-controls">
          <button onClick={() => updateSettings()}>Update Settings</button>
          <button onClick={() => startGame()}>Start Game</button>
        </div>
      )}

      <button onClick={() => leaveRoom()}>Leave Room</button>
    </div>
  );
}
```

## State Management

### React Context Example

```javascript
// RoomContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const RoomContext = createContext();

export function RoomProvider({ children, ws }) {
  const [currentRoom, setCurrentRoom] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!ws) return;

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      switch (message.event) {
        case 'lobby:room_created':
        case 'lobby:room_state':
          setCurrentRoom(message.data.room);
          setError(null);
          break;

        case 'lobby:player_joined':
        case 'lobby:player_left':
          setCurrentRoom(message.data.room);
          break;

        case 'lobby:left':
          setCurrentRoom(null);
          break;

        case 'lobby:error':
          setError(message.data.error);
          break;
      }
    };
  }, [ws]);

  const createRoom = (settings) => {
    ws.send(JSON.stringify({
      event: 'lobby:create',
      data: { settings }
    }));
  };

  const joinRoom = (roomCode) => {
    ws.send(JSON.stringify({
      event: 'lobby:join',
      data: { roomCode }
    }));
  };

  const leaveRoom = () => {
    ws.send(JSON.stringify({
      event: 'lobby:leave',
      data: {}
    }));
  };

  return (
    <RoomContext.Provider value={{
      currentRoom,
      error,
      createRoom,
      joinRoom,
      leaveRoom
    }}>
      {children}
    </RoomContext.Provider>
  );
}

export const useRoom = () => useContext(RoomContext);
```

## Error Handling

### User-Friendly Error Messages

```javascript
const ERROR_MESSAGES = {
  'Authentication required': 'Please log in to continue',
  'Room code is required': 'Please enter a room code',
  'room not found': 'This room does not exist',
  'room is full': 'This room is full (4/4 players)',
  'cannot join room with status: in_progress': 'This game has already started',
  'player already in room': 'You are already in this room',
  'Not in a room': 'You are not currently in a room',
  'Failed to create room': 'Could not create room. Please try again'
};

function getFriendlyErrorMessage(error) {
  for (const [key, message] of Object.entries(ERROR_MESSAGES)) {
    if (error.includes(key)) {
      return message;
    }
  }
  return 'An unexpected error occurred';
}
```

## Testing Utilities

### Mock WebSocket for Testing

```javascript
// mockWebSocket.js
export class MockWebSocket {
  constructor() {
    this.listeners = {};
    this.sentMessages = [];
  }

  addEventListener(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  send(data) {
    this.sentMessages.push(JSON.parse(data));
  }

  simulateMessage(event, data) {
    const message = { event, data };
    this.listeners.message?.forEach(cb =>
      cb({ data: JSON.stringify(message) })
    );
  }

  getLastSentMessage() {
    return this.sentMessages[this.sentMessages.length - 1];
  }
}

// Usage in tests
const mockWs = new MockWebSocket();
mockWs.simulateMessage('lobby:room_created', {
  room: { roomCode: 'ABC123', ... }
});
```

## Common Pitfalls

### 1. Room Code Formatting
```javascript
// ❌ Wrong - lowercase
joinRoom('abc123');

// ✅ Correct - uppercase
joinRoom('ABC123');
joinRoom(roomCode.toUpperCase());
```

### 2. Authentication Order
```javascript
// ❌ Wrong - create room before auth
ws.onopen = () => {
  createRoom();
};

// ✅ Correct - auth first, then wait for success
ws.onopen = () => {
  authenticate();
};

// On auth success
case 'auth:success':
  // Now safe to create/join rooms
  createRoom();
```

### 3. State Updates
```javascript
// ❌ Wrong - only updating on join
case 'lobby:room_state':
  setRoom(data.room);

// ✅ Correct - update on all relevant events
case 'lobby:room_state':
case 'lobby:player_joined':
case 'lobby:player_left':
  setRoom(data.room);
```

## Next Steps

1. Implement WebSocket connection management
2. Add room creation UI
3. Add room joining UI
4. Display room state and player list
5. Handle errors gracefully
6. Add loading states
7. Test with multiple browser windows

## Resources

- Full API documentation: `/backend/README.md`
- WebSocket testing: `/TASK-039-TESTING-GUIDE.md`
- Backend implementation: `/backend/service/game-server/controller/websocket/websocket.go`

## Support

If you encounter issues:
1. Check server logs for detailed errors
2. Verify WebSocket connection is established
3. Ensure authentication succeeded
4. Test with wscat first to isolate frontend issues
5. Review error messages in browser console
