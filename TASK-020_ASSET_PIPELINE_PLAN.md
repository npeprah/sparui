# TASK-020: Asset Creation Pipeline Plan

**Date:** December 17, 2025
**Designer:** arcade-ui-designer
**Status:** COMPLETE
**Duration:** 2 hours

---

## Executive Summary

This document defines the complete asset creation pipeline for Spar, including AI tool evaluation, prompt templates, style guidelines, and workflow for generating all visual assets needed for Week 2.

---

## 1. AI Tool Evaluation

### Tools Considered

#### Midjourney v6
**Pros:**
- Exceptional artistic quality and style consistency
- Strong with stylized, illustrative art
- Good at African-inspired patterns and cultural aesthetics
- Batch generation capabilities
- Discord-based workflow (easy sharing with team)

**Cons:**
- Requires Discord subscription ($10-60/month)
- Less precise control over specific elements
- Slower iteration (queue-based)

**Best For:** Card face designs, avatars, artistic elements

---

#### DALL-E 3 (via ChatGPT Plus)
**Pros:**
- Excellent prompt understanding
- Good consistency across generations
- Easy to iterate with conversational refinement
- Better at specific technical requirements (dimensions, layouts)
- Direct integration with GPT-4 for prompt optimization

**Cons:**
- Sometimes overcomplicates simple requests
- Can be overly "safe" with artistic choices

**Best For:** Technical assets, UI elements, specific card layouts

---

#### Leonardo.ai
**Pros:**
- Game asset focused
- Built-in upscaling and refinement tools
- Consistent style across batches
- Good at arcade/retro aesthetics
- More control over generation parameters

**Cons:**
- Learning curve for platform
- Free tier has limited credits

**Best For:** Card backs, particle textures, arcade-style effects

---

#### Stable Diffusion (Local/ComfyUI)
**Pros:**
- Complete control over generation
- No subscription costs
- Can fine-tune models for consistency
- Batch processing at scale

**Cons:**
- Requires technical setup
- Needs GPU for speed
- Steeper learning curve

**Best For:** Large batch generation, iteration after style is locked

---

### Recommended Tool Strategy

**Primary Tool: Midjourney v6**
- Use for all card illustrations (35 cards)
- Use for player avatars (5 characters)
- Use for any hero artwork

**Secondary Tool: DALL-E 3**
- Use for iteration and refinement
- Use for technical assets (particle textures)
- Use for poker table surface

**Backup Tool: Leonardo.ai**
- Use for particle effects and arcade-style elements
- Use for card backs and decorative patterns

---

## 2. Card Design Style Definition

### Visual Direction: "Afro-Futurism Meets Arcade Energy"

#### Core Aesthetic Principles

**1. African-Inspired Patterns**
- Kente cloth geometric motifs
- Adinkra symbols as decorative elements
- Ankara fabric patterns in backgrounds
- West African color combinations (gold, red, green, black)
- Subtle tribal patterns without cultural appropriation

**2. Vibrant Arcade Energy**
- High saturation colors
- Bold outlines (thick black strokes)
- Dynamic composition
- Gradient overlays for depth
- Neon accent highlights

**3. Modern Digital Illustration**
- Clean vector-style rendering
- Geometric shapes and symmetry
- Gradient mesh effects
- Metallic sheens on face cards
- Glow effects on suit symbols

---

### Card Layout Specifications

```
┌─────────────────────┐
│ [Value]       [Suit]│ ← Corner indicators (small)
│                     │
│                     │
│                     │
│    [CENTRAL SUIT    │ ← Large centered suit symbol
│     SYMBOL WITH     │   with gradient and glow
│     PATTERN]        │
│                     │
│                     │
│                     │
│ [Suit]      [Value] │ ← Mirrored corner (upside down)
└─────────────────────┘

Dimensions: 512x768px (2:3 ratio)
Border: 8px rounded corners (radius 20px)
Background: Subtle texture gradient
```

---

### Color Palette by Suit

**Hearts (Love/Passion)**
- Primary: Fire Red `#FF4500`
- Secondary: Gold `#FFD700`
- Accent: Deep Crimson `#DC143C`
- Background: Warm cream with red gradient

