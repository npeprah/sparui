# HANDOFF: TASK-019 - Test Backend Server Locally

**Date:** December 17, 2025
**From:** Project Manager
**To:** go-backend-engineer
**Status:** Ready to Start
**Priority:** P1 (High)

---

## Task Overview

**Objective:** Comprehensively test all backend endpoints and WebSocket connections locally to verify Week 1 backend infrastructure is fully functional.

**Context:** You just completed TASK-016 (JWT Authentication), which was the last P0 critical task for Week 1. All dependencies for this task are now complete. This is the final backend task before we move into Week 2 (Asset Creation & UI Foundation).

---

## What's Been Completed

### Infrastructure (TASK-012, TASK-013)
- Go module initialized at `/Users/nana/go/src/github.com/npeprah/sparui/backend`
- Chi HTTP server on port 8080
- CORS configured for localhost:5173, 5174
- Graceful shutdown implemented
- Standard middleware: RequestID, RealIP, Logger, Recoverer, Timeout

### Database (TASK-014, TASK-015)
- PostgreSQL 15 with Docker Compose
- 5 tables: users, user_stats, game_rooms, game_history, player_game_results
- Connection pooling configured
- 4 test users seeded (testuser1-4@example.com)

### Authentication (TASK-016 - JUST COMPLETED)
- **POST /api/v1/auth/register** - Create new user
- **POST /api/v1/auth/login** - Authenticate and get JWT token
- **GET /api/v1/auth/me** - Get current user (protected)
- **POST /api/v1/auth/logout** - Logout endpoint
- JWT middleware working
- Input validation implemented
- Bcrypt password hashing

### WebSocket (TASK-017, TASK-018)
- **GET /ws** - WebSocket endpoint
- Hub manages connections
- Message router handles events
- Ping/pong heartbeat (30s)

---

## Your Testing Tasks

### 1. Health Check Endpoint
```bash
curl -X GET http://localhost:8080/health
```

**Expected:**
- Status: 200 OK
- Response: JSON with status message

### 2. User Registration
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testplayer",
    "email": "testplayer@example.com",
    "password": "password123"
  }'
```

**Expected:**
- Status: 201 Created
- Response: User object with JWT token
- User stats initialized automatically

**Test edge cases:**
- Invalid email format
- Password too short (< 8 chars)
- Username too short (< 3 chars)
- Duplicate email
- Duplicate username

### 3. User Login
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testplayer@example.com",
    "password": "password123"
  }'
```

**Expected:**
- Status: 200 OK
- Response: User object with JWT token

**Test edge cases:**
- Wrong password
- Non-existent email
- Missing fields

### 4. Protected Route (Get Current User)
```bash
# First, save token from login/register response
TOKEN="<your_jwt_token_here>"

curl -X GET http://localhost:8080/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:**
- Status: 200 OK
- Response: User object with stats

**Test edge cases:**
- Missing Authorization header
- Invalid token
- Expired token (if possible)

### 5. WebSocket Connection

**Using wscat:**
```bash
# Install wscat if needed
npm install -g wscat

# Connect to WebSocket
wscat -c ws://localhost:8080/ws
```

**Expected:**
- Connection established
- Ping/pong heartbeat works
- Can send/receive messages

**Test messages:**
```json
{"event": "auth", "data": {"token": "your_jwt_token"}}
{"event": "lobby:create", "data": {"settings": {}}}
{"event": "game:play_card", "data": {"card": {"suit": "hearts", "value": "ace"}}}
```

**Test edge cases:**
- Invalid JSON
- Unknown event types
- Missing required fields

### 6. Database Verification

**Check seeded users:**
```bash
# Connect to database
make db-shell

# In psql:
SELECT id, username, email, created_at FROM users;
SELECT * FROM user_stats;
```

**Expected:**
- 4 test users exist
- Each user has corresponding user_stats entry
- Timestamps populated correctly

### 7. Server Startup and Shutdown

**Start server:**
```bash
make run
# OR
cd service/game-server/cmd && go run server.go
```

**Expected:**
- Server starts without errors
- Logs show:
  - Database connection successful
  - HTTP server listening on :8080
  - Routes registered
  - WebSocket hub initialized

**Shutdown:**
- Press Ctrl+C
- Verify graceful shutdown (waits for connections to close)
- No panic or error messages

---

## Acceptance Criteria (from TASK_BREAKDOWN.md)

- [ ] Server starts without errors
- [ ] Health check returns 200
- [ ] User registration works (test with curl/Postman)
- [ ] User login returns JWT token
- [ ] WebSocket connection established (test with wscat)
- [ ] WebSocket message echo works

---

## Documentation Requirements

**Update backend/README.md with:**
1. All endpoint documentation
2. Example curl commands for each endpoint
3. WebSocket event documentation
4. Environment variable requirements
5. Common troubleshooting tips

**Example format:**
```markdown
## API Endpoints

### Authentication

#### POST /api/v1/auth/register
Create a new user account.

**Request:**
```json
{
  "username": "string (3-50 chars)",
  "email": "string (valid email)",
  "password": "string (8-100 chars)"
}
```

**Response (201 Created):**
```json
{
  "user": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    ...
  },
  "token": "jwt_token"
}
```

**Errors:**
- 400: Invalid input
- 409: Email/username already exists
```

---

## Environment Setup

Ensure these environment variables are set:
```bash
PORT=8080
DB_HOST=localhost
DB_PORT=5432
DB_USER=sparuser
DB_PASSWORD=sparpassword
DB_NAME=spardb
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRATION_HOURS=24
```

---

## What to Report Back

When testing is complete, provide:

1. **Test Results Summary:**
   - Which endpoints work correctly
   - Which edge cases were tested
   - Any bugs or issues discovered

2. **Documentation:**
   - Updated README.md committed
   - All endpoints documented with examples

3. **Next Steps Recommendation:**
   - Any blockers for Week 2 development
   - Suggested improvements (defer to backlog if not critical)

---

## Success Metrics

**This task is complete when:**
- All acceptance criteria checked off
- All endpoints tested with curl/Postman
- WebSocket connection verified with wscat
- Documentation updated in README.md
- No critical bugs blocking Week 2 work

---

## Timeline

**Estimated Time:** 2-4 hours
**Target Completion:** December 18, 2025 (end of Week 1)

---

## Support

If you encounter blockers:
1. Check server logs for error details
2. Verify database is running: `make db-test`
3. Check environment variables are set
4. Review TASK-016 implementation in `/backend/service/game-server/controller/auth/`

---

## Next Task Preview

After TASK-019 is complete:
- **TASK-011** (Frontend WebSocket integration) may unblock if we can coordinate both servers running
- Week 2 will focus on **asset creation** (Design team) and **UI foundation** (Frontend team)
- Backend will be in maintenance mode during Week 2, focusing on Week 3 tasks (Room Manager, Game State)

---

**Good luck! This is the final Week 1 backend task. Let's finish strong and move into Week 2!**
