# Spar Audio Sourcing Guide

**Created:** December 19, 2025
**Purpose:** Step-by-step instructions for sourcing/creating P0 audio assets
**Target:** TASK-AUDIO-001 (Card Sounds) + TASK-AUDIO-003 (Game Events)

---

## Overview

This guide provides exact search strategies, AI generation prompts, and editing workflows for creating Spar's P0 audio assets. Follow these steps in order to ensure proper licensing, cultural authenticity, and technical quality.

---

## Part 1: TASK-AUDIO-001 - Core Card Sound Effects

### Sound 1: Card Shuffle (1-2 seconds, loopable)

**Target:** Smooth shuffling sound with shekere rattle undertone

**Option A: Free Sound Library Search**

**Freesound.org Search:**
1. Go to https://freesound.org
2. Search terms: `"card shuffle" OR "cards shuffling" OR "deck shuffle"`
3. Filters:
   - License: "Creative Commons 0" OR "Attribution"
   - Duration: 1-3 seconds
   - Channels: Stereo preferred
4. Sort by: Rating (highest first)
5. Listen to top 10 results
6. Download 3 best candidates

**Recommended Results (as of search):**
- Look for user "InspectorJ" (known for quality game sounds)
- Avoid overly "crunchy" or paper-like sounds
- Prefer smooth, rhythmic shuffling

**Option B: AI Generation (Stable Audio Open)**

**Prompt:**
```
playing cards being shuffled, smooth rhythmic shuffling sound,
1.5 seconds, professional card dealer, casino quality,
slight rattle percussion undertone, game sound effect
```

**Settings:**
- Duration: 1.5 seconds
- Sample rate: 44100 Hz
- Quality: High
- Seed: Try multiple (3-5 generations)

**Generation Tool:**
- Stable Audio Open: https://stability.ai/stable-audio
- Free tier available
- Open source model (commercial use OK)

---

### Sound 2: Card Deal (0.5-1 second)

**Target:** Single card sliding/dealing with crisp snap and djembe accent

**Option A: Free Sound Library Search**

**Freesound.org Search:**
1. Search: `"card deal" OR "card slide" OR "single card"`
2. Filters: CC0 or CC-BY, Duration: 0.3-1.5 seconds
3. Look for sharp, crisp sounds (not muffled)

**Pixabay Audio Search:**
1. Go to https://pixabay.com/sound-effects/
2. Search: "card"
3. Filter by duration: Short
4. Pixabay License = free commercial use

**Option B: Layer Two Sounds**

**Recipe:**
1. Find clean card slide sound (CC0)
2. Find short djembe hit sample (CC0)
3. Layer them in Audacity:
   - Card slide: 100% volume, full duration
   - Djembe hit: 40% volume, at the END (0.4-0.6s mark)
4. Subtle blending creates "card lands with percussive accent" effect

**Free Djembe Samples:**
- Freesound.org search: "djembe hit" OR "djembe single"
- OpenGameArt.org percussion packs
- Philharmonia Orchestra Free Samples (CC-BY-SA)

---

### Sound 3: Card Flip (0.3-0.5 seconds)

**Target:** Quick percussive card flip/reveal

**Option A: Free Sound Library Search**

**Freesound.org Search:**
1. Search: `"card flip" OR "page turn" OR "paper flip"`
2. Filters: CC0, Duration: 0.2-0.7 seconds
3. Avoid heavy "book flip" sounds - want light, crisp

**Alternative Search Terms:**
- "poker card flip"
- "playing card turn"
- "card reveal"

**Option B: AI Generation (Stable Audio Open)**

**Prompt:**
```
single playing card flip sound, quick snap, 0.4 seconds,
crisp attack, sharp percussive, arcade game sound effect,
professional recording
```

**Settings:**
- Duration: 0.4 seconds
- Emphasis: Sharp, percussive
- Generate 5 variations, pick best

---

### Sound 4: Card Play (0.3-0.5 seconds) **SIGNATURE SOUND**

