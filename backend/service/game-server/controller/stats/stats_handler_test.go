package stats

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/npeprah/sparui/backend/service/game-server/entity"
)

// TestHandlerGetLeaderboard tests the leaderboard HTTP endpoint
func TestHandlerGetLeaderboard(t *testing.T) {
	tests := []struct {
		name         string
		setupMock    func(*mockUserRepository)
		queryParams  string
		wantStatus   int
		validateBody func(*testing.T, []byte)
	}{
		{
			name: "Success - Default parameters",
			setupMock: func(m *mockUserRepository) {
				for i := 0; i < 5; i++ {
					userID := uuid.New().String()
					user, stats := createTestUser(userID, "Player"+string(rune('A'+i)), 10-i, 2, 100)
					m.users[userID] = user
					m.stats[userID] = stats
				}
			},
			queryParams: "",
			wantStatus:  http.StatusOK,
			validateBody: func(t *testing.T, body []byte) {
				var resp entity.LeaderboardResponse
				if err := json.Unmarshal(body, &resp); err != nil {
					t.Fatalf("Failed to unmarshal response: %v", err)
				}
				if resp.Limit != 10 {
					t.Errorf("Limit = %d, want 10", resp.Limit)
				}
				if resp.Offset != 0 {
					t.Errorf("Offset = %d, want 0", resp.Offset)
				}
			},
		},
		{
			name: "Success - Custom parameters",
			setupMock: func(m *mockUserRepository) {
				for i := 0; i < 10; i++ {
					userID := uuid.New().String()
					user, stats := createTestUser(userID, "Player"+string(rune('A'+i)), 20-i, 2, 200)
					m.users[userID] = user
					m.stats[userID] = stats
				}
			},
			queryParams: "?limit=5&offset=0&sortBy=wins",
			wantStatus:  http.StatusOK,
			validateBody: func(t *testing.T, body []byte) {
				var resp entity.LeaderboardResponse
				if err := json.Unmarshal(body, &resp); err != nil {
					t.Fatalf("Failed to unmarshal response: %v", err)
				}
				if resp.Limit != 5 {
					t.Errorf("Limit = %d, want 5", resp.Limit)
				}
				if resp.SortBy != "total_wins" {
					t.Errorf("SortBy = %s, want total_wins", resp.SortBy)
				}
			},
		},
		{
			name: "Success - Sort by win_rate",
			setupMock: func(m *mockUserRepository) {
				userID := uuid.New().String()
				user, stats := createTestUser(userID, "TopPlayer", 50, 10, 500)
				m.users[userID] = user
				m.stats[userID] = stats
			},
			queryParams: "?sortBy=win_rate",
			wantStatus:  http.StatusOK,
			validateBody: func(t *testing.T, body []byte) {
				var resp entity.LeaderboardResponse
				if err := json.Unmarshal(body, &resp); err != nil {
					t.Fatalf("Failed to unmarshal response: %v", err)
				}
				if resp.SortBy != "win_rate" {
					t.Errorf("SortBy = %s, want win_rate", resp.SortBy)
				}
			},
		},
		{
			name:        "Error - Invalid limit",
			setupMock:   func(m *mockUserRepository) {},
			queryParams: "?limit=invalid",
			wantStatus:  http.StatusBadRequest,
			validateBody: func(t *testing.T, body []byte) {
				var errResp ErrorResponse
				if err := json.Unmarshal(body, &errResp); err != nil {
					t.Fatalf("Failed to unmarshal error response: %v", err)
				}
				if errResp.Error != "invalid limit parameter" {
					t.Errorf("Error = %s, want 'invalid limit parameter'", errResp.Error)
				}
			},
		},
		{
			name:        "Error - Invalid offset",
			setupMock:   func(m *mockUserRepository) {},
			queryParams: "?offset=invalid",
			wantStatus:  http.StatusBadRequest,
			validateBody: func(t *testing.T, body []byte) {
				var errResp ErrorResponse
				if err := json.Unmarshal(body, &errResp); err != nil {
					t.Fatalf("Failed to unmarshal error response: %v", err)
				}
				if errResp.Error != "invalid offset parameter" {
					t.Errorf("Error = %s, want 'invalid offset parameter'", errResp.Error)
				}
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRepo := newMockUserRepository()
			tt.setupMock(mockRepo)

			service := NewService(mockRepo)
			handler := NewHandler(service)

			req := httptest.NewRequest(http.MethodGet, "/leaderboard"+tt.queryParams, nil)
			w := httptest.NewRecorder()

			handler.GetLeaderboard(w, req)

			if w.Code != tt.wantStatus {
				t.Errorf("Status = %d, want %d", w.Code, tt.wantStatus)
			}

			if tt.validateBody != nil {
				tt.validateBody(t, w.Body.Bytes())
			}
		})
	}
}

