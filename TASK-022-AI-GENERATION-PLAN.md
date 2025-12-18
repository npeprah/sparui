# TASK-022: AI Card Generation Strategy

**Date:** December 17, 2025
**Designer:** arcade-ui-designer
**Status:** In Progress - Test Batch Phase
**Priority:** P0 CRITICAL (blocks Week 3)

---

## Executive Summary

This document outlines the complete strategy for generating all 35 playing cards for the Spar game using AI image generation tools. The selected theme is **Afro-Heritage**, featuring warm cream backgrounds, Kente cloth patterns, and gold accents.

---

## Phase 1: Test Batch (3-5 Cards)

### Selected Test Cards
1. **6 of Hearts** - Basic number card test
2. **King of Hearts** - Face card character test
3. **Ace of Hearts** - Premium card treatment test
4. **6 of Clubs** - Second suit consistency test
5. **King of Spades** - Dark suit face card test

### Success Criteria for Test Batch
- [ ] Consistent Afro-Heritage visual style
- [ ] Clear suit symbols at 512x768px
- [ ] Readable corner indicators
- [ ] Kente patterns visible but subtle
- [ ] Gold borders prominent
- [ ] Arcade energy maintained
- [ ] Cultural authenticity without stereotypes
- [ ] File size <100KB after compression

---

## AI Tool Selection

### Primary Tool: Midjourney v6
**Reasons:**
- Best consistency across batch generations
- Superior quality for illustrated game assets
- Excellent at following detailed prompts
- Strong with geometric patterns and cultural design

### Backup Tool: DALL-E 3
**Reasons:**
- Good for iterative refinements
- Better text integration (for corner indicators)
- Faster generation for quick tests

### Post-Processing Tools
- **Figma** - Layout refinement, text overlay
- **Photoshop** - Color correction, pattern overlays
- **TinyPNG** - Compression to meet <100KB requirement

---

## Master AI Prompt Template

### Base Structure (All Cards)
```
Playing card design for African-inspired arcade card game,
[CARD_SPECIFIC_DETAILS],
512x768 pixels vertical format,

LAYOUT:
- Rounded corners (24px radius)
- Gold metallic border (4px, #FFD700)
- Warm cream background gradient (#FFF5E6 to #FFE8D6 to #FFF9F0)
- Subtle Kente cloth geometric pattern overlay (10% opacity)
- Corner indicators: top-left [VALUE], bottom-right [VALUE] rotated 180°
- Small suit symbol below value in corners

AESTHETIC:
- Bold arcade game art style
- High contrast cel-shaded illustration
- Vibrant colors with metallic gold accents
- Clean vector-like rendering
- Modern African design language
- Energetic and bold, not subtle

COLOR PALETTE:
- Background: Warm cream (#FFF5E6, #FFE8D6, #FFF9F0)
- Border: Metallic gold (#FFD700, #D4AF37, #B8860B)
- Patterns: Kente stripes (gold #FBC02D, brown #8B4513, tan #A0522D)
- [SUIT_SPECIFIC_COLORS]

TECHNICAL:
- Clean edges for PNG export
- No background (transparent or solid cream)
- Professional game asset quality
- Optimized for digital display
- Sharp details, no blur or artifacts

AVOID:
- Photorealistic rendering
- Cultural stereotypes
- Overly busy details
- Dim or muddy colors
- Generic playing card designs
```

---

## Suit-Specific Prompt Additions

### Hearts (Passion/Fire)
```
SUIT: Hearts (♥)
COLOR: Fire red (#FF4500) with gold accents
PATTERN TINT: Red Kente overlay (rgba(229, 57, 53, 0.15))
MOOD: Passionate, energetic, warm, powerful
SYMBOL: Large centered heart symbol with gradient shading (red to orange)
```

### Clubs (Strength/Nature)
```
SUIT: Clubs (♣)
COLOR: Dark green (#2F4F2F) with gold accents
PATTERN TINT: Green Kente overlay (rgba(0, 100, 0, 0.15))
MOOD: Strong, grounded, natural, resilient
SYMBOL: Large centered club symbol with gradient shading (dark green to forest green)
```