**Target:** Most satisfying sound - card played to table with talking drum accent

**Priority:** This is THE MOST IMPORTANT sound - players hear it 100+ times per game

**Option A: Custom Layered Sound (RECOMMENDED)**

**Recipe for Afrobeat Arcade Signature:**

**Layer 1 - Card Impact (70% volume):**
- Freesound search: "card slam" OR "card table" OR "card play"
- Want solid "thud" sound, not sliding

**Layer 2 - Talking Drum Hit (50% volume, 0.05s delayed):**
- Search: "talking drum" OR "dundun" OR "gangan"
- Single hit, sharp attack
- Pitched sound (not just noise)

**Layer 3 - Sub-bass Thump (30% volume, simultaneous):**
- Synthesize in Audacity: Generate > Tone
- Frequency: 80-100 Hz
- Duration: 0.15 seconds
- Envelope: Quick attack, medium decay

**Layering in Audacity:**
1. Import all 3 sounds on separate tracks
2. Align: Card impact at 0.0s, talking drum at 0.05s, sub-bass at 0.0s
3. Adjust volumes: Card 70%, Drum 50%, Bass 30%
4. Effect > Normalize to -12 LUFS
5. Export as 44.1kHz 16-bit WAV

**Result:** Satisfying, punchy, culturally authentic signature sound

**Option B: AI Generation with Emphasis**

**Prompt (Stable Audio Open):**
```
playing card slammed onto table, punchy impact with African talking drum accent,
0.4 seconds, arcade game sound, sharp attack, warm decay, professional quality,
percussive and satisfying
```

Generate 10 variations, test all, pick absolute best.

---

### Sound 5: Card Collect (0.5-1 second)

**Target:** Winning cards being collected - ascending tonal sequence

**Option A: Free Sound Library**

**Freesound.org Search:**
- "cards collect" OR "cards gather" OR "multiple cards"
- "poker chips collect" (similar feeling)
- "coins collect" (ascending tone reference)

**Option B: Custom Synthesized Sound (RECOMMENDED)**

**Audacity Recipe:**

1. **Generate Tone Sequence:**
   - Generate > Chirp
   - Start frequency: 400 Hz
   - End frequency: 800 Hz
   - Duration: 0.7 seconds
   - Waveform: Sine
   - Interpolation: Logarithmic

2. **Add Texture:**
   - Mix with short card shuffle loop (20% volume)
   - Creates "cards moving" texture under tonal sweep

3. **Apply Effects:**
   - Effect > Reverb (Small Room preset, 15% mix)
   - Effect > Normalize to -12 LUFS

4. **Result:** Magical, reward-feeling "cards flying to your pile" sound

**Option C: AI Generation**

**Prompt:**
```
cards being collected and gathered, ascending musical tone,
0.7 seconds, positive reward sound, magical swoosh,
game sound effect, pleasant and satisfying
```

---

### Sound 6: Card Hover (0.1-0.2 seconds) **SUBTLETY CRITICAL**

**Target:** Extremely subtle feedback - soft marimba/kalimba note

**Warning:** This sound plays on EVERY card hover - must be non-fatiguing

**Option A: Instrument Sample**

**Search for Single Note Samples:**
- Freesound: "kalimba note" OR "marimba note" OR "music box note"
- Philharmonia Orchestra: Free single instrument notes
- Want single, clean, soft note (C4 or G4 works well)

**Processing in Audacity:**
1. Trim to 0.15 seconds
2. Reduce volume to -18 LUFS (70% quieter than other card sounds)
3. Apply 50ms fade in, 80ms fade out
4. Effect > Low Pass Filter at 4kHz (removes harsh frequencies)

**Result:** Gentle, musical, non-annoying hover feedback

**Option B: Synthesize Simple Tone**

**Audacity Synthesis:**
1. Generate > Tone
   - Waveform: Sine
   - Frequency: 523 Hz (C5 note)
   - Amplitude: 0.3
   - Duration: 0.15 seconds

