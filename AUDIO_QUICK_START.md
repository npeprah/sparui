# Spar Audio - Quick Start Guide

**Created:** December 19, 2025
**Read Time:** 3 minutes
**Purpose:** Get started creating audio assets immediately

---

## What You Need to Know

You need **16 sounds** for MVP:
- **6 card sounds** (shuffle, deal, flip, play, collect, hover)
- **10 game event sounds** (wins, losses, declarations, effects)

**Time Required:**
- Fast path (placeholders): 1-2 hours
- Quality path (production): 5-8 hours
- Hybrid: Do both (placeholders now, quality later)

---

## 3-Step Quick Start (Choose Your Speed)

### Fast Path: Placeholders in 1-2 Hours

**For:** Immediate testing, can replace later

1. **Install Audacity** (free): https://www.audacityteam.org/
2. **Open** `/AUDIO_P0_ACTION_PLAN.md`
3. **Follow "Path 3"** quick synthesis recipes
4. **Export** each sound as OGG + MP3
5. **Place** in `/frontend/public/assets/sounds/sfx/cards/` and `/sfx/game_events/`
6. **Mark** as "PLACEHOLDER - REPLACE" in manifest

**Result:** Functional sounds for integration testing. Must replace before production.

---

### Quality Path: Production Assets in 5-8 Hours

**For:** Final MVP submission, proper licensing

1. **Install Audacity** (free): https://www.audacityteam.org/
2. **Create Freesound account** (free): https://freesound.org/
3. **Open** `/AUDIO_SOURCING_GUIDE.md`
4. **Start with "card_play"** (the signature sound - most important)
5. **Search Freesound:**
   - Use filters: CC0 or CC-BY license only
   - Download 3-5 candidates per sound
   - Test each for quality
6. **Edit in Audacity:**
   - Trim to correct length
   - Normalize to -12 LUFS
   - Add fades (in/out)
   - Export OGG + MP3
7. **Document licensing:**
   - Update AUDIO_MANIFEST.json
   - Update AUDIO_CREDITS.md (if CC-BY)
8. **Repeat** for all 16 sounds

**Result:** Professional, licensed, culturally authentic audio.

---

### Hybrid Path: Best of Both (Recommended)

**For:** Unblock integration now, deliver quality later

**This Week (1-2 hours):**
- Create placeholders using Fast Path
- Frontend can integrate and test immediately
- No pressure on audio quality yet

**Next Week (5-8 hours):**
- Replace placeholders with quality assets
- Proper licensing and cultural authenticity
- Production-ready before final MVP

**Benefits:**
- Frontend development unblocked immediately
- Time to source quality sounds properly
- Clear upgrade path
- Reduced pressure

---

## File Organization Reference

Place files here:
```
/frontend/public/assets/sounds/
├── sfx/
│   ├── cards/
│   │   ├── card_shuffle.ogg + .mp3
│   │   ├── card_deal.ogg + .mp3
│   │   ├── card_flip.ogg + .mp3
│   │   ├── card_play.ogg + .mp3  ← MOST IMPORTANT
│   │   ├── card_collect.ogg + .mp3
│   │   └── card_hover.ogg + .mp3
│   └── game_events/
│       ├── round_win.ogg + .mp3
│       ├── round_loss.ogg + .mp3
│       ├── game_victory.ogg + .mp3  ← CLIMACTIC
│       ├── game_defeat.ogg + .mp3
│       ├── dry_declaration.ogg + .mp3
│       ├── show_dry_declaration.ogg + .mp3
│       ├── fire_streak.ogg + .mp3
│       ├── freeze_effect.ogg + .mp3
│       ├── invalid_move.ogg + .mp3
│       └── phase_transition.ogg + .mp3
```

---

## Priority Ranking (If Time Limited)

Create sounds in this order:

**Tier 1 - Absolutely Critical:**
1. `card_play.ogg` - Players hear this 100+ times per game
2. `round_win.ogg` - Primary positive feedback
3. `round_loss.ogg` - Primary negative feedback

