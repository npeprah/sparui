# Player Stats & Leaderboard API Documentation

## Overview

The Stats API provides endpoints for retrieving player statistics, leaderboards, and player rankings. All stats are automatically updated after each game completion.

**Base URL:** `/api/v1/stats`

**Authentication:** Not required for MVP (can be added later)

---

## Endpoints

### 1. Get Leaderboard

Retrieve the top players sorted by various criteria with pagination support.

**Endpoint:** `GET /api/v1/stats/leaderboard`

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | integer | No | 10 | Number of entries to return (1-100) |
| `offset` | integer | No | 0 | Number of entries to skip (for pagination) |
| `sortBy` | string | No | `wins` | Sort criteria (see below) |

**Valid sortBy values:**
- `wins` or `total_wins` - Most wins (default)
- `win_rate` or `winrate` - Highest win percentage
- `points` or `total_points` - Total points earned
- `streak` or `best_streak` or `highest_streak` - Best win streak
- `games` or `total_games` - Most games played

**Example Request:**
```bash
GET /api/v1/stats/leaderboard?limit=20&offset=0&sortBy=wins
```

**Response:** `200 OK`
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "userId": "uuid-here",
      "username": "topplayer",
      "avatar": "avatar.png",
      "totalGames": 132,
      "totalWins": 100,
      "totalLosses": 32,
      "totalPoints": 3200,
      "winRate": 75.76,
      "highestStreak": 12,
      "gamesWithFire": 45,
      "gamesWithFreeze": 23,
      "dryWins": 15,
      "showDryWins": 5,
      "challengesMade": 30,
      "challengesWon": 22,
      "updatedAt": "2025-12-19T10:30:00Z"
    },
    // ... more entries
  ],
  "total": 500,
  "limit": 20,
  "offset": 0,
  "sortBy": "total_wins"
}
```

**Use Cases:**
- Display top 10 players on homepage
- Show paginated leaderboard page
- Display different leaderboard rankings (by wins, win rate, etc.)

---

### 2. Get Player Stats

Retrieve comprehensive statistics for a specific player.

**Endpoint:** `GET /api/v1/stats/player/:userId`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | string (UUID) | Yes | The player's user ID |

**Example Request:**
```bash
GET /api/v1/stats/player/550e8400-e29b-41d4-a716-446655440000
```

**Response:** `200 OK`
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "username": "player123",
  "avatar": "avatar.png",
  "totalGames": 50,
  "totalWins": 32,
  "totalLosses": 18,
  "totalPoints": 1250,
  "winRate": 64.00,
  "highestStreak": 8,
  "gamesWithFire": 15,
  "gamesWithFreeze": 10,
  "dryWins": 5,
  "showDryWins": 2,
  "challengesMade": 20,
  "challengesWon": 12,
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-12-19T10:30:00Z"
}
```

**Error Responses:**

`400 Bad Request` - Invalid or missing user ID
```json
{
  "error": "user ID is required",
  "status": 400
}
```

`404 Not Found` - Player not found
```json
{
  "error": "player not found",
  "status": 404
}
```

**Use Cases:**
- Display player profile
- Show personal stats dashboard
- Compare stats with friends

---

### 3. Get Player Rank

Calculate a player's rank position based on specified criteria.

**Endpoint:** `GET /api/v1/stats/player/:userId/rank`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | string (UUID) | Yes | The player's user ID |

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `sortBy` | string | No | `wins` | Ranking criteria (same as leaderboard) |

**Example Request:**
```bash
GET /api/v1/stats/player/550e8400-e29b-41d4-a716-446655440000/rank?sortBy=wins
```

