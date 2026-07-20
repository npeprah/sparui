# 20 — Fix hover scale bug + replicate Variant B animations exactly

**What to build:** The hover behavior and all motion beats match prototype Variant B exactly.

**Blocked by:** 19 (merged)  **Status:** ready-for-agent

## Bugs / deltas
- [ ] HOVER BUG: hovering a hand card scales it HUGE (fills the screen). Prototype hover =
      subtle lift only: `.card.playable:hover { transform: translateY(-18px); z-index: 50 }`
      + gold inset ring `.card.playable:hover::after { box-shadow: inset 0 0 0 4px #FFD700 }`.
      NO scale-up. Fix so hover just lifts the card ~18-22px and shows the gold ring.
- [ ] Animations replicate the prototype beats EXACTLY (test in motion, not just static):
      DEAL (fly-in from top-center deck, 90ms stagger, --bounce overshoot),
      PLAY (fly to pile, --bounce-hard overshoot, small spin, scale 1.06->1, POW!/BAM!/WHAP! burst),
      ROUND WIN (speech-bubble banner pop + confetti; winner-perspective only),
      FIRE (card wiggle + flame glow + rising sparks),
      FLAG (accused's card-backs flip to faces + CAUGHT YOU! banner).
- [ ] Verify by capturing motion frames and comparing to scratchpad/proto-B-anim/ + the prototype.

Reference: prototype `.scratch/spar-ek-playable/prototypes/06-ek-table/index.html` (variant B JS
beats: hover via `--hover-tf`/`layoutHand` cfg B hover=-22, beatDeal/beatPlay/beatWin/beatFire/
beatFlag, powBurst/confetti/fireSparks); frames in scratchpad/proto-B-anim/{hover,deal-*,play-*}.png.