**Tier 2 - Very Important:**
4. `card_deal.ogg` - Frequent action
5. `card_flip.ogg` - Frequent action
6. `game_victory.ogg` - Major climax moment
7. `invalid_move.ogg` - Important error feedback

**Tier 3 - Important:**
8. `card_shuffle.ogg` - Game start atmosphere
9. `card_collect.ogg` - Reward feeling
10. `game_defeat.ogg` - Major ending moment

**Tier 4 - Nice to Have:**
11-16. Remaining sounds (declarations, effects, transitions)

**Strategy:** If pressed for time, create Tier 1-2 in quality, Tier 3-4 as placeholders.

---

## Licensing Checklist (Quality Path Only)

Before using any sound, verify:

- [ ] Source is Freesound, Pixabay, or AI tool with commercial rights
- [ ] License is CC0 or CC-BY (NOT CC-BY-NC)
- [ ] Commercial use explicitly allowed
- [ ] If CC-BY: Attribution text copied and saved
- [ ] Source URL saved for reference
- [ ] License URL saved for reference

**Where to Document:**
- Individual asset: AUDIO_MANIFEST.json
- Attribution required: AUDIO_CREDITS.md

---

## Quick Audacity Reference

**Import Audio:**
- File > Open (or drag-and-drop)

**Trim to Selection:**
- Select region > Ctrl+T (Cmd+T on Mac)

**Normalize Volume:**
- Select All > Effect > Normalize > Set to -3 dB

**Add Fade:**
- Select region > Effect > Fade In / Fade Out

**Export OGG:**
- File > Export > Export Audio
- Format: Ogg Vorbis
- Quality: 7

**Export MP3:**
- File > Export > Export Audio
- Format: MP3
- Bitrate: 128 kbps CBR

---

## AI Tool Options (If Using)

### Free Option: Stable Audio Open
- URL: https://stability.ai/stable-audio
- Best for: Sound effects
- License: Open source, commercial OK
- Cost: Free

### Paid Option: Suno AI (Music)
- URL: https://suno.ai/
- Best for: Afrobeat music loops
- License: Commercial use on Pro plan
- Cost: $10/month

### Paid Option: ElevenLabs (Voice)
- URL: https://elevenlabs.io/
- Best for: Announcer voice lines (P2 task)
- License: Commercial use on paid tiers
- Cost: $5-11/month

**For P0 Tasks:** Stable Audio Open (free) or Freesound.org sufficient

---

## Cultural Authenticity Quick Tips

**For Card Sounds:**
- Layer clean card sound with djembe/talking drum hit
- Add subtle percussion accents (West African instruments)
- Keep it modern - avoid "tribal" stereotypes

**For Game Events:**
- Use talking drum patterns for declarations
- Polyrhythmic percussion for celebrations
- Contemporary production (not folk recordings)

**Good References:**
- Modern Afrobeat: Burna Boy, Wizkid, Davido
- Classic Afrobeat: Fela Kuti, Tony Allen
- Amapiano: Log drums, percussive elements

**Search Terms for Freesound:**
- "djembe hit"
- "talking drum"
- "West African percussion"
- "shekere"
- "Afrobeat"

---

## Common Mistakes to Avoid

❌ **Don't:** Use CC-BY-NC licensed sounds (non-commercial only)
✅ **Do:** Only use CC0 or CC-BY

❌ **Don't:** Forget to export BOTH OGG and MP3
✅ **Do:** Always export both formats

❌ **Don't:** Make sounds too long (players hear repeatedly)
✅ **Do:** Keep card sounds <1 second

❌ **Don't:** Make hover sound loud
✅ **Do:** Keep hover sound 70% quieter than other sounds

❌ **Don't:** Use harsh error sounds (frustrates players)
✅ **Do:** Use gentle, informative error sounds

❌ **Don't:** Use generic "tribal" sounds
✅ **Do:** Use contemporary Afrobeat elements

