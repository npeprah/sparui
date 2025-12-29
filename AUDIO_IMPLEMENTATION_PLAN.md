# Spar Game - Audio Implementation Plan

**Created:** December 19, 2025
**Status:** P0 Tasks In Progress
**Audio Designer:** audio-designer agent
**Cultural Direction:** Afrobeat Arcade Energy

---

## Overview

This document outlines the complete audio implementation strategy for Spar, combining arcade-style energy with authentic Afrobeat/Afro-Heritage cultural elements. The audio system will enhance gameplay feedback, celebrate Ghanaian cultural identity, and create an immersive, energetic experience.

---

## Audio Identity: "Afro-Futurism Meets Arcade Mayhem"

### Design Pillars

1. **Arcade Energy**: Punchy, satisfying, immediate feedback (NBA Jam, Mortal Kombat inspiration)
2. **Afrobeat Soul**: Polyrhythmic percussion, djembe hits, shekere accents, talking drum elements
3. **Modern Production**: 808s, synth elements, contemporary African music production (Burna Boy, Wizkid)
4. **Non-Fatiguing**: Clean, professional sounds that remain pleasant after repeated play
5. **Cultural Authenticity**: Celebrate contemporary African music, avoid stereotypical "tribal" sounds

### Reference Audio

- **Arcade Classics**: NBA Jam (announcer energy), NFL Blitz (impact sounds), Mortal Kombat (dramatic stings)
- **Afrobeat Legends**: Fela Kuti (classic polyrhythms), Tony Allen (drumming patterns)
- **Modern Afrobeat**: Burna Boy, Wizkid, Davido (contemporary production)
- **Amapiano**: Log drums, percussive elements, energetic grooves
- **Mobile Games**: Clash Royale, Hearthstone (clean, satisfying SFX)

---

## Technical Specifications

### File Standards

| Property | Specification | Notes |
|----------|---------------|-------|
| **Primary Format** | OGG Vorbis | Web-optimized, better compression than MP3 |
| **Fallback Format** | MP3 (128kbps) | Browser compatibility fallback |
| **Sample Rate** | 44.1kHz | CD-quality standard |
| **Bit Depth** | 16-bit | Final assets (24-bit for editing only) |
| **Loudness Target** | -14 LUFS (music), -12 LUFS (SFX peaks) | Professional game audio standard |
| **File Size Limits** | <100KB (SFX), <150KB (climactic), <3MB (music loops) | Web performance |
| **Naming Convention** | `[category]_[name]_[variant].ogg` | e.g., `sfx_card_flip_01.ogg` |

### Directory Structure

```
/frontend/public/assets/audio/
├── sfx/                    # Sound effects
│   ├── cards/             # Card interaction sounds
│   ├── game_events/       # Round/game win/loss, declarations
│   ├── effects/           # Fire, freeze, explosions
│   └── ui/                # Button clicks, hovers, modals
├── music/                 # Background music tracks
│   ├── menu_theme.ogg
│   ├── lobby_theme.ogg
│   ├── gameplay_calm.ogg
│   ├── gameplay_intense.ogg
│   └── victory_sting.ogg
└── announcer/             # Voice lines
    ├── on_fire.ogg
    ├── ice_cold.ogg
    ├── show_dry.ogg
    └── denied.ogg
```

---

## Priority-Based Task Breakdown

### P0: Critical MVP Blockers (Must Have)

#### TASK-AUDIO-001: Core Card Sound Effects (2-4 hours)
**Status:** In Progress
**Deliverables:** 6 sounds (12 files with OGG + MP3)

| Sound | Duration | Description | Cultural Element |
|-------|----------|-------------|------------------|
| `card_shuffle.ogg` | 1-2 sec | Loopable shuffling sound | Shekere rattle undertone |
| `card_deal.ogg` | 0.5-1 sec | Single card deal/slide | Crisp snap with djembe accent |
| `card_flip.ogg` | 0.3-0.5 sec | Card flip/reveal | Quick percussive hit |
| `card_play.ogg` | 0.3-0.5 sec | Card played to table | Satisfying thud + talking drum |
| `card_collect.ogg` | 0.5-1 sec | Winning cards collected | Ascending tonal sequence |
| `card_hover.ogg` | 0.1-0.2 sec | Subtle hover feedback | Soft marimba/kalimba note |

**Implementation Notes:**
- All card sounds should have consistent volume (normalized to -12 LUFS peak)
- Hover sound must be extremely subtle (70% quieter than play sound)
- Play sound is the "signature" - most satisfying, punchy
- All sounds fade out naturally (no abrupt cuts)

