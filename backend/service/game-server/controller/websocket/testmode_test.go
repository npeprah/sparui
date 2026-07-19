package websocket

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/npeprah/sparui/backend/service/game-server/entity"
)

// withTestMode enables test mode for the duration of a test and restores the
// previous state + clears injected scenarios afterwards, so the package-level
// flag never leaks between tests.
func withTestMode(t *testing.T) {
	t.Helper()
	prev := testModeEnabled
	testModeEnabled = true
	t.Cleanup(func() {
		testModeEnabled = prev
		injectedScenariosMu.Lock()
		injectedScenarios = make(map[string]*injectedScenario)
		injectedScenariosMu.Unlock()
	})
}

// twoValidHands returns two disjoint, legal 5-card hands for injection tests.
func twoValidHands() [][]entity.Card {
	return [][]entity.Card{
		{
			{Suit: entity.Hearts, Value: entity.Ace},
			{Suit: entity.Hearts, Value: entity.King},
			{Suit: entity.Hearts, Value: entity.Queen},
			{Suit: entity.Hearts, Value: entity.Jack},
			{Suit: entity.Hearts, Value: entity.Ten},
		},
		{
			{Suit: entity.Clubs, Value: entity.Six},
			{Suit: entity.Clubs, Value: entity.Seven},
			{Suit: entity.Clubs, Value: entity.Eight},
			{Suit: entity.Clubs, Value: entity.Nine},
			{Suit: entity.Clubs, Value: entity.Ten},
		},
	}
}

// TestTestModeDisabledByDefault is the core safety guarantee: nothing in this
// package activates test mode on its own. A fresh process must report the flag
// off and every hook must be a no-op.
func TestTestModeDisabledByDefault(t *testing.T) {
	if TestModeEnabled() {
		t.Fatal("test mode must be OFF by default")
	}
	// Hand injection is inert while the flag is off.
	if _, _, ok := injectedHandsFor("ROOM01", 2); ok {
		t.Fatal("injectedHandsFor must return ok=false when test mode is disabled")
	}
	if err := setInjectedScenario("ROOM01", &injectedScenario{hands: twoValidHands()}); err == nil {
		t.Fatal("setInjectedScenario must fail when test mode is disabled")
	}
}

func TestTestModeFromEnvHelperMirror(t *testing.T) {
	// buildFreshGame must ignore any stale scenario map entry unless the flag is
	// on. Insert directly (bypassing the gate) and confirm the getter still
	// refuses to serve it while disabled.
	injectedScenariosMu.Lock()
	injectedScenarios["ROOMX"] = &injectedScenario{hands: twoValidHands(), leaderIndex: 0}
	injectedScenariosMu.Unlock()
	t.Cleanup(func() {
		injectedScenariosMu.Lock()
		delete(injectedScenarios, "ROOMX")
		injectedScenariosMu.Unlock()
	})

	if _, _, ok := injectedHandsFor("ROOMX", 2); ok {
		t.Fatal("a pre-seeded scenario must not be served while test mode is off")
	}
}

func TestSetInjectedScenarioValidation(t *testing.T) {
	withTestMode(t)

	tests := []struct {
		name    string
		hands   [][]entity.Card
		leader  int
		wantErr bool
	}{
		{"valid two hands", twoValidHands(), 0, false},
		{"valid random leader", twoValidHands(), -1, false},
		{
			name: "wrong card count",
			hands: [][]entity.Card{
				{{Suit: entity.Hearts, Value: entity.Ace}},
				twoValidHands()[1],
			},
			wantErr: true,
		},
		{
			name: "duplicate card across hands",
			hands: [][]entity.Card{
				twoValidHands()[0],
				{
					{Suit: entity.Hearts, Value: entity.Ace}, // dup of seat 0
					{Suit: entity.Clubs, Value: entity.Seven},
					{Suit: entity.Clubs, Value: entity.Eight},
					{Suit: entity.Clubs, Value: entity.Nine},
					{Suit: entity.Clubs, Value: entity.Ten},
				},
			},
			wantErr: true,
		},
		{
			name: "invalid card (ace of spades)",
			hands: [][]entity.Card{
				{
					{Suit: entity.Spades, Value: entity.Ace}, // not in Spar deck
					{Suit: entity.Hearts, Value: entity.King},
					{Suit: entity.Hearts, Value: entity.Queen},
					{Suit: entity.Hearts, Value: entity.Jack},
					{Suit: entity.Hearts, Value: entity.Ten},
				},
				twoValidHands()[1],
			},
			wantErr: true,
		},
		{"leader out of range", twoValidHands(), 5, true},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			err := setInjectedScenario("ROOM"+tc.name, &injectedScenario{
				name:        tc.name,
				leaderIndex: tc.leader,
				hands:       tc.hands,
			})
			if tc.wantErr && err == nil {
				t.Fatalf("expected error, got nil")
			}
			if !tc.wantErr && err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
		})
	}
}

