# Spar Game - Backend Server

Go backend server for the Spar card game, providing REST API and WebSocket support for real-time multiplayer gameplay.

## Technology Stack

- **Go 1.21+**: Server runtime
- **Chi v5**: HTTP router and middleware
- **Gorilla WebSocket**: WebSocket communication
- **PostgreSQL**: Database for user data and game history (to be configured)
- **JWT**: Authentication tokens

## Project Structure

```
backend/
├── common/               # Shared code across services
├── middleware/           # Custom middleware
├── utils/                # Utility functions
├── service/
│   └── game-server/      # Main game service
│       ├── bin/          # Compiled binaries
│       ├── cmd/          # Entry points
│       │   └── server.go # Main server
│       ├── config/       # Configuration files
│       ├── controller/   # HTTP handlers
│       │   ├── auth/     # Authentication endpoints
│       │   ├── game/     # Game management endpoints
│       │   ├── websocket/# WebSocket handlers
│       │   └── matchmaking/ # Matchmaking logic
│       ├── entity/       # Domain entities
│       ├── repository/   # Data access layer
│       ├── gateway/      # External service integrations
│       ├── mapper/       # Entity-to-model conversions
│       └── docker/       # Docker configuration
├── go.mod
├── go.sum
└── README.md
```

## Prerequisites

- Go 1.21 or higher
- Docker and Docker Compose (for local development)
- Make (optional, for convenience commands)
- PostgreSQL 14+ (for production - use Docker for local dev)

## Getting Started

### 1. Start Database (Docker)

```bash
# Start PostgreSQL and Redis containers
make db-start

# Or manually:
docker compose up -d

# Verify containers are running
docker compose ps

# Test database connection
make db-test
```

The database will be initialized automatically with the schema from `service/game-server/docker/init.sql`.

**Docker Services:**
- PostgreSQL 15 on `localhost:5432`
  - Database: `spardb`
  - User: `sparuser`
  - Password: `sparpassword`
- Redis 7 on `localhost:6379`

### 2. Configure Environment

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
# Edit .env with your settings (defaults work for Docker setup)
```

### 3. Install Dependencies

```bash
go mod download
```

### 4. Build

```bash
# Build the server binary
make build

# Or manually:
go build -o bin/server ./service/game-server/cmd/server.go
```

### 5. Run Development Server

```bash
# Run with make
make run

# Or manually:
go run ./service/game-server/cmd/server.go
```

The server will start on `http://localhost:8080` (or the port specified in `PORT` environment variable).

### Database Management Commands

```bash
make db-start    # Start database containers
make db-stop     # Stop database containers
make db-reset    # Reset database (delete all data)
make db-shell    # Open PostgreSQL shell
make db-logs     # View database logs
make db-test     # Test database connection
```

### Run Tests

```bash
make test
```

## Environment Variables

Create a `.env` file in the backend directory:

```bash
# Server Configuration
PORT=8080

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=sparuser
DB_PASSWORD=sparpassword
DB_NAME=spardb
DB_SSLMODE=disable
DB_MAX_CONNS=20
DB_MAX_IDLE=5

# JWT Configuration
JWT_SECRET=dev-secret-change-in-production-please
JWT_EXPIRATION_HOURS=24

# Redis Configuration (optional - for distributed game state)
REDIS_URL=redis://localhost:6379

# Environment
ENVIRONMENT=development

# CORS Origins (comma-separated)
CORS_ORIGINS=http://localhost:5173,http://localhost:5174
```

## API Endpoints

### Health Check

#### GET /health

Returns server health status.

**Example Request:**
```bash
curl http://localhost:8080/health
```

**Response (200 OK):**
```json
{
  "status": "healthy",
  "service": "game-server"
}
```

---

### Authentication

#### POST /api/v1/auth/register

Create a new user account.

