# 17 — Integrate-and-verify and cutover

**What to build:** The rebuilt scene passes the full acceptance proof in real browsers and becomes the default, with the old scene removed. This is the gate where the scene-rebuild integration branch merges to `main` green.

**Blocked by:** 02, 04, 05, 06, 07, 08, 09, 10, 11, 14, 15, 16

**Status:** ready-for-agent

- [ ] Playwright acceptance runs A–H pass on the new scene: clean full 2-player game (A), correct flag (B), wrong flag (C), timer-expiry auto-play (D), dry (E), show-dry (F), fire+freeze (G), 3-player smoke (H)
- [ ] Human EK-feel pass reviewed against the `06` prototype at the key beats (screenshots/recordings)
- [ ] Green bar: zero tsc/build errors, zero lint warnings, green vitest + `go test ./...`, clean `go vet`
- [ ] The new scene is the default; the old `GameScene` + its aspirational tests are deleted
- [ ] The integration branch merges to `main` green (no red on `main`)
