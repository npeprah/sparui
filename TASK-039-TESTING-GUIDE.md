# TASK-039: Room Manager - Testing Guide

Quick reference for testing the room management functionality.

## Prerequisites

1. **Start the backend server:**
```bash
cd /Users/nana/go/src/github.com/npeprah/sparui/backend
go run ./service/game-server/cmd/server.go
```

2. **Ensure database is running:**
```bash
docker compose up -d postgres
```

## Running Unit Tests

### Basic Test Run
```bash
cd /Users/nana/go/src/github.com/npeprah/sparui/backend
go test ./service/game-server/controller/room/... -v
```

### With Coverage
```bash
go test ./service/game-server/controller/room/... -cover -v
```

### With Race Detection
```bash
go test -race ./service/game-server/controller/room/... -v
```

### With Coverage Report
```bash
go test ./service/game-server/controller/room/... -coverprofile=coverage.out
go tool cover -html=coverage.out
```

## WebSocket Testing with wscat

### 1. Install wscat
```bash
npm install -g wscat
```

### 2. Connect to WebSocket
```bash
wscat -c ws://localhost:8080/ws --origin http://localhost:5173
```

### 3. Authenticate (Required)
```json
{"event":"auth","data":{"token":"your-jwt-token-here"}}
```

You'll receive:
```json
{"event":"auth:success","data":{"playerId":"player-123","message":"Authenticated successfully"}}
```

### 4. Create a Room
```json
{"event":"lobby:create","data":{"settings":{"pointsToWin":10,"surfaceTheme":"poker-table"}}}
```

Expected response:
```json
{
  "event": "lobby:room_created",
  "data": {
    "room": {
      "id": "...",
      "roomCode": "ABC123",
      "hostId": "player-123",
      "players": [...],
      "maxPlayers": 4,
      "settings": {"pointsToWin": 10, "surfaceTheme": "poker-table"},
      "status": "waiting",
      "createdAt": "..."
    }
  }
}
```

### 5. Join a Room (in another wscat session)
```json
{"event":"lobby:join","data":{"roomCode":"ABC123"}}
```

Expected response:
```json
{
  "event": "lobby:room_state",
  "data": {
    "room": {
      "roomCode": "ABC123",
      "players": [
        {"id": "player-123", "username": "Host", "isHost": true},
        {"id": "player-456", "username": "Player", "isHost": false}
      ],
      ...
    }
  }
}
```

First client should also receive:
```json
{
  "event": "lobby:player_joined",
  "data": {
    "player": {"id": "player-456", "username": "Player", ...},
    "room": {...}
  }
}
```

### 6. Leave a Room
```json
{"event":"lobby:leave","data":{}}
```

Expected response:
```json
{
  "event": "lobby:left",
  "data": {
    "message": "Successfully left the room"
  }
}
```

Other players should receive:
```json
{
  "event": "lobby:player_left",
  "data": {
    "playerId": "player-456",
    "room": {...}
  }
}
```

## Testing Scenarios

### Scenario 1: Happy Path - Full Flow
1. Player 1 creates room → Gets room code (e.g., "ABC123")
2. Player 2 joins with code "ABC123" → Both receive updates
3. Player 3 joins with code "ABC123" → All receive updates
4. Player 2 leaves → Player 1 and 3 receive update
5. Player 3 leaves → Player 1 receives update
6. Player 1 leaves → Room deleted

### Scenario 2: Host Migration
1. Player 1 (host) creates room
2. Player 2 joins
3. Player 3 joins
4. Player 1 (host) leaves → Player 2 becomes new host
5. Verify Player 2 has `isHost: true`

### Scenario 3: Room Full
1. Player 1 creates room
2. Players 2, 3, 4 join successfully
3. Player 5 tries to join → Receives error "room is full"

### Scenario 4: Invalid Room Code
1. Player tries to join with code "INVALID"
2. Receives error "room not found: INVALID"

