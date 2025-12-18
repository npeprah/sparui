# Quick Start Guide - Generate Test Batch Cards

**Goal:** Generate 5 test cards to validate Afro-Heritage style
**Time:** 4-7 hours
**Status:** READY TO BEGIN

---

## The 5 Cards

1. **6♥** - 6 of Hearts (simple number card)
2. **10♣** - 10 of Clubs (different suit color)
3. **J♦** - Jack of Diamonds (face card)
4. **K♠** - King of Spades (dark suit face card)
5. **A♥** - Ace of Hearts (premium card)

---

## Step 1: View the Visual Mockup (2 minutes)

```bash
open /Users/nana/go/src/github.com/npeprah/sparui/test-batch-showcase.html
```

This shows you exactly what the cards should look like.

---

## Step 2: Choose Your AI Tool (1 minute)

### Option A: Midjourney (RECOMMENDED)
- **Best quality** for arcade-style art
- **Cost:** $10/month basic plan
- **Speed:** 4 variations in ~60 seconds
- **Good for:** Stylized art, cultural aesthetics

### Option B: DALL-E 3 (via ChatGPT Plus)
- **Most accessible** - just need ChatGPT Plus
- **Cost:** $20/month (includes other ChatGPT Plus features)
- **Speed:** 1 image in ~30 seconds
- **Good for:** Precise specifications, easy iteration

### Option C: Leonardo.ai
- **Free tier available** - 150 credits/day
- **Cost:** Free (with limits) or $10/month
- **Speed:** 4 variations in ~90 seconds
- **Good for:** Game assets, batch generation

---

## Step 3: Generate Each Card (30-45 min per card)

### Using Midjourney

1. **Open Discord** → Go to Midjourney server or your private server
2. **Type:** `/imagine`
3. **Paste prompt** from `AI-PROMPTS-TEST-BATCH.md`
4. **Add parameters:** `--ar 2:3 --q 2 --style raw`
5. **Wait** for 4 variations (~60 seconds)
6. **Upscale** best option (U1, U2, U3, or U4)
7. **Download** and save as PNG

**Example:**
```
/imagine African-inspired playing card, 6 of Hearts, Afro-Heritage theme, warm cream background (#FFF5E6 to #FFE8D6 gradient)... [full prompt] --ar 2:3 --q 2 --style raw
```

### Using DALL-E 3

1. **Open ChatGPT** (Plus subscription)
2. **Type:** "Generate this image with size 1024x1536, style vivid, quality HD:"
3. **Paste prompt** from `AI-PROMPTS-TEST-BATCH.md`
4. **Wait** for generation (~30 seconds)
5. **Review** and request adjustments if needed
6. **Download** and save as PNG

### Using Leonardo.ai

1. **Go to** leonardo.ai/ai/image-generation
2. **Select model:** Leonardo Diffusion XL or Phoenix
3. **Set dimensions:** 512x768 (or 1024x1536)
4. **Set count:** 4 images
5. **Paste prompt** from `AI-PROMPTS-TEST-BATCH.md`
6. **Click** Generate
7. **Download** best variation

---

## Step 4: Post-Process Each Card (10-15 min per card)

### 4a. Resize to Exact Dimensions

**Tools:**
- Photoshop: Image → Image Size → 512x768px
- GIMP: Image → Scale Image → 512x768px
- Online: Use "Simple Image Resizer" website

**Settings:**
- Width: 512px
- Height: 768px
- Maintain aspect ratio
- Quality: High

### 4b. Compress to Under 100KB

**Recommended:** TinyPNG.com

1. Go to tinypng.com
2. Upload your 512x768px PNG
3. Download compressed version
4. Verify file size <100KB

### 4c. Rename and Save

**Naming convention:**
- `hearts_6.png`
- `clubs_10.png`
- `diamonds_jack.png`
- `spades_king.png`
- `hearts_ace.png`

**Save locations:**
```
frontend/public/assets/cards/hearts/hearts_6.png
frontend/public/assets/cards/clubs/clubs_10.png
frontend/public/assets/cards/diamonds/diamonds_jack.png
frontend/public/assets/cards/spades/spades_king.png
frontend/public/assets/cards/hearts/hearts_ace.png
```

---

## Step 5: Quality Check Each Card (5 min per card)

### Visual Quality Checklist
- [ ] Suit symbol clearly visible
- [ ] Corner indicators readable
- [ ] Colors match theme (cream background, gold border)
- [ ] Kente pattern visible but subtle
- [ ] Gold border prominent
- [ ] No artifacts or pixelation
- [ ] Professional quality

### Technical Checklist
- [ ] Exactly 512x768px
- [ ] PNG with alpha channel
- [ ] File size <100KB
- [ ] Correct filename
- [ ] In correct folder

### Test at Different Sizes
- View at 64x96px (thumbnail) - can you identify it?
- View at 160x240px (gameplay) - readable?
- View at 512x768px (full size) - polished?

---

## Step 6: Review All 5 Together (30 min)

Place all 5 cards side-by-side and check:

### Consistency
- [ ] All feel like same deck
- [ ] Kente patterns similar style
- [ ] Gold borders consistent
- [ ] Cream backgrounds same tone

