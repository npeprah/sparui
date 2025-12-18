# Test Batch Generation Guide - TASK-022

**Status:** Phase 1 - Test Batch Ready for Generation
**Date:** December 17, 2025
**Designer:** arcade-ui-designer

---

## What You Have Now

I've prepared everything you need to generate the first 5 test cards for validation:

### 1. Visual Mockup Showcase
**File:** `/Users/nana/go/src/github.com/npeprah/sparui/test-batch-showcase.html`

Open this HTML file in your browser to see:
- Interactive mockups of all 5 test cards
- Afro-Heritage theme specifications
- Color palettes and design details
- Hover effects showing arcade energy
- Complete visual reference for AI generation

### 2. AI Generation Prompts
**File:** `/Users/nana/go/src/github.com/npeprah/sparui/AI-PROMPTS-TEST-BATCH.md`

This document contains:
- 5 detailed AI prompts (one for each test card)
- Instructions for Midjourney, DALL-E, Leonardo.ai
- Post-generation checklist
- Iteration guidelines

### 3. Execution Plan
**File:** `/Users/nana/go/src/github.com/npeprah/sparui/TASK-022-EXECUTION-PLAN.md`

Complete project plan including:
- All 8 phases of execution
- Timeline and risk mitigation
- Quality checklists
- Success metrics

---

## The 5 Test Cards

### Purpose of Test Batch
Before generating all 35 cards, we're validating the Afro-Heritage style with 5 diverse samples:

1. **6 of Hearts** - Simple number card test
2. **10 of Clubs** - Different suit color test (green)
3. **Jack of Diamonds** - Face card character art test
4. **King of Spades** - Dark suit face card test
5. **Ace of Hearts** - Premium card with maximum impact test

### Why These 5?
- Tests all card types (number, face, premium)
- Tests all suit colors (red, green, black)
- Validates Kente pattern consistency
- Validates character art style for face cards
- Ensures premium treatment for Aces

---

## How to Generate (Step-by-Step)

### Option 1: Using Midjourney (Recommended)

**Why Midjourney?**
- Best for stylized arcade art
- Consistent quality
- Good at geometric patterns (Kente)
- Handles cultural aesthetics well

**Steps:**

1. **Open Midjourney Discord**
   - Go to #general or your private server
   - Use `/imagine` command

2. **Generate Card 1 (6 of Hearts)**
   ```
   /imagine [COPY FULL PROMPT FROM AI-PROMPTS-TEST-BATCH.md] --ar 2:3 --q 2 --style raw
   ```

3. **Review 4 variations**
   - Midjourney generates 4 options
   - Look for: bold outlines, vibrant colors, visible Kente patterns, readable corners
   - Choose the best one (U1, U2, U3, or U4 to upscale)

4. **Upscale and Download**
   - Click the U button for your chosen variation
   - Wait for upscale to complete
   - Right-click → Save image as PNG
   - Name it: `hearts_6_raw.png`

5. **Repeat for remaining 4 cards**
   - 10 of Clubs
   - Jack of Diamonds
   - King of Spades
   - Ace of Hearts

6. **Post-Process All 5 Cards**
   - Resize each to exactly 512x768px (use Photoshop, GIMP, or online tool)
   - Compress each to <100KB (use TinyPNG.com)
   - Save final versions with proper naming:
     - `hearts_6.png`
     - `clubs_10.png`
     - `diamonds_jack.png`
     - `spades_king.png`
     - `hearts_ace.png`

### Option 2: Using DALL-E 3 (via ChatGPT Plus)

**Why DALL-E 3?**
- More accessible (just need ChatGPT Plus)
- Good at following detailed specifications
- Easier for beginners

**Steps:**

1. **Open ChatGPT** (Plus subscription required)

2. **Paste this message:**
   ```
   I need you to generate playing card designs for a game called Spar.
   I'll provide detailed specifications for each card.

   Please generate these images one at a time with the following settings:
   - Size: 1024x1536 (2:3 aspect ratio)
   - Style: Vivid
   - Quality: HD

   Here's the first card:
   [PASTE FULL PROMPT FOR 6 OF HEARTS FROM AI-PROMPTS-TEST-BATCH.md]
   ```

3. **Review Generated Image**
   - ChatGPT will generate 1 image
   - Check against quality checklist
   - If not perfect, ask for specific adjustments:
     - "Make the Kente pattern more visible"
     - "Increase the glow effect on the heart symbol"
     - "Make the gold border more metallic"