### Diamonds (Wealth/Prosperity)
```
SUIT: Diamonds (♦)
COLOR: Fire red (#FF4500) with gold accents (same as hearts)
PATTERN TINT: Gold Kente overlay (rgba(255, 215, 0, 0.15))
MOOD: Prosperous, luxurious, prestigious, bold
SYMBOL: Large centered diamond symbol with gradient shading (red to gold)
```

### Spades (Wisdom/Strategy)
```
SUIT: Spades (♠)
COLOR: Near black (#1C1C1C) with gold accents
PATTERN TINT: Dark Kente overlay (rgba(28, 28, 28, 0.15))
MOOD: Strategic, wise, mysterious, powerful
SYMBOL: Large centered spade symbol with gradient shading (black to dark gray)
```

---

## Card Type-Specific Prompts

### Number Cards (6-10)

**Complete Prompt:**
```
Playing card design for African-inspired arcade card game,
[VALUE] of [SUIT], number card,
512x768 pixels vertical format,

LAYOUT:
- Rounded corners (24px radius)
- Gold metallic border (4px, #FFD700)
- Warm cream background gradient (#FFF5E6 to #FFE8D6 to #FFF9F0)
- Subtle Kente cloth geometric pattern overlay (10% opacity)
- Top-left corner: Bold "[VALUE]" text + small [SUIT] symbol below
- Bottom-right corner: Same as top-left, rotated 180°
- Center: VERY LARGE [SUIT] symbol (160px equivalent, 60% of card height)

CENTER SYMBOL DETAILS:
- Gradient shading from [SUIT_PRIMARY_COLOR] to [SUIT_ACCENT_COLOR]
- Subtle metallic sheen effect
- Neon glow outline (8px blur, [SUIT_COLOR] at 50% opacity)
- Bold black outline (3px)

CORNER INDICATORS:
- Font: Bold geometric sans-serif (Orbitron-style)
- Value size: 40px equivalent
- Suit symbol size: 28px equivalent
- Color: [SUIT_PRIMARY_COLOR]
- Bold black outline with neon glow shadow

KENTE PATTERN:
- Geometric stripes: vertical, horizontal, diagonal
- Colors: Gold (#FBC02D), brown (#8B4513), tan (#A0522D)
- Tinted with [SUIT_COLOR_OVERLAY]
- Very subtle, 10% opacity, background texture only

AESTHETIC:
- Bold arcade game art style
- High contrast cel-shaded illustration
- Vibrant colors with metallic gold accents
- Clean vector-like rendering
- Modern African design language
- Energetic and bold, not subtle

TECHNICAL:
- Clean edges for PNG export
- Solid cream background or transparent
- Professional game asset quality
- Optimized for digital display
- Sharp details, no blur or artifacts

MOOD: [SUIT_MOOD_DESCRIPTOR]

AVOID:
- Photorealistic rendering
- Cultural stereotypes or appropriation
- Overly busy details that distract from suit symbol
- Dim or muddy colors
- Generic playing card designs
- Small or unclear suit symbols
```

### Face Cards (Jack, Queen, King)

**Complete Prompt:**
```
Playing card design for African-inspired arcade card game,
[FACE_RANK] of [SUIT], face card with character portrait,
512x768 pixels vertical format,

LAYOUT:
- Rounded corners (24px radius)
- Gold metallic border (4px, #FFD700)
- Warm cream background gradient (#FFF5E6 to #FFE8D6 to #FFF9F0)
- Kente cloth geometric pattern (more visible, 20% opacity)
- Top-left corner: Bold "[FIRST_LETTER]" + small [SUIT] symbol
- Bottom-right corner: Same as top-left, rotated 180°
- Center: Stylized character portrait (60% of card height)

CHARACTER DESIGN:
- [CHARACTER_AGE_DESCRIPTION]:
  * Jack: Young warrior (20s), athletic, energetic
  * Queen: Regal leader (30s), elegant, commanding
  * King: Wise elder (40s+), authoritative, powerful
- Modern African fashion with geometric patterns
- [FACE_RANK]-appropriate regalia (subtle crowns, jewelry, accessories)
- Direct eye contact, confident frontal pose
- Stylized comic book/arcade game art (NOT photorealistic)
- Bold black outlines (4px), cel-shaded rendering
- [SUIT_COLOR] color scheme in clothing and accessories
- Gold metallic accents on regalia

BACKGROUND:
- Kente cloth pattern more visible than number cards
- [SUIT_COLOR]-tinted overlay (20% opacity)
- Geometric borders with gold corner decorations
- Subtle radial gradient behind character (lighter in center)

CORNER INDICATORS:
- Font: Bold geometric sans-serif (Orbitron-style)
- Letter: J/Q/K (40px equivalent)
- Suit symbol size: 28px equivalent
- Color: [SUIT_PRIMARY_COLOR]
- Bold black outline with neon glow shadow

AESTHETIC:
- Comic book character portrait style
- High contrast cel-shaded illustration
- Vibrant [SUIT_COLOR] with metallic gold accents
- Clean vector-like rendering
- Modern African design language
- Cultural pride without stereotypes
- Arcade game character energy

CHARACTER EXPRESSION:
- Jack: Confident, energetic, ready for action
- Queen: Regal, elegant, commanding presence
- King: Wise, powerful, authoritative

TECHNICAL:
- Clean edges for PNG export
- Professional game asset quality
- Character centered, shoulders and head visible
- Sharp details on face and regalia
- No blur or artifacts

MOOD: [Confident/Regal/Wise], powerful, culturally proud, arcade game hero

AVOID:
- Photorealistic rendering
- Cultural stereotypes
- Excessive detail that loses clarity at card size
- Generic or corporate portrait style
- Busy backgrounds that distract from character
- Dim or muddy colors
```

