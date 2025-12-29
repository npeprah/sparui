# Matchmaking Queue System - Quick Start Guide

## Overview
The matchmaking system automatically pairs players for 2-4 player games using a smart FIFO algorithm with relaxed matching after 30 seconds.

---

## WebSocket Event Flow

### 1. Join Matchmaking Queue

**Client Sends:**
```javascript
socket.send(JSON.stringify({
  event: 'matchmaking:join',
  data: {}
}));
```

**Server Responds:**
```javascript
{
  event: 'matchmaking:joined',
  data: {
    playerId: 'player-abc123',
    position: 3,              // Your position in queue (1-based)
    totalPlayers: 5,          // Total players in queue
    estimatedWaitTime: 10,    // Estimated wait in seconds
    message: 'Successfully joined matchmaking queue'
  }
}
```

---

### 2. Receive Queue Status Updates (Every Second)

**Server Sends:**
```javascript
{
  event: 'matchmaking:status_update',
  data: {
    totalPlayers: 3,
    estimatedWaitTime: 15,
    yourPosition: 2,
    matchesCreated: 42
  }
}
```

---

### 3. Match Found!

**Server Sends:**
```javascript
{
  event: 'matchmaking:match_found',
  data: {
    matchId: 'VNEP3X9T4TAK',
    roomCode: 'ZZFNCU',        // Use this to join the game
    playerIds: ['p1', 'p2', 'p3', 'p4'],
    numPlayers: 4,
    message: 'Match found! Joining game...'
  }
}
```

**Client Action:** Navigate to `/game/:roomCode`

---

### 4. Leave Queue (Before Match)

**Client Sends:**
```javascript
socket.send(JSON.stringify({
  event: 'matchmaking:leave',
  data: {}
}));
```

**Server Responds:**
```javascript
{
  event: 'matchmaking:left',
  data: {
    playerId: 'player-abc123',
    message: 'Left matchmaking queue'
  }
}
```

---

### 5. Queue Timeout (After 60s)

**Server Sends:**
```javascript
{
  event: 'matchmaking:timeout',
  data: {
    playerId: 'player-abc123',
    message: 'Matchmaking queue timeout - please try again',
    waitTime: 60
  }
}
```

**Client Action:** Show retry button or suggest AI game

---

### 6. Get Queue Status

**Client Sends:**
```javascript
socket.send(JSON.stringify({
  event: 'matchmaking:status',
  data: {}
}));
```

**Server Responds:**
```javascript
{
  event: 'matchmaking:status',
  data: {
    totalPlayers: 5,
    estimatedWaitTime: 10,
    yourPosition: 3,
    matchesCreated: 42
  }
}
```

---

## Error Handling

**Server Error Response:**
```javascript
{
  event: 'matchmaking:error',
  data: {
    message: 'Authentication required'  // or other error message
  }
}
```

**Common Errors:**
- `'Authentication required'` - Player not authenticated
- `'Already in queue'` - Player tried to join twice
- `'Not in queue'` - Player tried to leave but wasn't in queue
- `'Cannot join matchmaking while in a game room'` - Player already in a game

---

## React/TypeScript Example