**Response:** `200 OK`
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "username": "player123",
  "rank": 42,
  "sortBy": "total_wins",
  "value": 32
}
```

**Notes:**
- `rank` is 1-based (1 = first place)
- `value` is the stat value being ranked by (e.g., 32 wins)
- Returns rank 0 if player has no games played

**Error Responses:**

`400 Bad Request` - Invalid user ID
```json
{
  "error": "user ID is required",
  "status": 400
}
```

`404 Not Found` - Player not found
```json
{
  "error": "player not found",
  "status": 404
}
```

**Use Cases:**
- Show "You are ranked #42 out of 500 players"
- Display rank badges
- Compare ranking across different criteria

---

## Data Models

### LeaderboardEntry

```typescript
interface LeaderboardEntry {
  rank: number;              // Player's position (1-based)
  userId: string;            // UUID
  username: string;          // Display name
  avatar: string;            // Avatar file name
  totalGames: number;        // Total games played
  totalWins: number;         // Total wins
  totalLosses: number;       // Total losses
  totalPoints: number;       // Total points earned
  winRate: number;           // Win percentage (0-100)
  highestStreak: number;     // Best consecutive win streak
  gamesWithFire: number;     // Games won with fire effect active
  gamesWithFreeze: number;   // Games won with freeze effect
  dryWins: number;           // Hidden dry card wins
  showDryWins: number;       // Show dry card wins
  challengesMade: number;    // Total challenges made
  challengesWon: number;     // Challenges won
  updatedAt: string;         // ISO 8601 timestamp
}
```

### PlayerStatsResponse

```typescript
interface PlayerStatsResponse {
  userId: string;            // UUID
  username: string;          // Display name
  avatar: string;            // Avatar file name
  totalGames: number;        // Total games played
  totalWins: number;         // Total wins
  totalLosses: number;       // Total losses
  totalPoints: number;       // Total points earned
  winRate: number;           // Win percentage (0-100)
  highestStreak: number;     // Best consecutive win streak
  gamesWithFire: number;     // Games won with fire effect active
  gamesWithFreeze: number;   // Games won with freeze effect
  dryWins: number;           // Hidden dry card wins
  showDryWins: number;       // Show dry card wins
  challengesMade: number;    // Total challenges made
  challengesWon: number;     // Challenges won
  createdAt: string;         // ISO 8601 timestamp
  updatedAt: string;         // ISO 8601 timestamp
}
```

### PlayerRankResponse

```typescript
interface PlayerRankResponse {
  userId: string;            // UUID
  username: string;          // Display name
  rank: number;              // Position (1-based, 0 = unranked)
  sortBy: string;            // Criteria used for ranking
  value: number;             // The stat value (e.g., 32 wins)
}
```

---

## Frontend Integration Examples

### React Example

```typescript
// Fetch leaderboard
async function fetchLeaderboard(limit = 10, offset = 0, sortBy = 'wins') {
  const response = await fetch(
    `/api/v1/stats/leaderboard?limit=${limit}&offset=${offset}&sortBy=${sortBy}`
  );
  if (!response.ok) throw new Error('Failed to fetch leaderboard');
  return await response.json();
}

// Fetch player stats
async function fetchPlayerStats(userId: string) {
  const response = await fetch(`/api/v1/stats/player/${userId}`);
  if (!response.ok) throw new Error('Failed to fetch player stats');
  return await response.json();
}

// Fetch player rank
async function fetchPlayerRank(userId: string, sortBy = 'wins') {
  const response = await fetch(
    `/api/v1/stats/player/${userId}/rank?sortBy=${sortBy}`
  );
  if (!response.ok) throw new Error('Failed to fetch player rank');
  return await response.json();
}
```

### Vue Example

```vue
<script setup>
import { ref, onMounted } from 'vue';

const leaderboard = ref([]);
const loading = ref(true);

async function loadLeaderboard() {
  try {
    const response = await fetch('/api/v1/stats/leaderboard?limit=10&sortBy=wins');
    const data = await response.json();
    leaderboard.value = data.leaderboard;
  } catch (error) {
    console.error('Failed to load leaderboard:', error);
  } finally {
    loading.value = false;
  }
}

onMounted(loadLeaderboard);
</script>

<template>
  <div v-if="loading">Loading...</div>
  <div v-else>
    <div v-for="entry in leaderboard" :key="entry.userId">
      <span>{{ entry.rank }}. {{ entry.username }}</span>
      <span>{{ entry.totalWins }} wins</span>
      <span>{{ entry.winRate.toFixed(2) }}% win rate</span>
    </div>
  </div>
