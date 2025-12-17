# Week 2 Designer Handoff - Asset Creation Priority

**Date:** December 17, 2025
**To:** arcade-ui-designer
**From:** Technical Lead / Project Manager
**Phase:** Week 2 - Asset Creation & UI Foundation
**Status:** READY TO START

---

## Executive Summary

Week 1 is complete! The backend infrastructure is production-ready (100% test pass rate), and the frontend foundation is solid. We're now entering Week 2 where **asset creation is the critical path**. Your work this week will directly enable game development in Week 3.

### Your Top Priority

**TASK-022: Generate 35 Card Images** - This is P0 (critical) and blocks all game scene work.

---

## Week 1 Accomplishments (Context)

### Backend Infrastructure ✅
- Go WebSocket server operational
- PostgreSQL database with complete schema
- JWT authentication fully functional (register, login, protected routes)
- 28 comprehensive tests passing (100% pass rate)
- API documented and ready for integration

### Frontend Foundation ✅
- React + TypeScript + Vite setup complete
- Tailwind CSS configured with custom arcade theme colors
- Phaser 3.80+ integrated and ready for game assets
- Zustand state management configured
- Basic UI components library (Button, Modal, Timer, Card)
- Main Menu screen with navigation (placeholder - needs your assets for final version)

### What This Means For You
The infrastructure is rock-solid and ready to receive your assets. When you deliver cards, particle textures, and avatars, the frontend engineers can immediately integrate them into working game scenes.

---

## Your Week 2 Tasks (Priority Order)

### [TASK-020] Research and Plan Asset Creation Pipeline
**Priority:** P1 (high)
**Size:** M (2-4 hrs)
**Status:** TODO → Start immediately

**Objective:** Define your asset creation workflow and tooling.

**Acceptance Criteria:**
- [ ] AI tools evaluated (Midjourney, DALL-E, Stable Diffusion) - which works best for our style?
- [ ] Card design style defined (African-inspired, vibrant, arcade aesthetic)
- [ ] Sample prompt templates created for consistent card generation
- [ ] Image editing workflow established (Figma/Photoshop for touch-ups)
- [ ] Export specifications documented (512x768px PNG with transparency)

**Deliverable:** Brief document or notes on your chosen pipeline + 2-3 test cards for team feedback

**Notes:**
- Reference PRD Section 7 for detailed pipeline guidance
- Test 2-3 sample cards first to validate the approach before generating all 35
- Consider batch generation for efficiency
- Share test cards with team for early feedback on style

---

### [TASK-022] Generate 35 Card Images with AI
**Priority:** P0 (CRITICAL - BLOCKS WEEK 3)
**Size:** XL (Full week - 40+ hrs)
**Status:** TODO → Start after TASK-020

**Objective:** Create all 35 playing cards with consistent style.

**Card Specifications:**
- **Dimensions:** 512x768px PNG with alpha transparency
- **Format:** PNG with alpha channel (transparent background)
- **File size:** < 100KB each (use TinyPNG or similar for compression)
- **Naming convention:** `[suit]_[value].png` (e.g., `hearts_ace.png`, `spades_6.png`)

**Deck Composition (35 cards total):**
- **Hearts** (9 cards): 6, 7, 8, 9, 10, Jack, Queen, King, Ace
- **Clubs** (9 cards): 6, 7, 8, 9, 10, Jack, Queen, King, Ace
- **Diamonds** (9 cards): 6, 7, 8, 9, 10, Jack, Queen, King, Ace
- **Spades** (8 cards): 6, 7, 8, 9, 10, Jack, Queen, King (NO ACE OF SPADES)