4. **Download and Save**
   - Download the image
   - Name it: `hearts_6_dalle.png`

5. **Repeat for remaining 4 cards**
   - Ask ChatGPT to generate the next card
   - Paste the next prompt from AI-PROMPTS-TEST-BATCH.md

6. **Post-Process**
   - Resize to 512x768px
   - Compress to <100KB
   - Save with proper naming

### Option 3: Using Leonardo.ai

**Why Leonardo.ai?**
- Good for game assets
- Fast generation
- 150 free credits daily
- Multiple variations at once

**Steps:**

1. **Sign up at leonardo.ai** (free account)

2. **Go to Image Generation**
   - Click "Image Generation" in sidebar
   - Select model: "Leonardo Diffusion XL" or "Phoenix"

3. **Configure Settings**
   - Width: 512, Height: 768 (or 1024x1536)
   - Number of Images: 4
   - Guidance Scale: 7-8
   - Tiling: Off

4. **Paste Prompt**
   - Copy full prompt for 6 of Hearts from AI-PROMPTS-TEST-BATCH.md
   - Paste into prompt box
   - Click "Generate"

5. **Review and Download**
   - Review all 4 variations
   - Download the best one
   - Name it: `hearts_6_leonardo.png`

6. **Repeat for remaining 4 cards**

7. **Post-Process**
   - Resize to 512x768px
   - Compress to <100KB

---

## Quality Validation Checklist

After generating all 5 test cards, verify each one:

### Visual Quality
- [ ] Suit symbol clearly visible and recognizable
- [ ] Corner indicators readable (test at 64x96px thumbnail size)
- [ ] Colors match Afro-Heritage theme specifications
- [ ] Kente pattern visible but not overwhelming
- [ ] Gold border prominent and metallic
- [ ] No compression artifacts or pixelation
- [ ] Consistent style with other test cards
- [ ] Professional game asset quality

### Technical Quality
- [ ] Exactly 512x768px dimensions
- [ ] PNG format with alpha channel
- [ ] File size under 100KB
- [ ] Proper filename convention
- [ ] sRGB color space

### Design Quality
- [ ] Arcade energy present (vibrant, bold)
- [ ] Cultural authenticity maintained
- [ ] No stereotypes or appropriation
- [ ] Readable at small sizes
- [ ] Appropriate for fast-paced gameplay

---

## What to Do After Test Batch

### Step 1: Review as a Set (15-30 minutes)

Place all 5 cards side-by-side and ask:

1. **Consistency:**
   - Do all 5 cards feel like they belong to the same deck?
   - Is the Afro-Heritage style consistent?
   - Are the Kente patterns similar in style and intensity?

2. **Color Harmony:**
   - Do the suit colors (red, green, black) work well together?
   - Is the gold border consistent across all cards?
   - Is the cream background the same tone?

3. **Readability:**
   - Test at thumbnail size (64x96px) - can you identify each card?
   - Test at gameplay size (160x240px) - are corners readable?
   - Test at full size (512x768px) - do details look polished?

4. **Arcade Energy:**
   - Do the cards feel exciting and vibrant?
   - Would these cards make someone say "whoa"?
   - Do they capture that NBA Jam / arcade mayhem vibe?

5. **Cultural Authenticity:**
   - Do the Kente patterns feel respectful and authentic?
   - Do face cards avoid stereotypes?
   - Does the design celebrate African heritage with pride?

### Step 2: Document Learnings (10-15 minutes)

Create a file called `TEST-BATCH-REVIEW.md` and note:

1. **What worked well:**
   - Which prompts generated the best results?
   - Which AI tool worked best for this style?
   - What design elements are strongest?

2. **What needs adjustment:**
   - Are Kente patterns too strong or too subtle?
   - Do face cards need more/less detail?
   - Should gold borders be more/less prominent?
   - Any color adjustments needed?

3. **Prompt refinements:**
   - Document any prompt changes that improved results
   - Note which keywords worked best
   - Save successful prompt patterns for full production

### Step 3: Decide on Full Production (5 minutes)

Ask yourself:

- **Are we ready to proceed with all 35 cards?**
  - YES → Move to Phase 3 (generate all Hearts)
  - NO → Iterate on test batch until satisfied