2. Apply Envelope:
   - 40ms fade in
   - 60ms fade out
   - Peak at 0.08s

3. Optional: Add harmonics
   - Duplicate track
   - Change frequency to 1046 Hz (C6 - octave above)
   - Reduce to 15% volume
   - Mix tracks

**Result:** Clean, simple, musical hover tone

---

## Part 2: Editing Workflow (All Card Sounds)

### Step 1: Import and Trim

1. Open sound in Audacity
2. Select audio, press Ctrl+T (trim to selection)
3. Remove silence from start and end
4. Ensure sound starts within 0.01 seconds (immediate attack)

### Step 2: Normalize Volume

1. Select all audio (Ctrl+A)
2. Effect > Normalize
   - Target: -3 dB (initial normalization)
   - Check "Normalize stereo channels independently"
3. Effect > Limiter
   - Type: Hard Limit
   - Limit to: -0.1 dB
   - Hold: 1 ms

### Step 3: Apply Fades

**For Hover/Flip/Play (short sounds):**
- Fade In: 10-20ms at start
- Fade Out: 50-100ms at end

**For Shuffle/Collect (longer sounds):**
- Fade In: 50ms
- Fade Out: 200ms

**Technique:**
- Select region to fade
- Effect > Fade In / Fade Out

### Step 4: Check Loudness

1. Analyze > Loudness Normalization (LUFS)
2. Target: -12 LUFS (integrated)
3. If off target: Effect > Loudness Normalization, set to -12 LUFS

### Step 5: Export Both Formats

**Export as OGG (Primary):**
1. File > Export > Export Audio
2. Format: Ogg Vorbis
3. Quality: 7 (VBR ~192 kbps)
4. Filename: `card_[name].ogg`

**Export as MP3 (Fallback):**
1. File > Export > Export Audio
2. Format: MP3
3. Bitrate: 128 kbps CBR
4. Filename: `card_[name].mp3`

### Step 6: Verify File Size

- Target: <100 KB per file
- If over: Reduce OGG quality to 5 or MP3 to 96 kbps
- Listen test to ensure quality acceptable

---

## Part 3: TASK-AUDIO-003 - Game Event Sound Effects

### Sound 7: Round Win (1-2 seconds)

**Target:** Positive, celebratory with djembe flourish + bell accent

**Option A: Layered Custom Sound (RECOMMENDED)**

**Recipe:**

**Layer 1 - Djembe Flourish (70% volume):**
- Search Freesound: "djembe roll" OR "djembe flourish"
- Want 0.5-1 second ascending/accelerating pattern
- If can't find: Layer 3-4 djembe hits with decreasing intervals (0.0s, 0.15s, 0.25s, 0.35s)

**Layer 2 - Bell/Chime Accent (60% volume):**
- Search: "bell chime" OR "game chime" OR "success chime"
- Single clear note, pleasant tone
- Position at 0.4-0.5s (after drum flourish starts)

**Layer 3 - Synth Chord (40% volume):**
- Major chord (C major works: C-E-G notes simultaneously)
- Warm, full sound
- Fade in at 0.3s, fade out at 1.5s

**Audacity Layering:**
1. Import all elements
2. Align timing: Drums start at 0.0s, bell at 0.4s, chord at 0.3s
3. Mix volumes as specified
4. Total duration: 1.5 seconds
5. Normalize to -12 LUFS
6. Add 200ms fade out at end

**Option B: AI Generation**

**Prompt (Suno AI or Udio for musical elements):**
```
celebration sound effect, 1.5 seconds, djembe drum flourish with bell chime,
positive victory sound, afrobeat percussion, game audio, no vocals,
major key, uplifting
```

---

### Sound 8: Round Loss (1-2 seconds)

**Target:** Negative but not harsh - low drum hit, descending tone

**Design Philosophy:** Communicate loss WITHOUT making player feel bad (important for retention)

**Option A: Free Sound Library**

