# How do we source the cartoon audio?

Type: grilling
Status: resolved
Blocked by: none

## Question

Decide the sourcing path for the cartoon-style audio the destination calls for —
playful SFX (deal, play, win, streak, freeze) plus a Mortal-Kombat-"toasty"-style
easter-egg sound byte and the NBA-Jam-style fire-streak sting.

Context: the repo has an audio system already (`frontend/` AUDIO_*.md notes,
`scripts/generate_placeholder_sounds.py`, `frontend/public/assets/sounds/`) — first
establish what exists and works (the current-state audit, ticket 01, may inform this),
then decide: generate placeholders, source licensed packs (which?), or record/synthesize
custom stingers. Note the "toasty" byte itself is trademark-adjacent — decide whether
an original soundalike is required.

## Resolution

Resolved via /grilling (HITL). Established facts first: **16 placeholder SFX already exist
and are fully wired** (`audioManager.ts` loads them by key: card deal/play/flip/hover/
shuffle/collect, round win/loss, game victory/defeat, dry + show-dry declaration,
fire_streak, freeze_effect, invalid_move, phase_transition). But they are **synthetic
placeholders** (`generate_placeholder_sounds.py`: "TEMPORARY... must be replaced"). **No
music, no announcer voice lines** (both dirs empty). No toasty byte exists. There is an
`AUDIO_SOURCING_GUIDE.md` + `AUDIO_MANIFEST.json`/`AUDIO_CREDITS.md` scaffold
(`total_assets: 0`).

### Decisions

- **Quality bar: replace placeholders with real, license-clean cartoon SFX** on the
  signature moments (deal, play, round win/loss, fire streak, freeze, dry/show-dry, game
  victory/defeat, toasty). Wiring already exists, so it's largely a **file-swap at the same
  asset paths/keys**, not new plumbing. (Rejected: shipping synthetic beeps - fails the
  destination's "sounds as fun as it looks" bar; and full studio production - over-scoped.)
- **Sourcing path: ALL licensed free packs** - CC0 / Pixabay / Freesound-CC0, commercial-
  use safe. Every asset logged in `AUDIO_MANIFEST.json` + `AUDIO_CREDITS.md`. (Rejected:
  all-AI, custom-recorded, or the licensed+custom mix - owner chose pure licensed packs.)
- **Toasty easter egg + NBA-Jam "on fire!" beat: original soundalikes that EVOKE, not
  copy.** Never the Mortal Kombat / NBA Jam samples or their exact trademarked deliveries;
  each pack clip vetted that it isn't a disguised rip. (Commercial-use IP safety.)
- **Background music: OUT of scope** (nice-to-have; separate curation/licensing/looping
  effort; nothing references music today so no wiring debt).
- **Broader announcer system: OUT of scope** - only the toasty + fire stingers; no
  contextual callout system (turn/round/taunt) for "playable".
- Judged by the 04 human EK-feel pass at release points.

### Small follow-ups folded in

- **`invalid_move` placeholder needs repurposing:** per the 04 rules, off-suit plays are
  NOT rejected, so the only "rejection" event is a **pre-leader play**. Repurpose the sound
  for that, or drop it - not a new asset.
- **Format:** `audioManager` loads `.wav`; licensed packs are often `.mp3`/`.ogg` - a
  format-consistency detail for the build ticket (keep `.wav` or switch uniformly), not a
  decision here.

### Graduates to build work

Source + license-vet + swap the ~16 signature SFX; create/source the original toasty + fire
soundalikes; populate `AUDIO_MANIFEST.json`/`AUDIO_CREDITS.md`. Music + announcer explicitly
deferred.
