# Spar Game Audio Assets

**Last Updated:** December 19, 2025
**Status:** P0 Audio Tasks In Progress
**Audio Identity:** Afro-Futurism Meets Arcade Energy

---

## Overview

This directory contains all audio assets for the Spar card game, combining arcade-style energy with authentic Afrobeat/Afro-Heritage cultural elements. All sounds are professionally produced, properly licensed for commercial use, and optimized for web delivery.

---

## Directory Structure

```
sounds/
├── sfx/                    # Sound effects
│   ├── cards/             # Card interaction sounds (6 sounds)
│   ├── game_events/       # Game event sounds (10 sounds)
│   ├── effects/           # Special effects (8 sounds)
│   └── ui/                # UI interaction sounds (8 sounds)
├── music/                 # Background music tracks (5 tracks)
├── announcer/             # Voice lines (12 clips)
├── AUDIO_MANIFEST.json    # Complete asset metadata and licensing
├── AUDIO_CREDITS.md       # Attribution requirements
└── README.md              # This file
```

---

## Audio Format Standards

### File Specifications

| Property | Value | Notes |
|----------|-------|-------|
| **Primary Format** | OGG Vorbis | Best compression for web |
| **Fallback Format** | MP3 (128kbps) | Browser compatibility |
| **Sample Rate** | 44.1kHz | CD-quality standard |
| **Bit Depth** | 16-bit | Final delivery format |
| **Loudness** | -12 LUFS (SFX), -14 LUFS (music) | Professional game audio |
| **File Size** | <100KB (SFX), <3MB (music) | Web performance optimized |

### Naming Convention

```
[category]_[name]_[variant].[ext]

Examples:
- card_play.ogg
- round_win_01.ogg
- ui_button_click.mp3
- fire_streak_loop.ogg
```

---

## Asset Categories

### 1. Card Sounds (P0 - Critical)

**Status:** In Progress
**Location:** `/sfx/cards/`
**Count:** 6 sounds (12 files with OGG + MP3)

| File | Duration | Description | Status |
|------|----------|-------------|--------|
| `card_shuffle` | 1-2s | Deck shuffling (loopable) | Not Started |
| `card_deal` | 0.5-1s | Single card deal | Not Started |
| `card_flip` | 0.3-0.5s | Card flip/reveal | Not Started |
| `card_play` | 0.3-0.5s | Card played (signature sound) | Not Started |
| `card_collect` | 0.5-1s | Winning cards collected | Not Started |
| `card_hover` | 0.1-0.2s | Subtle hover feedback | Not Started |

**Cultural Elements:** Djembe hits on impacts, shekere undertones, talking drum accents

---

### 2. Game Event Sounds (P0 - Critical)

**Status:** Ready to Start
**Location:** `/sfx/game_events/`
**Count:** 10 sounds (20 files)

| File | Duration | Description | Status |
|------|----------|-------------|--------|
| `round_win` | 1-2s | Round victory | Not Started |
| `round_loss` | 1-2s | Round loss (gentle) | Not Started |
| `game_victory` | 2-3s | Game win (climactic) | Not Started |
| `game_defeat` | 2-3s | Game loss (dignified) | Not Started |
| `dry_declaration` | 1-2s | "Dry" card declaration | Not Started |
| `show_dry_declaration` | 1-2s | "Show Dry" challenge | Not Started |
| `fire_streak` | 1-2s | Fire effect (loopable) | Not Started |
| `freeze_effect` | 1-2s | Freeze effect | Not Started |
| `invalid_move` | 0.3-0.5s | Error feedback (gentle) | Not Started |
| `phase_transition` | 1-2s | Scene transitions | Not Started |

**Cultural Elements:** Talking drum patterns, djembe flourishes, bell accents, polyrhythmic percussion

---

### 3. UI Sounds (P1 - High Priority)

**Status:** Not Started
**Location:** `/sfx/ui/`
**Count:** 8 sounds (16 files)