### Ace Cards (Premium Treatment)

**Complete Prompt:**
```
Playing card design for African-inspired arcade card game,
ACE of [SUIT], premium luxury card design,
512x768 pixels vertical format,

LAYOUT:
- Rounded corners (24px radius)
- ENHANCED gold metallic border (6px, gradient #FFD700 to #D4AF37)
- Warm cream background gradient (#FFF5E6 to #FFE8D6 to #FFF9F0)
- PREMIUM Kente cloth pattern (more ornate, 15% opacity)
- Top-left corner: Bold "A" + small [SUIT] symbol
- Bottom-right corner: Same as top-left, rotated 180°
- Center: EXTRA LARGE [SUIT] symbol (192px equivalent, 70% of card height)

CENTER SYMBOL DETAILS:
- Premium gradient mesh shading [SUIT_PRIMARY_COLOR] to [SUIT_ACCENT_COLOR]
- Metallic sheen with reflective highlights
- ENHANCED neon glow outline (12px blur, [SUIT_COLOR] at 70% opacity)
- Bold black outline (4px)
- Gradient overlay suggesting depth and dimension
- Slight 3D effect with subtle shadow

CORNER DECORATIONS:
- Art Deco style ornate geometric patterns
- Gold metallic corner flourishes (top-left, bottom-right)
- More elaborate than other cards

CORNER INDICATORS:
- Font: Bold geometric sans-serif (Orbitron-style)
- Letter: "A" (48px equivalent, larger than other cards)
- Suit symbol size: 32px equivalent
- Color: [SUIT_PRIMARY_COLOR]
- Enhanced glow effect

KENTE PATTERN:
- More ornate and visible than number cards
- Enhanced geometric complexity
- Colors: Gold (#FBC02D), brown (#8B4513), tan (#A0522D)
- Tinted with [SUIT_COLOR_OVERLAY]
- 15% opacity, premium texture

AESTHETIC:
- PREMIUM luxury feel (highest value card)
- Bold arcade game art style
- MAXIMUM visual impact
- Vibrant colors with metallic gold accents
- Clean vector-like rendering
- Modern African luxury design
- Show-stopping, prestigious

TECHNICAL:
- Clean edges for PNG export
- Professional game asset quality
- Optimized for digital display
- Sharp details, no blur or artifacts
- Most impressive card in the deck

MOOD: Premium, powerful, prestigious, show-stopping, [SUIT_MOOD]

AVOID:
- Photorealistic rendering
- Cultural stereotypes
- Subtle or understated design (go BIG)
- Dim or muddy colors
- Generic ace of spades designs
```

---

## Generation Workflow

### Step 1: Generate Base Images (Per Card Type)
1. Use Midjourney v6 with appropriate prompt
2. Generate 4 variations (--v 4)
3. Use seed for consistency (--seed [NUMBER])
4. Request high quality (--quality 2)
5. Square aspect ratio first (--ar 2:3 for 512:768)

**Example Midjourney Command:**
```
/imagine prompt: [FULL_PROMPT_TEXT] --ar 2:3 --v 6 --quality 2 --style raw
```

