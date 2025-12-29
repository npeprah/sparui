# P0 Audio Assets - Immediate Action Plan

**Created:** December 19, 2025
**Priority:** P0 - Critical MVP Blockers
**Estimated Time:** 5-8 hours total
**Status:** Ready to Execute

---

## Overview

This document provides concrete next steps for sourcing and creating the P0 audio assets (TASK-AUDIO-001 and TASK-AUDIO-003). These 16 sounds are critical for MVP and must be completed before frontend audio integration.

---

## Execution Strategy

### Option A: User Creates Assets (Recommended)

**Best for:** Users with access to AI audio tools or willing to search sound libraries

**Steps:**
1. Follow the AUDIO_SOURCING_GUIDE.md step-by-step
2. Use Freesound.org for free CC0 sounds
3. Use Stable Audio Open (free) for AI generation
4. Edit in Audacity (free)
5. Deliver files to `/frontend/public/assets/sounds/`

**Pros:** Full control, highest quality, learns audio workflow
**Cons:** Requires time investment (5-8 hours)

### Option B: audio-designer Agent Guides User (Interactive)

**Best for:** Users who want real-time guidance through the process

**Process:**
1. User shares screen or describes search results
2. Agent evaluates licensing and quality
3. Agent provides specific editing instructions
4. Agent validates final outputs

**Pros:** Supervised quality, licensing verification
**Cons:** Requires back-and-forth collaboration

### Option C: Temporary Placeholder Assets (Fast MVP)

**Best for:** Immediate testing, can replace later with proper assets

**Process:**
1. Use ultra-simple synthesized sounds in Audacity
2. Generate basic tones/clicks for each sound
3. Document as "placeholder - must replace"
4. Focus on integration testing first

**Pros:** Fastest path to MVP testing (1-2 hours)
**Cons:** Not production-quality, must be replaced

---

## Immediate Action: Choose Your Path

### Path 1: User Creates Assets (Full Quality)

**Your Mission:** Create 16 P0 sounds following the sourcing guide

**Start Here:**
1. Read `/AUDIO_SOURCING_GUIDE.md` (comprehensive instructions)
2. Install Audacity: https://www.audacityteam.org/
3. Create Freesound.org account: https://freesound.org/
4. Start with TASK-AUDIO-001: Card Sounds (6 sounds)

**Time Estimate:**
- TASK-AUDIO-001 (Card Sounds): 2-4 hours
- TASK-AUDIO-003 (Game Events): 3-4 hours
- **Total: 5-8 hours**

**Deliverables:**
- 16 sounds x 2 formats = 32 files (OGG + MP3)
- Updated AUDIO_MANIFEST.json with licensing info
- Updated AUDIO_CREDITS.md with attributions

**When Done:**
- Place files in `/frontend/public/assets/sounds/sfx/`
- Update manifest and credits
- Test in game (use integration guide)

---

### Path 2: Guided Creation (Interactive Support)

**Your Mission:** Create assets with agent guidance

**Start Here:**
1. Choose a sound to start with (recommend: card_play - the signature sound)
2. Share your approach:
   - "I'm searching Freesound for card sounds"
   - "I want to try AI generation with Stable Audio"
   - "I'm synthesizing sounds in Audacity"
3. Agent will provide real-time feedback and next steps

**Process Per Sound:**
1. User searches/generates 3-5 candidates
2. User shares source/license info
3. Agent validates licensing for commercial use
4. User edits sound (with agent guidance)
5. User exports and documents
6. Repeat for next sound

**Time Estimate:**
- Slightly longer than Path 1 due to back-and-forth
- But higher confidence in licensing/quality
- **Total: 6-10 hours**

---

### Path 3: Placeholder Assets (Fast MVP)

**Your Mission:** Create basic placeholder sounds for immediate testing

**Start Here:**
1. Install Audacity
2. Follow quick synthesis guide below
3. Document as "PLACEHOLDER - REPLACE BEFORE PRODUCTION"

**Quick Synthesis Guide:**

#### Card Sounds (6 placeholders - 30 minutes)

**card_shuffle.ogg:**
```
Audacity:
1. Generate > Noise (White Noise, 1.5 seconds, amplitude 0.3)
2. Effect > Low Pass Filter (cutoff 3000 Hz)
3. Effect > Fade In (200ms), Fade Out (300ms)
4. Export OGG + MP3
```

**card_deal.ogg:**
```
1. Generate > Tone (Sine, 400 Hz, 0.5 seconds, amplitude 0.4)
2. Effect > Sliding Stretch (pitch end 0.8)
3. Effect > Fade Out (150ms)
4. Export OGG + MP3
```