**Request Body:**
```json
{
  "username": "string (3-50 chars, required)",
  "email": "string (valid email, required)",
  "password": "string (8-100 chars, required)"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testplayer",
    "email": "testplayer@example.com",
    "password": "password123"
  }'
```

**Response (201 Created):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "username": "testplayer",
    "email": "testplayer@example.com",
    "avatar": "default-avatar.png"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Validation failed
  ```json
  {
    "error": "Validation failed",
    "details": {
      "email": "Invalid email format",
      "password": "Password must be at least 8 characters"
    }
  }
  ```
- `409 Conflict`: Email or username already registered
  ```json
  {
    "error": "Email already registered"
  }
  ```

---

#### POST /api/v1/auth/login

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testplayer@example.com",
    "password": "password123"
  }'
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "username": "testplayer",
    "email": "testplayer@example.com",
    "avatar": "default-avatar.png"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing required fields
  ```json
  {
    "error": "Validation failed",
    "details": {
      "password": "Password is required"
    }
  }
  ```
- `401 Unauthorized`: Invalid credentials
  ```json
  {
    "error": "Invalid email or password"
  }
  ```

---

#### GET /api/v1/auth/me

Get current authenticated user information. Requires valid JWT token.

**Headers:**
- `Authorization: Bearer <jwt_token>` (required)

**Example Request:**
```bash
curl http://localhost:8080/api/v1/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "username": "testplayer",
  "email": "testplayer@example.com",
  "avatar": "default-avatar.png"
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid token
  ```text
  Missing authorization header
  Invalid authorization header format
  Invalid or expired token
  ```

---

### Game Management

#### POST /api/v1/game/rooms

Create a new game room. *(Coming in Week 2)*

#### GET /api/v1/game/rooms/{roomCode}

Get room details by room code. *(Coming in Week 2)*

#### POST /api/v1/game/rooms/{roomCode}/join

Join an existing room. *(Coming in Week 2)*

#### DELETE /api/v1/game/rooms/{roomCode}/leave

Leave a room. *(Coming in Week 2)*

#### POST /api/v1/game/rooms/{roomCode}/start

Start the game in a room. *(Coming in Week 2)*

#### GET /api/v1/game/games/{gameId}/state

Get current game state. *(Coming in Week 3)*

#### GET /api/v1/game/players/{playerId}/stats

Get player statistics. *(Coming in Week 3)*

---

### WebSocket

#### GET /ws

Connect to WebSocket endpoint for real-time game events.

**Connection Requirements:**
- Must include `Origin` header with allowed origin:
  - `http://localhost:5173` (default Vite dev server)
  - `http://localhost:5174` (alternative dev port)

**Example Connection (using wscat):**
```bash
# Install wscat if needed
npm install -g wscat

# Connect to WebSocket
wscat -c ws://localhost:8080/ws --origin http://localhost:5173
```

**Connection Lifecycle:**
1. Client initiates WebSocket upgrade request
2. Server responds with 101 Switching Protocols
3. Connection established
4. Server sends ping every 30 seconds
5. Client responds with pong to keep connection alive

---

#### WebSocket Message Format

All messages use JSON format:

```json
{
  "event": "event_name",
  "data": {
    // Event-specific data
  }
}
```

---

#### WebSocket Events - Client → Server

##### auth
Authenticate WebSocket connection with JWT token.