---

#### TASK-AUDIO-003: Game Event Sound Effects (3-4 hours)
**Status:** Ready to Start
**Deliverables:** 10 sounds (20 files with OGG + MP3)

| Sound | Duration | Description | Cultural Element |
|-------|----------|-------------|------------------|
| `round_win.ogg` | 1-2 sec | Positive, celebratory | Djembe flourish + bell accent |
| `round_loss.ogg` | 1-2 sec | Negative, but not harsh | Low drum hit, descending tone |
| `game_victory.ogg` | 2-3 sec | Epic climax celebration | Full percussive ensemble + synth |
| `game_defeat.ogg` | 2-3 sec | Disappointed but dignified | Low bass drum, minor chord |
| `dry_declaration.ogg` | 1-2 sec | Confident announcement | Talking drum pattern |
| `show_dry_declaration.ogg` | 1-2 sec | Challenge/reveal moment | Sharp hit + reverb tail |
| `fire_streak.ogg` | 1-2 sec | Building intensity, loopable | Rising pitch, fast percussion |
| `freeze_effect.ogg` | 1-2 sec | Ice/freeze sound | Crystal hit + sub-bass drop |
| `invalid_move.ogg` | 0.3-0.5 sec | Error feedback (gentle) | Muted thud, non-punitive |
| `phase_transition.ogg` | 1-2 sec | Neutral scene change | Whoosh + marimba chord |

**Implementation Notes:**
- Victory/defeat sounds should be 20% louder than round win/loss (climactic emphasis)
- Fire streak should loop seamlessly for ongoing effects
- Freeze should have sub-bass component (felt on mobile vibration)
- Invalid move should be gentle (avoid player frustration)

---

### P1: High Priority (Should Have)

#### TASK-AUDIO-002: UI Sound Effects (2-3 hours)
**Status:** Not Started
**Deliverables:** 8 sounds (16 files)

| Sound | Duration | Description |
|-------|----------|-------------|
| `ui_button_click.ogg` | 0.1-0.2 sec | Primary button click |
| `ui_button_hover.ogg` | 0.1 sec | Button hover (very subtle) |
| `ui_modal_open.ogg` | 0.3-0.5 sec | Modal/dialog open |
| `ui_modal_close.ogg` | 0.3-0.5 sec | Modal/dialog close |
| `ui_error.ogg` | 0.5 sec | Error notification |
| `ui_success.ogg` | 0.5 sec | Success notification |
| `ui_timer_warning.ogg` | 0.5 sec | Timer < 10 seconds warning |
| `ui_timer_critical.ogg` | 0.3 sec | Timer < 3 seconds (loopable) |

---

#### TASK-AUDIO-004: Special Effect Sounds (3-4 hours)
**Status:** Not Started
**Deliverables:** 8 sounds (16 files)

| Sound | Duration | Description |
|-------|----------|-------------|
| `fire_ignite.ogg` | 0.5-1 sec | Fire effect start |
| `fire_loop.ogg` | 2 sec | Fire burning (seamless loop) |
| `ice_crack.ogg` | 0.5-1 sec | Initial freeze effect |
| `ice_shatter.ogg` | 0.5-1 sec | Ice breaking |
| `explosion_01.ogg` | 1-2 sec | Explosion variant 1 |
| `explosion_02.ogg` | 1-2 sec | Explosion variant 2 |
| `confetti_burst.ogg` | 1-2 sec | Celebration confetti |
| `streak_build.ogg` | 0.5 sec | Streak increasing (rising pitch) |

---

### P2: Medium Priority (Nice to Have)

#### TASK-AUDIO-005: Background Music (4-6 hours)
**Status:** Not Started
**Deliverables:** 5 music tracks

| Track | Duration | BPM | Description |
|-------|----------|-----|-------------|
| `menu_theme.ogg` | 1-2 min loop | 105 | Energetic Afrobeat menu theme |
| `lobby_theme.ogg` | 1-2 min loop | 98 | Relaxed waiting room vibe |
| `gameplay_calm.ogg` | 2-3 min loop | 110 | Focus mode, early rounds |
| `gameplay_intense.ogg` | 2-3 min loop | 128 | High stakes, final rounds |
| `victory_sting.ogg` | 10-15 sec | N/A | Game win musical stinger |

---

#### TASK-AUDIO-006: Announcer Voice Lines (4-6 hours)
**Status:** Not Started
**Deliverables:** 12 voice clips

