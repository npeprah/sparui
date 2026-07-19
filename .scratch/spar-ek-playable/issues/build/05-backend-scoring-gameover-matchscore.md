# 05 — Backend: value scoring, game-over, match-score persistence, play-again

**What to build:** The backend scores final-round wins by card value, ends the game on the 5th round, keeps a cumulative match score that persists across games, and restarts cleanly on play-again.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] The winner of the 5th and final round wins the game
- [ ] Final-round win scored by card value: 6→3, 7→2, 8+→1
- [ ] A cumulative match score persists across games in a room
- [ ] Play-again deals a fresh game for the whole room without re-lobbying; state stays consistent
- [ ] Invented per-round point bonuses (not in the ruleset) removed; `GetWinningPlayer` returns the highest scorer, not the leader
- [ ] Table-driven tests
