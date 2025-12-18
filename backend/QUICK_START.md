# Backend Quick Start Guide

## Start the Server (3 commands)

```bash
# 1. Start database
make db-start

# 2. Build server
make build

# 3. Run server
make run
```

Server running at: **http://localhost:8080**

---

## Test the Server

### Register a user
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"myuser","email":"myuser@example.com","password":"mypassword123"}'
```

### Login
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"myuser@example.com","password":"mypassword123"}'
```

Save the `token` from the response.

### Get current user (protected route)
```bash
TOKEN="your_jwt_token_here"
curl http://localhost:8080/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

---

## WebSocket Testing

### Using Go Client
```bash
# Register/login first to get token
TOKEN="your_jwt_token_here"

# Run WebSocket test
cd /tmp
go run test_ws.go "$TOKEN"
```

### Using wscat (if available)
```bash
npm install -g wscat
wscat -c ws://localhost:8080/ws --origin http://localhost:5173
```

Send auth message:
```json
{"event":"auth","data":{"token":"your_token_here"}}
```

---

## Database Access

```bash
# Open PostgreSQL shell
make db-shell

# In psql:
\dt                     # List tables
SELECT * FROM users;    # View users
SELECT * FROM user_stats; # View stats
```

---

## Common Commands

```bash
make db-start    # Start database containers
make db-stop     # Stop database
make db-reset    # Reset database (WARNING: deletes all data)
make db-logs     # View database logs
make build       # Build server binary
make run         # Run server
make test        # Run Go tests
```

---

## Troubleshooting

**Server won't start:**
```bash
lsof -i :8080        # Check if port in use
docker compose ps    # Check database is running
```

**Database connection fails:**
```bash
make db-test         # Test database connection
docker compose logs postgres  # View database logs
```

**WebSocket connection refused:**
- Make sure Origin header is `http://localhost:5173` or `http://localhost:5174`
- Check server logs for errors

---

## Environment Variables

Copy `.env.example` to `.env` - defaults work for local development.

Key variables:
- `PORT=8080` - Server port
- `DB_HOST=localhost` - Database host
- `JWT_SECRET=dev-secret-change-in-production-please` - JWT signing key

---

## API Endpoints

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | /health | No | Health check |
| POST | /api/v1/auth/register | No | Register new user |
| POST | /api/v1/auth/login | No | Login user |
| GET | /api/v1/auth/me | Yes | Get current user |
| GET | /ws | No | WebSocket connection |

**Auth Required:** Include header `Authorization: Bearer <jwt_token>`

---

## WebSocket Events

**Client → Server:**
- `auth` - Authenticate with JWT
- `lobby:create` - Create game lobby
- `lobby:join` - Join lobby
- `lobby:leave` - Leave lobby
- `game:play_card` - Play a card
- `game:declare_dry` - Declare dry
- `game:flag_player` - Challenge player

**Server → Client:**
- `auth:success` - Authentication confirmed
- More events coming in Week 2/3

---

## Project Structure

```
backend/
├── service/game-server/
│   ├── cmd/server.go          # Main entry point
│   ├── controller/
│   │   ├── auth/              # Auth endpoints
│   │   └── websocket/         # WebSocket handlers
│   ├── entity/                # Data models
│   ├── repository/            # Database access
│   └── docker/
│       └── init.sql           # Database schema
├── .env                       # Environment config
├── Makefile                   # Build commands
└── README.md                  # Full documentation
```

---

## Need Help?

- **Full Documentation:** See `backend/README.md`
- **Testing Report:** See `backend/TESTING_REPORT_TASK-019.md`
- **Task Details:** See `TASK_BREAKDOWN.md`

---

**Quick Start Guide** - Last Updated: December 17, 2025