| Line | Context | Energy Level |
|------|---------|--------------|
| "He's on Fire!" | 3+ wins streak | High intensity |
| "Ice Cold!" | Freeze opponent | Cool confidence |
| "Show Dry!" | Dry card challenge | Bold declaration |
| "Denied!" | Challenge failed | Sharp rejection |
| "Unstoppable!" | 5+ win streak | Maximum hype |
| "First Blood!" | First round win | Arcade classic |
| "Flawless Victory!" | Win without losing round | Perfect execution |
| "Come Back!" | Win after trailing | Dramatic reversal |
| "Toasty!" | Easter egg trigger | Cult classic reference |
| "Let's Go!" | Game start | Pump-up energy |
| "Game Over!" | Match end | Finality |
| "New Record!" | High score achieved | Achievement celebration |

---

### P3: Low Priority (Polish/Future)

#### TASK-AUDIO-007: Ambient Soundscapes (2-3 hours)
**Status:** Not Started
**Deliverables:** 3 ambient loops

- `ambient_crowd_murmur.ogg` - Subtle crowd background
- `ambient_night_crickets.ogg` - Evening atmosphere
- `ambient_rain.ogg` - Weather atmosphere

---

#### TASK-AUDIO-008: Character/Avatar Sounds (2-3 hours)
**Status:** Not Started
**Deliverables:** 10 character vocalizations

- 5 avatars x 2 sounds each (win celebration, loss reaction)
- Should reflect character personality
- Non-verbal vocalizations (laughs, sighs, etc.)

---

#### TASK-AUDIO-009: Multiplayer Social Sounds (1-2 hours)
**Status:** Not Started
**Deliverables:** 5 social interaction sounds

- Player join/leave room
- Chat message received
- Emote/reaction sounds
- Friend challenge notification
- Tournament start fanfare

---

#### TASK-AUDIO-010: Accessibility Audio (2-3 hours)
**Status:** Not Started
**Deliverables:** 8 accessibility cues

- Screen reader-friendly audio cues
- Turn notification sounds
- Card suit announcement tones
- Win condition audio descriptions

---

## Audio Sourcing Strategy

### Phase 1: Free Sound Library Search (Preferred)

**Primary Sources:**
1. **Freesound.org**
   - Search terms: "card flip", "percussion hit", "djembe", "celebration"
   - License filter: CC0 or CC-BY only
   - Download 3-5 candidates per sound

2. **Pixabay Audio**
   - Pixabay License (free commercial use)
   - Good for general SFX

3. **OpenGameArt.org**
   - Game-specific sounds
   - Community CC0 contributions

4. **BBC Sound Effects**
   - RemArc license (free for personal/educational/research)
   - Check commercial use terms

### Phase 2: AI Audio Generation (When Needed)

**Platform Selection:**

| Platform | Best For | Commercial Use | Cost |
|----------|----------|----------------|------|
| **Stable Audio Open** | SFX generation | Yes (open source) | Free |
| **ElevenLabs** | Voice/announcer | Yes (paid tier) | $5-11/mo |
| **Suno AI** | Full music tracks | Yes (Pro plan) | $10/mo |
| **Udio** | Music loops | Yes (paid tier) | $10/mo |
| **Soundraw** | Background music | Yes (Creator plan) | $20/mo |

**AI Generation Prompts:**

**Card Sounds (Stable Audio Open):**
```
Prompt: "crisp playing card flip sound, 0.5 seconds, sharp attack,
quick decay, arcade game sound effect, professional studio quality"

Settings: Duration 0.5s, 44.1kHz, high quality
```

**Afrobeat Percussion (Stable Audio Open):**
```
Prompt: "djembe drum hit, single strike, sharp attack, warm tone,
0.3 seconds, dry recording, game sound effect"

Settings: Duration 0.3s, emphasis on clarity
```

**Victory Music (Suno AI):**
```
Prompt: "Energetic Afrobeat victory celebration, 15 seconds,
105 BPM, djembe drums, shekere, bass, brass stabs, no vocals,
game music, loopable"

Tags: afrobeat, celebration, percussion, instrumental, game
```

**Announcer Voice (ElevenLabs):**
```
Voice: Josh (deep, authoritative)
Style: Energetic sports announcer
Energy: Maximum hype
Pacing: Quick, punchy delivery
Line: "He's on FIRE! 🔥"
```

### Phase 3: Custom Recording (If Budget Allows)

- Hire session percussionists for authentic djembe/talking drum recordings
- Record Ghanaian voice actors for authentic accent/pronunciation
- Professional studio mixing for cohesive sound signature

---

## Licensing Documentation Standards

