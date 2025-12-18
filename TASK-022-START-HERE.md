# TASK-022: Generate 35 Card Images - START HERE

**Status:** Ready for AI Generation (Test Batch Phase)
**Priority:** P0 CRITICAL - Blocks Week 3 Development
**Designer:** arcade-ui-designer
**Date:** December 17, 2025

---

## Quick Start Guide

### 1. Review Visual Mockups (Just Opened)
The browser just opened `spar-card-mockups.html` showing:
- Interactive mockups of 5 test cards
- Full Afro-Heritage theme implementation
- Design specifications and technical details
- Hover effects and animations

**Use these mockups as your visual target for AI generation.**

### 2. Access Ready-to-Use AI Prompts
Open: `/Users/nana/go/src/github.com/npeprah/sparui/AI-PROMPTS-READY-TO-USE.md`

This file contains:
- Complete, copy-paste-ready prompts for all 35 cards
- Test batch prompts (5 cards) at the top
- Organized by suit with specific color guidance
- Midjourney command syntax included

### 3. Complete Generation Strategy
Open: `/Users/nana/go/src/github.com/npeprah/sparui/TASK-022-AI-GENERATION-PLAN.md`

This file contains:
- Full week timeline (Days 1-6)
- Post-processing workflow
- Quality assurance checklists
- Batch generation strategy

---

## Recommended Workflow for Today (Day 1)

### Phase 1: Generate Test Batch (5 Cards)

#### Card 1: 6 of Hearts (Number Card Test)
1. **Copy prompt from AI-PROMPTS-READY-TO-USE.md** (section: "1. Six of Hearts")
2. **Open Midjourney** (or DALL-E 3)
3. **Paste prompt + add parameters:**
   ```
   /imagine prompt: [paste full prompt] --ar 2:3 --v 6 --quality 2 --style raw
   ```
4. **Generate 4 variations**
5. **Select best option** (check against mockup)
6. **Note the seed number** for consistency
7. **Download high-res image**

#### Card 2: King of Hearts (Face Card Test)
- Follow same process
- Face cards need character portraits (young warrior/regal leader/wise elder)
- Match the energy and style from mockup

#### Card 3: Ace of Hearts (Premium Card Test)
- Follow same process
- Premium treatment: larger symbol, enhanced glow, Art Deco corners