**Message:**
```json
{
  "event": "auth",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Server Response:**
```json
{
  "event": "auth:success",
  "data": {
    "playerId": "player-123",
    "message": "Authenticated successfully"
  }
}
```

##### lobby:create
Create a new game lobby. **Requires authentication.**

**Message:**
```json
{
  "event": "lobby:create",
  "data": {
    "settings": {
      "pointsToWin": 10,
      "surfaceTheme": "poker-table"
    }
  }
}
```

**Settings (optional):**
- `pointsToWin` (integer, default: 10): Points needed to win the game
- `surfaceTheme` (string, default: "poker-table"): Visual theme for the game table

**Server Response (Success):**
```json
{
  "event": "lobby:room_created",
  "data": {
    "room": {
      "id": "room-uuid",
      "roomCode": "ABC123",
      "hostId": "user-uuid",
      "players": [
        {
          "id": "user-uuid",
          "username": "testplayer",
          "avatar": "default-avatar.png",
          "isHost": true,
          "isReady": false,
          "joinedAt": "2025-12-18T10:30:00Z"
        }
      ],
      "maxPlayers": 4,
      "settings": {
        "pointsToWin": 10,
        "surfaceTheme": "poker-table"
      },
      "status": "waiting",
      "createdAt": "2025-12-18T10:30:00Z"
    }
  }
}
```

**Server Response (Error):**
```json
{
  "event": "lobby:error",
  "data": {
    "error": "Authentication required"
  }
}
```

##### lobby:join
Join an existing lobby by room code. **Requires authentication.**

**Message:**
```json
{
  "event": "lobby:join",
  "data": {
    "roomCode": "ABC123"
  }
}
```

**Validation:**
- Room code must exist
- Room must have status "waiting" (not in progress or completed)
- Room must not be full (maximum 4 players)
- Player must not already be in the room

**Server Response (Success - to joiner):**
```json
{
  "event": "lobby:room_state",
  "data": {
    "room": {
      "id": "room-uuid",
      "roomCode": "ABC123",
      "hostId": "host-uuid",
      "players": [
        {
          "id": "host-uuid",
          "username": "host",
          "avatar": "avatar1.png",
          "isHost": true,
          "isReady": false,
          "joinedAt": "2025-12-18T10:30:00Z"
        },
        {
          "id": "user-uuid",
          "username": "testplayer",
          "avatar": "avatar2.png",
          "isHost": false,
          "isReady": false,
          "joinedAt": "2025-12-18T10:31:00Z"
        }
      ],
      "maxPlayers": 4,
      "settings": {
        "pointsToWin": 10,
        "surfaceTheme": "poker-table"
      },
      "status": "waiting",
      "createdAt": "2025-12-18T10:30:00Z"
    }
  }
}
```

**Broadcast (to all other players in room):**
```json
{
  "event": "lobby:player_joined",
  "data": {
    "player": {
      "id": "user-uuid",
      "username": "testplayer",
      "avatar": "avatar2.png",
      "isHost": false,
      "isReady": false,
      "joinedAt": "2025-12-18T10:31:00Z"
    },
    "room": {
      "id": "room-uuid",
      "roomCode": "ABC123",
      "hostId": "host-uuid",
      "players": [...],
      "maxPlayers": 4,
      "settings": {...},
      "status": "waiting"
    }
  }
}
```

**Server Response (Error):**
```json
{
  "event": "lobby:error",
  "data": {
    "error": "room not found: ABC123"
  }
}
```

**Possible Error Messages:**
- `"Authentication required"` - Player not authenticated
- `"Room code is required"` - Missing room code
- `"room not found: ABC123"` - Invalid room code
- `"room is full"` - Room has reached maximum capacity (4 players)
- `"cannot join room with status: in_progress"` - Game already started
- `"player already in room"` - Player already joined this room

##### lobby:leave
Leave current lobby. **Requires authentication.**

**Message:**
```json
{
  "event": "lobby:leave",
  "data": {}
}
```

**Host Migration:**
If the host leaves and there are other players remaining, the oldest player becomes the new host automatically.

**Room Cleanup:**
If the last player leaves, the room is automatically deleted.

**Server Response (Success - to leaving player):**
```json
{
  "event": "lobby:left",
  "data": {
    "message": "Successfully left the room"
  }
}
```

**Broadcast (to remaining players - if room still exists):**
```json
{
  "event": "lobby:player_left",
  "data": {
    "playerId": "user-uuid",
    "room": {
      "id": "room-uuid",
      "roomCode": "ABC123",
      "hostId": "new-host-uuid",
      "players": [
        {
          "id": "new-host-uuid",
          "username": "newhost",
          "avatar": "avatar.png",
          "isHost": true,
          "isReady": false,
          "joinedAt": "2025-12-18T10:30:00Z"
        }
      ],
      "maxPlayers": 4,
      "settings": {...},
      "status": "waiting"
    }
  }
}
```

**Server Response (Error):**
```json
{
  "event": "lobby:error",
  "data": {
    "error": "Not in a room"
  }
}
```

**Possible Error Messages:**
- `"Authentication required"` - Player not authenticated
- `"Not in a room"` - Player not currently in any room
- `"room not found: ABC123"` - Room no longer exists
- `"player not in room"` - Player not in the specified room

##### game:play_card
Play a card during active game. *(Handler stub - full implementation in Week 3)*

**Message:**
```json
{
  "event": "game:play_card",
  "data": {
    "card": {
      "suit": "hearts",
      "value": "ace"
    }
  }
}
```

##### game:declare_dry
Declare dry or show dry card. *(Handler stub - full implementation in Week 3)*

**Message:**
```json
{
  "event": "game:declare_dry",
  "data": {
    "type": "dry",
    "card": {
      "suit": "spades",
      "value": "2"
    }
  }
}
```

##### game:flag_player
Challenge another player. *(Handler stub - full implementation in Week 3)*

**Message:**
```json
{
  "event": "game:flag_player",
  "data": {
    "targetPlayerId": "player-456",
    "reason": "invalid_play"
  }
}
```

---

#### WebSocket Events - Server → Client

##### auth:success
Confirms successful authentication.

**Format:**
```json
{
  "event": "auth:success",
  "data": {
    "playerId": "player-uuid",
    "message": "Authenticated successfully"
  }
}
```

##### lobby:room_created
Sent when a player successfully creates a new room.

##### lobby:room_state
Sent to a player when they successfully join a room.

##### lobby:player_joined
Broadcast to all players in a room when a new player joins.

##### lobby:player_left
Broadcast to all players in a room when a player leaves.

##### lobby:left
Confirmation sent to a player after they leave a room.

##### lobby:error
Sent when a lobby-related action fails.

**Format:**
```json
{
  "event": "lobby:error",
  "data": {
    "error": "Error message describing what went wrong"
  }
}
```

##### game:state_update
Full game state update. *(Coming in Week 3)*

##### game:card_played
Broadcast when a player plays a card. *(Coming in Week 3)*

##### game:round_winner
Announce round winner. *(Coming in Week 3)*

##### game:timer_update
Timer countdown updates. *(Coming in Week 3)*

---

### CORS Configuration

The server is configured to accept requests from:
- `http://localhost:5173` (default Vite dev server)
- `http://localhost:5174` (alternative dev port)