**Search Strategy:**
- Freesound: "game over" OR "lose" OR "defeat" (filter for gentle)
- Look for: Low tones, descending pitches, NOT harsh buzzer sounds
- Avoid: Buzzer, alarm, anything punitive

**Good Examples:**
- Low drum hits
- Descending piano notes
- Bass drops (not aggressive)

**Option B: Custom Synthesized**

**Audacity Recipe:**

1. **Generate Descending Tone:**
   - Generate > Chirp
   - Start: 300 Hz
   - End: 150 Hz
   - Duration: 1.2 seconds
   - Waveform: Sine
   - Interpolation: Linear

2. **Add Low Drum Hit:**
   - Find single bass drum or low tom sample (CC0)
   - Position at 0.0s (start)
   - Volume: 70%

3. **Layer Descending Tone:**
   - Fade in at 0.2s
   - Fade out at 1.2s
   - Volume: 50%

4. **Result:** Dignified loss sound - clear but not punishing

---

### Sound 9: Game Victory (2-3 seconds) **CLIMACTIC**

**Target:** Epic celebration - full percussive ensemble + synth

**Priority:** This is the ULTIMATE reward sound - make it special

**Option A: AI-Generated Music Sting (RECOMMENDED)**

**Suno AI Prompt:**
```
Epic afrobeat victory celebration, 12 seconds, 105 BPM,
full percussion ensemble with djembe, shekere, talking drums,
brass stabs, synth bass, major key, triumphant and energetic,
no vocals, game music stinger, loopable ending
```

**Tags:** afrobeat, celebration, victory, percussion, brass, game, instrumental

**Alternative: Udio Prompt:**
```
[Intro: Percussion Build]
Afrobeat victory theme, djembe ensemble, celebration drums,
brass section hits, electronic bass, 105 BPM, 12 seconds,
instrumental game music, epic and triumphant
```

**Post-Processing:**
1. Trim to best 2.5-3 seconds
2. Ensure natural ending (or add fade)
3. Normalize to -11 LUFS (slightly louder than other sounds)
4. Verify seamless loop point if needed

**Option B: Layered Custom Sound (If AI unavailable)**

**Complex Recipe (requires multiple sources):**

**Base Layer - Percussion Ensemble:**
- Find Afrobeat drum loop (1-2 bars, CC0)
- OR: Layer multiple percussion one-shots

**Accent Layer - Brass Stabs:**
- Search: "brass stab" OR "trumpet hit" OR "brass accent"
- Place at 0.5s, 1.0s, 1.5s (rhythmic punctuation)

**Harmonic Layer - Synth Chord:**
- Major 7th chord (sophisticated victory sound)
- Swell from 0.0s to 2.0s

**Mix in Audacity:**
- 6-8 total tracks
- Complex but worth it for ultimate reward moment

---

### Sound 10: Game Defeat (2-3 seconds)

**Target:** Disappointed but dignified - low bass drum, minor chord

**Design:** Same principle as round loss - clear but not harsh

**Option A: AI Generation**

**Prompt:**
```
game over defeat sound, 2 seconds, low bass drum hit,
minor chord, disappointed but respectful tone,
cinematic game audio, not harsh, dignified ending
```

**Option B: Custom Synthesis**

**Audacity Recipe:**

1. **Bass Drum Foundation:**
   - Find deep bass drum sample (CC0)
   - Position at 0.0s and 0.8s (two hits)

2. **Minor Chord Layer:**
   - Generate 3 sine tones simultaneously:
     - A3 (220 Hz)
     - C4 (261 Hz)
     - E4 (329 Hz)
   - Duration: 1.5 seconds
   - Fade in: 0.3s, Fade out: 0.8s
   - Volume: 40%

3. **Sub-bass Rumble:**
   - Generate tone: 60 Hz, 1.2 seconds
   - Volume: 30%
   - Creates weight/gravity

**Result:** Respectful game over sound - clear loss but not punitive

---

### Sound 11: Dry Declaration (1-2 seconds)

**Target:** Confident announcement - talking drum pattern

**Cultural Context:** "Dry" is a strategic Spar declaration - sound should be bold, confident

