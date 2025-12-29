# Quick Match - Frontend Integration Guide

## Overview

Quick Match provides one-click matchmaking for casual games. This guide shows how to integrate the Quick Match feature into your frontend.

---

## Quick Start

### 1. User Clicks "Quick Match" Button

```typescript
// Send matchmaking join request
socket.send(JSON.stringify({
  event: "matchmaking:join",
  data: {
    playerId: currentUser.id,
    username: currentUser.username
  }
}));
```

### 2. Show Queue Status

```typescript
// Listen for join confirmation
socket.on("message", (event) => {
  const data = JSON.parse(event.data);

  if (data.event === "matchmaking:joined") {
    showQueueUI({
      position: data.data.position,
      totalPlayers: data.data.totalPlayers,
      estimatedWaitTime: data.data.estimatedWaitTime
    });
  }
});
```

### 3. Handle Match Found

```typescript
// Listen for match found event
if (data.event === "matchmaking:match_found") {
  showMatchFoundNotification({
    roomCode: data.data.roomCode,
    numPlayers: data.data.numPlayers,
    countdown: data.data.countdownTime
  });
}
```

### 4. Navigate to Game Room

```typescript
// Listen for game redirect
if (data.event === "game:redirect") {
  // Navigate to game room
  router.push(data.data.redirectTo); // "/game/{roomCode}"

  // Or use roomCode directly
  navigateToGame(data.data.roomCode);
}
```

---

## Complete Example

### React/TypeScript Example

```typescript
import { useEffect, useState } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { useRouter } from 'next/router';

interface QueueStatus {
  position: number;
  totalPlayers: number;
  estimatedWaitTime: number;
}

export function QuickMatchButton() {
  const { socket, send } = useWebSocket();
  const router = useRouter();
  const [isInQueue, setIsInQueue] = useState(false);
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [matchFound, setMatchFound] = useState(false);

  const handleQuickMatch = () => {
    send({
      event: "matchmaking:join",
      data: {
        playerId: currentUser.id,
        username: currentUser.username
      }
    });
    setIsInQueue(true);
  };

  const handleCancelQueue = () => {
    send({
      event: "matchmaking:leave",
      data: {
        playerId: currentUser.id
      }
    });
    setIsInQueue(false);
    setQueueStatus(null);
  };

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);

      switch (data.event) {
        case "matchmaking:joined":
          setQueueStatus({
            position: data.data.position,
            totalPlayers: data.data.totalPlayers,
            estimatedWaitTime: data.data.estimatedWaitTime
          });
          break;

        case "matchmaking:status_update":
          setQueueStatus({
            position: data.data.yourPosition,
            totalPlayers: data.data.totalPlayers,
            estimatedWaitTime: data.data.estimatedWaitTime
          });
          break;

        case "matchmaking:match_found":
          setMatchFound(true);
          // Show "Match Found!" notification
          showNotification("Match Found!", "success");
          break;

        case "game:redirect":
          // Navigate to game room
          router.push(`/game/${data.data.roomCode}`);
          break;

        case "matchmaking:left":
          setIsInQueue(false);
          setQueueStatus(null);
          break;

        case "matchmaking:timeout":
          setIsInQueue(false);
          setQueueStatus(null);
          showNotification("Queue timeout - please try again", "error");
          break;

        case "matchmaking:error":
          setIsInQueue(false);
          showNotification(data.data.error, "error");
          break;
      }
    };

    socket.addEventListener("message", handleMessage);
    return () => socket.removeEventListener("message", handleMessage);
  }, [socket, router]);

  if (matchFound) {
    return (
      <div className="match-found-card">
        <h2>Match Found!</h2>
        <p>Joining game...</p>
        <Spinner />
      </div>
    );
  }

  if (isInQueue) {
    return (
      <div className="queue-card">
        <h2>Finding Match...</h2>
        <p>Position in queue: {queueStatus?.position || "..."}</p>
        <p>Players in queue: {queueStatus?.totalPlayers || "..."}</p>
        <p>Estimated wait: {queueStatus?.estimatedWaitTime || "..."}s</p>
        <button onClick={handleCancelQueue}>Cancel</button>
      </div>
    );
  }

  return (
    <button
      onClick={handleQuickMatch}
      className="quick-match-button"
    >
      Quick Match
    </button>
  );
}
```

---

## WebSocket Events Reference

### Client → Server

#### Join Quick Match
```json
{
  "event": "matchmaking:join",
  "data": {
    "playerId": "player-123",
    "username": "Alice"
  }
}
```

#### Leave Queue
```json
{
  "event": "matchmaking:leave",
  "data": {
    "playerId": "player-123"
  }
}
```

#### Get Status
```json
{
  "event": "matchmaking:status",
  "data": {
    "playerId": "player-123"
  }
}
```

### Server → Client

#### Join Confirmation
```json
{
  "event": "matchmaking:joined",
  "data": {
    "playerId": "player-123",
    "position": 2,
    "totalPlayers": 3,
    "estimatedWaitTime": 5,
    "message": "Successfully joined matchmaking queue"
  }
}
```

#### Queue Status Update (periodic)
```json
{
  "event": "matchmaking:status_update",
  "data": {
    "yourPosition": 2,
    "totalPlayers": 3,
    "estimatedWaitTime": 5,
    "matchesCreated": 10
  }
}
```

#### Match Found
```json
{
  "event": "matchmaking:match_found",
  "data": {
    "matchId": "R7WZGEZ908CH",
    "roomCode": "VCTNGP",
    "playerIds": ["player-1", "player-2", "player-3", "player-4"],
    "numPlayers": 4,
    "countdownTime": 5,
    "message": "Match found! Joining game..."
  }
}
```