CORS headers are automatically added to all responses:
- `Access-Control-Allow-Origin`: Matched origin
- `Access-Control-Allow-Credentials`: true
- `Access-Control-Allow-Methods`: GET, POST, PUT, DELETE, OPTIONS
- `Access-Control-Allow-Headers`: Content-Type, Authorization

## Development

### Hot Reload

For development with hot reload, install `air`:

```bash
go install github.com/air-verse/air@latest
air
```

### Code Quality

```bash
# Format code
make fmt

# Run linter
make lint

# Run tests
make test
```

## Deployment

### Docker

```bash
# Build Docker image
make docker-build

# Run with Docker Compose
docker-compose up
```

### Production

1. Set environment variables
2. Build the binary: `make build`
3. Run the server: `./bin/server`

For production deployments, consider:
- Setting up PostgreSQL with connection pooling
- Configuring Redis for distributed state
- Using a reverse proxy (Nginx) for SSL termination
- Implementing rate limiting
- Setting up monitoring and logging

## Testing

```bash
# Run all tests
go test ./...

# Run with coverage
go test -cover ./...

# Run specific package tests
go test ./service/game-server/controller/auth
```

## Troubleshooting

### Server won't start
- Check if port 8080 is already in use: `lsof -i :8080`
- Verify database is running: `docker compose ps`
- Check environment variables in `.env` file
- Review server logs for detailed error messages

