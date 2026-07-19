# What is the e2e acceptance script?

Type: grilling
Status: resolved
Blocked by: none

## Question

Define the exact list of scenarios that must pass in a real browser with ≥2 players
for the game to be called "playable" — the finish-line proof for the destination.

Candidate scenarios to react to (from PRD §2 and the destination): room create/join,
ready/start, deal 5 cards each, leader plays, follow-suit play, off-suit play, round
win + correct winner leads, timers visibly counting down, dry/show-dry declaration,
flag/challenge both directions, fire-streak trigger + freeze counter, final-round
scoring (6→3 / 7→2 / 8+→1, dry bonuses), game over screen, play-again for both
players. Which of these are must-pass, in what order, and what (if anything) is
nice-to-have? Also: does the script need to pass for 3–4 players too, or is 2-player
proof sufficient for the destination?

## Resolution

Resolved via /grilling (HITL). This grilling also surfaced several **rule
clarifications** from the game owner that correct the backend audit (02) - captured in the
map's "Decisions so far" and summarized under "Rules pinned" below.

### Acceptance-script scope decisions

- **Bar = full ruleset.** Every signature mechanic (dry/show-dry, flagging both
  directions, fire streak + freeze, final-round value scoring) must work in-browser - not
  just the core trick loop. It's what makes it Spar.
- **Coverage = 2-player full + one 3-player smoke.** Full script must pass at 2 players;
  a reduced 3-player smoke exercises the "subsequent follower 5s" timer tier and
  multi-opponent hand rendering. 4-player not required to declare victory.
- **Pass = functional automated gate + human visual pass.** The script asserts functional
  outcomes (state, scores, events, turn flow) + cheap state-driven visual facts (fire
  state visible, dry card set aside, flag reveal shown). Subjective EK "feel" (motion,
  juice, audio) is judged by a human reviewing screenshots/recordings at key beats against
  the 06 prototype - NOT scripted pass/fail.
- **Reconnect = out of scope** (nice-to-have). Auto-play-on-expiry already lets a game
  finish if someone drops, so the finish line isn't gated on reconnect-and-resume.

### The script (a SET of targeted runs - flags void the game mid-way, so they can't
### share the clean-game run)

**Run A - clean full 2-player game (the spine):**
1. Create private room → shareable code; 2nd player joins by code; both see each other +
   ready state.
2. Both ready → host starts (blocked with <2 players).
3. Deal 5 each; a leader is designated - only the leader can open (a follower playing
   before the leader is rejected, harmlessly).
4. Leader plays → led suit set. After that either follower may play at any time; the timer
   walks the sequence (first follower 8s, subsequent 5s) and only pressures the on-deck
   seat.
5. Follow-suit freedom: a player breaks suit while holding the led suit and the system
   ALLOWS it (no rejection); no one flags, so play continues.
6. Highest led-suit card wins the round; winner leads next.
7. Reach round 5; value scoring applied (6→3, 7→2, 8+→1); game-over screen shows winner +
   winning card + points.
8. Play again deals a fresh game with no re-lobby; cumulative match score persists and is
   visible.

**Run B - correct flag:** a real illegal move (off-suit while holding led suit) is flagged
→ offender -3 on match score → current game voided, reshuffle, fresh game starts.

**Run C - wrong flag:** an off-suit play where the accused did NOT hold the suit is flagged
→ challenger -3 → game voided symmetrically.

**Run D - timer expiry:** on-deck player idles → system auto-plays their lowest led-suit
card if held, else lowest card; sequence advances. Leader idle → auto-plays lowest to set
suit. Game never stalls.

**Run E - dry:** declare a 6 or 7 face-down at game start (optional/skippable) → win the
final round with it → bonus (6→6, 7→4) REPLACES base score; declared card shown set aside
(face-down back).

**Run F - show-dry:** declare face-up → double bonus (6→12, 7→8); card set aside face-up.

**Run G - fire streak + freeze:** same leader wins 3 consecutive rounds → 4th-round card
renders on fire; an opponent breaking the streak triggers the freeze counter.

**Run H - 3-player smoke (reduced):** 3 players join → deal → a few rounds exercising the
subsequent-follower 5s timer + multi-opponent hand rendering → reach game over.

**Human visual pass (not scripted):** at key beats - deal, play→overshoot to pile,
round-win banner, fire, freeze, flag reveal, game-over - a human confirms EK feel vs the
06 prototype.

### Hands off to ticket 05 (harness)

Runs E/F/G and forcing a specific led suit for the flag runs require **engineering
specific hands** - so the harness needs **deterministic/seedable deals** (fixed deck order
or a test hook to set hands). Carry this constraint into 05.

### Rules pinned during this grilling (authoritative - correct PRD/code where they differ)

1. **Off-suit is NOT system-rejected.** A player may break suit while holding the led suit;
   it is policed only by flagging. → Backend's forced follow-suit (`websocket.go:491-501`)
   is a confirmed BUG to remove.
2. **"Illegal move" = playing a wrong suit while holding the led suit.**
3. **Turn order = whose TIMER runs, not who may play.** Only the leader opens (pre-leader
   plays rejected, harmless). After the leader, anyone may play at any time; a timer walks
   the clockwise sequence (first follower 8s, subsequent 5s), pressuring only the on-deck
   seat. → Backend's strict turn-order enforcement is a confirmed BUG to loosen.
4. **Correct flag:** offender -3 on the CUMULATIVE MATCH score; the whole current
   (5-round) game is VOIDED, deck reshuffled, a fresh game starts. Match score persists.
   (Diverges from PRD, which only ends the round.)
5. **Wrong flag:** symmetric - challenger -3, game voided the same way.
6. **Timer expiry:** auto-play the player's lowest led-suit card if held, else lowest card;
   leader auto-plays lowest to set the suit. Guarantees progress; makes reconnect
   non-essential.
7. **Fire streak = 3 consecutive round wins as leader → 4th-round card on fire**; freeze
   counter when an opponent breaks it. (Settles the 2-vs-3-vs-4 contradiction: code=2 and
   CLAUDE.md=4 are both wrong; PRD's 3→4th is authoritative.)
