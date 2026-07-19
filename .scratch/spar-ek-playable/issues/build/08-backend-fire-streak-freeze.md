# 08 — Backend: fire streak and freeze counter

**What to build:** Winning 3 consecutive rounds as leader marks the 4th-round card "on fire"; breaking an opponent's streak triggers the freeze counter. The state is exposed for the UI to render.

**Blocked by:** 03, 05

**Status:** ready-for-agent

- [ ] Fire ignites after 3 consecutive round wins as leader, on the 4th round's card (threshold corrected from the current 2)
- [ ] Freeze counter triggers when a fire streak is broken by an opponent
- [ ] Invented fire/freeze point bonuses removed (state/visual only, unless the ruleset says otherwise)
- [ ] Card fire/freeze state exposed for the client to render
- [ ] Table-driven tests for the 3→4th threshold and the freeze-on-break