**Option A: Talking Drum Sample (MOST AUTHENTIC)**

**Search Strategy:**
1. Freesound: "talking drum" OR "gangan" OR "dundun" OR "dondo"
2. Look for 2-3 note patterns (not single hits)
3. CC0 or CC-BY license
4. West African traditional recordings preferred

**Recommended Pattern:**
- 3-note sequence: Low-High-Mid pitch
- Rapid delivery (0.5-0.7 seconds total)
- Clean, dry recording (minimal reverb)

**Processing:**
1. Trim to pattern
2. Amplify to -11 LUFS (bold, prominent)
3. Add subtle 20ms fade in/out
4. Optional: Duplicate and pan slightly (stereo width)

**Option B: AI Generation**

**Prompt:**
```
West African talking drum pattern, 3-note sequence,
confident and bold, 0.7 seconds, traditional Ghanaian gangan,
dry recording, game sound effect, authentic percussion
```

---

### Sound 12: Show Dry Declaration (1-2 seconds)

**Target:** Challenge/reveal moment - sharp hit + reverb tail

**Context:** Counter-declaration to "Dry" - dramatic reveal

**Design:** Should feel like "BOOM - exposed!"

**Option A: Dramatic Impact Sound**

**Layering Recipe:**

**Layer 1 - Sharp Percussion Hit (80% volume):**
- Search: "impact hit" OR "dramatic hit" OR "boom"
- Single sharp transient
- Position at 0.0s

**Layer 2 - Talking Drum Accent (60% volume):**
- High-pitched talking drum hit
- Position at 0.05s (slightly delayed)

**Layer 3 - Reverb Tail:**
- Apply reverb to Layer 1:
  - Room Size: Large
  - Reverb Time: 2.0s
  - Dampening: 50%
  - Wet/Dry: 40% wet

**Audacity Process:**
1. Layer all elements
2. Total duration: 1.5-2.0 seconds (including reverb tail)
3. Normalize to -11 LUFS
4. Ensure reverb fades naturally

**Result:** Dramatic, reveals-the-truth impact sound

---

### Sound 13: Fire Streak (1-2 seconds, loopable)

**Target:** Building intensity, rising pitch, fast percussion

**Context:** Plays when player has winning streak - must loop seamlessly

**Option A: AI Generation (RECOMMENDED for looping)**

**Stable Audio Open Prompt:**
```
fire burning with building intensity, rising pitch,
fast crackling, 2 seconds, seamless loop,
game sound effect, energetic and accelerating
```

**Settings:**
- Duration: 2.0 seconds EXACTLY
- Enable seamless loop option (if available)
- Generate 5 variations

**Post-Processing:**
1. Test loop point: Import in Audacity, duplicate, place end-to-end
2. Listen for seamless transition
3. If needed: Crossfade last 100ms with first 100ms

**Option B: Layered Fire + Percussion**

**Recipe:**

**Base Layer - Fire Sound:**
- Freesound search: "fire crackling" OR "fire burning" OR "flames"
- Find 2-second loop with consistent energy

**Accent Layer - Accelerating Percussion:**
- Find or create djembe hit pattern with decreasing intervals:
  - Hits at: 0.0s, 0.4s, 0.7s, 0.9s, 1.05s, 1.17s, 1.27s, 1.35s
  - Creates acceleration feeling
  - Volume: 40% (subtle accent)

**Pitch Layer - Rising Tone:**
- Generate chirp: 200 Hz → 400 Hz, 2 seconds
- Volume: 20% (subliminal rising energy)

**Mix and ensure loop:**
1. Layer all elements
2. Make sure fire sound loops naturally
3. Test loop seam carefully

---

### Sound 14: Freeze Effect (1-2 seconds)

**Target:** Ice/freeze sound with crystal hit + sub-bass drop

**Design:** Should feel cold, sharp, impactful

**Option A: Layered Custom Sound (RECOMMENDED)**

**Recipe:**

