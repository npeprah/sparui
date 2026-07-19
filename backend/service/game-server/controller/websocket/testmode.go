package websocket

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"sync"

	"github.com/npeprah/sparui/backend/service/game-server/entity"
)

// ---------------------------------------------------------------------------
// SPAR_TEST_MODE - deterministic end-to-end harness support (NEVER production)
//
// Test mode is a single, strictly-gated switch that the e2e harness turns on so
// browser-driven acceptance runs are deterministic and infra-light. It bundles
// two capabilities, both no-ops unless test mode is explicitly enabled:
//
//  1. DB-optional boot (owned by cmd/server.go + InitWebSocketTestMode below):
//     the server boots without Postgres; the in-memory room manager and the
//     in-memory games map already carry all live gameplay, so nothing in the
//     acceptance path needs the database.
//
//  2. Hand injection (this file): before a game starts, a test can pin the
//     exact hands + opening leader for a room so named scenarios (clean game,
//     correct/wrong flag, dry, show-dry, fire+freeze) load reproducibly instead
//     of relying on a shuffled deck.
//
// GATING: testModeEnabled defaults to false and is flipped ON only by
// EnableTestMode(), which cmd/server.go calls solely when the SPAR_TEST_MODE
// environment variable is truthy. Every hook in this file is a hard no-op while
// the flag is false, so an unset env var leaves the production boot path and
// the shuffled-deck game construction completely unchanged.
// ---------------------------------------------------------------------------

// testModeEnabled gates every test-only hook in this package. It is false by
// default and only ever set true via EnableTestMode.
var testModeEnabled bool

// EnableTestMode turns on SPAR_TEST_MODE hooks (hand injection + the in-memory
// DB-optional boot). It MUST only be called from the server entrypoint when the
// SPAR_TEST_MODE env var is truthy, and MUST NEVER be reachable in production.
func EnableTestMode() {
	testModeEnabled = true
	slog.Warn("SPAR_TEST_MODE ENABLED - deterministic e2e hooks are active; " +
		"this build MUST NOT be run in production")
}

// TestModeEnabled reports whether SPAR_TEST_MODE hooks are active.
func TestModeEnabled() bool {
	return testModeEnabled
}

// injectedScenario pins the exact hands and opening leader for one room.
type injectedScenario struct {
	// name is a human label for the scenario (e.g. "flag-correct"); advisory.
	name string
	// leaderIndex is the seat index (0-based) of the opening leader, or -1 to
	// pick the leader randomly the way a normal game would.
	leaderIndex int
	// hands holds one 5-card hand per seat, ordered to match the room's players
	// (seat 0 is the host/first joiner, and so on).
	hands [][]entity.Card
}

var (
	injectedScenarios   = make(map[string]*injectedScenario)
	injectedScenariosMu sync.Mutex
)

// setInjectedScenario validates and stores a scenario for a room. The scenario
// persists until explicitly cleared (so a flag-void reshuffle re-deals the same
// deterministic hands) or overwritten. Returns an error describing the first
// validation failure. It is a no-op error unless test mode is enabled.
func setInjectedScenario(roomCode string, s *injectedScenario) error {
	if !testModeEnabled {
		return fmt.Errorf("test mode is not enabled")
	}
	if roomCode == "" {
		return fmt.Errorf("roomCode is required")
	}
	if err := validateInjectedHands(s.hands); err != nil {
		return err
	}
	if s.leaderIndex < -1 || s.leaderIndex >= len(s.hands) {
		return fmt.Errorf("leaderIndex %d out of range for %d seats", s.leaderIndex, len(s.hands))
	}
	injectedScenariosMu.Lock()
	injectedScenarios[roomCode] = s
	injectedScenariosMu.Unlock()
	slog.Info("Test-mode hands injected",
		"roomCode", roomCode, "scenario", s.name, "seats", len(s.hands), "leaderIndex", s.leaderIndex)
	return nil
}

// clearInjectedScenario removes any pinned scenario for a room.
func clearInjectedScenario(roomCode string) {
	injectedScenariosMu.Lock()
	delete(injectedScenarios, roomCode)
	injectedScenariosMu.Unlock()
}

