# Path 3: Placeholder Sounds - Quick Workflow (1-2 Hours)

**Created:** December 19, 2025
**Purpose:** Create 16 functional placeholder sounds for immediate testing
**Time:** 1-2 hours
**Tool:** Audacity (free)

---

## ⚠️ IMPORTANT NOTICE

These sounds are **TEMPORARY PLACEHOLDERS** for integration testing only.

**They MUST be replaced with quality assets before production.**

Placeholders allow:
- Frontend integration to proceed immediately
- Audio system testing without delay
- Time to properly source quality assets later

---

## Quick Setup

1. **Install Audacity:** https://www.audacityteam.org/download/
2. **Create folders:** (Already done ✅)
   - `/frontend/public/assets/sounds/sfx/cards/`
   - `/frontend/public/assets/sounds/sfx/game_events/`

---

## Workflow Tips

**Efficient Creation Strategy:**
1. Create each sound in Audacity
2. Immediately export BOTH formats (OGG first, then MP3)
3. Move to next sound (don't batch export - too easy to make mistakes)
4. Mark completion in checklist below

**Audacity Quick Export:**
- **OGG:** File > Export > Export Audio > Format: Ogg Vorbis, Quality: 7
- **MP3:** File > Export > Export Audio > Format: MP3, Bitrate: 128 kbps CBR

---

## PART 1: Card Sounds (6 sounds, ~30 minutes)

### 1. card_shuffle.ogg + .mp3

**Target:** Shuffling card deck sound
**Duration:** 1.5 seconds
**Location:** `/frontend/public/assets/sounds/sfx/cards/`

**Audacity Steps:**
1. Generate > Noise
   - Noise type: White
   - Amplitude: 0.3
   - Duration: 1.5 seconds
2. Effect > Filter Curve EQ (or Low Pass Filter)
   - Cutoff: 3000 Hz
3. Effect > Fade In
   - Duration: 200ms (0.2 seconds)
4. Effect > Fade Out
   - Duration: 300ms (0.3 seconds)
5. **Export as:** `card_shuffle.ogg` (Format: Ogg Vorbis, Quality: 7)
6. **Export as:** `card_shuffle.mp3` (Format: MP3, 128 kbps CBR)

**Save to:** `/frontend/public/assets/sounds/sfx/cards/`

✅ Done: [ ]

---

### 2. card_deal.ogg + .mp3

**Target:** Single card being dealt to player
**Duration:** 0.5 seconds
**Location:** `/frontend/public/assets/sounds/sfx/cards/`

**Audacity Steps:**
1. Generate > Tone
   - Waveform: Sine
   - Frequency: 400 Hz
   - Amplitude: 0.4
   - Duration: 0.5 seconds
2. Effect > Sliding Stretch (or Change Pitch)
   - Pitch: End at 80% (or -3 semitones)
3. Effect > Fade Out
   - Duration: 150ms
4. **Export as:** `card_deal.ogg` and `card_deal.mp3`

**Save to:** `/frontend/public/assets/sounds/sfx/cards/`

✅ Done: [ ]

---

### 3. card_flip.ogg + .mp3

**Target:** Card flipping over (reveal)
**Duration:** 0.3 seconds
**Location:** `/frontend/public/assets/sounds/sfx/cards/`

**Audacity Steps:**
1. Generate > Tone
   - Waveform: Sine
   - Frequency: 600 Hz
   - Amplitude: 0.5
   - Duration: 0.3 seconds
2. Effect > Change Pitch
   - Pitch: -3 semitones
3. Effect > Fade In
   - Duration: 10ms
4. Effect > Fade Out
   - Duration: 100ms
5. **Export as:** `card_flip.ogg` and `card_flip.mp3`

**Save to:** `/frontend/public/assets/sounds/sfx/cards/`

✅ Done: [ ]

---

### 4. card_play.ogg + .mp3 ⭐ MOST IMPORTANT

**Target:** Card being played to center (signature sound, heard 100+ times)
**Duration:** 0.4 seconds
**Location:** `/frontend/public/assets/sounds/sfx/cards/`

**Audacity Steps:**
1. Generate > Tone
   - Waveform: Sine
   - Frequency: 300 Hz
   - Amplitude: 0.6
   - Duration: 0.4 seconds
2. Effect > Bass and Treble
   - Bass: +10 dB
   - Treble: 0 dB
3. Effect > Fade Out
   - Duration: 150ms
4. **Export as:** `card_play.ogg` and `card_play.mp3`

**Save to:** `/frontend/public/assets/sounds/sfx/cards/`

✅ Done: [ ]

---

### 5. card_collect.ogg + .mp3

**Target:** Collecting cards after winning round
**Duration:** 0.7 seconds
**Location:** `/frontend/public/assets/sounds/sfx/cards/`

**Audacity Steps:**
1. Generate > Chirp
   - Waveform: Sine
   - Start Frequency: 400 Hz
   - End Frequency: 800 Hz
   - Duration: 0.7 seconds
2. Effect > Fade In
   - Duration: 50ms
3. Effect > Fade Out
   - Duration: 200ms
4. **Export as:** `card_collect.ogg` and `card_collect.mp3`

**Save to:** `/frontend/public/assets/sounds/sfx/cards/`

✅ Done: [ ]

---

### 6. card_hover.ogg + .mp3

**Target:** Subtle hover feedback (should be QUIET)
**Duration:** 0.15 seconds
**Location:** `/frontend/public/assets/sounds/sfx/cards/`

**Audacity Steps:**
1. Generate > Tone
   - Waveform: Sine
   - Frequency: 523 Hz (C5 note)
   - Amplitude: 0.2 (LOWER than others - should be subtle)
   - Duration: 0.15 seconds
2. Effect > Fade In
   - Duration: 40ms
3. Effect > Fade Out
   - Duration: 80ms
4. **Export as:** `card_hover.ogg` and `card_hover.mp3`

**Save to:** `/frontend/public/assets/sounds/sfx/cards/`

✅ Done: [ ]

---

## PART 2: Game Event Sounds (10 sounds, ~45 minutes)

### 7. round_win.ogg + .mp3

**Target:** Player wins a round (positive feedback)
**Duration:** 1.2 seconds
**Location:** `/frontend/public/assets/sounds/sfx/game_events/`

**Audacity Steps:**
1. Generate > Chirp
   - Waveform: Sine
   - Start Frequency: 300 Hz
   - End Frequency: 600 Hz
   - Duration: 1.2 seconds
2. Effect > Reverb
   - Room Size: 50
   - Damping: 50%
   - Wet Gain: -10 dB
3. **Export as:** `round_win.ogg` and `round_win.mp3`

**Save to:** `/frontend/public/assets/sounds/sfx/game_events/`

✅ Done: [ ]

---

### 8. round_loss.ogg + .mp3

**Target:** Player loses a round (gentle negative feedback)
**Duration:** 1.2 seconds
**Location:** `/frontend/public/assets/sounds/sfx/game_events/`

**Audacity Steps:**
1. Generate > Chirp
   - Waveform: Sine
   - Start Frequency: 300 Hz
   - End Frequency: 150 Hz (downward pitch)
   - Duration: 1.2 seconds
2. Effect > Fade Out
   - Duration: 400ms
3. **Export as:** `round_loss.ogg` and `round_loss.mp3`

**Save to:** `/frontend/public/assets/sounds/sfx/game_events/`

✅ Done: [ ]

---

### 9. game_victory.ogg + .mp3 🎉 CLIMACTIC

**Target:** Player wins entire game (celebration)
**Duration:** 2.5 seconds
**Location:** `/frontend/public/assets/sounds/sfx/game_events/`

**Audacity Steps:**
1. Generate > Chirp
   - Waveform: Sine
   - Start Frequency: 200 Hz
   - End Frequency: 800 Hz (big upward sweep)
   - Duration: 2.5 seconds
2. Effect > Reverb
   - Room Size: 75 (large room)
   - Damping: 40%
   - Wet Gain: -6 dB
3. Effect > Amplify
   - Amplification: +6 dB (make it louder)
4. **Export as:** `game_victory.ogg` and `game_victory.mp3`

**Save to:** `/frontend/public/assets/sounds/sfx/game_events/`

✅ Done: [ ]

---

### 10. game_defeat.ogg + .mp3

**Target:** Player loses entire game (respectful ending)
**Duration:** 2.0 seconds
**Location:** `/frontend/public/assets/sounds/sfx/game_events/`

**Audacity Steps:**
1. Generate > Tone
   - Waveform: Sine
   - Frequency: 150 Hz (low tone)
   - Amplitude: 0.6
   - Duration: 2.0 seconds
2. Effect > Fade In
   - Duration: 300ms
3. Effect > Fade Out
   - Duration: 800ms
4. **Export as:** `game_defeat.ogg` and `game_defeat.mp3`

**Save to:** `/frontend/public/assets/sounds/sfx/game_events/`

✅ Done: [ ]

---

### 11. dry_declaration.ogg + .mp3

**Target:** Player declares "Dry" (bold move)
**Duration:** 0.8 seconds
**Location:** `/frontend/public/assets/sounds/sfx/game_events/`

**Audacity Steps:**
1. Generate > Tone
   - Waveform: Square (more aggressive)
   - Frequency: 400 Hz
   - Amplitude: 0.5
   - Duration: 0.8 seconds
2. Effect > Change Tempo
   - Tempo: +20% (speed up slightly)
3. Effect > Fade Out
   - Duration: 200ms
4. **Export as:** `dry_declaration.ogg` and `dry_declaration.mp3`

**Save to:** `/frontend/public/assets/sounds/sfx/game_events/`

✅ Done: [ ]

---

### 12. show_dry_declaration.ogg + .mp3

**Target:** Player declares "Show Dry" (even bolder)
**Duration:** 1.0 seconds
**Location:** `/frontend/public/assets/sounds/sfx/game_events/`

**Audacity Steps:**
1. Generate > Tone
   - Waveform: Square
   - Frequency: 500 Hz (higher than regular dry)
   - Amplitude: 0.6
   - Duration: 1.0 seconds
2. Effect > Reverb
   - Room Size: 60 (large hall feel)
   - Wet Gain: -12 dB
3. Effect > Fade Out
   - Duration: 400ms
4. **Export as:** `show_dry_declaration.ogg` and `show_dry_declaration.mp3`

**Save to:** `/frontend/public/assets/sounds/sfx/game_events/`

✅ Done: [ ]

---

### 13. fire_streak.ogg + .mp3

**Target:** Fire streak effect (heating up, building energy)
**Duration:** 1.5 seconds
**Location:** `/frontend/public/assets/sounds/sfx/game_events/`

**Audacity Steps:**
1. Generate > Noise
   - Noise type: Pink Noise
   - Amplitude: 0.4
   - Duration: 1.5 seconds
2. Effect > High Pass Filter
   - Cutoff: 500 Hz (remove low rumble)
3. Effect > Sliding Stretch
   - Pitch: End at 150% (pitch rises)
4. **Export as:** `fire_streak.ogg` and `fire_streak.mp3`

**Save to:** `/frontend/public/assets/sounds/sfx/game_events/`

**Note:** Consider this loopable if effect continues

✅ Done: [ ]

---

### 14. freeze_effect.ogg + .mp3

**Target:** Freeze effect (cold, stopping momentum)
**Duration:** 1.2 seconds
**Location:** `/frontend/public/assets/sounds/sfx/game_events/`

**Audacity Steps:**
1. Generate > Tone
   - Waveform: Sine
   - Frequency: 2000 Hz (high, crystalline)
   - Amplitude: 0.5
   - Duration: 1.2 seconds
2. Effect > Sliding Stretch
   - Pitch: End at 50% (pitch falls, like slowing down)
3. Effect > Reverb
   - Room Size: 60 (large hall)
   - Damping: 30%
   - Wet Gain: -8 dB
4. **Export as:** `freeze_effect.ogg` and `freeze_effect.mp3`

**Save to:** `/frontend/public/assets/sounds/sfx/game_events/`

✅ Done: [ ]

---

### 15. invalid_move.ogg + .mp3

**Target:** Invalid card play attempt (gentle correction)
**Duration:** 0.3 seconds
**Location:** `/frontend/public/assets/sounds/sfx/game_events/`

**Audacity Steps:**
1. Generate > Tone
   - Waveform: Sine
   - Frequency: 300 Hz
   - Amplitude: 0.4 (NOT too loud - shouldn't be punishing)
   - Duration: 0.3 seconds
2. Effect > Sliding Stretch
   - Pitch: End at 70% (slight downward pitch)
3. Effect > Fade Out
   - Duration: 100ms
4. **Export as:** `invalid_move.ogg` and `invalid_move.mp3`

**Save to:** `/frontend/public/assets/sounds/sfx/game_events/`

✅ Done: [ ]

---

### 16. phase_transition.ogg + .mp3

**Target:** Game phase change overlay (2-second transitions)
**Duration:** 1.0 seconds
**Location:** `/frontend/public/assets/sounds/sfx/game_events/`

**Audacity Steps:**
1. Generate > Noise
   - Noise type: White Noise
   - Amplitude: 0.3
   - Duration: 1.0 seconds
2. Effect > Low Pass Filter
   - Cutoff: 2000 Hz (soften it)
3. Effect > Fade In
   - Duration: 200ms
4. Effect > Fade Out
   - Duration: 300ms
5. **Export as:** `phase_transition.ogg` and `phase_transition.mp3`

**Save to:** `/frontend/public/assets/sounds/sfx/game_events/`

✅ Done: [ ]

---

## ✅ Completion Checklist

### Card Sounds (6)
- [ ] card_shuffle.ogg + .mp3
- [ ] card_deal.ogg + .mp3
- [ ] card_flip.ogg + .mp3
- [ ] card_play.ogg + .mp3 ⭐ (MOST IMPORTANT)
- [ ] card_collect.ogg + .mp3
- [ ] card_hover.ogg + .mp3

### Game Event Sounds (10)
- [ ] round_win.ogg + .mp3
- [ ] round_loss.ogg + .mp3
- [ ] game_victory.ogg + .mp3 🎉 (CLIMACTIC)
- [ ] game_defeat.ogg + .mp3
- [ ] dry_declaration.ogg + .mp3
- [ ] show_dry_declaration.ogg + .mp3
- [ ] fire_streak.ogg + .mp3
- [ ] freeze_effect.ogg + .mp3
- [ ] invalid_move.ogg + .mp3
- [ ] phase_transition.ogg + .mp3

**Total Files:** 32 files (16 sounds × 2 formats)

---

## After Completion

### 1. Verify File Organization

```
/frontend/public/assets/sounds/
├── sfx/
│   ├── cards/
│   │   ├── card_shuffle.ogg + .mp3 ✅
│   │   ├── card_deal.ogg + .mp3 ✅
│   │   ├── card_flip.ogg + .mp3 ✅
│   │   ├── card_play.ogg + .mp3 ✅
│   │   ├── card_collect.ogg + .mp3 ✅
│   │   └── card_hover.ogg + .mp3 ✅
│   └── game_events/
│       ├── round_win.ogg + .mp3 ✅
│       ├── round_loss.ogg + .mp3 ✅
│       ├── game_victory.ogg + .mp3 ✅
│       ├── game_defeat.ogg + .mp3 ✅
│       ├── dry_declaration.ogg + .mp3 ✅
│       ├── show_dry_declaration.ogg + .mp3 ✅
│       ├── fire_streak.ogg + .mp3 ✅
│       ├── freeze_effect.ogg + .mp3 ✅
│       ├── invalid_move.ogg + .mp3 ✅
│       └── phase_transition.ogg + .mp3 ✅
```

### 2. Mark as Placeholders

Create a file: `/frontend/public/assets/sounds/PLACEHOLDER_NOTICE.txt`

```
⚠️ PLACEHOLDER AUDIO ASSETS ⚠️

All sounds in this directory are TEMPORARY PLACEHOLDERS created for integration testing.

These sounds:
- Provide functional audio feedback for testing
- Allow frontend integration to proceed without delay
- MUST be replaced with production-quality assets before final MVP

Replacement Priority: HIGH
Replacement Timeline: Next sprint (5-8 hours)
Replacement Method: Follow AUDIO_SOURCING_GUIDE.md (Path 1)

Created: [Date]
Status: PLACEHOLDER - DO NOT SHIP TO PRODUCTION
```

### 3. Test One Sound in Browser

Create `/frontend/test-audio.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Audio Test - Spar</title>
</head>
<body>
  <h1>Spar Audio Test</h1>
  <h2>Card Sounds</h2>
  <button onclick="playSound('cards/card_play')">Play Card</button>
  <button onclick="playSound('cards/card_shuffle')">Shuffle</button>
  <button onclick="playSound('cards/card_deal')">Deal</button>

  <h2>Game Events</h2>
  <button onclick="playSound('game_events/round_win')">Round Win</button>
  <button onclick="playSound('game_events/game_victory')">Game Victory</button>

  <audio id="audio"></audio>

  <script>
    function playSound(path) {
      const audio = document.getElementById('audio');
      audio.src = `public/assets/sounds/sfx/${path}.ogg`;
      audio.play();
    }
  </script>
</body>
</html>
```

### 4. Ready for Frontend Integration

Once all 32 files are in place:
- Frontend engineer can begin AudioManager integration
- Use `/AUDIO_INTEGRATION_GUIDE.md` for implementation
- Test all sounds in game context
- Document any issues or volume adjustments needed

---

## Next Steps (After Placeholders Working)

**Week 2 Goal:** Replace placeholders with quality assets

1. **Read:** `/AUDIO_SOURCING_GUIDE.md`
2. **Start with:** `card_play` (signature sound - highest priority)
3. **Use:** Freesound.org (CC0/CC-BY sounds)
4. **Document:** Licensing in AUDIO_MANIFEST.json and AUDIO_CREDITS.md
5. **Time:** 5-8 hours for all 16 quality sounds
6. **Result:** Production-ready audio with cultural authenticity

---

## Troubleshooting

**"I can't find [Effect] in Audacity":**
- Check: Effect menu might be organized differently
- Try: Effect > Filter Curve EQ instead of Low/High Pass Filter
- Alternative: Use built-in EQ to manually adjust frequencies

**"Sounds are too quiet/loud":**
- Fix: Effect > Normalize > Set to -3 dB
- This balances volume across all sounds

**"Export options don't match":**
- OGG: File > Export > Export Audio > Format dropdown > "Ogg Vorbis Files"
- MP3: May need LAME encoder installed (Audacity will prompt if needed)

**"File won't export":**
- Check: File name doesn't have invalid characters
- Check: You have write permissions to the directory
- Try: Export to Desktop first, then move to correct folder

---

**Status:** Ready to Execute
**Time Required:** 1-2 hours
**Next Milestone:** All 32 files created and tested
**Then:** Frontend integration can proceed immediately

🎮 Go create those sounds! 🥁
