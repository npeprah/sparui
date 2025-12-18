# Avatar Design Handoff - Visual Specifications

**Date:** December 18, 2025
**Designer:** arcade-ui-designer
**Status:** Ready for AI Generation
**Project:** Spar - Traditional Ghanaian Card Game

---

## Design Direction: "Afro-Futurism Meets Arcade Energy"

The avatar set captures the bold, vibrant aesthetic of Spar with diverse African representation and arcade character energy. Think NBA Jam character select screens meets Black Panther's Afrofuturism.

### Core Principles
- **Bold & Expressive:** Each avatar has distinct personality and energy
- **Cultural Authenticity:** Diverse African features, hairstyles, and fashion
- **Arcade Energy:** High contrast, cel-shaded style, game-ready visibility
- **Recognition:** Clear silhouettes recognizable at all sizes (256px → 64px)

---

## Avatar Set Overview

| Avatar | Name | Personality | Presentation | Skin Tone | Hairstyle | Accent Color |
|--------|------|-------------|--------------|-----------|-----------|--------------|
| 01 | Confident Leader | Bold, commanding | Masculine | Medium | Short fade with designs | Fire Red |
| 02 | Cool Strategist | Calm, focused | Feminine | Dark | Box braids, high ponytail | Ice Blue |
| 03 | Playful Challenger | Energetic, friendly | Non-binary | Light-Medium | Natural afro twist-out | Gold |
| 04 | Fierce Competitor | Intense, competitive | Feminine | Very Dark | Long locs with gold cuffs | Deep Purple |
| 05 | Wise Veteran | Knowing, experienced | Masculine | Medium-Dark | Salt & pepper beard | Gold |

---

## Component: Avatar 01 - "The Confident Leader"