// TestBuildFreshGameUsesInjectedHands proves the deterministic path: with test
// mode on and a scenario pinned, buildFreshGame deals the exact injected hands
// and seats the specified opening leader.
func TestBuildFreshGameUsesInjectedHands(t *testing.T) {
	withTestMode(t)

	roomCode := "ROOMINJ"
	if err := setInjectedScenario(roomCode, &injectedScenario{
		name:        "smoke",
		leaderIndex: 1,
		hands:       twoValidHands(),
	}); err != nil {
		t.Fatalf("setInjectedScenario: %v", err)
	}

	seeds := []playerSeed{
		{ID: "p0", Username: "P0"},
		{ID: "p1", Username: "P1"},
	}
	gs, err := buildFreshGame(roomCode, 10, seeds)
	if err != nil {
		t.Fatalf("buildFreshGame: %v", err)
	}

	// Seat 0 got the hearts hand, seat 1 got the clubs hand.
	if got := gs.Players[0].Hand[0]; got.Suit != entity.Hearts || got.Value != entity.Ace {
		t.Fatalf("seat 0 first card = %s, want ace of hearts", got.String())
	}
	if got := gs.Players[1].Hand[0]; got.Suit != entity.Clubs || got.Value != entity.Six {
		t.Fatalf("seat 1 first card = %s, want 6 of clubs", got.String())
	}
	// Opening leader is seat 1 as pinned.
	if gs.LeaderID != "p1" {
		t.Fatalf("leader = %q, want p1", gs.LeaderID)
	}
	if !gs.Players[1].IsLeader {
		t.Fatal("seat 1 must be marked leader")
	}
}

// TestBuildFreshGameSeatMismatchFallsBack ensures a scenario whose seat count
// does not match the actual players is ignored (random deck) rather than
// crashing or dealing a short game.
func TestBuildFreshGameSeatMismatchFallsBack(t *testing.T) {
	withTestMode(t)

	roomCode := "ROOMMISS"
	if err := setInjectedScenario(roomCode, &injectedScenario{
		name:        "two-seat",
		leaderIndex: 0,
		hands:       twoValidHands(),
	}); err != nil {
		t.Fatalf("setInjectedScenario: %v", err)
	}

	// Three players but a two-seat scenario: must fall back to a full deal.
	seeds := []playerSeed{
		{ID: "p0"}, {ID: "p1"}, {ID: "p2"},
	}
	gs, err := buildFreshGame(roomCode, 10, seeds)
	if err != nil {
		t.Fatalf("buildFreshGame: %v", err)
	}
	for i, p := range gs.Players {
		if len(p.Hand) != 5 {
			t.Fatalf("seat %d dealt %d cards, want 5", i, len(p.Hand))
		}
	}
}

func TestHandleTestInjectGating(t *testing.T) {
	body := testInjectRequest{
		RoomCode: "ROOMHTTP",
		Scenario: "smoke",
		Hands: [][]testInjectCard{
			{{Suit: "hearts", Rank: "A"}, {Suit: "hearts", Rank: "K"}, {Suit: "hearts", Rank: "Q"}, {Suit: "hearts", Rank: "J"}, {Suit: "hearts", Value: "10"}},
			{{Suit: "clubs", Value: "6"}, {Suit: "clubs", Value: "7"}, {Suit: "clubs", Value: "8"}, {Suit: "clubs", Value: "9"}, {Suit: "clubs", Value: "10"}},
		},
	}
	raw, _ := json.Marshal(body)

	// With test mode OFF, the endpoint must refuse.
	req := httptest.NewRequest(http.MethodPost, "/test/inject-hands", bytes.NewReader(raw))
	rec := httptest.NewRecorder()
	HandleTestInject(rec, req)
	if rec.Code != http.StatusForbidden {
		t.Fatalf("test mode off: status = %d, want 403", rec.Code)
	}

	// With test mode ON, the same request succeeds and the scenario is stored
	// (mapping frontend ranks to backend values along the way).
	withTestMode(t)
	req = httptest.NewRequest(http.MethodPost, "/test/inject-hands", bytes.NewReader(raw))
	rec = httptest.NewRecorder()
	HandleTestInject(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("test mode on: status = %d body=%s, want 200", rec.Code, rec.Body.String())
	}

	hands, leader, ok := injectedHandsFor("ROOMHTTP", 2)
	if !ok {
		t.Fatal("scenario not stored after HTTP inject")
	}
	if leader < 0 {
		t.Fatalf("leader should be resolved to a concrete seat, got %d", leader)
	}
	// Frontend rank "A" must have mapped to backend value "ace".
	if hands[0][0].Value != entity.Ace {
		t.Fatalf("seat0 card0 value = %q, want ace (rank mapping)", hands[0][0].Value)
	}
}
