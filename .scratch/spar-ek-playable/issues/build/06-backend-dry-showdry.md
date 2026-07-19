# 06 — Backend: dry / show-dry declarations and scoring

**What to build:** A player may declare one 6 or 7 as dry (face-down) or show-dry (face-up) at game start, or skip; the bonus scores only when they win the final round with the declared card.

**Blocked by:** 03, 05

**Status:** ready-for-agent

- [ ] A declaring phase exists at game start; one declaration per game; only a 6 or 7; skippable
- [ ] Dry: 6→6 pts, 7→4 pts. Show-dry: 6→12 pts, 7→8 pts
- [ ] The bonus applies **only** when the player wins the final round with the declared card, and replaces the base score
- [ ] Declared-card state exposed for the UI (face-down for dry, face-up for show-dry)
- [ ] Declaration handler wired (no longer a stub); table-driven tests including the "must win final round with it" condition