**Layer 1 - Ice Crack (70% volume):**
- Freesound search: "ice crack" OR "glass crack" OR "freeze"
- Sharp, brittle sound
- Position at 0.0s

**Layer 2 - Crystal/Glass Hit (60% volume):**
- Search: "wine glass" OR "crystal" OR "glass chime"
- High, ringing tone
- Position at 0.05s

**Layer 3 - Sub-Bass Drop (50% volume):**
- Generate chirp: 150 Hz → 60 Hz, 0.8 seconds
- Sine wave
- Creates "cold weight" feeling

**Layer 4 - Reverb Tail:**
- Apply large hall reverb to crystal layer
- Creates icy spaciousness

**Audacity Layering:**
1. Import all elements
2. Align timing as specified
3. Total duration: 1.5 seconds
4. Normalize to -12 LUFS
5. Apply subtle high-pass filter at 100 Hz to ice sounds (clarity)

**Result:** Cold, impactful freeze effect with sub-bass you can "feel"

**Option B: AI Generation**

**Prompt:**
```
ice freeze sound effect, crystal crack with sub-bass drop,
1.5 seconds, cold and impactful, glass shattering with deep thump,
game sound effect, cinematic
```

---

### Sound 15: Invalid Move (0.3-0.5 seconds) **GENTLE ERROR**

**Target:** Error feedback that's informative but NOT punitive

**Critical Design Principle:** Players make mistakes - don't make them feel bad

**Option A: Soft Negative Sound**

**Search Strategy:**
- Freesound: "error" OR "denied" OR "cancel" (filter for gentle)
- Avoid: Buzzers, alarms, harsh sounds
- Look for: Muted thuds, soft "bonk", gentle tone

**Good Examples:**
- Muted marimba note (low)
- Soft "boop" down pitch
- Gentle "thud"

**Option B: Custom Synthesis (RECOMMENDED)**

**Audacity Recipe:**

1. **Generate Descending Tone:**
   - Generate > Tone
   - Waveform: Sine
   - Start frequency: 300 Hz
   - Duration: 0.3 seconds

2. **Apply Pitch Bend:**
   - Effect > Sliding Stretch
   - Pitch: Start 1.0, End 0.7
   - Creates gentle "bonk" down

3. **Add Soft Attack:**
   - Apply 30ms fade in (softens the blow)
   - Apply 100ms fade out

4. **Reduce Volume:**
   - Normalize to -16 LUFS (quieter than other sounds)
   - Error feedback should be subtle

**Result:** Clear error indication without player frustration

---

### Sound 16: Phase Transition (1-2 seconds)

**Target:** Neutral scene change - whoosh + marimba chord

**Context:** Played between game phases (waiting → playing, etc.)

**Option A: Whoosh + Musical Element**

**Recipe:**

**Layer 1 - Whoosh (70% volume):**
- Freesound search: "whoosh" OR "transition" OR "swipe"
- Clean, neutral swoosh
- Duration: 1.0-1.5 seconds

**Layer 2 - Marimba Chord (50% volume):**
- Find marimba chord sample OR synthesize
- Major triad (C-E-G or G-B-D)
- Position at 0.4s (mid-transition)
- Subtle, not dominating

**Option B: AI Generation**

**Prompt:**
```
game phase transition sound, 1.2 seconds, smooth whoosh
with subtle marimba chord accent, neutral and professional,
scene change sound effect, clean and polished
```

**Processing:**
1. Ensure smooth fade in/out
2. Normalize to -13 LUFS (moderate volume)
3. Apply subtle reverb (10% wet)

---

## Part 4: Quality Control Checklist

Before considering any sound "done", verify ALL of the following:

### Technical Quality
- [ ] File size <100KB (SFX) or <150KB (climactic)
- [ ] Sample rate: 44.1kHz
- [ ] Bit depth: 16-bit
- [ ] Both OGG and MP3 versions exported
- [ ] No clipping (peaks below 0 dB)
- [ ] No clicks/pops at start or end
- [ ] Clean fades applied appropriately