**Clubs (Strength/Power)**
- Primary: Rich Green `#0A5F38`
- Secondary: Gold `#FFD700`
- Accent: Dark Forest `#006400`
- Background: Cream with green gradient

**Diamonds (Wealth/Prosperity)**
- Primary: Gold `#FFD700`
- Secondary: Deep Purple `#8B00FF`
- Accent: Amber `#FFBF00`
- Background: Light gold gradient

**Spades (Wisdom/Strategy)**
- Primary: Deep Purple `#8B00FF`
- Secondary: Ice Blue `#00BFFF`
- Accent: Midnight Blue `#191970`
- Background: Cool gray with purple gradient

---

### Face Card Character Design

**Jack (Young Warrior)**
- Age: 20s
- Style: Modern warrior with traditional elements
- Pose: Three-quarter profile, confident stance
- Details: Geometric face paint, contemporary African fashion
- Background: Abstract pattern with suit motifs

**Queen (Regal Leader)**
- Age: 30s-40s
- Style: Elegant authority with cultural pride
- Pose: Full frontal, commanding presence
- Details: Crown with Adinkra symbols, flowing garments
- Background: Ornate geometric patterns

**King (Wise Elder)**
- Age: 50s+
- Style: Powerful dignity with ancestral wisdom
- Pose: Seated in authority, wise gaze
- Details: Traditional regalia modernized, staff/scepter
- Background: Complex layered patterns

---

## 3. Prompt Templates

### Number Cards (6-10) - Detailed Template

```
African-inspired playing card design, [VALUE] of [SUIT],
vibrant [SUIT COLOR] and gold color scheme,
arcade game art style, high contrast, digital illustration,

LAYOUT:
- Large centered [SUIT] symbol with gradient shading
- [SUIT]-colored Kente cloth pattern in background
- Geometric border with rounded corners
- Corner indicators with [VALUE] and small [SUIT] icon

STYLE:
- Bold outlines, cel-shaded rendering
- Metallic gold accents and highlights
- Neon glow effect on suit symbol
- Subtle felt texture background
- 512x768px vertical card format
- Clean, readable, professional quality

MOOD: Energetic, vibrant, modern African aesthetic
```

**Example Filled In (7 of Hearts):**
```
African-inspired playing card design, 7 of Hearts,
vibrant fire red and gold color scheme,
arcade game art style, high contrast, digital illustration,

LAYOUT:
- Large centered heart symbol with gradient shading from crimson to red
- Red-colored Kente cloth geometric pattern in background
- Geometric border with rounded corners (20px radius)
- Corner indicators with "7" and small heart icon

STYLE:
- Bold black outlines, cel-shaded rendering
- Metallic gold accents and highlights
- Neon glow effect on heart symbol
- Subtle cream felt texture background
- 512x768px vertical card format
- Clean, readable, professional quality

MOOD: Passionate, energetic, vibrant, modern African aesthetic,
warm color temperature, arcade game energy
```

---

### Face Cards (Jack, Queen, King) - Detailed Template

```
African-inspired [FACE] of [SUIT] playing card,
character portrait in [SUIT COLOR] and gold,
arcade game character art, high contrast digital illustration,

CHARACTER:
- [AGE DESCRIPTION] [GENDER] with [CULTURAL DETAILS]
- [POSE DESCRIPTION]
- Modern African fashion with traditional elements
- Geometric face paint with [SUIT] motifs
- [ACCESSORIES/REGALIA]

BACKGROUND:
- [SUIT]-colored Kente cloth pattern
- Adinkra symbols subtly integrated
- Geometric Art Deco style borders
- Corner indicators with "[FACE]" and [SUIT] icon

STYLE:
- Bold comic book style outlines
- Cel-shaded rendering with metallic highlights
- Vibrant colors with neon accents
- 512x768px vertical format
- Arcade game character portrait quality

MOOD: [Confident/Regal/Wise], powerful, culturally proud
```

