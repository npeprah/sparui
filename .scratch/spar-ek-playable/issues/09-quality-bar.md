# What is the quality bar for "playable"?

Type: grilling
Status: resolved
Blocked by: none

## Question

Decide what must be green, beyond the e2e acceptance script, before the destination is
considered reached.

Candidates: `npm run build` (tsc) passing with zero errors; `npm run lint` passing at
zero warnings (repo convention); vitest suite green; backend `go test ./...` green;
`go vet` clean. Recommendation to react to: all of the above — a playable game on a
red build is a fragile base, and the lint/test conventions already exist in the repo.
Also decide whether new code written for the redesign must come with tests (the repo
has test files for scenes/sprites/utils — match that convention?).

## Resolution

Resolved via /grilling (HITL).

### The green bar - ALL must pass to declare "playable", AND each build ticket must land
### green (no slice merges red; not just the final destination state)

- `npm run build` (`tsc && vite build`) - **zero errors** (currently 40).
- `npm run lint` (`eslint --max-warnings 0`) - **zero warnings** (currently 256 problems).
- `vitest` - **green** (currently 92 failing / 10 files).
- backend `go test ./...` - **green** (currently 3 packages failing).
- `go vet ./...` - **clean** (currently 1 finding).
- the 05 e2e acceptance runs (A-H) pass + the human EK-feel pass at release points.

### Reaching green from today's red: triage each failure (do NOT "make everything pass")

A test is authoritative only if it reflects a decision actually made. So:
- correct-but-regressed tests (e.g. backend follow-suit tests that already encode the
  right off-suit rule) → **fix the code**;
- tests for dead code being purged (duplicate `SettingsModal`, `particleManager`) →
  **delete with the code**;
- tests asserting old/wrong behavior (forced follow-suit, fire-streak=2) → **rewrite to
  the pinned rules**;
- speculative tests for out-of-scope features → **delete** (don't let a stale test set
  scope).

### New-code testing convention: yes, at the established seams, behavior-focused

- backend rules/engine → **table-driven unit tests** (match existing
  challenge/dry/score/streak style);
- frontend store + util logic → **vitest**;
- Phaser canvas rendering → **NOT unit-tested** - covered by the 05 e2e proof + human
  feel-pass (pixel rendering is brittle + low-value to unit-test);
- tests assert external behavior (events, state transitions, scores), not implementation
  details. `/implement` → `/tdd` is the *how* per slice; this is the *what*.

### Coverage: NO numeric coverage-% gate

A percentage target invites low-value tests written to hit a number. Require meaningful
behavior tests at the seams instead. `test:coverage` stays a diagnostic, not a gate.