### Step 2: Select Best Variation
Evaluate based on:
- Visual impact and arcade energy
- Clarity of suit symbols
- Consistency with Afro-Heritage theme
- Cultural authenticity
- Professional quality

### Step 3: Post-Processing in Figma/Photoshop
1. **Import AI-generated image**
2. **Resize to exactly 512x768px**
3. **Add/refine corner indicators** (if AI didn't nail them)
   - Font: Orbitron Bold or similar geometric sans
   - Size: 40px for value, 28px for suit symbol
   - Color: Match suit primary color
   - Effects: Black outline + neon glow
4. **Enhance Kente pattern overlay** (if needed)
   - Create pattern layer with geometric stripes
   - Apply suit-specific color tint
   - Adjust opacity (10-20%)
5. **Refine gold border**
   - Ensure 4px solid border
   - Apply gradient if premium card (Ace)
   - Add slight outer glow
6. **Color correction**
   - Ensure background matches #FFF5E6 gradient
   - Boost saturation if needed
   - Adjust contrast for arcade energy
7. **Export as PNG**
   - 512x768px exact
   - Transparent or solid background
   - 8-bit per channel
   - sRGB color space

### Step 4: Compression
1. Upload to TinyPNG.com
2. Compress to <100KB
3. Verify quality maintained
4. Download optimized PNG

### Step 5: Organization
1. Rename to convention: `[suit]_[value].png`
2. Place in appropriate folder: `frontend/public/assets/cards/[suit]/`
3. Verify file in correct location
4. Test load in browser

---

## Batch Generation Strategy

### Week 2 Timeline (Full Week)

**Day 1 (Today - Dec 17):**
- Generate test batch (5 cards)
- Review and refine prompts
- Document any adjustments needed

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
- Quality check consistency
- Final review of all 35 cards

**Day 6 (Dec 22):**
- Create showcase HTML
- Final documentation
- Handoff to engineering

---

## Quality Assurance Checklist

### Per-Card Checklist
- [ ] Exact dimensions: 512x768px
- [ ] File size: <100KB
- [ ] PNG format with proper alpha channel
- [ ] Filename follows convention
- [ ] Placed in correct folder
- [ ] Suit symbol large and clear
- [ ] Corner indicators readable
- [ ] Colors match Afro-Heritage theme
- [ ] Kente pattern visible but subtle
- [ ] Gold border prominent
- [ ] No compression artifacts
- [ ] Consistent style with test batch
- [ ] Arcade energy maintained
- [ ] Cultural authenticity respected

### Cross-Card Consistency Checklist
- [ ] All number cards have similar layout
- [ ] All face cards have similar character style
- [ ] All aces have similar premium treatment
- [ ] Hearts consistent across all values
- [ ] Clubs consistent across all values
- [ ] Diamonds consistent across all values
- [ ] Spades consistent across all values
- [ ] Suit colors distinct but cohesive
- [ ] Pattern intensity consistent within card type
- [ ] Border style uniform across all cards

---

## Prompt Refinement Log

### Version 1.0 (Initial - Dec 17)
- Base template created from CARD_DESIGN_HANDOFF.md
- Incorporated Afro-Heritage theme specifications from cardThemes.ts
- Added detailed suit-specific color guidance
- Structured prompts by card type (number, face, ace)

### [Updates will be logged here as we iterate]

---

## Test Batch Results

### 6 of Hearts
**Status:** [PENDING]
**Midjourney Seed:** [TBD]
**Notes:** [TBD]

### King of Hearts
**Status:** [PENDING]
**Midjourney Seed:** [TBD]
**Notes:** [TBD]

### Ace of Hearts
**Status:** [PENDING]
**Midjourney Seed:** [TBD]
**Notes:** [TBD]

### 6 of Clubs
**Status:** [PENDING]
**Midjourney Seed:** [TBD]
**Notes:** [TBD]

### King of Spades
**Status:** [PENDING]
**Midjourney Seed:** [TBD]
**Notes:** [TBD]

---

## Document Status

**Phase:** Test Batch Generation
**Next Action:** Generate first test card (6 of Hearts)
**Blocker:** None
**ETA:** Test batch complete by end of Day 1

---

**Last Updated:** December 17, 2025
**Document Version:** 1.0