### Visual Specs
- **Dimensions:** 256x256px (square)
- **Format:** PNG with transparency
- **Framing:** Head and shoulders, centered
- **Background:** Transparent OR solid deep purple (#4B0082) circle to be removed
- **Border:** 2-3px bold black outline around character (cel-shaded style)
- **File Size:** <50KB (compressed)

### Character Description

**Appearance:**
- **Presentation:** Masculine, young adult (late 20s)
- **Skin Tone:** Medium brown (#8D5524, similar to mahogany)
- **Face Shape:** Strong jawline, defined features
- **Expression:** Confident smirk, direct eye contact, slightly raised eyebrow
- **Pose:** Slight forward lean, shoulders squared (commanding presence)

**Hairstyle:**
- Short fade haircut (tight on sides, textured on top)
- Clean geometric line designs shaved into left side
- Natural black hair with slight sheen

**Clothing & Accessories:**
- Modern African-inspired collar (geometric Kente pattern)
- Gold chain necklace (thick, visible)
- Fire red accent color in clothing details
- Clean, contemporary style (not traditional regalia)

**Color Palette:**
- Skin: #8D5524 (medium brown) with #6B4423 shadows, #A67C52 highlights
- Hair: #1A1A1A (black) with #404040 highlights
- Clothing: Fire Red (#FF4500) and Gold (#FFD700) accents
- Jewelry: Metallic gold (#FFD700) with shine

**Personality Vibe:**
- Bold, confident, natural leader
- "I know I'm gonna win"
- Competitive but not arrogant
- Commands respect

### AI Generation Prompts

**Primary Prompt (Midjourney v6 / DALL-E 3):**
```
African man avatar, confident leader character portrait,
arcade game art style, cel-shaded digital illustration,

CHARACTER:
- Late 20s masculine presentation
- Medium brown skin tone (#8D5524)
- Strong jawline, defined features
- Confident smirk expression, direct eye contact
- Short fade haircut with geometric line designs on side
- Modern African fashion with geometric Kente collar pattern
- Thick gold chain necklace
- Fire red (#FF4500) and gold (#FFD700) accent colors
- Shoulders visible (bust shot)

STYLE:
- Bold black outlines (2-3px), cel-shaded comic book style
- High contrast lighting
- NBA Jam / Street Fighter character portrait aesthetic
- Vibrant colors, arcade energy
- Clean professional game asset quality
- 256x256px square format
- Transparent background OR solid purple circle background

TECHNICAL:
- Head and shoulders framing, centered
- Direct forward-facing pose
- Clear silhouette for small sizes
- High readability, bold features
- No excessive detail that loses clarity

MOOD: Confident, commanding, bold, competitive leader energy

AVOID: Photorealistic rendering, busy backgrounds, stereotypes,
excessive detail, neutral expressions
```

**Alternative Prompt (Leonardo.ai / Ideogram):**
```
Portrait of confident African male gamer avatar,
cel-shaded comic book art, arcade game character,
medium brown skin, short fade haircut with designs,
gold chain necklace, modern Kente pattern collar,
fire red and gold colors, bold black outlines,
confident smirk, direct eye contact, commanding presence,
256x256px square, transparent background, high contrast,
NBA Jam style character select portrait
```

**Style References:**
- NBA Jam player portraits (bold, expressive)
- Street Fighter character select screens
- Wakanda character designs (modern Afrofuturism)
- Comic book illustration style

### Post-Processing Notes
1. **Resize:** Generate at 1024x1024px, resize to 256x256px using Lanczos resampling
2. **Background Removal:** If solid color generated, use remove.bg or Photoshop magic wand
3. **Outline Enhancement:** If outline isn't bold enough, add 2-3px black stroke in Photoshop
4. **Color Correction:** Adjust vibrance +10, contrast +5 for arcade pop
5. **Compression:** Export PNG-24, compress with TinyPNG to <50KB
6. **Quality Check:** Test visibility at 128px, 64px sizes

---

## Component: Avatar 02 - "The Cool Strategist"

### Visual Specs
- **Dimensions:** 256x256px (square)
- **Format:** PNG with transparency
- **Framing:** Head and shoulders, centered
- **Background:** Transparent OR solid deep purple (#4B0082) circle
- **Border:** 2-3px bold black outline
- **File Size:** <50KB

### Character Description

**Appearance:**
- **Presentation:** Feminine, young adult (mid 20s)
- **Skin Tone:** Dark brown (#4A3728, rich cocoa)
- **Face Shape:** Oval face, high cheekbones, elegant features
- **Expression:** Calm, focused, slight knowing smile
- **Pose:** Composed, confident, head slightly tilted (analytical)

**Hairstyle:**
- Long box braids in high ponytail
- Braids cascade over shoulder
- Natural black with subtle dark blue highlights (ice blue accent)
- Gold hair cuffs on select braids

**Clothing & Accessories:**
- Modern geometric collar with ice blue accents
- Large gold hoop earrings
- Ice blue (#00D4FF) accent color in clothing
- Clean contemporary style

**Color Palette:**
- Skin: #4A3728 (dark brown) with #352818 shadows, #5C4938 highlights
- Hair: #0A0A0A (deep black) with #00D4FF (ice blue) subtle highlights
- Clothing: Ice Blue (#00D4FF) and Gold (#FFD700) accents
- Jewelry: Metallic gold with shine

**Personality Vibe:**
- Calm, strategic, analytical
- "I've already calculated my next three moves"
- Cool under pressure
- Quiet confidence

### AI Generation Prompts

**Primary Prompt (Midjourney v6 / DALL-E 3):**
```
African woman avatar, cool strategist character portrait,
arcade game art style, cel-shaded digital illustration,

CHARACTER:
- Mid 20s feminine presentation
- Dark brown skin tone (#4A3728)
- Oval face, high cheekbones, elegant features
- Calm focused expression, slight knowing smile
- Long box braids in high ponytail cascading over shoulder
- Gold hair cuffs on select braids
- Large gold hoop earrings
- Modern geometric collar with ice blue accents
- Ice blue (#00D4FF) and gold (#FFD700) accent colors
- Shoulders visible (bust shot)

STYLE:
- Bold black outlines (2-3px), cel-shaded comic book style
- High contrast lighting
- NBA Jam / Street Fighter character portrait aesthetic
- Vibrant colors, arcade energy
- Clean professional game asset quality
- 256x256px square format
- Transparent background OR solid purple circle

TECHNICAL:
- Head and shoulders framing, centered
- Composed forward-facing pose, slight head tilt
- Clear silhouette for small sizes
- High readability, defined features
- Strategic, analytical vibe

MOOD: Calm, focused, strategic, cool confidence

AVOID: Photorealistic rendering, busy backgrounds, stereotypes,
excessive detail, aggressive expressions
```

**Alternative Prompt (Leonardo.ai / Ideogram):**
```
Portrait of cool African female gamer avatar,
cel-shaded comic book art, arcade game character,
dark brown skin, long box braids in high ponytail,
gold hoop earrings, ice blue and gold colors,
bold black outlines, calm focused expression,
analytical pose, elegant features, 256x256px square,
transparent background, high contrast, NBA Jam style
```

### Post-Processing Notes
Same as Avatar 01 (resize, background removal, outline, color correction, compression, quality check)

---

## Component: Avatar 03 - "The Playful Challenger"

### Visual Specs
- **Dimensions:** 256x256px (square)
- **Format:** PNG with transparency
- **Framing:** Head and shoulders, centered
- **Background:** Transparent OR solid deep purple
- **Border:** 2-3px bold black outline
- **File Size:** <50KB

### Character Description

**Appearance:**
- **Presentation:** Non-binary, young adult (early-mid 20s)
- **Skin Tone:** Light-medium brown (#B8886B, warm tan)
- **Face Shape:** Round-ish, friendly features, bright eyes
- **Expression:** Bright smile, energetic, playful sparkle in eyes
- **Pose:** Energetic, slightly dynamic (friendly competitor)

**Hairstyle:**
- Short natural afro with twist-out texture
- Voluminous, defined curls
- Natural black with golden brown highlights
- Side part

**Clothing & Accessories:**
- Colorful Kente pattern scarf/collar (multi-color)
- Gold stud earrings
- Rainbow gradient accent or gold primary accent
- Vibrant, celebratory style

**Color Palette:**
- Skin: #B8886B (light-medium brown) with #9A6F52 shadows, #D4A586 highlights
- Hair: #2A1810 (brown-black) with #8B6F47 (golden brown) highlights
- Clothing: Gold (#FFD700), Pink (#FF1493), Green (#32CD32), Purple (#8B00FF)
- Jewelry: Gold

**Personality Vibe:**
- Playful, friendly, energetic
- "Let's have fun with this!"
- Loves the game, loves the competition
- Infectious positive energy

### AI Generation Prompts

**Primary Prompt (Midjourney v6 / DALL-E 3):**
```
African person avatar, playful challenger character portrait,
non-binary presentation, arcade game art style,
cel-shaded digital illustration,

CHARACTER:
- Early-mid 20s, non-binary presentation
- Light-medium brown skin tone (#B8886B)
- Round friendly face, bright expressive eyes
- Bright energetic smile, playful expression
- Short natural afro with twist-out texture
- Voluminous defined curls, side part
- Colorful Kente pattern scarf/collar (rainbow colors)
- Gold stud earrings
- Gold (#FFD700) accent with rainbow elements
- Shoulders visible (bust shot)

STYLE:
- Bold black outlines (2-3px), cel-shaded comic book style
- High contrast lighting
- NBA Jam / Street Fighter character portrait aesthetic
- Vibrant celebratory colors, maximum energy
- Clean professional game asset quality
- 256x256px square format
- Transparent background OR solid purple circle

TECHNICAL:
- Head and shoulders framing, centered
- Energetic forward-facing pose
- Clear silhouette for small sizes
- Friendly, approachable features
- Playful, positive energy

MOOD: Playful, energetic, friendly, celebratory

AVOID: Photorealistic rendering, busy backgrounds, stereotypes,
excessive detail, serious expressions
```

**Alternative Prompt (Leonardo.ai / Ideogram):**
```
Portrait of playful African gamer avatar,
non-binary presentation, cel-shaded comic book art,
light-medium brown skin, short natural afro twist-out,
colorful Kente scarf, gold earrings, bright smile,
bold black outlines, energetic expression, rainbow colors,
256x256px square, transparent background, arcade style
```

### Post-Processing Notes
Same as Avatar 01

---

## Component: Avatar 04 - "The Fierce Competitor"

### Visual Specs
- **Dimensions:** 256x256px (square)
- **Format:** PNG with transparency
- **Framing:** Head and shoulders, centered
- **Background:** Transparent OR solid deep purple
- **Border:** 2-3px bold black outline
- **File Size:** <50KB

### Character Description

**Appearance:**
- **Presentation:** Feminine, adult (late 20s-early 30s)
- **Skin Tone:** Very dark brown (#2C1810, deep ebony)
- **Face Shape:** Sculpted features, defined cheekbones, intense eyes
- **Expression:** Intense focused gaze, slight competitive smirk
- **Pose:** Strong, competitive, forward-facing (intimidating presence)

**Hairstyle:**
- Long natural locs (shoulder-length visible)
- Gold cuffs/rings on multiple locs
- Dark brown-black locs with natural sheen
- Side sweep with volume

**Clothing & Accessories:**
- Modern African collar with deep purple accents
- Gold nose ring (septum or nostril)
- Gold hoop or statement earrings
- Deep purple (#4B0082) and gold accent colors
- Regal, powerful style

**Color Palette:**
- Skin: #2C1810 (very dark brown) with #1A0A05 shadows, #3D2418 highlights
- Hair: #1A0F08 (dark brown-black) with #3D2815 natural highlights
- Clothing: Deep Purple (#4B0082) and Gold (#FFD700) accents
- Jewelry: Metallic gold

**Personality Vibe:**
- Fierce, competitive, intense
- "I came here to win"
- Intimidating presence, focused
- Respect through skill

### AI Generation Prompts

**Primary Prompt (Midjourney v6 / DALL-E 3):**
```
African woman avatar, fierce competitor character portrait,
arcade game art style, cel-shaded digital illustration,

CHARACTER:
- Late 20s-early 30s feminine presentation
- Very dark brown skin tone (#2C1810, deep ebony)
- Sculpted features, defined cheekbones, intense eyes
- Intense focused gaze, slight competitive smirk
- Long natural locs with gold cuffs/rings
- Locs cascade over shoulder, side sweep
- Gold nose ring (septum or nostril)
- Gold hoop or statement earrings
- Modern African collar with deep purple accents
- Deep purple (#4B0082) and gold (#FFD700) colors
- Shoulders visible (bust shot)

STYLE:
- Bold black outlines (2-3px), cel-shaded comic book style
- High contrast lighting, dramatic shadows
- NBA Jam / Mortal Kombat character portrait aesthetic
- Vibrant colors, intense energy
- Clean professional game asset quality
- 256x256px square format
- Transparent background OR solid purple circle

TECHNICAL:
- Head and shoulders framing, centered
- Strong forward-facing pose
- Clear silhouette for small sizes
- Intense, competitive features
- Intimidating but not aggressive

MOOD: Fierce, competitive, intense, powerful

AVOID: Photorealistic rendering, busy backgrounds, stereotypes,
excessive detail, friendly expressions
```

**Alternative Prompt (Leonardo.ai / Ideogram):**
```
Portrait of fierce African female gamer avatar,
cel-shaded comic book art, arcade game character,
very dark brown skin, long locs with gold cuffs,
gold nose ring, intense focused expression,
deep purple and gold colors, bold black outlines,
powerful competitive presence, 256x256px square,
transparent background, Mortal Kombat style
```

### Post-Processing Notes
Same as Avatar 01

---

## Component: Avatar 05 - "The Wise Veteran"

### Visual Specs
- **Dimensions:** 256x256px (square)
- **Format:** PNG with transparency
- **Framing:** Head and shoulders, centered
- **Background:** Transparent OR solid deep purple
- **Border:** 2-3px bold black outline
- **File Size:** <50KB

### Character Description

**Appearance:**
- **Presentation:** Masculine, mature adult (40s-50s)
- **Skin Tone:** Medium-dark brown (#6B4F3A, warm cocoa)
- **Face Shape:** Weathered features, distinguished, warm eyes
- **Expression:** Knowing smile, wise, experienced, approachable
- **Pose:** Relaxed confidence, head slightly tilted (mentor energy)

**Hairstyle:**
- Short cropped hair (natural, slightly graying)
- Well-groomed salt and pepper beard (short, maintained)
- Natural black with gray/silver highlights
- Distinguished appearance

**Clothing & Accessories:**
- Traditional African collar/necklace (ornate, cultural)
- Geometric patterns, earthy tones with gold
- Gold accent color
- Classic, timeless style

**Color Palette:**
- Skin: #6B4F3A (medium-dark brown) with #4F3828 shadows, #8A6B52 highlights
- Hair: #2A2A2A (dark gray) with #B0B0B0 (silver) gray highlights
- Beard: #3A3A3A (charcoal) with #C0C0C0 (silver) highlights
- Clothing: Gold (#FFD700), Earthy Brown (#8B7355), Cream (#F5DEB3)
- Jewelry: Gold

**Personality Vibe:**
- Wise, experienced, patient
- "I've seen it all before"
- Mentor energy, approachable
- Quiet strength

### AI Generation Prompts

**Primary Prompt (Midjourney v6 / DALL-E 3):**
```
African man avatar, wise veteran character portrait,
mature elder, arcade game art style,
cel-shaded digital illustration,

CHARACTER:
- 40s-50s masculine presentation
- Medium-dark brown skin tone (#6B4F3A)
- Weathered distinguished features, warm kind eyes
- Knowing smile, wise experienced expression
- Short cropped hair (slightly graying)
- Well-groomed salt and pepper beard (short, maintained)
- Traditional African collar/necklace (ornate, cultural)
- Geometric patterns, gold accents
- Gold (#FFD700) accent color
- Shoulders visible (bust shot)

STYLE:
- Bold black outlines (2-3px), cel-shaded comic book style
- High contrast lighting
- NBA Jam character portrait aesthetic
- Warm vibrant colors, experienced energy
- Clean professional game asset quality
- 256x256px square format
- Transparent background OR solid purple circle

TECHNICAL:
- Head and shoulders framing, centered
- Relaxed confident pose, slight head tilt
- Clear silhouette for small sizes
- Distinguished mature features
- Mentor, elder wisdom vibe

MOOD: Wise, patient, experienced, approachable mentor

AVOID: Photorealistic rendering, busy backgrounds, stereotypes,
excessive detail, stern expressions, looking old/frail
```

**Alternative Prompt (Leonardo.ai / Ideogram):**
```
Portrait of wise African elder gamer avatar,
cel-shaded comic book art, arcade game character,
medium-dark brown skin, salt and pepper beard,
traditional African necklace, knowing smile,
gold colors, bold black outlines, distinguished features,
warm experienced presence, 256x256px square,
transparent background, NBA Jam style
```

### Post-Processing Notes
Same as Avatar 01

---

## Technical Specifications Summary

### Export Settings (All Avatars)
- **Format:** PNG with alpha transparency
- **Dimensions:** Exactly 256x256px (square)
- **Color Space:** sRGB
- **Bit Depth:** 8-bit per channel (24-bit RGB + 8-bit alpha = 32-bit)
- **Resolution:** 72 DPI (web-optimized)
- **Compression:** PNG-24 with TinyPNG optimization
- **Target File Size:** <50KB per avatar

### Naming Convention
```
avatar_01.png  (Confident Leader)
avatar_02.png  (Cool Strategist)
avatar_03.png  (Playful Challenger)
avatar_04.png  (Fierce Competitor)
avatar_05.png  (Wise Veteran)
```

### Folder Structure
```
frontend/public/assets/avatars/
├── avatar_01.png
├── avatar_02.png
├── avatar_03.png
├── avatar_04.png
├── avatar_05.png
├── README.md (usage guide)
└── processing_notes.md (AI prompts and post-processing log)
```

---

## Post-Processing Pipeline

### Step-by-Step Workflow

**1. Generate High-Resolution (1024x1024px)**
- Use AI tool (Midjourney, DALL-E 3, Leonardo.ai, Ideogram)
- Generate 4+ variations per avatar concept
- Select best option based on:
  - Expression clarity
  - Style consistency
  - Cultural authenticity
  - Arcade energy
  - Technical quality

**2. Resize to 256x256px**
```bash
# Using ImageMagick
convert input.png -resize 256x256 -unsharp 0x1 output.png

# OR using Python (Pillow)
from PIL import Image
img = Image.open('input.png')
img = img.resize((256, 256), Image.Resampling.LANCZOS)
img.save('output.png', 'PNG')
```

**3. Background Removal (if needed)**
- Option A: Use remove.bg online tool
- Option B: Photoshop magic wand + feather 1px
- Option C: Python rembg library
```bash
pip install rembg
rembg i input.png output.png
```

**4. Outline Enhancement (if needed)**
- Open in Photoshop/GIMP
- Select character layer
- Add Layer Style: Stroke
  - Size: 2-3px
  - Position: Outside
  - Color: Black (#000000)
  - Opacity: 100%

**5. Color Correction (optional)**
- Vibrance: +10
- Contrast: +5
- Saturation: +5 (for arcade pop)
- Ensure skin tones remain authentic

**6. Compression**
```bash
# Using TinyPNG API or online tool
# OR using pngquant
pngquant --quality=80-95 --speed 1 avatar_01.png -o avatar_01_compressed.png

# Verify file size
ls -lh avatar_01_compressed.png
```

**7. Quality Validation Checklist**
- [ ] File size <50KB
- [ ] Dimensions exactly 256x256px
- [ ] Transparent background (no artifacts)
- [ ] Bold black outline visible
- [ ] Expression clear and readable
- [ ] Colors vibrant and arcade-style
- [ ] Recognizable at 128px size
- [ ] Recognizable at 64px size
- [ ] No compression artifacts
- [ ] Cultural authenticity maintained

---

## Integration Usage Guide

### React Component Example
```tsx
import avatar01 from '@/assets/avatars/avatar_01.png';
import avatar02 from '@/assets/avatars/avatar_02.png';
import avatar03 from '@/assets/avatars/avatar_03.png';
import avatar04 from '@/assets/avatars/avatar_04.png';
import avatar05 from '@/assets/avatars/avatar_05.png';

const avatarMap = {
  1: avatar01,
  2: avatar02,
  3: avatar03,
  4: avatar04,
  5: avatar05,
};

interface AvatarProps {
  avatarId: number;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  avatarId,
  size = 'medium',
  className = ''
}) => {
  const sizeClasses = {
    small: 'w-16 h-16',   // 64px (game table, leaderboard)
    medium: 'w-32 h-32',  // 128px (lobby, player slots)
    large: 'w-64 h-64',   // 256px (profile, settings)
  };

  return (
    <img
      src={avatarMap[avatarId]}
      alt={`Player Avatar ${avatarId}`}
      className={`${sizeClasses[size]} rounded-full ${className}`}
      style={{
        filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))',
      }}
    />
  );
};
```

### Display Sizes

**Large (256x256px):**
- Player profile card (main menu)
- Settings/profile page
- Avatar selection grid

**Medium (128x128px):**
- Lobby screen player slots
- Match history
- Leaderboards (top players)

**Small (64x64px):**
- Game table player positions
- In-game HUD
- Chat messages
- Leaderboard list

### CSS Styling Recommendations
```css
.avatar {
  /* Base styles */
  border-radius: 50%; /* Circular frame */
  border: 3px solid var(--avatar-border-color, #FFD700);
  background: linear-gradient(135deg, #4B0082, #8B00FF);

  /* Arcade glow effect */
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.3),
    0 0 20px rgba(255, 215, 0, 0.4);

  /* Smooth transitions */
  transition: all 0.3s ease;
}

.avatar:hover {
  transform: scale(1.05);
  box-shadow:
    0 8px 16px rgba(0, 0, 0, 0.4),
    0 0 30px rgba(255, 215, 0, 0.6);
}

.avatar--selected {
  border-color: #FFD700;
  box-shadow:
    0 8px 16px rgba(0, 0, 0, 0.4),
    0 0 40px rgba(255, 215, 0, 0.8);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}
```

---

## Quality Checklist (All Avatars)

### Visual Quality
- [ ] Expression is clear and matches personality
- [ ] Cel-shaded style with bold black outlines (2-3px)
- [ ] High contrast colors for arcade energy
- [ ] Recognizable at thumbnail size (64x64px)
- [ ] Cultural elements authentic and respectful
- [ ] Diverse representation across set
- [ ] Consistent art style across all 5 avatars
- [ ] No stereotypes or caricatures
- [ ] Professional game asset quality

### Technical Quality
- [ ] Exactly 256x256px dimensions
- [ ] PNG format with alpha transparency
- [ ] File size under 50KB
- [ ] Clean transparent edges (no white fringe)
- [ ] Proper filename convention (avatar_01.png)
- [ ] sRGB color space
- [ ] 72 DPI resolution
- [ ] No compression artifacts

### Diversity & Representation
- [ ] 5 distinct personalities represented
- [ ] Range of skin tones (light-medium to very dark)
- [ ] Variety of hairstyles (fade, braids, afro, locs, short)
- [ ] Gender diversity (masculine, feminine, non-binary)
- [ ] Age range (20s-50s)
- [ ] Different energy levels (playful, fierce, calm, confident, wise)
- [ ] Cultural authenticity maintained

### Consistency Check
- [ ] All avatars use same cel-shaded art style
- [ ] Bold black outlines consistent across set
- [ ] Similar level of detail/complexity
- [ ] Color palettes distinct but cohesive
- [ ] All expressions clear and readable
- [ ] Framing and composition consistent

---

## AI Generation Best Practices

### Prompt Engineering Tips

**1. Start Broad, Then Refine**
```
First prompt: "African person avatar, arcade game art"
Analyze results → Identify issues
Second prompt: Add specific details (skin tone hex, expression, style references)
```

**2. Use Style References**
- Include "NBA Jam character portrait"
- Include "cel-shaded comic book art"
- Include "Street Fighter character select"
- These train the AI on the aesthetic

**3. Specify Technical Requirements**
- "256x256px square format"
- "transparent background"
- "bold black outlines"
- "high contrast"

**4. Avoid Vague Descriptors**
❌ "Dark skin" → ✅ "Dark brown skin tone (#4A3728)"
❌ "Nice hair" → ✅ "Long box braids in high ponytail with gold cuffs"
❌ "Friendly" → ✅ "Bright energetic smile with playful sparkle in eyes"

**5. Cultural Sensitivity**
- Use specific hairstyle names (locs, braids, afro, fade)
- Avoid generic "African" descriptors without specifics
- Reference modern African fashion, not only traditional
- Afrofuturism = African heritage + futuristic elements

### Tool-Specific Tips

**Midjourney v6:**
- Use `--style raw` for less stylization
- Use `--ar 1:1` for square format
- Use `--v 6` for latest version
- Example: `/imagine [prompt] --ar 1:1 --v 6 --style raw`

**DALL-E 3:**
- Very literal with prompts, be specific
- Great for diversity and cultural representation
- Specify "digital illustration" not "photo"

**Leonardo.ai:**
- Use "Illustration" or "Vector Art" models
- Enable "Prompt Magic" for better interpretation
- Use "Alchemy" for higher quality

**Ideogram:**
- Excellent for consistent style across set
- Use shorter prompts (more concise)
- Great for bold outlines and graphic style

---

## Troubleshooting Common Issues

### Issue: AI generates photorealistic instead of cel-shaded
**Solution:** Add these to prompt:
- "cel-shaded comic book art"
- "digital illustration, NOT photorealistic"
- "bold black outlines, arcade game character"
- "Street Fighter / NBA Jam style"

### Issue: Background not transparent
**Solution:**
- Generate with solid purple background
- Use remove.bg tool
- OR use Photoshop magic wand + delete
- OR use Python rembg library

### Issue: Outlines too thin or missing
**Solution:**
- Add "bold black outlines 2-3px" to prompt
- OR add in post-processing (Photoshop Layer Style: Stroke)

### Issue: Expression too neutral
**Solution:**
- Be very specific: "confident smirk, raised eyebrow"
- Reference emotions: "competitive intensity"
- Add context: "ready to win, dominant energy"

### Issue: Cultural elements feel generic
**Solution:**
- Research specific African fashion/hairstyles
- Use real style references (Kente patterns, specific braid styles)
- Balance traditional + modern (Afrofuturism)
- Consult cultural authenticity resources

### Issue: File size too large
**Solution:**
- Use TinyPNG compression tool
- OR use pngquant with quality 80-95
- Consider PNG-8 instead of PNG-24 if colors allow
- Reduce alpha channel complexity

---

## Next Steps

### Generation Phase
1. **Select AI Tool:** Choose Midjourney, DALL-E 3, Leonardo.ai, or Ideogram
2. **Generate Variations:** Create 4+ versions of each avatar
3. **Review & Select:** Choose best option for each based on quality checklist
4. **Document:** Record exact prompts used for future consistency

### Post-Processing Phase
1. **Resize:** 1024x1024px → 256x256px
2. **Background Removal:** Make transparent
3. **Outline Enhancement:** Add/strengthen black outlines if needed
4. **Color Correction:** Adjust vibrance, contrast for arcade pop
5. **Compression:** Reduce file size to <50KB
6. **Quality Validation:** Check all items on quality checklist

### Integration Phase
1. **File Organization:** Place in `/frontend/public/assets/avatars/`
2. **React Components:** Create Avatar component
3. **Testing:** Test visibility at all sizes (256px, 128px, 64px)
4. **Documentation:** Update README with usage examples
5. **Handoff:** Provide this document to frontend engineers

---

## Success Criteria

✅ **5 diverse avatars designed** with distinct personalities
✅ **African heritage represented authentically** (skin tones, hairstyles, fashion)
✅ **"Afro-Futurism Meets Arcade Energy" aesthetic achieved**
✅ **Technical specs met** (256x256px, PNG, <50KB, transparent)
✅ **Cel-shaded style with bold outlines** for arcade feel
✅ **Clear expressions** readable at all display sizes
✅ **Cultural authenticity** and respect maintained
✅ **AI generation prompts** ready for execution
✅ **Post-processing workflow** documented
✅ **Integration examples** provided for engineers

---

**Document Version:** 1.0
**Last Updated:** December 18, 2025
**Status:** Ready for AI Generation Phase

---

## Appendix: Color Reference

### Skin Tones Used
```css
--avatar-01-skin: #8D5524;  /* Medium brown - Confident Leader */
--avatar-02-skin: #4A3728;  /* Dark brown - Cool Strategist */
--avatar-03-skin: #B8886B;  /* Light-medium brown - Playful Challenger */
--avatar-04-skin: #2C1810;  /* Very dark brown - Fierce Competitor */
--avatar-05-skin: #6B4F3A;  /* Medium-dark brown - Wise Veteran */
```

### Accent Colors Used
```css
--fire-red: #FF4500;      /* Avatar 01 */
--ice-blue: #00D4FF;      /* Avatar 02 */
--gold: #FFD700;          /* Avatar 03, 05 */
--deep-purple: #4B0082;   /* Avatar 04 */
```

### Background Colors
```css
--transparent: rgba(0, 0, 0, 0);        /* Preferred */
--purple-circle: #4B0082;                /* Alternative (to be removed) */
--outline-black: #000000;                /* Bold outlines */
```