### Database connection fails
- Ensure Docker containers are running: `docker compose ps`
- Test connection: `make db-test`
- Verify credentials in `.env` match Docker Compose configuration
- Check if PostgreSQL port 5432 is exposed: `docker compose port postgres 5432`

### WebSocket connection refused
- Verify Origin header is set to allowed origin (localhost:5173 or localhost:5174)
- Check server logs for "Failed to upgrade connection" errors
- Ensure WebSocket endpoint is `/ws` not `/websocket`
- Test with provided Go client: `go run /tmp/test_ws.go <jwt_token>`

### JWT token invalid
- Token expires after 24 hours (default) - login again
- Ensure Authorization header format: `Bearer <token>`
- Check JWT_SECRET matches between registration/login sessions
- Token must be obtained from /auth/register or /auth/login

### CORS errors in browser
- Server only allows origins: localhost:5173, localhost:5174
- Add additional origins to CORS_ORIGINS in `.env` if needed
- Ensure frontend is making requests from allowed origin

## Project Status

**Current Phase:** Week 1 Complete - Infrastructure Ready for Week 2

**Completed (Week 1):**
- ✅ TASK-012: Go module initialization
- ✅ TASK-013: HTTP server with Chi router
- ✅ TASK-013: CORS configuration and middleware
- ✅ TASK-013: Health check endpoint
- ✅ TASK-013: Graceful shutdown
- ✅ TASK-014: PostgreSQL database setup (Docker Compose)
- ✅ TASK-014: Redis container setup
- ✅ TASK-015: Database schema with 5 tables (users, user_stats, game_rooms, game_history, player_game_results)
- ✅ TASK-015: User repository with CRUD operations
- ✅ TASK-015: Test data seeding
- ✅ TASK-016: JWT authentication service
- ✅ TASK-016: Password hashing utilities (bcrypt)
- ✅ TASK-016: Auth middleware for protected routes
- ✅ TASK-016: User registration endpoint
- ✅ TASK-016: User login endpoint
- ✅ TASK-016: Get current user endpoint
- ✅ TASK-017: WebSocket hub implementation
- ✅ TASK-017: Connection lifecycle management
- ✅ TASK-018: WebSocket message routing
- ✅ TASK-018: Event handler stubs (auth, lobby, game events)
- ✅ TASK-019: Comprehensive testing of all endpoints
- ✅ TASK-019: WebSocket connection validation
- ✅ TASK-019: Complete API documentation

**Completed (Week 3 - Room Management):**
- ✅ TASK-039: Room Manager implementation
- ✅ TASK-039: Room entity with full data model
- ✅ TASK-039: Room repository for database persistence
- ✅ TASK-039: WebSocket lobby:create event handler
- ✅ TASK-039: WebSocket lobby:join event handler
- ✅ TASK-039: WebSocket lobby:leave event handler
- ✅ TASK-039: Host migration logic
- ✅ TASK-039: Room cleanup for empty rooms
- ✅ TASK-039: Comprehensive unit tests (61.7% coverage, race-free)
- ✅ TASK-039: Room management API documentation

**Next (Week 3):**
- Player ready state management
- Game initialization from lobby
- Game state manager
- Frontend UI components

**Future (Week 3+):**
- Complete game logic engine
- Card play validation
- Round management
- Dry/Show Dry mechanics
- Challenge system
- Timer management
- Comprehensive unit tests

## Contributing

This is a solo project, but contributions are welcome after MVP launch.

## License

Proprietary - All rights reserved