**Design Style (from PRD Section 4.4):**
- **Theme:** African-inspired, vibrant, arcade aesthetic
- **Colors:** Bold, high-contrast, energetic (Fire Red #FF4500, Ice Blue #00BFFF, Gold #FFD700, Deep Purple #8B00FF)
- **Card Layout:**
  - Border: Rounded corners, subtle gradient
  - Background: Light texture (felt-like or subtle pattern)
  - Suit Symbols: Large, centered, with gradient
  - Face Cards: Stylized character art (Jack, Queen, King) - African-inspired characters
- **Special States (create base cards first, we'll add effects in code):**
  - Fire border variant (optional - can be done programmatically)
  - Ice border variant (optional - can be done programmatically)

**Acceptance Criteria:**
- [ ] All 35 cards generated with consistent style across suits
- [ ] Cards exported as 512x768px PNG with transparency
- [ ] Cards organized by suit in folders: `/hearts`, `/clubs`, `/diamonds`, `/spades`
- [ ] Cards optimized with compression (< 100KB each)
- [ ] Special card states created if time permits (fire/ice borders - these can be added later)
- [ ] Delivered to frontend engineer with folder structure intact

**File Organization:**
```
assets/cards/
├── hearts/
│   ├── hearts_6.png
│   ├── hearts_7.png
│   ├── hearts_8.png
│   ├── hearts_9.png
│   ├── hearts_10.png
│   ├── hearts_jack.png
│   ├── hearts_queen.png
│   ├── hearts_king.png
│   └── hearts_ace.png
├── clubs/
│   └── [same structure]
├── diamonds/
│   └── [same structure]
└── spades/
    ├── spades_6.png
    ├── spades_7.png
    ├── spades_8.png
    ├── spades_9.png
    ├── spades_10.png
    ├── spades_jack.png
    ├── spades_queen.png
    └── spades_king.png (NO ACE)
```

**Notes:**
- **THIS IS THE CRITICAL PATH ITEM** - Game scene work in Week 3 cannot begin without these cards
- Use your prompt template from TASK-020 for consistency
- Get feedback on first batch (e.g., all Hearts) before completing the rest
- Face cards (Jack, Queen, King) can have character art - be creative with African-inspired designs
- Focus on consistency across suits - players should instantly recognize suits
- If time is tight, prioritize getting all cards done over perfecting every detail
- We can iterate on individual cards in future sprints if needed

**Sample AI Prompts (adjust based on your tool):**
```
"African-inspired playing card, Ace of Hearts, vibrant red and gold, high contrast,
arcade game art style, digital illustration, centered heart symbol with gradient,
clean geometric border, felt texture background"

"African-inspired Jack of Clubs playing card, character portrait of young African warrior,
vibrant green and gold colors, high contrast arcade game art, stylized geometric design"
```

---

### [TASK-023] Create Particle Effect Textures
**Priority:** P1 (high)
**Size:** M (2-4 hrs)
**Status:** TODO → Can run in parallel with TASK-022

**Objective:** Design particle textures for fire, ice, and explosion effects.

**Textures Needed:**
1. **Fire Particle Texture**
   - Size: 256x256px PNG with alpha
   - Colors: Orange/red/yellow gradient
   - Style: Organic, flame-like shape
   - Use: Phaser particle emitter will spawn hundreds of these

2. **Ice Particle Texture**
   - Size: 256x256px PNG with alpha
   - Colors: Blue crystalline, light blue, white highlights
   - Style: Sharp, geometric, icy
   - Use: Freeze effect when fire streaks are broken

3. **Explosion Particle Texture**
   - Size: 256x256px PNG with alpha
   - Colors: Gold, yellow, white
   - Style: Star/sparkle shape
   - Use: Victory explosions

4. **Confetti Textures (5 colors)**
   - Size: 128x128px PNG with alpha each
   - Colors: Red, Blue, Green, Gold, Purple
   - Style: Simple rectangular confetti pieces
   - Use: Victory screen celebration

**Acceptance Criteria:**
- [ ] Fire particle texture created (orange/red/yellow gradient)
- [ ] Ice particle texture created (blue crystalline)
- [ ] Explosion particle texture created (star/sparkle)
- [ ] Confetti textures created (5 colors)
- [ ] All textures 256x256px (or 128x128 for confetti) PNG with alpha channel
- [ ] Delivered organized in `/effects` folder

**File Organization:**
```
assets/effects/
├── fire_particle.png
├── ice_particle.png
├── explosion_particle.png
├── confetti_red.png
├── confetti_blue.png
├── confetti_green.png
├── confetti_gold.png
└── confetti_purple.png
```

**Notes:**
- Keep textures simple - Phaser will composite many of them for effects
- Consider performance (small file sizes)
- Test with Phaser particle emitters if possible (frontend engineer can help)
- These enable the spectacular "ON FIRE!" and "FROZEN!" effects from the PRD

---

### [TASK-024] Generate Player Avatar Set
**Priority:** P1 (high)
**Size:** M (2-4 hrs)
**Status:** TODO → Can start after card samples approved

**Objective:** Create 5 diverse player avatars with consistent cartoon style.

**Specifications:**
- **Dimensions:** 256x256px PNG with transparent background
- **Count:** 5 unique avatars
- **Style:** African-inspired, friendly, approachable, cartoon/arcade style
- **Diversity:** Represent different genders and ages
- **File size:** < 50KB each (optimized)

**Acceptance Criteria:**
- [ ] 5 unique avatars generated with AI
- [ ] Diverse representation (gender, age, ethnicity)
- [ ] Consistent art style across all avatars (same artist/tool/prompt template)
- [ ] 256x256px PNG with transparent background
- [ ] Optimized file sizes (< 50KB each)
- [ ] Delivered in `/avatars` folder with clear naming

**File Organization:**
```
assets/avatars/
├── avatar_1.png
├── avatar_2.png
├── avatar_3.png
├── avatar_4.png
└── avatar_5.png
```

**Notes:**
- Reference PRD Section 7 for style guidance
- Keep style friendly and approachable - these represent players
- More avatars can be added in Phase 2
- Avatars should work well at small sizes (they'll appear in lobbies and during gameplay)
- Consider diversity: different ages, genders, styles

**Sample Prompt:**
```
"Friendly African character avatar, cartoon style, vibrant colors,
arcade game character portrait, smiling, headshot, circular frame,
digital illustration"
```

---

### [TASK-025] Create Poker Table Surface Background
**Priority:** P1 (high)
**Size:** M (2-4 hrs)
**Status:** TODO → Can do in parallel

**Objective:** Design the default poker table surface theme.

**Specifications:**
- **Dimensions:** 1920x1080px or larger (will be scaled to fit)
- **Format:** PNG or WebP (optimized for web)
- **Theme:** Professional Poker Table (default theme)
- **Style:** Realistic poker felt texture with wood trim

**Design Elements (from PRD Section 3.2):**
- **Felt Green:** #0A5F38 (primary surface color)
- **Wood Trim:** #4A2511 (border/edge color)
- **Gold Accents:** #D4AF37 (subtle decorative elements)
- **Texture:** Subtle felt texture, not too busy
- **Layout:** Oval or rectangular poker table shape

**Acceptance Criteria:**
- [ ] Poker table surface designed (1920x1080px minimum)
- [ ] Felt green color matches PRD (#0A5F38)
- [ ] Wood trim details added around edges
- [ ] Gold accent elements included (subtle)
- [ ] Exported as optimized PNG or WebP (< 500KB)
- [ ] Delivered in `/surfaces` folder

**File Organization:**
```
assets/surfaces/
└── poker_table_default.png
```

**Notes:**
- Reference PRD Section 3.2 for exact color specs
- Keep texture subtle - it's a background, shouldn't distract from cards
- Other themes (street court, wooden floor, neon, beach) deferred to Week 8
- This will be the default theme for MVP
- Consider how cards will look on this surface (good contrast)

---

### [TASK-026] Source Placeholder Sound Effects (Optional - Lower Priority)
**Priority:** P2 (medium)
**Size:** M (2-4 hrs)
**Status:** TODO → If time permits after critical assets

**Objective:** Find and organize placeholder sound effects for game actions.

**Sounds Needed:**
- Card shuffle sound
- Card play sound (whoosh + thud)
- Button click sound
- Win round sound (ding/chime)
- Fire ignition sound (whoosh + crackle)
- Ice freeze sound (crack + crystalline chime)

**Acceptance Criteria:**
- [ ] All 6+ sound effects sourced
- [ ] Sounds in MP3 format (web-friendly)
- [ ] File sizes small (< 100KB per sound)
- [ ] Organized in `/sounds/sfx` folder
- [ ] Licensing verified (free/open source)

**Sources (Suggested):**
- Freesound.org
- Zapsplat.com
- Mixkit.co
- YouTube Audio Library

**Notes:**
- These are placeholders for MVP - custom sounds can come in Phase 2
- Keep file sizes small for web performance
- Verify licensing (use Creative Commons or public domain)
- This is P2 priority - focus on visual assets first

---

## Design Requirements from PRD

### Section 4.4: Card Design Specifications
- **Border:** Rounded corners, subtle gradient
- **Background:** Light texture (felt-like, wood grain based on theme)
- **Suit Symbols:** Large, centered, with gradient
- **Face Cards:** Stylized character art (Jack, Queen, King) - African-inspired
- **Fire State (optional):** Orange glow, flame particles around card
- **Frozen State (optional):** Blue tint, ice crystals on corners

### Section 3.2: Color Palette
- **Fire Red:** #FF4500 (Win streaks, danger, energy)
- **Ice Blue:** #00BFFF (Freeze effects, calm, counter)
- **Gold:** #FFD700 (Victory, highlights, leader indicators)
- **Deep Purple:** #8B00FF (Premium feel, UI accents)

### Section 7: Asset Creation Pipeline
- **Concept:** Define visual style (African-inspired, vibrant, modern)
- **AI Generation:** Use Midjourney/DALL-E with prompt templates
- **Editing:** Touch up in Photoshop/Figma as needed
- **Export:** Proper dimensions with transparency
- **Optimization:** Compress with TinyPNG or similar

---

## Timeline and Expectations

### Week 2 Schedule (Dec 17-24, 2025)

**Day 1-2 (Dec 17-18):**
- Complete TASK-020 (asset pipeline planning)
- Generate first batch of cards (all Hearts - 9 cards)
- Get team feedback on style

**Day 3-5 (Dec 19-21):**
- Generate remaining cards (Clubs, Diamonds, Spades - 26 cards)
- Create particle effect textures (TASK-023)
- Create player avatars (TASK-024)

**Day 6-7 (Dec 22-23):**
- Create poker table surface (TASK-025)
- Finalize all assets, optimize file sizes
- Organize and deliver to frontend team
- Source sound effects if time permits (TASK-026)

**Week 2 Goal:** All critical assets (35 cards, particle textures, avatars, table surface) delivered by end of week.

---

## Success Criteria

### Week 2 Complete When:
- [ ] All 35 card images generated and delivered
- [ ] Particle effect textures created
- [ ] 5 player avatars created
- [ ] Poker table surface created
- [ ] All assets organized in proper folder structure
- [ ] Frontend engineer confirms assets integrated successfully
- [ ] No blockers for Week 3 game scene development

### Quality Standards:
- **Consistency:** All cards have unified style and aesthetic
- **Performance:** File sizes optimized for web (no huge PNGs)
- **Naming:** Clear, consistent file naming convention
- **Organization:** Proper folder structure for easy integration
- **Feedback:** At least one design review with team during the week

---

## Communication and Coordination

### Daily Check-ins
- Share progress updates in team channel
- Post work-in-progress samples for feedback
- Flag any blockers immediately

### Design Review Points
1. **After TASK-020:** Share asset pipeline decision + test cards
2. **After first batch (Hearts):** Get style approval before continuing
3. **Mid-week:** Share particle textures and avatars for feedback
4. **End of week:** Final asset delivery and handoff

### Questions to Ask
- Do the test cards match the team's vision?
- Are the colors vibrant enough for the arcade aesthetic?
- Do the face cards have enough character/personality?
- Are file sizes optimized enough for web?

### Who to Contact
- **Technical Lead/PM:** Strategic questions, priorities, timeline
- **Frontend Engineer:** Integration questions, file formats, technical specs
- **Team:** Design feedback, style direction, creative decisions

---

## Tools and Resources

### Recommended AI Tools
- **Midjourney** (Discord-based, excellent for stylized art)
- **DALL-E 3** (via ChatGPT Plus, good for specific prompts)
- **Stable Diffusion** (local/online, more control)

### Image Editing
- **Figma** (web-based, great for touch-ups and exports)
- **Photoshop** (if available)
- **GIMP** (free alternative)

### Optimization
- **TinyPNG** (https://tinypng.com) - PNG compression
- **Squoosh** (https://squoosh.app) - Google's image optimizer
- **ImageOptim** (Mac app for batch optimization)

### Sound Sources (if time permits)
- Freesound.org
- Zapsplat.com
- Mixkit.co

---

## Reference Documents

### Must Read
1. **PRD.md** - Section 4.4 (Card Design), Section 3.2 (Colors), Section 7 (Asset Pipeline)
2. **TASK_BREAKDOWN.md** - Week 2 tasks (lines 617-752)
3. **PROJECT_STATE.md** - Current project status

### Files in Repository
- `/Users/nana/go/src/github.com/npeprah/sparui/PRD.md`
- `/Users/nana/go/src/github.com/npeprah/sparui/TASK_BREAKDOWN.md`
- `/Users/nana/go/src/github.com/npeprah/sparui/PROJECT_STATE.md`

---

## What Happens After Week 2

### Week 3 Preview: Phaser Game Scene Foundation
Once you deliver the card assets, the frontend engineer will:
- Integrate all 35 cards into Phaser BootScene
- Build the main GameScene with cards rendering
- Create Card entity classes
- Implement card deal animations
- Add player positioning around the table

**Your work this week directly enables Week 3 game development.**

---

## Final Notes

### You Are the Critical Path
Week 2's success depends on your asset creation. The entire game scene development in Week 3 is blocked without the card images. This is high-pressure but also high-impact work - the game won't look like a game without your assets.

### Quality Over Perfection
We're building an MVP. The cards need to be good and consistent, but they don't need to be perfect. We can iterate on individual cards in future sprints. The goal is to get all 35 cards done and unblock Week 3.

### You're Not Alone
The team is here to support you. If you need feedback, help with tools, or want to discuss creative direction, reach out immediately. We're all working toward the same goal: shipping a fun, beautiful card game.

### Celebrate Wins
When you finish the first batch of cards, share them with the team. When the frontend engineer integrates them and they appear in the game for the first time, that's a huge milestone. Enjoy these moments!

---

## Questions or Blockers?

**Contact:** Technical Lead / PM
**Status:** Ready to start immediately
**Next Action:** Begin TASK-020 (Asset Pipeline Planning)

Let's make Week 2 amazing! 🎨🃏✨
