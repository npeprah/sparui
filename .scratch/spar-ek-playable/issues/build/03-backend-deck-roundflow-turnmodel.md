# 03 — Backend: correct deck, round flow, off-suit freedom, and turn model

**What to build:** The authoritative backend plays a correct Spar round — correct deck, a designated leader who alone opens, followers free to play any card at any time after the leader (off-suit is NOT rejected), highest led-suit card wins, correct default/disqualification rules, and a random first leader.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Deck = 6–A hearts/clubs/diamonds + 6–K spades, **no ace of spades** (fixes the inverted composition)
- [ ] 5 cards dealt per player; 2–4 players supported
- [ ] Random leader for the first game; the round winner leads the next round
- [ ] Only the leader can open a round; a follower playing before the leader is rejected harmlessly
- [ ] **Off-suit play accepted even when the player holds the led suit** (forced follow-suit removed)
- [ ] Highest card of the led suit wins; a player without the led suit cannot win; leader wins by default if no one follows suit
- [ ] Table-driven unit tests cover all of the above; the existing follow-suit tests pass by fixing the code (not the tests)
