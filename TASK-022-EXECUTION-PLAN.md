# TASK-022 Execution Plan: Generate 35 Card Images with AI

**Date:** December 17, 2025
**Designer:** arcade-ui-designer
**Priority:** P0 (Critical - Blocks Week 3)
**Estimated Time:** 40+ hours (Full Week)
**Status:** IN PROGRESS

---

## Executive Summary

Generate all 35 playing cards for Spar using the **Afro-Heritage theme** as the default design language. This is the most critical Week 2 deliverable, blocking all Week 3 game scene development.

---

## Theme: Afro-Heritage Specifications

### Color Palette
- **Background**: Warm cream (#FFF5E6, #FFE8D6, #FFF9F0)
- **Patterns**: Kente cloth geometric stripes
  - stripe1: rgba(251, 192, 45, 0.15) - Gold/Yellow
  - stripe2: rgba(139, 69, 19, 0.12) - Brown
  - stripe3: rgba(255, 215, 0, 0.10) - Gold
  - stripe4: rgba(160, 82, 45, 0.08) - Sienna
- **Borders**: Gold (#FFD700 primary, #D4AF37 secondary, #B8860B decorative)
- **Suit Colors**:
  - Hearts: #FF4500 (Fire Red)
  - Diamonds: #FF4500 (Fire Red)
  - Clubs: #2F4F2F (Dark green)
  - Spades: #1C1C1C (Near black)
- **Text**: #1C1C1C (primary), #4A4A4A (secondary)

### Design Elements
- **Kente Patterns**: Geometric overlays inspired by traditional Kente cloth
- **Gold Accents**: Metallic borders and decorative elements
- **Rounded Corners**: 24px border-radius
- **Arcade Energy**: Bold, vibrant, high-contrast for fast-paced gameplay

---

## Card Inventory (35 Total)

### Hearts (9 cards)
- Number cards: 6, 7, 8, 9, 10
- Face cards: Jack, Queen, King, Ace

### Clubs (9 cards)
- Number cards: 6, 7, 8, 9, 10
- Face cards: Jack, Queen, King, Ace

### Diamonds (9 cards)
- Number cards: 6, 7, 8, 9, 10
- Face cards: Jack, Queen, King, Ace

### Spades (8 cards) - NO ACE
- Number cards: 6, 7, 8, 9, 10
- Face cards: Jack, Queen, King

---

## Execution Phases

### Phase 1: Test Batch (CURRENT)
**Goal:** Validate Afro-Heritage style with 5 sample cards
**Time:** 4-6 hours

**Test Cards:**
1. 6 of Hearts (number card - simple)
2. 10 of Clubs (number card - different suit)
3. Jack of Diamonds (face card - character art)
4. King of Spades (face card - dark suit)
5. Ace of Hearts (premium card - special treatment)

**Success Criteria:**
- [ ] Consistent Afro-Heritage style across all 5 cards
- [ ] Colors match theme specifications from cardThemes.ts
- [ ] Kente patterns visible but not overwhelming
- [ ] Readable at small sizes (64x96px thumbnail test)
- [ ] Cultural authenticity maintained
- [ ] Arcade energy present (vibrant, high-impact)

### Phase 2: Iteration & Refinement
**Goal:** Review test batch and adjust prompts
**Time:** 2-4 hours

**Actions:**
- Review with internal quality standards
- Adjust AI prompts if needed
- Refine color consistency
- Test readability at various sizes

### Phase 3: Full Production - Hearts (9 cards)
**Goal:** Generate all Hearts suit cards
**Time:** 6-8 hours

**Cards:** 6, 7, 8, 9, 10, Jack, Queen, King, Ace

### Phase 4: Full Production - Clubs (9 cards)
**Goal:** Generate all Clubs suit cards
**Time:** 6-8 hours

**Cards:** 6, 7, 8, 9, 10, Jack, Queen, King, Ace

### Phase 5: Full Production - Diamonds (9 cards)
**Goal:** Generate all Diamonds suit cards
**Time:** 6-8 hours

**Cards:** 6, 7, 8, 9, 10, Jack, Queen, King, Ace

### Phase 6: Full Production - Spades (8 cards)
**Goal:** Generate all Spades suit cards (NO ACE)
**Time:** 5-7 hours

**Cards:** 6, 7, 8, 9, 10, Jack, Queen, King

### Phase 7: Post-Processing
**Goal:** Optimize all 35 cards
**Time:** 4-6 hours

**Tasks:**
- Resize all cards to exactly 512x768px
- Compress all cards to <100KB each
- Quality check all cards
- Verify folder organization
- Create visual showcase/preview

### Phase 8: Documentation & Handoff
**Goal:** Complete deliverables
**Time:** 2-3 hours

**Deliverables:**
- All 35 card PNG files
- Updated CARD_DESIGN_HANDOFF.md
- Sample showcase HTML
- Design notes document

---

## AI Prompt Templates

### Number Cards (6-10)

```
African-inspired playing card, [VALUE] of [SUIT], Afro-Heritage theme,
warm cream background (#FFF5E6 to #FFE8D6 gradient),
traditional Kente cloth geometric patterns with subtle gold and brown stripes,
gold metallic border (#FFD700) with 24px rounded corners,
large centered [SUIT] symbol in [SUIT_COLOR],
corner indicators: "[VALUE]" (top-left) and "[SUIT_SYMBOL]" below,
mirrored bottom-right corner (180° rotation),

STYLE:
- Bold digital illustration, arcade game art style
- High contrast, vibrant colors, cel-shaded rendering
- Metallic gold accents and decorative elements
- Neon glow effect on suit symbol
- Clean professional game asset quality
- 512x768px vertical format

ELEMENTS:
- Kente pattern: repeating geometric stripes (gold, brown, tan)
- Suit symbol: gradient shading, neon glow
- Border: thick gold frame with decorative corners
- Background: warm cream felt texture

MOOD: Energetic, vibrant, bold, modern African aesthetic,
arcade game energy, high contrast, culturally proud

AVOID: Photorealism, excessive detail, cultural appropriation,
busy backgrounds, low contrast
```

### Face Cards (Jack, Queen, King)

```
African-inspired [FACE_CARD] of [SUIT], Afro-Heritage theme,
character portrait in [SUIT_COLOR] and gold,
arcade game character art, high contrast cel-shaded illustration,

CHARACTER:
- [AGE_DESCRIPTION] with confident, commanding presence
- Modern African fashion with geometric Kente patterns
- [CARD_APPROPRIATE] regalia (crown for King, elegant attire for Queen, warrior gear for Jack)
- Stylized portrait (comic book style, NOT photorealistic)
- Direct eye contact, powerful pose
- Cultural pride without stereotypes

BACKGROUND:
- Warm cream background with Kente cloth pattern
- Gold metallic border (#FFD700) with 24px rounded corners
- Corner indicators: "[LETTER]" and "[SUIT_SYMBOL]"
- Mirrored bottom-right corner

STYLE:
- Bold comic book outlines, cel-shaded
- Vibrant [SUIT_COLOR] and gold color scheme
- Metallic highlights and neon glows
- 512x768px vertical format
- Arcade game character portrait aesthetic
- High contrast for readability

MOOD: [Confident/Regal/Wise], powerful, culturally proud,
arcade energy, bold and striking

AVOID: Photorealism, stereotypes, excessive detail
```

### Ace Cards (Premium Treatment)

```
African-inspired Ace of [SUIT], Afro-Heritage theme,
premium luxury design, [SUIT_COLOR] and gold,
arcade game art, high contrast digital illustration,

LAYOUT:
- EXTRA LARGE centered [SUIT_SYMBOL] (60% of card height)
- Premium ornate Kente cloth pattern background
- Enhanced golden decorative borders with Art Deco style
- Corner indicators: "A" and [SUIT_SYMBOL]
- Mirrored bottom-right corner

SPECIAL FEATURES:
- Massive suit symbol with gradient mesh
- Metallic gold sheen and reflections
- Enhanced neon glow effect (brightest of all cards)
- Ornate corner decorations with geometric patterns
- Premium luxury feel (highest value card)
- Extra decorative Kente pattern elements

STYLE:
- Bold outlines, maximum visual impact
- Vibrant gradients with metallic accents
- 512x768px vertical format
- Most impressive and premium card in deck
- Warm cream background (#FFF5E6)

MOOD: Premium, powerful, prestigious, show-stopping,
ultimate card, arcade spectacle

AVOID: Photorealism, understated design, low impact
```

---

## Card-Specific Prompt Details

### Hearts (Fire Red #FF4500)
- **Energy:** Passion, love, intensity
- **Kente Colors:** Red, gold, orange geometric patterns
- **Glow:** Fire red neon effect
- **Jack:** Young warrior with confident stance
- **Queen:** Regal woman with elegant traditional attire
- **King:** Mature leader with crown and authority
- **Ace:** Massive heart symbol with flames and gold

### Clubs (Dark Green #2F4F2F)
- **Energy:** Strength, power, nature
- **Kente Colors:** Green, brown, gold geometric patterns
- **Glow:** Forest green soft glow
- **Jack:** Strong warrior with nature-inspired elements
- **Queen:** Wise woman with earth-tone regalia
- **King:** Powerful leader with natural authority
- **Ace:** Large club symbol with leaves and growth motifs

### Diamonds (Fire Red #FF4500)
- **Energy:** Wealth, prosperity, value
- **Kente Colors:** Gold, amber, yellow geometric patterns
- **Glow:** Golden metallic shine
- **Jack:** Young noble with rich attire
- **Queen:** Elegant woman with luxurious jewelry
- **King:** Wealthy ruler with golden crown
- **Ace:** Sparkling diamond symbol with rays of light

### Spades (Near Black #1C1C1C)
- **Energy:** Wisdom, strategy, mystery
- **Kente Colors:** Dark purple, black, silver geometric patterns
- **Glow:** Dark mystical aura
- **Jack:** Strategic warrior with tactical presence
- **Queen:** Mysterious woman with intellectual bearing
- **King:** Wise elder with deep knowledge
- **NO ACE** (per game rules)

---

## Technical Specifications

### Export Settings
- **Format:** PNG with alpha transparency
- **Dimensions:** 512x768px (exactly)
- **Color Space:** sRGB
- **Bit Depth:** 32-bit (24-bit RGB + 8-bit alpha)
- **Resolution:** 72 DPI
- **Compression:** Optimized PNG
- **Target Size:** <100KB per card

### File Naming
- Format: `[suit]_[value].png`
- Examples: `hearts_6.png`, `clubs_king.png`, `diamonds_ace.png`
- All lowercase
- Underscores separate suit and value

### Folder Structure
```
frontend/public/assets/cards/
├── hearts/    (9 cards)
├── clubs/     (9 cards)
├── diamonds/  (9 cards)
└── spades/    (8 cards - NO ACE)
```

---

## Quality Checklist (Per Card)

### Visual Quality
- [ ] Suit symbol clearly visible and recognizable
- [ ] Corner indicators readable at 64x96px thumbnail
- [ ] Colors match Afro-Heritage theme specifications
- [ ] Kente pattern visible but not overwhelming
- [ ] Gold border prominent and polished
- [ ] No compression artifacts or pixelation
- [ ] Consistent style with other cards in suit
- [ ] Professional game asset quality
- [ ] Cultural authenticity maintained
- [ ] Arcade energy present (vibrant, impactful)

### Technical Quality
- [ ] Exactly 512x768px dimensions
- [ ] PNG format with alpha channel
- [ ] File size under 100KB
- [ ] Proper filename convention
- [ ] Placed in correct folder
- [ ] sRGB color space
- [ ] 72 DPI resolution

### Consistency Check
- [ ] Face cards have similar character style across suits
- [ ] Number cards have similar layout across suits
- [ ] Aces have premium treatment across all suits (except Spades)
- [ ] Color palettes distinct by suit but cohesive overall
- [ ] Pattern intensity consistent
- [ ] Border style consistent

---

## Risk Mitigation

### Risk 1: Style Inconsistency
**Mitigation:** Generate test batch first, refine prompts before full production

### Risk 2: Cultural Authenticity
**Mitigation:** Research Kente patterns, avoid stereotypes, focus on pride and heritage

### Risk 3: Readability at Small Sizes
**Mitigation:** Test thumbnails at 64x96px, ensure bold outlines and high contrast

### Risk 4: File Size Exceeds 100KB
**Mitigation:** Use TinyPNG, reduce complexity if needed, optimize compression

### Risk 5: Time Overrun
**Mitigation:** Work in batches, set daily targets, batch similar cards together

---

## Timeline

### Week 2 Schedule
- **Monday:** Test batch (5 cards) + iteration
- **Tuesday:** Hearts full suit (9 cards)
- **Wednesday:** Clubs full suit (9 cards)
- **Thursday:** Diamonds full suit (9 cards)
- **Friday:** Spades full suit (8 cards) + post-processing
- **Weekend Buffer:** Quality check, documentation, handoff prep

---

## Success Metrics

### Phase 1 Success (Test Batch)
- 5 high-quality sample cards generated
- Style validated and approved internally
- Prompts refined and documented
- Ready to proceed to full production

### Full Project Success
- All 35 cards generated and optimized
- Consistent Afro-Heritage style throughout
- All cards <100KB file size
- Readable at all display sizes
- Cultural authenticity maintained
- Arcade energy captured
- Engineers can integrate immediately
- Zero blocking issues for Week 3

---

## Notes & Learnings

### Design Decisions
*(To be filled as work progresses)*

### AI Prompt Refinements
*(To be documented during iteration)*

### Technical Challenges
*(To be noted if encountered)*

---

**Document Version:** 1.0
**Last Updated:** December 17, 2025
**Status:** Ready to begin Phase 1 (Test Batch)