#### Game Redirect
```json
{
  "event": "game:redirect",
  "data": {
    "roomCode": "VCTNGP",
    "matchId": "R7WZGEZ908CH",
    "autoStart": true,
    "countdown": 5,
    "message": "Redirecting to game room...",
    "redirectTo": "/game/VCTNGP"
  }
}
```

#### Queue Left
```json
{
  "event": "matchmaking:left",
  "data": {
    "playerId": "player-123",
    "message": "Left matchmaking queue"
  }
}
```

#### Queue Timeout
```json
{
  "event": "matchmaking:timeout",
  "data": {
    "playerId": "player-123",
    "message": "Matchmaking queue timeout - please try again",
    "waitTime": 60
  }
}
```

#### Error
```json
{
  "event": "matchmaking:error",
  "data": {
    "error": "Player already in game"
  }
}
```

---

## UI/UX Guidelines

### Queue Screen

**Show:**
- Current position in queue
- Total players in queue
- Estimated wait time
- "Cancel" button
- Loading animation

**Update:**
- Refresh every ~1 second with status updates
- Show position changes smoothly
- Count down estimated wait time

### Match Found Notification

**Show:**
- "Match Found!" message
- Number of players
- "Joining game..." status
- Brief countdown animation (5 seconds)

**Then:**
- Auto-redirect to game room
- No user interaction needed

### Error Handling

**Common Errors:**
- "Already in game" → Show message, suggest finishing current game
- "Queue timeout" → Show retry button
- "Connection lost" → Show reconnect UI

---

## Best Practices

### 1. Authentication
Always send authenticated user data:
```typescript
{
  playerId: currentUser.id,    // From auth system
  username: currentUser.username // From user profile
}
```

### 2. Loading States
Show appropriate UI for each state:
- Idle → "Quick Match" button
- Joining → Brief spinner
- In Queue → Queue status card
- Match Found → Success animation
- Redirecting → Loading game screen

### 3. Error Recovery
Handle errors gracefully:
```typescript
const handleError = (error: string) => {
  setIsInQueue(false);
  setQueueStatus(null);
  showNotification(error, "error");
  // Allow user to try again
};
```

### 4. Cleanup
Clean up on component unmount:
```typescript
useEffect(() => {
  return () => {
    if (isInQueue) {
      handleCancelQueue();
    }
  };
}, [isInQueue]);
```

### 5. Connection Loss
Handle WebSocket disconnection:
```typescript
socket.on("close", () => {
  if (isInQueue) {
    setIsInQueue(false);
    showNotification("Connection lost", "error");
  }
});
```

---

## Testing Quick Match

### Manual Testing Steps

1. **Open browser** to game frontend
2. **Login** as test user
3. **Click "Quick Match"**
4. **Verify queue UI** appears
5. **Open second browser** (or incognito)
6. **Login** as different user
7. **Click "Quick Match"**
8. **Both should match** within seconds
9. **Both redirect** to same room
10. **Game countdown** starts automatically
11. **Game begins** after 5 seconds

### Testing with Multiple Players

Open 4 browser tabs:
```bash
# Tab 1: Player 1
# Tab 2: Player 2
# Tab 3: Player 3
# Tab 4: Player 4
```

Click "Quick Match" in all tabs → All 4 matched → Game starts

---

## Common Issues & Solutions

### Issue: Queue Never Finds Match
**Solution:** Ensure at least 2 players are in queue

### Issue: Match Found but No Redirect
**Solution:** Check `game:redirect` event handler, verify routing works

### Issue: "Already in game" Error
**Solution:** Player must leave current game before joining Quick Match

### Issue: Queue Timeout
**Solution:** Normal if < 2 players in queue for 60 seconds, just try again

### Issue: Position Not Updating
**Solution:** Check WebSocket connection, ensure `matchmaking:status_update` handler works

---

## Performance Tips

1. **Debounce Updates:** Don't re-render on every status update
2. **Optimize Animations:** Use CSS transitions for smooth UI
3. **Lazy Load Game:** Only load game scene after redirect
4. **Cancel Requests:** Always cancel queue on unmount
5. **Cache Room Data:** Store room info for quick navigation

---

## Example Animations

### Match Found Animation
```css
@keyframes matchFound {
  0% { transform: scale(0.8); opacity: 0; }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}

.match-found-card {
  animation: matchFound 0.5s ease-out;
}
```

### Queue Position Counter
```typescript
<AnimatedNumber
  value={queueStatus.position}
  duration={300}
/>
```

---

## Accessibility

- **Keyboard Navigation:** Ensure "Quick Match" and "Cancel" are keyboard accessible
- **Screen Readers:** Announce queue updates ("Position 2 of 5")
- **Focus Management:** Focus "Cancel" button when queue UI appears
- **ARIA Labels:** Label loading states and notifications
- **Color Contrast:** Ensure text is readable

---

## Analytics Events

Track these events for analytics:

```typescript
// User clicks Quick Match
analytics.track("quick_match_started", { userId });

// User joins queue
analytics.track("queue_joined", { userId, position, totalPlayers });

// Match found
analytics.track("match_found", { userId, matchId, waitTime });

// User cancels queue
analytics.track("queue_cancelled", { userId, waitTime });

// Queue timeout
analytics.track("queue_timeout", { userId, waitTime: 60 });
```

---

## Need Help?

- **Backend WebSocket Docs:** See `backend/service/game-server/controller/websocket/websocket.go`
- **Quick Match Implementation:** See `TASK-075-COMPLETION-SUMMARY.md`
- **Test Examples:** See `backend/service/game-server/controller/matchmaking/integration_test.go`

---

**Quick Match makes playing Spar effortless - just one click to play!** 🎮
