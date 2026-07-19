# 07 — Backend: flagging (both directions) and game void

**What to build:** Any player can flag a suspected illegal move; a correct flag costs the offender -3 and voids the whole game, a wrong flag costs the challenger -3 and voids the game symmetrically, the cumulative match score persists, and the flagged hand is revealed.

**Blocked by:** 03, 05

**Status:** ready-for-agent

- [ ] A flag resolves against the accused's actual holdings — illegal = playing a wrong suit while holding the led suit
- [ ] Correct flag: offender -3 on the cumulative match score; the whole current game is voided → reshuffle → fresh game starts
- [ ] Wrong flag: challenger -3; game voided the same way
- [ ] The flagged player's hand is revealed on resolution
- [ ] Flag handler wired (no longer a stub); the old challenge scoring (+10/-5, zeroing the score) replaced with the -3 rule
- [ ] Table-driven tests for both directions and match-score persistence across the void