### Scenario 5: Join In-Progress Game
1. Create room and manually set status to "in_progress"
2. Player tries to join
3. Receives error "cannot join room with status: in_progress"

### Scenario 6: Concurrent Joins
1. Create room
2. Start 3 concurrent join requests
3. Verify all succeed or fail gracefully
4. Verify room capacity not exceeded

## Error Messages Reference

### lobby:create Errors
- `"Authentication required"` - PlayerID not set on client
- `"Invalid request format"` - Malformed JSON
- `"Failed to create room"` - Internal error

### lobby:join Errors
- `"Authentication required"` - PlayerID not set
- `"Room code is required"` - Missing roomCode
- `"room not found: ABC123"` - Invalid code
- `"room is full"` - 4 players already in room
- `"cannot join room with status: in_progress"` - Game started
- `"player already in room"` - Already joined

### lobby:leave Errors
- `"Authentication required"` - PlayerID not set
- `"Not in a room"` - Not currently in any room
- `"room not found: ABC123"` - Room deleted
- `"player not in room"` - Not in specified room

## Database Verification

### Check rooms in database
```bash
docker exec -it spar-postgres psql -U sparuser -d spardb -c "SELECT room_code, host_id, status FROM game_rooms;"
```

### Check room details
```bash
docker exec -it spar-postgres psql -U sparuser -d spardb -c "SELECT * FROM game_rooms WHERE room_code='ABC123';"
```

### Count active rooms
```bash
docker exec -it spar-postgres psql -U sparuser -d spardb -c "SELECT COUNT(*) FROM game_rooms WHERE status='waiting';"
```

## Performance Testing

### Test room code uniqueness
```bash
cd /Users/nana/go/src/github.com/npeprah/sparui/backend
go test ./service/game-server/controller/room/... -run TestRoomCodeUniqueness -v
```

### Test concurrent access
```bash
go test ./service/game-server/controller/room/... -run TestConcurrentAccess -v -race
```

### Benchmark (if benchmarks added)
```bash
go test ./service/game-server/controller/room/... -bench=. -benchmem
```

## Troubleshooting

### WebSocket connection fails
1. Check server is running: `curl http://localhost:8080/health`
2. Verify origin header: `--origin http://localhost:5173`
3. Check server logs for connection errors

### Authentication fails
1. Get valid JWT token from `/api/v1/auth/login`
2. Ensure auth event is sent first after connection
3. Check token is not expired

### Room operations fail
1. Verify authentication succeeded first
2. Check server logs for detailed error
3. Verify room code is correct (uppercase, 6 chars)
4. Ensure room capacity not exceeded

### Tests fail
1. Clear test cache: `go clean -testcache`
2. Verify no port conflicts: `lsof -i :8080`
3. Check database is running: `docker ps`
4. Review test output for specific failures

## Manual Testing Checklist

- [ ] Server starts without errors
- [ ] Can create room with default settings
- [ ] Can create room with custom settings
- [ ] Room code is 6 characters uppercase
- [ ] Can join room with valid code
- [ ] Cannot join room with invalid code
- [ ] Cannot join full room (4 players)
- [ ] Cannot join in-progress game
- [ ] Host migration works when host leaves
- [ ] Last player leaving deletes room
- [ ] Broadcasts work to all room members
- [ ] Error messages are user-friendly
- [ ] Database persists room data
- [ ] No race conditions in concurrent tests

## CI/CD Testing

### Pre-commit checks
```bash
# Format code
go fmt ./...

# Run linter
go vet ./...

# Run all tests
go test ./... -race

# Check coverage
go test ./service/game-server/controller/room/... -cover
```

### CI pipeline should run
```bash
go test ./... -race -cover -v
```

## Additional Resources

- Full API documentation: `/backend/README.md`
- Task requirements: `/TASK-039-COMPLETION-SUMMARY.md`
- Database schema: `/backend/service/game-server/docker/init.sql`
- WebSocket patterns: `/backend/service/game-server/controller/websocket/websocket.go`