Every audio asset MUST include:

1. **Source**: Where was it obtained?
2. **License**: Exact license type (CC0, CC-BY, Pixabay, etc.)
3. **Attribution Required**: Yes/No (if yes, exact credit text)
4. **Commercial Use**: Explicitly confirmed
5. **Modifications**: Any edits made (trimming, normalization, EQ, etc.)
6. **Date Added**: When asset was integrated

**Format:**
```json
{
  "file": "sfx_card_flip_01.ogg",
  "source": "Freesound.org - User: JohnDoe",
  "source_url": "https://freesound.org/people/JohnDoe/sounds/12345/",
  "license": "CC0 (Public Domain)",
  "attribution_required": false,
  "commercial_use": true,
  "modifications": "Trimmed to 0.4s, normalized to -12 LUFS, 200ms fade out",
  "date_added": "2025-12-19",
  "integrated_by": "audio-designer"
}
```

---

## Implementation Guidelines

### Volume Mixing Recommendations

| Category | Relative Volume | Notes |
|----------|----------------|-------|
| **Music** | 60% (master) | Allows SFX to punch through |
| **Card SFX** | 85% | Primary gameplay feedback |
| **Game Events** | 100% | Most important audio cues |
| **UI Sounds** | 70% | Subtle, non-intrusive |
| **Announcer** | 95% | Excitement peaks |
| **Ambient** | 40% | Background texture only |

### Ducking Rules

- Music ducks to 40% during announcer voice lines
- Music ducks to 50% during game event SFX (victory, defeat)
- No ducking for card sounds (music stays at 60%)

### Audio Sprite Strategy (Performance Optimization)

Combine frequently-used UI sounds into single audio sprite files:

**ui_sprite.ogg** contains:
- 0.0-0.2s: button_click
- 0.2-0.3s: button_hover
- 0.3-0.8s: modal_open
- 0.8-1.3s: modal_close
- etc.

Benefits:
- Reduces HTTP requests (1 file instead of 8)
- Faster initial load time
- Single decode operation

### Preloading Strategy

**Priority 1 (Load Immediately):**
- All card sounds
- UI button click/hover
- Invalid move error sound

**Priority 2 (Load on Game Start):**
- Game event sounds
- Special effects
- Phase transition

**Priority 3 (Lazy Load):**
- Background music (start streaming after UI loads)
- Announcer voice lines (load on first streak event)
- Ambient soundscapes

---

## Testing Checklist

For each audio asset, verify:

- [ ] File size within limits (<100KB SFX, <3MB music)
- [ ] Both OGG and MP3 versions exported
- [ ] Volume normalized to target LUFS
- [ ] Clean start (no click/pop at beginning)
- [ ] Clean end (proper fade or natural decay)
- [ ] Loops seamlessly (for looping sounds)
- [ ] Sounds good at 50%, 75%, 100% volume
- [ ] Not annoying after 20+ repetitions
- [ ] Fits cultural aesthetic (Afrobeat elements present)
- [ ] License documented in manifest
- [ ] Works in Chrome, Safari, Firefox

---

## Integration Code Structure

### Audio Manager Class (to be implemented)

```typescript
// Placeholder for future AudioManager implementation
class AudioManager {
  private sounds: Map<string, Howl>;
  private music: Howl | null;
  private volume: {
    master: number;
    sfx: number;
    music: number;
    voice: number;
  };

  preload(priority: 1 | 2 | 3): Promise<void>;
  playSound(name: string, volume?: number): void;
  playMusic(name: string, loop?: boolean): void;
  stopAll(): void;
  setVolume(category: string, level: number): void;
  mute(category: string): void;
}
```

---

## Next Steps (P0 Focus)

1. **TASK-AUDIO-001**: Research and source core card sounds
   - Search Freesound.org with CC0/CC-BY filter
   - Test Stable Audio Open for card flip/play sounds
   - Generate 3-5 candidates per sound
   - Select best, edit, normalize, export OGG + MP3

2. **TASK-AUDIO-003**: Research and source game event sounds
   - Search for celebration/victory sounds
   - Look for percussion hits (djembe, talking drum samples)
   - Generate AI sounds for fire/freeze effects
   - Edit, normalize, export all formats

3. **Create AUDIO_MANIFEST.json**: Document all assets with licensing
4. **Create AUDIO_INTEGRATION_GUIDE.md**: Implementation instructions for frontend engineer
5. **Deliver P0 assets**: Organized, tested, documented, ready to integrate

---

**Last Updated:** December 19, 2025
**Next Review:** After P0 completion
