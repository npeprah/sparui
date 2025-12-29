package stats

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
)

// Handler handles HTTP requests for player stats and leaderboard
type Handler struct {
	service *Service
}

// NewHandler creates a new stats HTTP handler
func NewHandler(service *Service) *Handler {
	return &Handler{
		service: service,
	}
}

// Routes returns the router with all stats endpoints registered
func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()

	// Public endpoints (no auth required for MVP - can add later)
	r.Get("/leaderboard", h.GetLeaderboard)
	r.Get("/player/{userId}", h.GetPlayerStats)
	r.Get("/player/{userId}/rank", h.GetPlayerRank)

	return r
}

// GetLeaderboard handles GET /api/v1/stats/leaderboard
// Query params:
// - limit: number of entries (default 10, max 100)
// - offset: pagination offset (default 0)
// - sortBy: sort criteria (wins, win_rate, points, streak, games)
//
// Example: GET /api/v1/stats/leaderboard?limit=20&offset=0&sortBy=wins
func (h *Handler) GetLeaderboard(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Parse query parameters
	limitStr := r.URL.Query().Get("limit")
	offsetStr := r.URL.Query().Get("offset")
	sortBy := r.URL.Query().Get("sortBy")

	// Default values
	limit := 10
	offset := 0

	// Parse limit
	if limitStr != "" {
		parsedLimit, err := strconv.Atoi(limitStr)
		if err != nil {
			h.respondError(w, http.StatusBadRequest, "invalid limit parameter")
			return
		}
		limit = parsedLimit
	}

	// Parse offset
	if offsetStr != "" {
		parsedOffset, err := strconv.Atoi(offsetStr)
		if err != nil {
			h.respondError(w, http.StatusBadRequest, "invalid offset parameter")
			return
		}
		offset = parsedOffset
	}

	// Default sortBy
	if sortBy == "" {
		sortBy = "wins"
	}

	// Get leaderboard
	response, err := h.service.GetLeaderboard(ctx, limit, offset, sortBy)
	if err != nil {
		slog.Error("Failed to get leaderboard",
			"error", err,
			"limit", limit,
			"offset", offset,
			"sortBy", sortBy,
		)
		h.respondError(w, http.StatusInternalServerError, "failed to retrieve leaderboard")
		return
	}

	h.respondJSON(w, http.StatusOK, response)
}

// GetPlayerStats handles GET /api/v1/stats/player/:userId
// Returns comprehensive statistics for a specific player
//
// Example: GET /api/v1/stats/player/uuid-here
func (h *Handler) GetPlayerStats(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	userID := chi.URLParam(r, "userId")
	if userID == "" {
		h.respondError(w, http.StatusBadRequest, "user ID is required")
		return
	}

	stats, err := h.service.GetPlayerStats(ctx, userID)
	if err != nil {
		slog.Error("Failed to get player stats",
			"error", err,
			"userId", userID,
		)

		// Check if it's a not found error (contains "not found" in the error message)
		errMsg := err.Error()
		if errMsg == "player not found" || errMsg == "stats not found" ||
			errMsg == "failed to get player stats: player not found" ||
			errMsg == "failed to get player stats: user not found" ||
			errMsg == "failed to get player stats: stats not found" {
			h.respondError(w, http.StatusNotFound, "player not found")
			return
		}

		h.respondError(w, http.StatusInternalServerError, "failed to retrieve player stats")
		return
	}

	h.respondJSON(w, http.StatusOK, stats)
}

// GetPlayerRank handles GET /api/v1/stats/player/:userId/rank
// Query params:
// - sortBy: sort criteria to rank by (wins, win_rate, points, streak, games)
//
// Example: GET /api/v1/stats/player/uuid-here/rank?sortBy=wins
func (h *Handler) GetPlayerRank(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	userID := chi.URLParam(r, "userId")
	if userID == "" {
		h.respondError(w, http.StatusBadRequest, "user ID is required")
		return
	}

	sortBy := r.URL.Query().Get("sortBy")
	if sortBy == "" {
		sortBy = "wins" // Default to wins
	}

	rank, err := h.service.GetPlayerRank(ctx, userID, sortBy)
	if err != nil {
		slog.Error("Failed to get player rank",
			"error", err,
			"userId", userID,
			"sortBy", sortBy,
		)

		// Check if it's a not found error
		if err.Error() == "failed to get user: user not found" ||
			err.Error() == "failed to calculate rank: player stats not found" {
			h.respondError(w, http.StatusNotFound, "player not found")
			return
		}

		h.respondError(w, http.StatusInternalServerError, "failed to calculate player rank")
		return
	}

	h.respondJSON(w, http.StatusOK, rank)
}

// respondJSON sends a JSON response
func (h *Handler) respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	if err := json.NewEncoder(w).Encode(data); err != nil {
		slog.Error("Failed to encode JSON response", "error", err)
	}
}

// respondError sends an error response
func (h *Handler) respondError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	response := map[string]interface{}{
		"error":  message,
		"status": status,
	}

	if err := json.NewEncoder(w).Encode(response); err != nil {
		slog.Error("Failed to encode error response", "error", err)
	}
}

// ErrorResponse is a standardized error response
type ErrorResponse struct {
	Error  string `json:"error"`
	Status int    `json:"status"`
}
