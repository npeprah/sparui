# 12 — Extend CardSprite for the EK look

**What to build:** `CardSprite` gains the Exploding-Kittens look — a chunky ink-outline border, per-theme (gold/comic/neon) treatment, and hooks for fire/freeze/dry state overlays — while keeping its existing state, animation, and drag behavior.

**Blocked by:** 01

**Status:** ready-for-agent
_Integration-branch ticket (part of the scene rebuild). May be red in isolation on the branch; green is promised at 17._

- [ ] Chunky ink-outline border + comic framing rendered on the sprite
- [ ] Per-theme treatment (gold / comic / neon) that switches with the active theme
- [ ] Hooks/slots for fire, freeze, and dry state overlays (rendered in 16)
- [ ] Existing state machine, animations, and drag/hover behavior preserved (refactor only methods that fight the change)