- **Do we need to adjust the style?**
  - If yes, regenerate test batch with refined prompts
  - Document all changes

- **Is this the design language we want for Spar?**
  - Does it match the PRD vision?
  - Does it serve the gameplay experience?
  - Will it stand out in the market?

### Step 4: Proceed to Full Production

Once test batch is approved:

1. **Update prompts** with any refinements from testing
2. **Generate Hearts suit** (9 cards) using refined prompts
3. **Generate Clubs suit** (9 cards)
4. **Generate Diamonds suit** (9 cards)
5. **Generate Spades suit** (8 cards)
6. **Post-process all 35 cards**
7. **Create final showcase and documentation**

---

## Expected Timeline

### Phase 1: Test Batch (Current)
- **Generation time:** 2-4 hours (depending on AI tool and iterations)
- **Post-processing:** 1-2 hours (resize, compress, organize)
- **Review:** 30 minutes - 1 hour
- **Total:** 4-7 hours

### Full Project (After Test Batch)
- **Hearts (9 cards):** 6-8 hours
- **Clubs (9 cards):** 6-8 hours
- **Diamonds (9 cards):** 6-8 hours
- **Spades (8 cards):** 5-7 hours
- **Post-processing:** 4-6 hours
- **Documentation:** 2-3 hours
- **Total:** 29-40 hours (full week)

---

## Tools You'll Need

### AI Generation Tools (Choose One)
- Midjourney (paid, $10/month basic plan)
- ChatGPT Plus with DALL-E 3 ($20/month)
- Leonardo.ai (free tier: 150 credits/day)
- Stable Diffusion (free but technical setup required)

### Image Editing Tools
- **Photoshop** (paid) - most powerful
- **GIMP** (free) - good alternative to Photoshop
- **Figma** (free) - for design work and resizing
- **Online resizers** (free) - Simple Image Resizer, etc.

### Compression Tools
- **TinyPNG** (free, online) - highly recommended
- **ImageOptim** (free, Mac) - batch compression
- **Squoosh** (free, online) - Google's image compressor

---

## Quick Start Commands

### Open the Visual Mockup
```bash
open /Users/nana/go/src/github.com/npeprah/sparui/test-batch-showcase.html
```

### View AI Prompts
```bash
cat /Users/nana/go/src/github.com/npeprah/sparui/AI-PROMPTS-TEST-BATCH.md
```

### Check Folder Structure
```bash
ls -la /Users/nana/go/src/github.com/npeprah/sparui/frontend/public/assets/cards/
```

---

## Need Help?

### Common Issues

**Issue:** AI generates photorealistic cards instead of arcade style
**Solution:** Add stronger keywords: "cel-shaded", "bold outlines", "flat colors", "comic book style", "NOT photorealistic"

**Issue:** Kente patterns are too overwhelming
**Solution:** Reduce opacity in prompt: "subtle Kente pattern background texture, low opacity"

**Issue:** Colors don't match specifications
**Solution:** Include hex codes directly in prompt and emphasize color accuracy

**Issue:** Corner indicators are unreadable at small sizes
**Solution:** Request "large, bold corner indicators" and "high contrast"

**Issue:** Face cards look stereotypical or inappropriate
**Solution:** Emphasize "modern African aesthetic", "cultural pride", "avoid stereotypes", "stylized portrait"

---

## Resources

### References
- `/Users/nana/go/src/github.com/npeprah/sparui/frontend/src/config/cardThemes.ts` - Theme colors
- `/Users/nana/go/src/github.com/npeprah/sparui/PRD.md` - Game design vision
- `/Users/nana/go/src/github.com/npeprah/sparui/CARD_DESIGN_HANDOFF.md` - Design specifications
- `/Users/nana/go/src/github.com/npeprah/sparui/card-design-showcase.html` - Previous 6 theme designs

### Next Documents to Create
After test batch is complete, create:
- `TEST-BATCH-REVIEW.md` - Your learnings and decisions
- `REFINED-PROMPTS.md` - Updated prompts for full production
- `GENERATION-LOG.md` - Track which AI tool/settings worked for each card

---

**Good luck with the test batch generation!**

This is the most critical Week 2 deliverable. Take your time to get it right.
The test batch sets the visual language for the entire game.

**Status:** Ready to begin AI generation
**Next Action:** Open test-batch-showcase.html and start generating cards
