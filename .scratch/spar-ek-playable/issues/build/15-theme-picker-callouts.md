# 15 — Theme picker and comic-callout config

**What to build:** Players can switch the table palette (Warm Heritage / Comic / Neon) in settings, and the comic callout words + triggers are driven by a designer-authored config.

**Blocked by:** 13

**Status:** ready-for-agent
_Integration-branch ticket. May be red in isolation on the branch; green is promised at 17._

- [ ] Settings palette picker: Warm Heritage (default), Comic, Neon — built on the existing theme store; persists; applies to chrome / borders / card back / callouts
- [ ] Card faces stay palette-agnostic (only the surroundings reskin)
- [ ] A data-driven, designer-authored callout config maps game events → callout word(s) + style + trigger, editable without code changes
- [ ] Callouts fire on their configured events (e.g. big play → "POW!", flag → "BUSTED!", win → "BOOM!")