</template>
```

---

## Performance Considerations

### Database Indexes

The following indexes are automatically created for optimal query performance:

```sql
CREATE INDEX idx_user_stats_total_wins ON user_stats(total_wins DESC, total_games DESC) WHERE total_games > 0;
CREATE INDEX idx_user_stats_win_rate ON user_stats(win_rate DESC, total_wins DESC) WHERE total_games > 0;
CREATE INDEX idx_user_stats_total_points ON user_stats(total_points DESC, total_wins DESC) WHERE total_games > 0;
CREATE INDEX idx_user_stats_highest_streak ON user_stats(highest_streak DESC, total_wins DESC) WHERE total_games > 0;
CREATE INDEX idx_user_stats_total_games ON user_stats(total_games DESC, total_wins DESC) WHERE total_games > 0;
```

### Expected Performance

- **Leaderboard queries:** < 100ms for top 100 players
- **Player stats queries:** < 50ms
- **Player rank queries:** < 100ms

### Caching Recommendations

For production deployments, consider caching:

1. **Leaderboard:** Cache for 5-10 minutes (updates infrequently)
   ```javascript
   const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
   ```

2. **Player stats:** Cache for 1-2 minutes (updates after each game)
   ```javascript
   const CACHE_TTL = 60 * 1000; // 1 minute
   ```

3. **Player rank:** Cache for 5-10 minutes (less critical, can be stale)
   ```javascript
   const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
   ```

---

## Testing

### Curl Examples

```bash
# Get top 10 players
curl "http://localhost:8080/api/v1/stats/leaderboard?limit=10&sortBy=wins"

# Get player stats
curl "http://localhost:8080/api/v1/stats/player/550e8400-e29b-41d4-a716-446655440000"

# Get player rank
curl "http://localhost:8080/api/v1/stats/player/550e8400-e29b-41d4-a716-446655440000/rank?sortBy=wins"

# Get leaderboard sorted by win rate
curl "http://localhost:8080/api/v1/stats/leaderboard?limit=20&sortBy=win_rate"
```

---

## Common Use Cases

### 1. Homepage Leaderboard Widget

Display top 5 players:

```javascript
const data = await fetchLeaderboard(5, 0, 'wins');
displayLeaderboard(data.leaderboard);
```

### 2. Full Leaderboard Page with Pagination

```javascript
const page = 1;
const limit = 25;
const offset = (page - 1) * limit;
const data = await fetchLeaderboard(limit, offset, 'wins');

// Display pagination
const totalPages = Math.ceil(data.total / limit);
```

### 3. Player Profile Dashboard

```javascript
const userId = getCurrentUserId();
const [stats, rank] = await Promise.all([
  fetchPlayerStats(userId),
  fetchPlayerRank(userId, 'wins')
]);

displayProfile(stats, rank);
```

### 4. Multi-Criteria Leaderboard Tabs

```javascript
const tabs = ['wins', 'win_rate', 'points', 'streak'];
for (const tab of tabs) {
  const data = await fetchLeaderboard(10, 0, tab);
  displayTab(tab, data.leaderboard);
}
```

---

## Error Handling Best Practices

```typescript
async function safelyFetchLeaderboard() {
  try {
    const response = await fetch('/api/v1/stats/leaderboard');

    if (!response.ok) {
      if (response.status === 400) {
        console.error('Invalid request parameters');
      } else if (response.status === 500) {
        console.error('Server error, try again later');
      }
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error);
    // Return fallback data or show error UI
    return { leaderboard: [], total: 0, limit: 10, offset: 0 };
  }
}
```

---

## Rate Limiting Considerations

While not implemented in MVP, consider these recommendations for production:

- **Leaderboard:** 30 requests/minute per IP
- **Player stats:** 60 requests/minute per IP
- **Player rank:** 30 requests/minute per IP

---

## Future Enhancements

Potential future features (not in MVP):

1. **Time-based leaderboards:** Daily, weekly, monthly rankings
2. **Friend rankings:** Compare with friends only
3. **Historical stats:** Track stats over time
4. **Achievements:** Badge system based on stats
5. **Seasonal resets:** Reset stats periodically
6. **Global vs. regional leaderboards:** Geographic rankings
7. **Custom leaderboards:** Filter by game mode, card deck, etc.

---

## Support

For questions or issues:
- GitHub Issues: [project-repo/issues]
- API Version: v1
- Last Updated: December 19, 2025