**card_flip.ogg:**
```
1. Generate > Tone (Sine, 600 Hz, 0.3 seconds, amplitude 0.5)
2. Effect > Change Pitch (-3 semitones)
3. Effect > Fade In (10ms), Fade Out (100ms)
4. Export OGG + MP3
```

**card_play.ogg:**
```
1. Generate > Tone (Sine, 300 Hz, 0.4 seconds, amplitude 0.6)
2. Effect > Bass and Treble (Bass +10 dB)
3. Effect > Fade Out (150ms)
4. Export OGG + MP3
```

**card_collect.ogg:**
```
1. Generate > Chirp (400 Hz to 800 Hz, 0.7 seconds, sine)
2. Effect > Fade In (50ms), Fade Out (200ms)
3. Export OGG + MP3
```

**card_hover.ogg:**
```
1. Generate > Tone (Sine, 523 Hz [C5], 0.15 seconds, amplitude 0.2)
2. Effect > Fade In (40ms), Fade Out (80ms)
3. Export OGG + MP3
```

#### Game Event Sounds (10 placeholders - 45 minutes)

**round_win.ogg:**
```
1. Generate > Chirp (300 Hz to 600 Hz, 1.2 seconds, sine)
2. Effect > Reverb (Room Size 50, Damping 50%)
3. Export OGG + MP3
```

**round_loss.ogg:**
```
1. Generate > Chirp (300 Hz to 150 Hz, 1.2 seconds, sine)
2. Effect > Fade Out (400ms)
3. Export OGG + MP3
```

**game_victory.ogg:**
```
1. Generate > Chirp (200 Hz to 800 Hz, 2.5 seconds, sine)
2. Effect > Reverb (Large Room)
3. Effect > Amplify (+6 dB)
4. Export OGG + MP3
```

**game_defeat.ogg:**
```
1. Generate > Tone (Sine, 150 Hz, 2.0 seconds, amplitude 0.6)
2. Effect > Fade In (300ms), Fade Out (800ms)
3. Export OGG + MP3
```

**dry_declaration.ogg:**
```
1. Generate > Tone (Square, 400 Hz, 0.8 seconds, amplitude 0.5)
2. Effect > Change Tempo (+20%)
3. Effect > Fade Out (200ms)
4. Export OGG + MP3
```

**show_dry_declaration.ogg:**
```
1. Generate > Tone (Square, 500 Hz, 1.0 seconds, amplitude 0.6)
2. Effect > Reverb (Large Hall, 40% wet)
3. Effect > Fade Out (400ms)
4. Export OGG + MP3
```

**fire_streak.ogg:**
```
1. Generate > Noise (Pink Noise, 1.5 seconds, amplitude 0.4)
2. Effect > High Pass Filter (cutoff 500 Hz)
3. Effect > Sliding Stretch (pitch end 1.5)
4. Export OGG + MP3 (mark as loopable)
```

**freeze_effect.ogg:**
```
1. Generate > Tone (Sine, 2000 Hz, 1.2 seconds, amplitude 0.5)
2. Effect > Sliding Stretch (pitch end 0.5)
3. Effect > Reverb (Large Hall, 60% wet)
4. Export OGG + MP3
```

**invalid_move.ogg:**
```
1. Generate > Tone (Sine, 300 Hz, 0.3 seconds, amplitude 0.4)
2. Effect > Sliding Stretch (pitch end 0.7)
3. Effect > Fade Out (100ms)
4. Export OGG + MP3
```

**phase_transition.ogg:**
```
1. Generate > Noise (White Noise, 1.0 seconds, amplitude 0.3)
2. Effect > Low Pass Filter (cutoff 2000 Hz)
3. Effect > Fade In (200ms), Fade Out (300ms)
4. Export OGG + MP3
```

**Time Estimate:** 1-2 hours for all 16 placeholder sounds

**Critical Note:** These are FUNCTIONAL PLACEHOLDERS only. They:
- Provide audio feedback for testing
- Allow integration work to proceed
- MUST be replaced with proper assets before production
- Should be documented clearly as temporary

**Placeholder Manifest Entry:**
```json
{
  "file_ogg": "card_play.ogg",
  "source": "Audacity synthesis",
  "license": "Custom placeholder",
  "commercial_use": false,
  "status": "TEMPORARY PLACEHOLDER - REPLACE BEFORE PRODUCTION",
  "replacement_priority": "HIGH"
}
```

---

## Recommended Approach: Path 1 with Path 3 Backup

**Strategy:**
1. **Week 1 (Now):** Create Path 3 placeholders (1-2 hours)
   - Allows immediate integration testing
   - Unblocks frontend development