#### Card 4: 6 of Clubs (Second Suit Consistency Test)
- Follow same process
- Verify dark green color (#2F4F2F) vs fire red

#### Card 5: King of Spades (Dark Suit Face Card Test)
- Follow same process
- Near black color (#1C1C1C) with gold accents

### Phase 2: Post-Processing (Per Card)

After generating each card:

1. **Import to Figma or Photoshop**
2. **Resize to EXACTLY 512x768px**
3. **Add/refine corner indicators** (if AI didn't nail them)
   - Font: Orbitron Black (900 weight)
   - Value: 40px, Suit: 28px
   - Colors: Match suit specification
4. **Enhance Kente pattern** (if needed)
   - Create overlay layer
   - Apply geometric stripes
   - Set to 10-20% opacity
5. **Refine gold border**
   - 4px solid #FFD700
   - Add slight outer glow
6. **Color correct**
   - Background: #FFF5E6 gradient
   - Adjust saturation for arcade energy
7. **Export PNG**
   - 512x768px exact
   - Transparent background
   - sRGB color space

### Phase 3: Compression & Organization

For each completed card:

1. **Compress to <100KB**
   - Upload to TinyPNG.com
   - Download optimized version
2. **Rename properly**
   - Format: `[suit]_[value].png`
   - Examples: `hearts_6.png`, `hearts_king.png`
3. **Place in folder**
   - Path: `/Users/nana/go/src/github.com/npeprah/sparui/frontend/public/assets/cards/[suit]/`
   - Create suit folder if needed
4. **Test in browser**
   - Verify file loads correctly
   - Check sizing and quality

### Phase 4: Review & Iterate

After completing test batch:

1. **Compare all 5 cards side-by-side**
2. **Check consistency:**
   - [ ] Same style and energy across all cards
   - [ ] Suit colors distinct but cohesive
   - [ ] Kente patterns visible at consistent intensity
   - [ ] Gold borders uniform
   - [ ] Corner indicators readable
   - [ ] Arcade energy maintained
3. **Refine prompts if needed**
4. **Document any changes** in AI-GENERATION-PLAN.md

---

## Key Design Principles to Maintain

### 1. Afro-Heritage Theme Consistency
- Warm cream backgrounds (#FFF5E6, #FFE8D6, #FFF9F0)
- Kente geometric patterns (gold, brown, tan stripes)
- Gold borders (#FFD700) on ALL cards
- Cultural authenticity without stereotypes

### 2. Arcade Energy
- Bold, vibrant colors (never muddy or dim)
- High contrast cel-shaded style
- Neon glow effects on suit symbols
- Large, clear suit symbols
- Energetic, not subtle

### 3. Suit Identity
- **Hearts:** Fire red #FF4500 (passion, love)
- **Clubs:** Dark green #2F4F2F (strength, nature)
- **Diamonds:** Fire red #FF4500 (wealth, prosperity)
- **Spades:** Near black #1C1C1C (wisdom, strategy)

### 4. Card Type Hierarchy
- **Number cards (6-10):** Large centered suit symbol (160px)
- **Face cards (J, Q, K):** Character portraits with regalia
- **Aces:** PREMIUM treatment - extra large symbol (192px), enhanced effects

### 5. Technical Quality
- Exactly 512x768px (verify in editor)
- File size <100KB (compress after export)
- PNG with transparency or solid background
- sRGB color space, 72 DPI
- Sharp edges, no artifacts

---

## File Organization Structure

```
frontend/public/assets/cards/
├── hearts/
│   ├── hearts_6.png
│   ├── hearts_7.png
│   ├── hearts_8.png
│   ├── hearts_9.png
│   ├── hearts_10.png
│   ├── hearts_jack.png
│   ├── hearts_queen.png
│   ├── hearts_king.png
│   └── hearts_ace.png (9 total)
├── clubs/
│   └── [9 cards same structure]
├── diamonds/
│   └── [9 cards same structure]
└── spades/
    ├── spades_6.png
    ├── spades_7.png
    ├── spades_8.png
    ├── spades_9.png
    ├── spades_10.png
    ├── spades_jack.png
    ├── spades_queen.png
    └── spades_king.png (8 total - NO ACE)
```

---

## Quality Checklist (Per Card)

Before considering a card "complete," verify:

### Visual Quality
- [ ] Suit symbol large, centered, and clear
- [ ] Corner indicators readable at thumbnail size
- [ ] Colors match Afro-Heritage specifications
- [ ] Kente pattern visible but not overwhelming
- [ ] Gold border prominent and consistent
- [ ] No compression artifacts or pixelation
- [ ] Consistent style with other cards
- [ ] Arcade energy maintained (bold, not subtle)

### Technical Quality
- [ ] Exactly 512x768px dimensions
- [ ] PNG format with proper alpha channel
- [ ] File size under 100KB
- [ ] Proper filename convention
- [ ] Placed in correct folder
- [ ] sRGB color space
- [ ] 72 DPI resolution

### Cultural Quality
- [ ] Authentic African aesthetic
- [ ] No stereotypes or appropriation
- [ ] Kente patterns geometrically accurate
- [ ] Face cards show respectful character design
- [ ] Modern + traditional balance maintained

---

## Troubleshooting Common Issues

### Issue: AI generates photorealistic cards
**Solution:** Emphasize "cel-shaded illustration," "arcade game art," "bold comic book style" in prompt

### Issue: Suit symbols too small
**Solution:** Add "VERY LARGE," "160px size," "60% of card height" to prompt

### Issue: Colors too dim or muddy
**Solution:** Add "vibrant colors," "high contrast," "arcade energy," avoid "subtle"

### Issue: Kente pattern too overwhelming
**Solution:** Post-process to reduce opacity to 10-20%, or regenerate with "subtle background texture"

### Issue: Corner indicators unclear
**Solution:** Add them manually in Figma/Photoshop - faster than regenerating

### Issue: Inconsistent style across cards
**Solution:** Use the same seed number, or regenerate batch with reference to first card

### Issue: File size too large
**Solution:** Compress with TinyPNG, reduce PNG bit depth, or slightly lower quality

---

## Week Timeline Overview

**Day 1 (Dec 17 - TODAY):**
- Generate test batch (5 cards)
- Review and refine prompts
- Document any adjustments

**Day 2 (Dec 18):**
- Generate all Hearts (9 cards)
- Post-process and compress
- Quality check consistency

**Day 3 (Dec 19):**
- Generate all Clubs (9 cards)
- Post-process and compress
- Quality check consistency

**Day 4 (Dec 20):**
- Generate all Diamonds (9 cards)
- Post-process and compress
- Quality check consistency

**Day 5 (Dec 21):**
- Generate all Spades (8 cards)
- Post-process and compress
- Final review of all 35 cards

**Day 6 (Dec 22):**
- Create showcase HTML
- Final documentation
- Handoff to engineering

---

## Success Criteria

Task is complete when:
- [ ] All 35 cards generated with consistent Afro-Heritage style
- [ ] All cards exported as 512x768px PNG
- [ ] All cards optimized to <100KB
- [ ] All cards organized in correct folders with proper naming
- [ ] Cultural authenticity maintained throughout
- [ ] Arcade energy present in all designs
- [ ] Quality checklist passed for every card
- [ ] Documentation updated with final specs
- [ ] Engineers can begin Week 3 game scene development

---

## Files You Need

1. **Visual Mockups (JUST OPENED):**
   `/Users/nana/.claude/plugins/cache/claude-plugins-official/frontend-design/.../spar-card-mockups.html`

2. **Ready-to-Use AI Prompts:**
   `/Users/nana/go/src/github.com/npeprah/sparui/AI-PROMPTS-READY-TO-USE.md`

3. **Complete Generation Strategy:**
   `/Users/nana/go/src/github.com/npeprah/sparui/TASK-022-AI-GENERATION-PLAN.md`

4. **Theme Configuration (Reference):**
   `/Users/nana/go/src/github.com/npeprah/sparui/frontend/src/config/cardThemes.ts`

5. **Design Handoff Specs:**
   `/Users/nana/go/src/github.com/npeprah/sparui/CARD_DESIGN_HANDOFF.md`

6. **Destination Folder:**
   `/Users/nana/go/src/github.com/npeprah/sparui/frontend/public/assets/cards/`

---

## Questions or Issues?

Refer to the detailed documentation in:
- TASK-022-AI-GENERATION-PLAN.md (workflow details)
- AI-PROMPTS-READY-TO-USE.md (all prompts)
- CARD_DESIGN_HANDOFF.md (design specifications)

---

## Let's Get Started!

**Your first action:** Copy the "6 of Hearts" prompt from `AI-PROMPTS-READY-TO-USE.md` and paste it into Midjourney with the parameters:

```
--ar 2:3 --v 6 --quality 2 --style raw
```

Generate 4 variations, select the best, and start post-processing. The mockup in your browser shows exactly what you're aiming for.

**You've got this!** This is a full week task, so take your time to ensure quality and consistency. Week 3 development depends on these cards being perfect.

---

**Document Version:** 1.0
**Status:** Ready to Begin
**Next Action:** Generate first test card (6 of Hearts)