### Color Harmony
- [ ] Red, green, black suits work together
- [ ] No jarring color clashes
- [ ] Theme feels cohesive

### Readability
- [ ] All cards identifiable at small sizes
- [ ] Corners clearly readable
- [ ] Suit symbols prominent

### Arcade Energy
- [ ] Cards feel vibrant and exciting
- [ ] Bold and high-impact
- [ ] Would make someone say "whoa!"

### Cultural Authenticity
- [ ] Kente patterns respectful
- [ ] Face cards avoid stereotypes
- [ ] Celebrates African heritage

---

## Step 7: Document Your Learnings (15 min)

Create `TEST-BATCH-REVIEW.md` and note:

### What Worked Well
- Which AI tool gave best results?
- Which prompts were most effective?
- What design elements are strongest?

### What Needs Adjustment
- Are Kente patterns right intensity?
- Do colors need tweaking?
- Should borders be more/less prominent?
- Face card detail level appropriate?

### Prompt Refinements
- Any keywords to add/remove?
- Any specifications to clarify?
- Save successful prompt patterns

---

## Step 8: Decide on Next Steps (5 min)

### Ready for Full Production?

**YES** → Proceed to generate all 35 cards
- Move to Hearts full suit (9 cards)
- Use refined prompts from test batch
- Maintain consistency

**NO** → Iterate on test batch
- Regenerate problem cards
- Refine prompts
- Test again until satisfied

---

## Quick Reference: AI Prompts Location

**All prompts:** `AI-PROMPTS-TEST-BATCH.md`

**Direct access:**
```bash
cat /Users/nana/go/src/github.com/npeprah/sparui/AI-PROMPTS-TEST-BATCH.md
```

---

## Quick Reference: Key Colors

```css
/* Backgrounds */
Cream Primary: #FFF5E6
Cream Secondary: #FFE8D6
Cream Tertiary: #FFF9F0

/* Borders */
Gold Primary: #FFD700
Gold Secondary: #D4AF37
Gold Decorative: #B8860B

/* Suits */
Hearts: #FF4500 (Fire Red)
Diamonds: #FF4500 (Fire Red)
Clubs: #2F4F2F (Dark Green)
Spades: #1C1C1C (Near Black)

/* Kente Patterns */
Stripe 1: rgba(251, 192, 45, 0.15) - Gold
Stripe 2: rgba(139, 69, 19, 0.12) - Brown
Stripe 3: rgba(255, 215, 0, 0.10) - Gold
Stripe 4: rgba(160, 82, 45, 0.08) - Sienna
```

---

## Troubleshooting

### Problem: AI generates photorealistic cards
**Solution:** Emphasize "cel-shaded", "bold outlines", "arcade game art", "NOT photorealistic"

### Problem: Kente patterns too strong
**Solution:** Add "subtle background texture", "low opacity", "not overwhelming"

### Problem: Colors don't match specs
**Solution:** Include hex codes in prompt, post-process to adjust colors

### Problem: Corners unreadable at small size
**Solution:** Request "large bold corner indicators", "high contrast", test at 64x96px

### Problem: Face cards look stereotypical
**Solution:** Emphasize "modern African aesthetic", "avoid stereotypes", "cultural pride"

### Problem: File size over 100KB
**Solution:** Use TinyPNG for aggressive compression, simplify if needed

---

## Time Estimates

**Per Card:**
- Generation: 30-45 minutes (including iterations)
- Post-processing: 10-15 minutes
- Quality check: 5 minutes
- **Total:** 45-65 minutes per card

**Full Test Batch (5 cards):**
- Generation: 2.5-3.5 hours
- Post-processing: 1-1.5 hours
- Review: 30 minutes
- Documentation: 15 minutes
- **Total:** 4-5.5 hours

**Add buffer for iteration:** 4-7 hours total

---

## Success = Ready for Full Production

When test batch is complete and approved, you'll have:

- [ ] 5 high-quality cards that validate the style
- [ ] Confidence in the Afro-Heritage theme
- [ ] Refined prompts for full production
- [ ] Process and tools validated
- [ ] Timeline estimates confirmed
- [ ] Ready to generate remaining 30 cards

---

## Next Phase After Test Batch

**Hearts Full Suit (9 cards):**
- 6♥ (already have from test batch)
- 7♥, 8♥, 9♥, 10♥ (number cards - same prompt pattern)
- J♥, Q♥, K♥ (face cards - adapt Jack prompt)
- A♥ (already have from test batch)

**Time:** 6-8 hours for Hearts
**Then:** Clubs (6-8 hrs) → Diamonds (6-8 hrs) → Spades (5-7 hrs)

---

## Resources

**Visual Mockup:** `test-batch-showcase.html`
**AI Prompts:** `AI-PROMPTS-TEST-BATCH.md`
**Full Guide:** `TEST-BATCH-README.md`
**Status:** `TASK-022-STATUS.md`
**Plan:** `TASK-022-EXECUTION-PLAN.md`

---

**Ready?** Open the visual mockup, choose your AI tool, and start generating!

```bash
open /Users/nana/go/src/github.com/npeprah/sparui/test-batch-showcase.html
```

**Good luck! This is the most critical Week 2 deliverable.**