2. **Week 2:** Replace with Path 1 quality assets (5-8 hours)
   - Search Freesound.org for best CC0 sounds
   - Use AI generation where needed
   - Professional editing and polish
   - Proper licensing documentation

**Benefits:**
- Frontend integration can start immediately
- No pressure - placeholder testing works
- Time to source/create quality assets properly
- Clear upgrade path to production-ready audio

---

## Success Criteria

Before marking P0 audio as "complete":

### For Placeholder Assets (Path 3)
- [ ] All 16 sounds created and functional
- [ ] Both OGG and MP3 formats exported
- [ ] Files in correct directories
- [ ] Sounds play correctly in test environment
- [ ] Clearly documented as placeholders
- [ ] Replacement plan documented

### For Production Assets (Path 1 or 2)
- [ ] All 16 sounds meet quality standards
- [ ] Licensing verified for commercial use
- [ ] Attribution documented (where required)
- [ ] File sizes within limits (<100KB SFX)
- [ ] Volume normalized to -12 LUFS
- [ ] Clean start/end (no clicks/pops)
- [ ] Tested in game context
- [ ] Not annoying after 20+ repetitions
- [ ] Cultural authenticity verified (Afrobeat elements where appropriate)
- [ ] AUDIO_MANIFEST.json updated
- [ ] AUDIO_CREDITS.md updated

---

## File Organization

When delivering assets, ensure proper structure:

```
/frontend/public/assets/sounds/
├── sfx/
│   ├── cards/
│   │   ├── card_shuffle.ogg
│   │   ├── card_shuffle.mp3
│   │   ├── card_deal.ogg
│   │   ├── card_deal.mp3
│   │   ├── card_flip.ogg
│   │   ├── card_flip.mp3
│   │   ├── card_play.ogg
│   │   ├── card_play.mp3
│   │   ├── card_collect.ogg
│   │   ├── card_collect.mp3
│   │   ├── card_hover.ogg
│   │   └── card_hover.mp3
│   └── game_events/
│       ├── round_win.ogg
│       ├── round_win.mp3
│       ├── round_loss.ogg
│       ├── round_loss.mp3
│       ├── game_victory.ogg
│       ├── game_victory.mp3
│       ├── game_defeat.ogg
│       ├── game_defeat.mp3
│       ├── dry_declaration.ogg
│       ├── dry_declaration.mp3
│       ├── show_dry_declaration.ogg
│       ├── show_dry_declaration.mp3
│       ├── fire_streak.ogg
│       ├── fire_streak.mp3
│       ├── freeze_effect.ogg
│       ├── freeze_effect.mp3
│       ├── invalid_move.ogg
│       ├── invalid_move.mp3
│       ├── phase_transition.ogg
│       └── phase_transition.mp3
```

---

## Next Steps Decision Matrix

| If you... | Then do... | Time Required |
|-----------|------------|---------------|
| Want production-quality audio now | Path 1: Follow sourcing guide | 5-8 hours |
| Want guidance and validation | Path 2: Interactive guided creation | 6-10 hours |
| Need to test integration ASAP | Path 3: Create placeholders | 1-2 hours |
| Want hybrid approach | Path 3 now, Path 1 later | 1-2 hrs + 5-8 hrs |

---

## Questions to Answer

1. **Do you have access to AI audio tools?**
   - Yes → Path 1 or 2 (can use AI generation)
   - No → Path 1 with Freesound only, or Path 3

2. **How urgent is audio integration?**
   - Very urgent → Path 3 (placeholders)
   - Can wait a week → Path 1 or 2 (quality assets)

3. **Do you want to learn audio workflow?**
   - Yes → Path 1 or 2 (valuable skill)
   - No → Path 3 (minimal time)

4. **Is cultural authenticity critical now?**
   - Yes → Path 1 or 2 only (proper Afrobeat elements)
   - Can come later → Path 3 now, upgrade later

---

## Ready to Start?

**Choose your path and let me know:**

- "I'll do Path 1 - guide me through sourcing quality assets"
- "I'll do Path 2 - let's create assets together with your guidance"
- "I'll do Path 3 - I need placeholders fast for testing"
- "I'll do Path 3 now, Path 1 later - hybrid approach"

**Or ask questions:**
- "How do I use Freesound.org?"
- "What's the easiest AI tool for this?"
- "Can you help me synthesize sounds in Audacity?"
- "How do I verify licensing for commercial use?"

I'm here to support whichever path you choose.

---

**Last Updated:** December 19, 2025
**Status:** Ready for user decision
**All documentation complete:** Planning ✅ Sourcing Guide ✅ Integration Guide ✅ Manifest ✅