| File | Duration | Description |
|------|----------|-------------|
| `ui_button_click` | 0.1-0.2s | Primary button click |
| `ui_button_hover` | 0.1s | Button hover (subtle) |
| `ui_modal_open` | 0.3-0.5s | Modal/dialog open |
| `ui_modal_close` | 0.3-0.5s | Modal/dialog close |
| `ui_error` | 0.5s | Error notification |
| `ui_success` | 0.5s | Success notification |
| `ui_timer_warning` | 0.5s | Timer warning (<10s) |
| `ui_timer_critical` | 0.3s | Critical timer (<3s) |

---

### 4. Special Effects (P1 - High Priority)

**Status:** Not Started
**Location:** `/sfx/effects/`
**Count:** 8 sounds (16 files)

| File | Duration | Description |
|------|----------|-------------|
| `fire_ignite` | 0.5-1s | Fire effect start |
| `fire_loop` | 2s | Fire burning (seamless loop) |
| `ice_crack` | 0.5-1s | Initial freeze |
| `ice_shatter` | 0.5-1s | Ice breaking |
| `explosion_01` | 1-2s | Explosion variant 1 |
| `explosion_02` | 1-2s | Explosion variant 2 |
| `confetti_burst` | 1-2s | Celebration effect |
| `streak_build` | 0.5s | Streak increasing |

---

### 5. Background Music (P2 - Medium Priority)

**Status:** Not Started
**Location:** `/music/`
**Count:** 5 tracks

| File | Duration | BPM | Description |
|------|----------|-----|-------------|
| `menu_theme` | 1-2min | 105 | Energetic Afrobeat menu |
| `lobby_theme` | 1-2min | 98 | Relaxed waiting room |
| `gameplay_calm` | 2-3min | 110 | Early rounds focus |
| `gameplay_intense` | 2-3min | 128 | Final rounds tension |
| `victory_sting` | 10-15s | N/A | Game win stinger |

**Musical Style:** Contemporary Afrobeat with polyrhythmic percussion, talking drums, djembe, shekere, modern 808s, synth elements

---

### 6. Announcer Voice Lines (P2 - Medium Priority)

**Status:** Not Started
**Location:** `/announcer/`
**Count:** 12 voice clips

| File | Context | Energy |
|------|---------|--------|
| `on_fire` | 3+ win streak | High intensity |
| `ice_cold` | Freeze opponent | Cool confidence |
| `show_dry` | Dry challenge | Bold declaration |
| `denied` | Challenge failed | Sharp rejection |
| `unstoppable` | 5+ win streak | Maximum hype |
| `first_blood` | First round win | Arcade classic |
| `flawless_victory` | Win without losses | Perfect |
| `come_back` | Win after trailing | Dramatic |
| `toasty` | Easter egg | Cult classic |
| `lets_go` | Game start | Pump-up |
| `game_over` | Match end | Finality |
| `new_record` | High score | Achievement |

**Voice Direction:** Energetic sports announcer style (NBA Jam inspiration), diverse voice casting

---

## Licensing Information

### License Types Used

All assets are verified for commercial use:

- **CC0 (Public Domain)**: No attribution required, full commercial rights
- **CC-BY (Attribution)**: Attribution required, commercial use allowed
- **Pixabay License**: Free commercial use, no attribution required
- **AI Generated**: Platforms with commercial use rights (paid tiers)

### Attribution Requirements

See `AUDIO_CREDITS.md` for complete attribution list. Any assets requiring attribution will be clearly marked with exact credit text.

---

## Integration Guidelines

### Loading Strategy

**Priority 1 (Preload):**
- All card sounds
- UI button interactions
- Invalid move sound

**Priority 2 (Game Start):**
- Game event sounds
- Special effects

**Priority 3 (Lazy Load):**
- Background music (stream)
- Announcer voice lines
- Ambient soundscapes

### Volume Mixing

| Category | Relative Volume | Notes |
|----------|----------------|-------|
| Music | 60% | Background texture |
| Card SFX | 85% | Primary feedback |
| Game Events | 100% | Most important cues |
| UI Sounds | 70% | Subtle interactions |
| Announcer | 95% | Excitement peaks |

### Audio Ducking

- Music ducks to 40% during announcer lines
- Music ducks to 50% during climactic game events
- No ducking for card sounds

---