// TestHandlerGetPlayerStats tests the player stats HTTP endpoint
func TestHandlerGetPlayerStats(t *testing.T) {
	tests := []struct {
		name         string
		setupMock    func(*mockUserRepository) string // returns userID
		userID       string
		wantStatus   int
		validateBody func(*testing.T, []byte)
	}{
		{
			name: "Success - Player found",
			setupMock: func(m *mockUserRepository) string {
				userID := uuid.New().String()
				user, stats := createTestUser(userID, "TestPlayer", 20, 5, 300)
				m.users[userID] = user
				m.stats[userID] = stats
				return userID
			},
			wantStatus: http.StatusOK,
			validateBody: func(t *testing.T, body []byte) {
				var resp entity.PlayerStatsResponse
				if err := json.Unmarshal(body, &resp); err != nil {
					t.Fatalf("Failed to unmarshal response: %v", err)
				}
				if resp.Username != "TestPlayer" {
					t.Errorf("Username = %s, want TestPlayer", resp.Username)
				}
				if resp.TotalWins != 20 {
					t.Errorf("TotalWins = %d, want 20", resp.TotalWins)
				}
			},
		},
		{
			name: "Error - Player not found",
			setupMock: func(m *mockUserRepository) string {
				return uuid.New().String() // Non-existent user
			},
			wantStatus: http.StatusNotFound,
			validateBody: func(t *testing.T, body []byte) {
				// Just verify we got an error response
				if len(body) == 0 {
					t.Error("Expected error response body, got empty")
				}
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRepo := newMockUserRepository()
			userID := tt.setupMock(mockRepo)

			service := NewService(mockRepo)
			handler := NewHandler(service)

			// Create router with chi to test URL parameters
			r := chi.NewRouter()
			r.Get("/stats/player/{userId}", handler.GetPlayerStats)

			req := httptest.NewRequest(http.MethodGet, "/stats/player/"+userID, nil)
			w := httptest.NewRecorder()

			r.ServeHTTP(w, req)

			if w.Code != tt.wantStatus {
				t.Errorf("Status = %d, want %d", w.Code, tt.wantStatus)
			}

			if tt.validateBody != nil {
				tt.validateBody(t, w.Body.Bytes())
			}
		})
	}
}

// TestHandlerGetPlayerRank tests the player rank HTTP endpoint
func TestHandlerGetPlayerRank(t *testing.T) {
	tests := []struct {
		name         string
		setupMock    func(*mockUserRepository) string // returns userID
		queryParams  string
		wantStatus   int
		validateBody func(*testing.T, []byte)
	}{
		{
			name: "Success - Default sort by wins",
			setupMock: func(m *mockUserRepository) string {
				userID := uuid.New().String()
				user, stats := createTestUser(userID, "RankedPlayer", 30, 10, 400)
				m.users[userID] = user
				m.stats[userID] = stats
				return userID
			},
			queryParams: "",
			wantStatus:  http.StatusOK,
			validateBody: func(t *testing.T, body []byte) {
				var resp entity.PlayerRankResponse
				if err := json.Unmarshal(body, &resp); err != nil {
					t.Fatalf("Failed to unmarshal response: %v", err)
				}
				if resp.Username != "RankedPlayer" {
					t.Errorf("Username = %s, want RankedPlayer", resp.Username)
				}
				if resp.SortBy != "total_wins" {
					t.Errorf("SortBy = %s, want total_wins", resp.SortBy)
				}
			},
		},
		{
			name: "Success - Sort by points",
			setupMock: func(m *mockUserRepository) string {
				userID := uuid.New().String()
				user, stats := createTestUser(userID, "PointsPlayer", 25, 5, 600)
				m.users[userID] = user
				m.stats[userID] = stats
				return userID
			},
			queryParams: "?sortBy=points",
			wantStatus:  http.StatusOK,
			validateBody: func(t *testing.T, body []byte) {
				var resp entity.PlayerRankResponse
				if err := json.Unmarshal(body, &resp); err != nil {
					t.Fatalf("Failed to unmarshal response: %v", err)
				}
				if resp.SortBy != "total_points" {
					t.Errorf("SortBy = %s, want total_points", resp.SortBy)
				}
			},
		},
		{
			name: "Error - Player not found",
			setupMock: func(m *mockUserRepository) string {
				return uuid.New().String() // Non-existent user
			},
			queryParams: "",
			wantStatus:  http.StatusNotFound,
			validateBody: func(t *testing.T, body []byte) {
				var errResp ErrorResponse
				if err := json.Unmarshal(body, &errResp); err != nil {
					t.Fatalf("Failed to unmarshal error response: %v", err)
				}
				if errResp.Error != "player not found" {
					t.Errorf("Error = %s, want 'player not found'", errResp.Error)
				}
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRepo := newMockUserRepository()
			userID := tt.setupMock(mockRepo)

			service := NewService(mockRepo)
			handler := NewHandler(service)

			// Create router with chi to test URL parameters
			r := chi.NewRouter()
			r.Get("/stats/player/{userId}/rank", handler.GetPlayerRank)

			req := httptest.NewRequest(http.MethodGet, "/stats/player/"+userID+"/rank"+tt.queryParams, nil)
			w := httptest.NewRecorder()

			r.ServeHTTP(w, req)

			if w.Code != tt.wantStatus {
				t.Errorf("Status = %d, want %d", w.Code, tt.wantStatus)
			}

			if tt.validateBody != nil {
				tt.validateBody(t, w.Body.Bytes())
			}
		})
	}
}

