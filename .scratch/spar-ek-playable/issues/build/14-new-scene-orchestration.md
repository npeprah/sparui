# 14 — New-scene turn/round + play-again orchestration

**What to build:** The new scene drives the game against the corrected rules — leader-opens / anyone-after, the timer sequence, off-suit freedom, dry/flag UI controls, and a clean play-again — reading authoritative state from the backend.

**Blocked by:** 13, 02

**Status:** ready-for-agent
_Integration-branch ticket. May be red in isolation on the branch; green is promised at 17._

- [ ] Leader opens; followers can play any time after; the on-deck timer ring reflects the server-streamed timer
- [ ] Off-suit plays are playable (no client-side rejection); the auto-play-on-any-click hack removed and proper turn affordances added
- [ ] Dry / show-dry declaration controls and the flag control are wired to the aligned contract
- [ ] Clean play-again (no fragile multi-step teardown); the listener-attach race and stale-streak reads are fixed
- [ ] Opponent plays render correctly (including their card-back fans shrinking as they play)