## Implementation Code Reference

### Howler.js Integration (Recommended)

```typescript
import { Howl } from 'howler';

// Initialize sound
const cardPlay = new Howl({
  src: [
    'assets/sounds/sfx/cards/card_play.ogg',
    'assets/sounds/sfx/cards/card_play.mp3'
  ],
  volume: 0.85,
  preload: true
});

// Play sound
cardPlay.play();
```

### Phaser Audio Integration

```typescript
// In PreloadScene
this.load.audio('card_play', [
  'assets/sounds/sfx/cards/card_play.ogg',
  'assets/sounds/sfx/cards/card_play.mp3'
]);

// In GameScene
this.sound.play('card_play', { volume: 0.85 });
```

---

## Testing Checklist

Before marking any sound as complete:

- [ ] Both OGG and MP3 versions exist
- [ ] File sizes within limits
- [ ] Volume normalized to target LUFS
- [ ] Clean start/end (no clicks/pops)
- [ ] Sounds good at various volumes
- [ ] Not annoying after 20+ plays
- [ ] License documented in manifest
- [ ] Attribution included (if required)
- [ ] Works in Chrome, Safari, Firefox

---

## Cultural Authenticity Notes

### Afrobeat Elements Incorporated

- **Djembe**: West African goblet drum - used for card impact accents
- **Talking Drum (Gangan)**: Ghanaian hourglass drum - pitch-bending for declarations
- **Shekere**: Beaded gourd rattle - texture for shuffling
- **Polyrhythmic Patterns**: Multiple rhythmic layers, Afrobeat signature
- **Modern Production**: 808s, synths, contemporary African music production

### Cultural Respect Guidelines

- Avoid stereotypical "tribal" sounds
- Celebrate contemporary African music
- Respectful representation of Ghanaian culture
- Authentic instrumentation when possible
- Modern, polished production quality

---

## Development Status

### P0 Tasks (MVP Blockers)

- [ ] TASK-AUDIO-001: Core Card Sounds (2-4 hours) - **IN PROGRESS**
- [ ] TASK-AUDIO-003: Game Event Sounds (3-4 hours) - **READY TO START**

### P1 Tasks (High Priority)

- [ ] TASK-AUDIO-002: UI Sounds (2-3 hours)
- [ ] TASK-AUDIO-004: Special Effects (3-4 hours)

### P2 Tasks (Medium Priority)

- [ ] TASK-AUDIO-005: Background Music (4-6 hours)
- [ ] TASK-AUDIO-006: Announcer Voice Lines (4-6 hours)

### P3 Tasks (Low Priority)

- [ ] TASK-AUDIO-007: Ambient Soundscapes (2-3 hours)
- [ ] TASK-AUDIO-008: Character Sounds (2-3 hours)
- [ ] TASK-AUDIO-009: Multiplayer Social Sounds (1-2 hours)
- [ ] TASK-AUDIO-010: Accessibility Audio (2-3 hours)

---

## Resources

### Design Documents

- `/AUDIO_IMPLEMENTATION_PLAN.md` - Complete audio strategy
- `/AUDIO_SOURCING_GUIDE.md` - Step-by-step sourcing instructions
- `/AUDIO_MANIFEST.json` - Technical metadata and licensing
- `/AUDIO_CREDITS.md` - Attribution requirements

### Tools Used

- **Audacity**: Audio editing and mixing
- **Stable Audio Open**: AI SFX generation
- **Suno AI / Udio**: Music generation
- **ElevenLabs**: Voice synthesis
- **FFmpeg**: Format conversion

### Sound Libraries

- Freesound.org (CC0/CC-BY sounds)
- Pixabay Audio (free commercial)
- OpenGameArt.org (game audio)
- BBC Sound Effects (check license)

---

## Contact

**Audio Designer:** audio-designer agent
**Project:** Spar Card Game
**Repository:** sparui
**Created:** December 19, 2025

For questions about audio implementation, licensing, or cultural authenticity, consult the audio-designer agent or refer to the comprehensive documentation in the project root.

---

**Last Updated:** December 19, 2025
**Status:** P0 audio tasks in progress - sourcing and creation underway