**Example Filled In (Queen of Diamonds):**
```
African-inspired Queen of Diamonds playing card,
character portrait in gold and deep purple,
arcade game character art, high contrast digital illustration,

CHARACTER:
- Elegant Black woman in her 30s-40s with regal bearing
- Full frontal pose, commanding presence, direct eye contact
- Modern African fashion: flowing gold and purple robes with geometric patterns
- Geometric face paint with diamond motifs on cheeks
- Crown adorned with Adinkra Gye Nyame symbol, gold jewelry

BACKGROUND:
- Gold and purple Kente cloth pattern with diamond shapes
- Adinkra symbols subtly woven into fabric
- Geometric Art Deco style borders with metallic sheen
- Corner indicators with "Q" and small diamond icon

STYLE:
- Bold comic book style black outlines
- Cel-shaded rendering with metallic gold and purple highlights
- Vibrant colors with neon amber accents around crown
- 512x768px vertical format
- Arcade game character portrait quality, stylized not photorealistic

MOOD: Regal, powerful, wise, dignified, culturally proud,
warm lighting, commanding presence
```

---

## 4. Asset Specifications

### Playing Cards
- **Dimensions:** 512x768px PNG
- **Format:** PNG with alpha transparency
- **Color Space:** sRGB
- **Resolution:** 72 DPI (web-optimized)
- **File Size:** <100KB each (post-compression)
- **Naming Convention:** `[suit]_[value].png`
  - Examples: `hearts_ace.png`, `clubs_6.png`, `diamonds_king.png`

