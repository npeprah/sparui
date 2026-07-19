# Does the backend implement the core PRD rules correctly?

Type: research
Status: resolved
Blocked by: none

## Question

Audit `backend/service/game-server/` against `PRD.md` §2 (the rules authority) and
report, rule by rule, whether the backend implements it correctly, incorrectly, or not
at all. Run `go test ./...` in `backend/` and report the results.

Checklist from PRD §2:

- 35-card deck: 6–A of hearts/clubs/diamonds, 6–K of spades (no ace of spades)
  (`entity/deck.go`).
- Deal: 5 cards per player; random leader first game, winner leads subsequent games.
- Round flow: leader plays any card; highest card of led suit wins the round; winner
  leads next round.
- Follow-suit expectation with freedom to off-suit (strategic choice, not forced) and
  the flag/challenge mechanic: correct flag → flagged player −3, round ends; incorrect
  flag → challenger −3, round ends (`challenge_handler.go`).
- No-suit disqualification from winning a round; leader-wins-by-default when nobody has
  the led suit.
- Scoring: winner of the 5th/final round wins the game; 3 pts with 6, 2 with 7, 1 with
  8+ (`score_manager.go`).
- Dry / Show Dry: one declaration per game of a 6 or 7 at game start; dry 6→6 pts,
  dry 7→4 pts; show-dry 6→12 pts, show-dry 7→8 pts, only when winning the final round
  with the declared card (`dry_card_handler.go`).
- Turn timers: leader 15s, first follower 8s, subsequent 5s (`timer_manager.go`).
- Fire streak: 3 consecutive round wins as leader → 4th-round card "on fire"; freeze
  counter when the streak breaks (`win_streak_handler.go`).
- Play-again / game restart flow (`game_over_handler.go`).
- 2–4 players supported.

Also flag the `go vet` self-assignment at `dry_card_handler.go:115` and whether it
indicates a real bug. Do not fix anything. Report rule-by-rule verdicts with
file:line references.

## Resolution

Audited (fresh-eyes subagent, read-only). **Headline: the backend is NOT currently a
trustworthy rules authority.** There are two effectively separate implementations that
disagree with each other and the PRD:

1. A well-tested **library layer** (`ScoreManager`, `DryCardHandler`, `ChallengeHandler`,
   `WinStreakHandler`, `Engine`) that implements some rules correctly but invents scoring
   the PRD never mentions.
2. The **actual runtime path** (`controller/websocket/websocket.go`) - what a real player
   hits - which bypasses almost all of the library layer.

Scorecard vs the 11-point checklist: **3 correct, 6 incorrect, 2 missing.**
`go test ./...`: 3 packages pass (`controller/game`, `matchmaking`, `room`), **3 FAIL**
(`controller/websocket`, `entity`, `controller/stats`). `go vet`: 1 finding
(`dry_card_handler.go:115`, harmless no-op self-assignment - timestamp never updates).

Rule-by-rule (file:line):

- **Deck composition - INCORRECT.** `entity/deck.go:43-46` builds spades as `{Seven..Ace}`
  - excludes the 6, includes the Ace: the exact inverse of the PRD. `Validate()`
  (`deck.go:127`) enforces the same wrong composition.
- **Random first leader - INCORRECT.** `websocket.go:1448` `IsLeader: i == 0` and `:1467`
  - first player is always leader; restart re-seats first player, not prior winner
  (`:1339`). (Deal of 5 correct `deck.go:72`; winner-leads-next correct `:685`.)
- **Round flow / highest led suit wins - CORRECT.** `websocket.go:711-751`,
  `game_engine.go:387-448`.
- **Follow-suit FREEDOM + flag - INCORRECT (core violation).** Live path *forces*
  follow-suit and rejects off-suit plays: `websocket.go:491-501` ("Must follow suit").
  Kills the Freedom rule and makes flagging pointless. `ChallengeHandler` models freedom
  but scoring is wrong (+10/-5 constants `challenge_handler.go:18,21`; valid flag zeroes
  score `:417` instead of -3) AND is not wired in - `handleFlagPlayer` is a placeholder
  (`websocket.go:945-957`).
- **No-suit DQ / leader-wins-by-default - CORRECT.** `websocket.go:728-734`.
- **Value scoring (6→3/7→2/8+→1) - MISSING.** Does not exist anywhere. Live path only
  counts tricks (`winner.RoundsWon++` `websocket.go:616`); winning-card value never read.
- **Dry / Show Dry - INCORRECT/MISSING.** Bonus values correct (`entity/game.go:166-185`)
  but "win final round with declared card" condition never checked
  (`game_over_handler.go:122-124` grants unconditionally); live game skips the declaring
  phase (`websocket.go:1465`); `handleDeclareDry` is a placeholder (`:843-859`). Dry never
  actually scores in a real game.
- **Turn timers 15/8/5 - CORRECT.** `timer_manager.go:196-204` (minor: init hardcodes 30
  at `websocket.go:1474` before first turn corrects it).
- **Fire streak - INCORRECT (resolves the 3-vs-4 ambiguity).** PRD §2.6 = win 3
  consecutive → 4th card on fire. Code uses `FireStreakThreshold = 2`
  (`win_streak_handler.go:19`), ignites at `WinStreak >= 2` (`:166`) - one round early.
  Entity comment says "3+" (`entity/game.go:210`) while code checks 2. Freeze only fires
  when broken streak `>= 3` (`:22,115`) - internally inconsistent. Also the +5/round fire
  and +10 freeze **point bonuses are code inventions not in PRD §2.**
- **Play-again - CORRECT (caveat: re-seats first player as leader, not prior winner).**
- **2-4 players - CORRECT.** `deck.go:69-71`.

Extra scoring bug found: `GameState.GetWinningPlayer()` (`entity/game.go:421-427`) returns
`GetLeader()` instead of the highest scorer (fails `entity` test).

**Implication for the spec:** the spec's "backend stays authoritative / PRD §2 governs"
assumption is currently FALSE in the shipped websocket path. The rules-correctness work is
substantial and belongs on the build map, not just "wire up the frontend."