// injectedHandsFor returns the pinned hands and opening-leader index for a room
// when test mode is on and a matching scenario exists. ok is false (and the
// caller falls back to the normal shuffled deck) when test mode is off, no
// scenario is registered, or the scenario's seat count does not match the
// actual number of players.
func injectedHandsFor(roomCode string, numSeats int) (hands [][]entity.Card, leaderIndex int, ok bool) {
	if !testModeEnabled {
		return nil, 0, false
	}
	injectedScenariosMu.Lock()
	s, exists := injectedScenarios[roomCode]
	injectedScenariosMu.Unlock()
	if !exists {
		return nil, 0, false
	}
	if len(s.hands) != numSeats {
		slog.Warn("Test-mode scenario seat count mismatch; falling back to shuffled deck",
			"roomCode", roomCode, "scenarioSeats", len(s.hands), "actualSeats", numSeats)
		return nil, 0, false
	}
	// Deep-copy so the caller mutating hands (removing played cards) never
	// corrupts the stored scenario used by a later reshuffle.
	out := make([][]entity.Card, len(s.hands))
	for i, hand := range s.hands {
		out[i] = append([]entity.Card(nil), hand...)
	}
	leader := s.leaderIndex
	if leader < 0 {
		leader = pickRandomLeaderIndex(numSeats)
	}
	return out, leader, true
}

// validateInjectedHands enforces that injected hands form a legal deal: every
// seat gets exactly 5 valid cards and no card is dealt twice or is outside the
// standard 35-card Spar deck.
func validateInjectedHands(hands [][]entity.Card) error {
	if len(hands) < 2 || len(hands) > 4 {
		return fmt.Errorf("must inject hands for between 2 and 4 seats, got %d", len(hands))
	}

	// Build the set of legal cards from the canonical deck.
	legal := make(map[string]bool)
	for _, c := range entity.NewDeck().Cards {
		legal[cardKey(c)] = true
	}

	seen := make(map[string]bool)
	for seat, hand := range hands {
		if len(hand) != 5 {
			return fmt.Errorf("seat %d must have exactly 5 cards, got %d", seat, len(hand))
		}
		for _, c := range hand {
			key := cardKey(c)
			if !legal[key] {
				return fmt.Errorf("seat %d has invalid card %q", seat, c.String())
			}
			if seen[key] {
				return fmt.Errorf("card %q dealt more than once", c.String())
			}
			seen[key] = true
		}
	}
	return nil
}

func cardKey(c entity.Card) string {
	return string(c.Suit) + "-" + string(c.Value)
}

// ---------------------------------------------------------------------------
// HTTP endpoints (mounted under /test/* by cmd/server.go ONLY in test mode)
// ---------------------------------------------------------------------------

// testInjectCard is the wire shape for a single injected card. Suit is the
// lowercase backend suit ("hearts"); the value may be given as the backend
// value ("6", "jack") or the frontend rank ("J"), matching game:play_card.
type testInjectCard struct {
	Suit  string `json:"suit"`
	Value string `json:"value"`
	Rank  string `json:"rank"`
}

// testInjectRequest is the body for POST /test/inject-hands. leaderIndex is
// optional: omit (or -1) to keep the normal random opening leader.
type testInjectRequest struct {
	RoomCode    string             `json:"roomCode"`
	Scenario    string             `json:"scenario"`
	LeaderIndex *int               `json:"leaderIndex"`
	Hands       [][]testInjectCard `json:"hands"`
}

// HandleTestInject pins deterministic hands for a room. It is only mounted when
// test mode is enabled, and additionally rejects requests if the flag is off as
// a defense in depth.
func HandleTestInject(w http.ResponseWriter, r *http.Request) {
	if !testModeEnabled {
		http.Error(w, "test mode not enabled", http.StatusForbidden)
		return
	}

	var req testInjectRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body: "+err.Error(), http.StatusBadRequest)
		return
	}

	hands := make([][]entity.Card, len(req.Hands))
	for i, seat := range req.Hands {
		hands[i] = make([]entity.Card, len(seat))
		for j, c := range seat {
			value := c.Value
			if value == "" {
				value = c.Rank
			}
			hands[i][j] = entity.Card{
				Suit:  entity.Suit(c.Suit),
				Value: entity.Value(mapFrontendRankToBackend(value)),
			}
		}
	}

	leaderIndex := -1
	if req.LeaderIndex != nil {
		leaderIndex = *req.LeaderIndex
	}

	if err := setInjectedScenario(req.RoomCode, &injectedScenario{
		name:        req.Scenario,
		leaderIndex: leaderIndex,
		hands:       hands,
	}); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]any{
		"status":   "ok",
		"roomCode": req.RoomCode,
		"seats":    len(hands),
	})
}

// HandleTestReset clears any pinned scenario for a room (or all rooms if no
// roomCode query is supplied). Only mounted in test mode.
func HandleTestReset(w http.ResponseWriter, r *http.Request) {
	if !testModeEnabled {
		http.Error(w, "test mode not enabled", http.StatusForbidden)
		return
	}
	roomCode := r.URL.Query().Get("roomCode")
	if roomCode == "" {
		injectedScenariosMu.Lock()
		injectedScenarios = make(map[string]*injectedScenario)
		injectedScenariosMu.Unlock()
	} else {
		clearInjectedScenario(roomCode)
	}
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(`{"status":"ok"}`))
}