// TestRoutes verifies that all routes are registered correctly
func TestRoutes(t *testing.T) {
	mockRepo := newMockUserRepository()
	// Seed the user the route tests reference so /player/test-id resolves to a
	// real record (200) instead of a not-found (404). Without this the handler's
	// legitimate not-found 404 is indistinguishable from a router 404, which
	// would make this route-existence test fail for the wrong reason.
	user, stats := createTestUser("test-id", "Tester", 5, 5, 100)
	mockRepo.users["test-id"] = user
	mockRepo.stats["test-id"] = stats
	service := NewService(mockRepo)
	handler := NewHandler(service)

	router := handler.Routes()

	// Test that routes exist by making requests
	testCases := []struct {
		method string
		path   string
	}{
		{http.MethodGet, "/leaderboard"},
		{http.MethodGet, "/player/test-id"},
		{http.MethodGet, "/player/test-id/rank"},
	}

	for _, tc := range testCases {
		t.Run(tc.method+" "+tc.path, func(t *testing.T) {
			req := httptest.NewRequest(tc.method, tc.path, nil)
			w := httptest.NewRecorder()

			router.ServeHTTP(w, req)

			// Just verify the route exists (not 404)
			if w.Code == http.StatusNotFound {
				t.Errorf("Route %s %s not found", tc.method, tc.path)
			}
		})
	}
}

// TestHTTPIntegration tests the complete HTTP flow
func TestHTTPIntegration(t *testing.T) {
	mockRepo := newMockUserRepository()

	// Create test data
	user1ID := uuid.New().String()
	user1, stats1 := createTestUser(user1ID, "Alice", 50, 10, 800)
	mockRepo.users[user1ID] = user1
	mockRepo.stats[user1ID] = stats1

	user2ID := uuid.New().String()
	user2, stats2 := createTestUser(user2ID, "Bob", 40, 15, 600)
	mockRepo.users[user2ID] = user2
	mockRepo.stats[user2ID] = stats2

	service := NewService(mockRepo)
	handler := NewHandler(service)
	router := handler.Routes()

	t.Run("Get leaderboard", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/leaderboard?limit=10&sortBy=wins", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("Status = %d, want %d", w.Code, http.StatusOK)
		}

		var resp entity.LeaderboardResponse
		if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
			t.Fatalf("Failed to unmarshal response: %v", err)
		}

		if len(resp.Leaderboard) != 2 {
			t.Errorf("Leaderboard length = %d, want 2", len(resp.Leaderboard))
		}
	})

	t.Run("Get player stats", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/player/"+user1ID, nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("Status = %d, want %d", w.Code, http.StatusOK)
		}

		var resp entity.PlayerStatsResponse
		if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
			t.Fatalf("Failed to unmarshal response: %v", err)
		}

		if resp.Username != "Alice" {
			t.Errorf("Username = %s, want Alice", resp.Username)
		}
		if resp.TotalWins != 50 {
			t.Errorf("TotalWins = %d, want 50", resp.TotalWins)
		}
	})

	t.Run("Get player rank", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/player/"+user1ID+"/rank?sortBy=wins", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("Status = %d, want %d", w.Code, http.StatusOK)
		}

		var resp entity.PlayerRankResponse
		if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
			t.Fatalf("Failed to unmarshal response: %v", err)
		}

		if resp.Username != "Alice" {
			t.Errorf("Username = %s, want Alice", resp.Username)
		}
	})
}

// Benchmark HTTP handlers
func BenchmarkGetLeaderboard(b *testing.B) {
	mockRepo := newMockUserRepository()

	// Create 100 test users
	for i := 0; i < 100; i++ {
		userID := uuid.New().String()
		user, stats := createTestUser(userID, "Player"+string(rune('A'+i%26)), 100-i, 10, 1000-i*10)
		mockRepo.users[userID] = user
		mockRepo.stats[userID] = stats
	}

	service := NewService(mockRepo)
	handler := NewHandler(service)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		req := httptest.NewRequest(http.MethodGet, "/leaderboard?limit=10", nil)
		w := httptest.NewRecorder()
		handler.GetLeaderboard(w, req)
	}
}