❌ **Don't:** Forget to normalize volume
✅ **Do:** Normalize all sounds to -12 LUFS

---

## Testing Your Sounds

### Quick Test in Audacity
1. Import sound
2. Press spacebar to play
3. Check: Does it start immediately? (No leading silence)
4. Check: Does it end cleanly? (No abrupt cut)
5. Check: Is volume consistent with others?
6. Check: Does it sound good at 50%, 75%, 100% volume?

### Test in Browser
1. Place files in `/frontend/public/assets/sounds/`
2. Create simple HTML test page:
```html
<!DOCTYPE html>
<html>
<body>
  <button onclick="playSound()">Test Sound</button>
  <audio id="audio" src="assets/sounds/sfx/cards/card_play.ogg"></audio>
  <script>
    function playSound() {
      document.getElementById('audio').play();
    }
  </script>
</body>
</html>
```
3. Open in Chrome/Safari/Firefox
4. Click button - sound should play

---

## Getting Help

**If stuck on:**

**Licensing:**
- "Is this sound OK for commercial use?"
- → Check AUDIO_SOURCING_GUIDE.md license section
- → Consult audio-designer agent for verification

**Sound Quality:**
- "Does this sound fit the game?"
- → Reference AUDIO_SOURCING_GUIDE.md for each sound's target
- → Consult audio-designer agent for quality check

**Cultural Authenticity:**
- "Does this have proper Afrobeat elements?"
- → Reference AUDIO_IMPLEMENTATION_PLAN.md cultural direction
- → Consult audio-designer agent for validation

**Technical Issues:**
- "How do I export/edit/normalize?"
- → Check AUDIO_SOURCING_GUIDE.md editing workflow section
- → Consult audio-designer agent for step-by-step guidance

---

## Ready? Start Here

1. **Choose your path:**
   - [ ] Fast Path (placeholders) → See AUDIO_P0_ACTION_PLAN.md "Path 3"
   - [ ] Quality Path → See AUDIO_SOURCING_GUIDE.md "Part 1"
   - [ ] Hybrid Path → Do Fast Path now, Quality Path later

2. **Install Audacity:** https://www.audacityteam.org/

3. **If Quality Path:** Create Freesound account: https://freesound.org/

4. **Create first sound:** Start with `card_play.ogg` (most important)

5. **Document as you go:** Update AUDIO_MANIFEST.json

6. **Ask questions:** Consult audio-designer agent anytime

---

## Success Looks Like

**After 1-2 Hours (Fast Path):**
- [ ] 16 sounds created (placeholder quality)
- [ ] Both OGG and MP3 formats
- [ ] Files in correct directories
- [ ] Frontend can test integration
- [ ] Marked as "PLACEHOLDER - REPLACE"

**After 5-8 Hours (Quality Path):**
- [ ] 16 sounds created (production quality)
- [ ] All licenses verified (CC0 or CC-BY)
- [ ] Attribution documented (where required)
- [ ] Volumes normalized to -12 LUFS
- [ ] Cultural authenticity validated
- [ ] AUDIO_MANIFEST.json complete
- [ ] AUDIO_CREDITS.md updated
- [ ] Ready for MVP submission

---

## Full Documentation Reference

For deeper guidance, see:

- **AUDIO_PROJECT_SUMMARY.md** - Complete overview
- **AUDIO_IMPLEMENTATION_PLAN.md** - Full strategy and task breakdown
- **AUDIO_SOURCING_GUIDE.md** - Detailed step-by-step instructions
- **AUDIO_INTEGRATION_GUIDE.md** - Technical implementation
- **AUDIO_P0_ACTION_PLAN.md** - Detailed execution paths

**This Quick Start:** Fastest path to getting started
**Sourcing Guide:** Most detailed instructions for each sound

---

**Last Updated:** December 19, 2025
**Status:** Ready to execute
**Estimated Time:** 1-2 hours (Fast) or 5-8 hours (Quality)

🎮 Let's create amazing audio for Spar! 🥁