### Particle Textures
- **Fire Particle:** 256x256px PNG with alpha
  - Organic flame shape
  - Orange (#FF8C00) to red (#FF4500) gradient
  - Transparent edges for blending

- **Ice Particle:** 256x256px PNG with alpha
  - Sharp crystalline geometric shape
  - Light blue (#87CEEB) to white gradient
  - Sparkle highlights

- **Explosion Particle:** 256x256px PNG with alpha
  - Star/sparkle burst shape
  - Gold (#FFD700) to yellow (#FFFF00) gradient
  - Radial glow

- **Confetti Pieces:** 128x128px each (5 colors)
  - Simple rectangular pieces
  - Solid colors: Red, Blue, Green, Gold, Purple
  - Slight rotation variation

### Player Avatars
- **Dimensions:** 256x256px PNG with alpha
- **Count:** 5 unique characters
- **Style:** Friendly, cartoon-style, diverse
- **Diversity:** Mix of genders, ages, styles
- **Background:** Transparent (circular vignette okay)
- **File Size:** <50KB each

### Poker Table Surface
- **Dimensions:** 1920x1080px minimum (can be larger)
- **Format:** PNG or WebP
- **Theme:** Professional poker table
- **Colors:**
  - Felt Green: `#0A5F38`
  - Wood Trim: `#4A2511`
  - Gold Accents: `#D4AF37`
- **Details:** Subtle felt texture, wood grain trim, ornate gold corner details
- **File Size:** <500KB (optimized)

---

## 5. Workflow Process

### Phase 1: Test Cards (Hearts Suit - 9 cards)
**Purpose:** Validate style before generating all 35 cards

**Steps:**
1. Generate 6 of Hearts (simple number card test)
2. Generate King of Hearts (face card test)
3. Generate Ace of Hearts (high-value number card test)
4. Share with team for feedback
5. Iterate based on feedback
6. If approved, generate remaining Hearts (7, 8, 9, 10, Jack, Queen)

**Success Criteria:**
- Style feels vibrant and arcade-inspired
- African patterns visible but not overwhelming
- Cards are readable at small sizes
- Consistency across number and face cards
- Team approval to proceed

---

### Phase 2: Full Card Generation (Remaining 26 cards)
**Clubs (9 cards):** 6, 7, 8, 9, 10, Jack, Queen, King, Ace
**Diamonds (9 cards):** 6, 7, 8, 9, 10, Jack, Queen, King, Ace
**Spades (8 cards):** 6, 7, 8, 9, 10, Jack, Queen, King (NO ACE)

**Batch Strategy:**
- Generate all number cards first (6-10) for each suit
- Then generate all face cards (Jack, Queen, King)
- Then generate Aces (special treatment)
- Use same prompt template with suit color variations

---

### Phase 3: Post-Processing
**For Each Card:**
1. Export from AI tool at highest resolution
2. Open in image editor (Figma/Photoshop)
3. Resize to exactly 512x768px
4. Adjust brightness/contrast if needed for consistency
5. Add slight sharpening filter
6. Export as PNG with transparency
7. Compress with TinyPNG (<100KB target)
8. Rename according to naming convention
9. Place in correct folder (/cards/[suit]/)

**Quality Checks:**
- All cards same dimensions (512x768px)
- Consistent visual style across suits
- Corner indicators clearly visible
- Suit symbols recognizable at thumbnail size
- No compression artifacts
- File sizes under 100KB

---

### Phase 4: Particle Textures & Additional Assets
**Parallel Track (can run while cards are being processed):**

1. **Fire Particle** (256x256px)
   - Generate organic flame shape
   - Apply gradient overlay (orange to red)
   - Add transparency edges
   - Export with alpha channel

2. **Ice Particle** (256x256px)
   - Generate crystalline geometric shape
   - Apply blue-to-white gradient
   - Add sparkle highlights
   - Export with alpha channel

3. **Explosion/Sparkle Particle** (256x256px)
   - Generate star burst shape
   - Apply gold gradient
   - Add radial glow
   - Export with alpha channel

4. **Confetti Particles** (128x128px each × 5)
   - Simple rectangular shapes
   - Solid colors (Red, Blue, Green, Gold, Purple)
   - Slight rotation variety
   - Export with alpha channel

---

### Phase 5: Avatars & Table Surface
**Final Assets:**

**Player Avatars (5 characters):**
1. Young male, friendly smile, modern casual
2. Young female, confident, athletic style
3. Middle-aged male, wise, traditional elements
4. Middle-aged female, elegant, professional
5. Elder character, warm, approachable

**Poker Table Surface:**
- Generate green felt texture (1920x1080px+)
- Add wood trim border with realistic grain
- Apply subtle gold accent decorations
- Ensure texture is tileable (seamless edges)
- Export as optimized WebP or PNG

---

## 6. Tools & Software Stack

### Primary Creation Tools
- **Midjourney v6** (Discord) - Main card generation
- **ChatGPT Plus + DALL-E 3** - Iteration and technical assets
- **Leonardo.ai** (Free tier) - Particle effects backup

### Post-Processing Tools
- **Figma** (Web-based) - Primary image editing, resizing, exports
- **TinyPNG** (tinypng.com) - Batch PNG compression
- **Squoosh** (squoosh.app) - Individual image optimization

### Organization Tools
- **Finder** (macOS) - File organization with preview
- **Visual Studio Code** - Quick batch renaming with terminal

---

## 7. Quality Assurance Checklist

### Per-Asset Quality Check
- [ ] Correct dimensions (512x768px for cards, etc.)
- [ ] PNG format with alpha channel where needed
- [ ] File size under target (<100KB for cards)
- [ ] Proper naming convention applied
- [ ] Placed in correct folder
- [ ] Visually consistent with established style
- [ ] Readable at thumbnail size (for cards)
- [ ] No artifacts or compression issues

### Batch Quality Check (After Each Suit)
- [ ] All 9 cards present (8 for Spades)
- [ ] Consistent color palette across suit
- [ ] Face cards match character descriptions
- [ ] Number cards readable and clear
- [ ] No missing corner indicators
- [ ] Style cohesion with other suits

### Final Delivery Quality Check
- [ ] All 35 cards present
- [ ] All particle textures present (8 files)
- [ ] All avatars present (5 files)
- [ ] Poker table surface present (1 file)
- [ ] Total file count: 49 visual assets
- [ ] Folder structure matches specification
- [ ] README.md created with asset manifest
- [ ] Test images viewed on white and dark backgrounds

---

## 8. Timeline & Milestones

### Day 1 (Today - December 17)
- [x] Complete TASK-020 (this document)
- [ ] Generate 3 test cards (6♥, K♥, A♥)
- [ ] Get team feedback
- [ ] Iterate if needed

### Day 2 (December 18)
- [ ] Complete all Hearts (9 cards total)
- [ ] Get approval to proceed
- [ ] Begin Clubs generation

### Day 3-4 (December 19-20)
- [ ] Complete Clubs (9 cards)
- [ ] Complete Diamonds (9 cards)
- [ ] Complete Spades (8 cards)
- [ ] Begin particle textures

### Day 5 (December 21)
- [ ] Complete particle textures
- [ ] Generate player avatars
- [ ] Post-process and optimize all assets

### Day 6 (December 22)
- [ ] Create poker table surface
- [ ] Final quality checks
- [ ] Compress and optimize all files
- [ ] Organize in final folder structure

### Day 7 (December 23)
- [ ] Buffer day for any issues
- [ ] Final delivery to frontend team
- [ ] Documentation handoff

---

## 9. Risk Mitigation

### Potential Risks & Solutions

**Risk: Inconsistent style across cards**
- **Mitigation:** Generate all cards of one suit in single session
- **Mitigation:** Use exact same prompt template with only color variations
- **Mitigation:** Keep reference images open during generation

**Risk: AI tool generates wrong dimensions**
- **Mitigation:** Always post-process and resize in Figma
- **Mitigation:** Use Figma templates with exact dimensions

**Risk: File sizes too large**
- **Mitigation:** Batch compress with TinyPNG
- **Mitigation:** Reduce color palette if needed
- **Mitigation:** Convert to WebP for web if PNG is too large

**Risk: Cultural appropriation concerns**
- **Mitigation:** Use geometric patterns inspired by African art, not sacred symbols
- **Mitigation:** Focus on Afro-futurism aesthetic (modern + cultural pride)
- **Mitigation:** Avoid specific tribal/ethnic stereotypes

**Risk: Cards not readable at small sizes**
- **Mitigation:** Test at 128px width (typical in-game size)
- **Mitigation:** Increase contrast if needed
- **Mitigation:** Bold outlines on suit symbols

---

## 10. Success Criteria

### TASK-020 Complete When:
- [x] AI tool evaluation completed
- [x] Primary tool selected (Midjourney)
- [x] Card design style defined
- [x] Prompt templates created
- [x] Asset specifications documented
- [x] Workflow process established
- [x] Quality checklist created
- [x] Timeline planned

### TASK-022 Ready to Begin:
- [ ] 3 test cards generated (6♥, K♥, A♥)
- [ ] Team feedback received
- [ ] Style approved
- [ ] Full generation can proceed

---

## 11. Next Steps

**Immediate Actions (Next 2 Hours):**
1. Subscribe to Midjourney (if not already)
2. Set up Midjourney workspace in Discord
3. Generate 3 test cards using prompt templates
4. Share test cards with team in a visual format
5. Request feedback on:
   - Overall style and energy
   - Readability of cards
   - African-inspired pattern balance
   - Color vibrancy
   - Face card character appeal

**After Approval:**
1. Begin Phase 2: Full card generation
2. Follow workflow process outlined above
3. Share progress daily with team
4. Flag any blockers immediately

---

## Appendix A: Recommended Midjourney Parameters

```
--ar 2:3 (aspect ratio for 512x768px cards)
--style raw (for more control over style)
--stylize 150 (moderate stylization, not over-the-top)
--quality 2 (highest quality)
--v 6 (Midjourney version 6)
```

**Example Full Midjourney Prompt:**
```
/imagine African-inspired playing card design, 7 of Hearts,
vibrant fire red and gold color scheme, arcade game art style,
high contrast, digital illustration, large centered heart symbol
with gradient shading, Kente cloth geometric pattern background,
bold outlines, cel-shaded rendering, metallic gold accents,
neon glow effect, 512x768px format --ar 2:3 --style raw --stylize 150 --quality 2 --v 6
```

---

## Appendix B: Alternative Tools (If Midjourney Unavailable)

**DALL-E 3 Adaptation:**
- Use same prompt templates
- Request: "High resolution, game art quality"
- May need more iterations for consistency
- Better for technical assets than artistic cards

**Leonardo.ai Adaptation:**
- Use "Game Assets" preset model
- Enable "Prompt Magic" for better interpretation
- Use "Alchemy Upscale" for final quality
- Good balance between control and quality

---

## Document History

**Version 1.0** - December 17, 2025
- Initial asset pipeline plan created
- AI tools evaluated
- Style direction defined
- Prompt templates created
- Workflow established

---

**TASK-020 STATUS: COMPLETE**
**Ready to proceed to test card generation (TASK-022 Phase 1)**