### Loudness Standards
- [ ] Normalized to -12 LUFS (or specified target)
- [ ] Consistent volume with other sounds in category
- [ ] Sounds balanced when played together
- [ ] Not too quiet (inaudible) or too loud (jarring)

### Cultural Authenticity
- [ ] Afrobeat elements present (where appropriate)
- [ ] No stereotypical "generic tribal" sounds
- [ ] Contemporary, modern production quality
- [ ] Respects Ghanaian cultural context

### Gameplay Feel
- [ ] Appropriate for game moment (matches emotion)
- [ ] Not annoying after 20+ repetitions
- [ ] Clear feedback (player understands what happened)
- [ ] Timing feels right (not too long/short)

### Licensing
- [ ] Source documented
- [ ] License verified (CC0, CC-BY, or commercial-OK)
- [ ] Attribution requirements noted
- [ ] Commercial use explicitly confirmed

### Looping (if applicable)
- [ ] Loops seamlessly (no audible seam)
- [ ] Tested by playing 5+ loops in sequence
- [ ] Consistent energy throughout loop
- [ ] Works as both loop and one-shot

---

## Part 5: Recommended Tools

### Free Audio Editing
- **Audacity** (Windows/Mac/Linux): https://www.audacityteam.org/
  - Primary tool for editing, mixing, effects
- **Ocenaudio** (simpler alternative): https://www.ocenaudio.com/

### File Conversion
- **FFmpeg** (command line): Convert between formats
  ```bash
  # WAV to OGG
  ffmpeg -i input.wav -c:a libvorbis -q:a 7 output.ogg

  # WAV to MP3
  ffmpeg -i input.wav -b:a 128k output.mp3
  ```

### Loudness Metering
- **Youlean Loudness Meter** (free plugin): https://youlean.co/youlean-loudness-meter/
  - Accurate LUFS measurement
  - Works as VST/AU in DAWs or standalone

### AI Audio Generation
- **Stable Audio Open**: https://stability.ai/stable-audio
  - Free tier available
  - Open source model
  - Good for SFX
- **ElevenLabs**: https://elevenlabs.io/
  - Voice generation
  - $5/month starter plan
- **Suno AI**: https://suno.ai/
  - Full music generation
  - $10/month Pro plan
  - Excellent for Afrobeat

### Sound Libraries
- **Freesound.org**: https://freesound.org/
  - Largest free sound library
  - Advanced license filtering
- **Pixabay Audio**: https://pixabay.com/sound-effects/
  - Simple license (free commercial)
  - Quality curated
- **BBC Sound Effects**: https://sound-effects.bbcrewind.co.uk/
  - 16,000+ sounds
  - Check license for commercial use

---

## Part 6: Asset Delivery Format

When sounds are complete, organize them as follows:

### Directory Structure
```
/frontend/public/assets/audio/
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

### Naming Convention
- Format: `[category]_[name]_[variant].ogg`
- Lowercase with underscores
- No spaces or special characters
- Descriptive but concise

### Companion Documentation
Each asset delivery should include:

1. **AUDIO_MANIFEST.json** - Complete licensing and technical metadata
2. **AUDIO_INTEGRATION_GUIDE.md** - Implementation instructions
3. **AUDIO_CREDITS.md** - Attribution requirements
4. **README.md** - Quick reference for developers

---

## Next Steps

1. Start with **TASK-AUDIO-001** (Card Sounds)
   - Begin with Sound 4 (Card Play) - the signature sound
   - Then do remaining 5 card sounds
   - Total estimated time: 2-4 hours

2. Proceed to **TASK-AUDIO-003** (Game Events)
   - Start with victory/defeat (most impactful)
   - Then round win/loss
   - Then special declarations
   - Total estimated time: 3-4 hours

3. Document everything in AUDIO_MANIFEST.json as you go

4. Deliver complete P0 package for integration

---

**Last Updated:** December 19, 2025
**Ready to Start:** Follow this guide step-by-step for best results
