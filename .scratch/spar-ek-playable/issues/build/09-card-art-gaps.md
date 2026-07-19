# 09 — Card-art gaps and corrected 35-card wiring

**What to build:** The complete corrected 35-card set loads in the game, including the previously-missing 6 of spades and a designed card back that replaces the procedural one.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] `spades_6` generated via the existing AI card pipeline in the matching painterly style, compressed, and placed
- [ ] A single designed card-back illustration generated and wired in (replaces the procedural code-drawn back)
- [ ] The card asset loader expects the full **35** cards (not 34); the asset-path helper casing bug is fixed and its test passes
- [ ] No ace-of-spades asset is ever wired (matches the corrected deck)