```typescript
import { useEffect, useState } from 'react';

interface QueueStatus {
  totalPlayers: number;
  estimatedWaitTime: number;
  yourPosition: number;
}

export function MatchmakingQueue() {
  const [inQueue, setInQueue] = useState(false);
  const [status, setStatus] = useState<QueueStatus | null>(null);
  const socket = useWebSocket(); // Your WebSocket hook

  useEffect(() => {
    socket.addEventListener('message', handleMessage);
    return () => socket.removeEventListener('message', handleMessage);
  }, []);

  const handleMessage = (event: MessageEvent) => {
    const message = JSON.parse(event.data);

    switch (message.event) {
      case 'matchmaking:joined':
        setInQueue(true);
        setStatus({
          totalPlayers: message.data.totalPlayers,
          estimatedWaitTime: message.data.estimatedWaitTime,
          yourPosition: message.data.position,
        });
        break;

      case 'matchmaking:status_update':
        setStatus(message.data);
        break;

      case 'matchmaking:match_found':
        // Navigate to game room
        window.location.href = `/game/${message.data.roomCode}`;
        break;

      case 'matchmaking:timeout':
        setInQueue(false);
        alert('Matchmaking timeout. Please try again!');
        break;

      case 'matchmaking:left':
        setInQueue(false);
        setStatus(null);
        break;

      case 'matchmaking:error':
        console.error('Matchmaking error:', message.data.message);
        alert(message.data.message);
        break;
    }
  };

  const joinQueue = () => {
    socket.send(JSON.stringify({
      event: 'matchmaking:join',
      data: {}
    }));
  };

  const leaveQueue = () => {
    socket.send(JSON.stringify({
      event: 'matchmaking:leave',
      data: {}
    }));
  };

  return (
    <div className="matchmaking-queue">
      {!inQueue ? (
        <button onClick={joinQueue}>Join Quick Match</button>
      ) : (
        <div className="queue-status">
          <h3>Finding Match...</h3>
          {status && (
            <>
              <p>Position: {status.yourPosition} of {status.totalPlayers}</p>
              <p>Estimated Wait: {status.estimatedWaitTime}s</p>
            </>
          )}
          <button onClick={leaveQueue}>Cancel</button>
        </div>
      )}
    </div>
  );
}
```

---

## Matching Algorithm

### Instant Match (4+ Players)
```
Queue: [Player1, Player2, Player3, Player4, Player5]
       ↓
Match: [Player1, Player2, Player3, Player4]
Queue: [Player5]
```

### Relaxed Match (2-3 Players, 30s Wait)
```
Time: 0s  → Queue: [Player1, Player2]  → No match (wait)
Time: 30s → Queue: [Player1, Player2]  → Match created!
```

### Multiple Matches
```
Queue: [P1, P2, P3, P4, P5, P6, P7, P8]
       ↓
Match1: [P1, P2, P3, P4]
Match2: [P5, P6, P7, P8]
Queue: []
```

---

## Configuration

Current settings (can be customized):

| Setting | Value | Description |
|---------|-------|-------------|
| Min Players | 2 | Minimum for a match |
| Max Players | 4 | Maximum for a match |
| Preferred Players | 4 | Ideal match size |
| Queue Timeout | 60s | Time before auto-removal |
| Relaxed Match Time | 30s | Wait before 2-player match |
| Status Update Interval | 1s | How often updates are sent |

---

## Testing

### Manual Testing
1. Open 4 browser tabs
2. Authenticate in each tab
3. Join matchmaking in all 4 tabs
4. Verify match is created
5. Verify all 4 tabs navigate to game room

### Automated Testing
```bash
# Run all matchmaking tests
go test -v ./service/game-server/controller/matchmaking/...

# Run with race detection
go test -race ./service/game-server/controller/matchmaking/...

# Check coverage
go test -cover ./service/game-server/controller/matchmaking/...
```

---

## Troubleshooting

### "Authentication required" error
- Ensure player is authenticated before joining queue
- Send `auth` event with valid token first

### Not receiving status updates
- Check WebSocket connection is open
- Verify player is in queue (`matchmaking:joined` received)
- Check browser console for WebSocket errors

### Match not being created
- Ensure 4 players are in queue (or 2+ players with 30s wait)
- Check server logs for match creation events
- Verify room manager is initialized

### Players stuck in queue
- Check for timeout after 60 seconds
- Verify background worker is running
- Check server logs for errors

---

## Production Checklist

- [ ] WebSocket authentication working
- [ ] Frontend UI for queue status
- [ ] Handling of match_found event (navigation)
- [ ] Timeout handling (retry button)
- [ ] Error message display
- [ ] Loading states during queue
- [ ] Cancel/leave queue button
- [ ] Mobile responsive design
- [ ] Accessibility (screen reader support)
- [ ] Analytics tracking (queue joins, matches, timeouts)

---

## Support

For issues or questions:
1. Check server logs for errors
2. Review TASK-074-COMPLETION-SUMMARY.md for detailed documentation
3. Run tests to verify system is working
4. Check WebSocket connection in browser dev tools

---

**Last Updated:** December 19, 2025
**Status:** Production Ready ✅
