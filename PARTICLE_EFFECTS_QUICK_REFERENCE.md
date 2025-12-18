# Particle Effects Quick Reference Guide

**Project:** Spar Card Game
**Purpose:** Fast visual reference for particle specifications
**Use:** Quick lookup while generating or implementing particles

---

## 🔥 FIRE PARTICLES (4 files)

| File | Size | Shape | Colors | Use |
|------|------|-------|--------|-----|
| `fire_particle_01.png` | 64x64px | Teardrop flame | Gold→Orange→Red→Crimson | Primary flame |
| `fire_particle_02.png` | 48x48px | Blob flame | Gold→Orange→Red→Crimson | Variation |
| `fire_spark.png` | 32x32px | 4-point star | Gold + White core | Fast accent |
| `fire_smoke.png` | 64x64px | Cloud | Gray + Orange tint | Trailing smoke |

**Colors:**
- Gold: `#FFD700`
- Orange: `#FF8C00`
- Red: `#FF4500`
- Crimson: `#DC143C`

**Style:** Cel-shaded, 3px black outline, arcade energy

**Max Particles:** 50 on screen

---

## ❄️ ICE PARTICLES (5 files)

| File | Size | Shape | Colors | Use |
|------|------|-------|--------|-----|
| `ice_crystal_01.png` | 48x48px | Hexagonal star | Cyan→Sky→Ice→Steel | Primary crystal |
| `ice_crystal_02.png` | 40x40px | Diamond shard | Cyan→Sky→Ice→Steel | Variation |
| `ice_frost.png` | 32x32px | Snowflake | White + Cyan tint | Frost cluster |
| `ice_vapor.png` | 64x64px | Wispy cloud | Sky Blue semi-transparent | Frozen mist |
| `ice_sparkle.png` | 24x24px | 4-point star | White + Cyan glow | Twinkle |

**Colors:**
- Light Cyan: `#E0FFFF`
- Sky Blue: `#87CEEB`
- Ice Blue: `#00BFFF`
- Steel Blue: `#4682B4`

**Style:** Geometric, 2px black outline, sharp edges

**Max Particles:** 75 on screen

---

## 💥 EXPLOSION PARTICLES (5 files)

| File | Size | Shape | Colors | Use |
|------|------|-------|--------|-----|
| `explosion_star.png` | 56x56px | 5-point star | White→Gold→Orange + Purple glow | Star burst |
| `explosion_diamond.png` | 48x48px | 4-point diamond | White→Gold | Diamond burst |
| `explosion_ring.png` | 128x128px | Ring/donut | White→Gold fading | Shockwave |
| `explosion_flash.png` | 96x96px | 8-ray burst | White + Gold tips | Flash burst |
| `explosion_debris.png` | 32x32px | Small shapes | Gold, Orange, Purple, White | Debris |

**Colors:**
- White: `#FFFFFF`
- Gold: `#FFD700`
- Orange: `#FF6600`
- Purple: `#8B00FF`

**Style:** Comic book, 2px black outline, high impact

**Max Particles:** 100 on screen (burst only)

---

## 🎉 CONFETTI PARTICLES (17 files)

### Strips (6 files - 16x48px vertical)
| File | Color | Hex |
|------|-------|-----|
| `confetti_strip_gold.png` | Gold | `#FFD700` |
| `confetti_strip_red.png` | Kente Red | `#E53935` |
| `confetti_strip_green.png` | Rich Green | `#0A5F38` |
| `confetti_strip_purple.png` | Deep Purple | `#8B00FF` |
| `confetti_strip_pink.png` | Hot Pink | `#FF1493` |
| `confetti_strip_orange.png` | Orange | `#FF6600` |

### Geometric Shapes (6 files - varied sizes)
| File | Shape | Size | Color |
|------|-------|------|-------|
| `confetti_square_gold.png` | Square | 24x24px | Gold |
| `confetti_square_red.png` | Square | 24x24px | Red |
| `confetti_triangle_purple.png` | Triangle | 28x28px | Purple |
| `confetti_triangle_pink.png` | Triangle | 28x28px | Pink |
| `confetti_circle_gold.png` | Circle | 20x20px | Gold |
| `confetti_circle_orange.png` | Circle | 20x20px | Orange |

### Cultural Accent (1 file)
| File | Size | Description |
|------|------|-------------|
| `confetti_kente.png` | 32x32px | Simplified Kente cloth pattern (Gold, Red, Green) |

**Style:** Flat colors, 1px darker outline (not black), festive

**Max Particles:** 200 on screen (victory only)

---

## Color Palette Summary

### Fire Colors
```
#FFD700  Gold (brightest)
#FF8C00  Dark Orange
#FF4500  Fire Red
#DC143C  Crimson (darkest)
```

### Ice Colors
```
#E0FFFF  Light Cyan (brightest)
#87CEEB  Sky Blue
#00BFFF  Ice Blue
#4682B4  Steel Blue (darkest)
```

### Explosion Colors
```
#FFFFFF  White (flash)
#FFD700  Gold (primary)
#FF6600  Orange (accent)
#8B00FF  Deep Purple (glow)
```

### Confetti Colors
```
#FFD700  Gold
#E53935  Kente Red
#0A5F38  Rich Green
#8B00FF  Deep Purple
#FF1493  Hot Pink
#FF6600  Orange
```

---

## Style Guidelines

### All Particles
- **Background:** Transparent PNG
- **Format:** PNG-8 or PNG-24 optimized
- **Resolution:** 72 DPI
- **File Size:** <20KB target
- **Color Space:** sRGB
- **Bit Depth:** 32-bit (RGBA)

### Fire & Explosion
- **Outline:** 2-3px solid black (`#000000`)
- **Style:** Cel-shaded, hard color transitions
- **Aesthetic:** Bold arcade energy, comic book style

### Ice
- **Outline:** 2px solid black
- **Style:** Geometric, sharp edges
- **Aesthetic:** Crystalline, angular, contrasting

### Confetti
- **Outline:** 1px darker shade (not black)
- **Style:** Flat color with subtle gradient
- **Aesthetic:** Festive, simple, celebratory

---

## Phaser Loading Snippet

```typescript
// Fire
this.load.image('fire_particle_01', 'assets/particles/fire/fire_particle_01.png');
this.load.image('fire_spark', 'assets/particles/fire/fire_spark.png');

// Ice
this.load.image('ice_crystal_01', 'assets/particles/ice/ice_crystal_01.png');
this.load.image('ice_sparkle', 'assets/particles/ice/ice_sparkle.png');

// Explosion
this.load.image('explosion_star', 'assets/particles/explosion/explosion_star.png');
this.load.image('explosion_ring', 'assets/particles/explosion/explosion_ring.png');

// Confetti (batch load)
const colors = ['gold', 'red', 'green', 'purple', 'pink', 'orange'];
colors.forEach(c => {
  this.load.image(`confetti_strip_${c}`, `assets/particles/confetti/strips/confetti_strip_${c}.png`);
});
```

---

## Performance Targets

| Effect | Max Particles | Emission | Duration | FPS Target |
|--------|--------------|----------|----------|------------|
| Fire | 50 | Continuous | 1.5s lifespan | 60 FPS |
| Ice | 75 | Burst | 2s lifespan | 60 FPS |
| Explosion | 100 | One-time burst | 1.2s lifespan | 60 FPS |
| Confetti | 200 | Continuous (10s) | 4s lifespan | 60 FPS |

### Mobile Adjustments
- Reduce particle counts by 40%
- Fire: 30 particles max
- Ice: 45 particles max
- Explosion: 60 particles max
- Confetti: 100 particles max
- Disable smoke trails

---

## Generation Checklist

### Per Particle
- [ ] Generate 4 variations
- [ ] Select best option
- [ ] Resize to exact dimensions
- [ ] Verify transparent background
- [ ] Add/adjust outlines if needed
- [ ] Verify colors match hex codes
- [ ] Compress with TinyPNG
- [ ] Test at 50% scale
- [ ] Save to correct folder
- [ ] Correct filename

### Quality Check
- [ ] Crisp edges (anti-aliased)
- [ ] Pure transparency (no semi-transparent bg)
- [ ] Outlines visible at full size
- [ ] Colors accurate to palette
- [ ] File size <20KB
- [ ] Dimensions exact
- [ ] No compression artifacts

---

## AI Tool Quick Settings

### Midjourney
```
[Prompt] --style raw --v 6 --ar 1:1 --quality 2
```

### DALL-E 3
```
Standard settings, HD quality
Use prompts as-is
```

### Leonardo.ai
```
Alchemy v2
Preset: Game Asset
Quality: High
```

### Ideogram
```
Mode: Design
Quality: High
Aspect: Square (1:1)
```

---

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Multiple particles in one sprite | Add "single particle only" to prompt |
| Missing outlines | Emphasize "thick black outline" + px width |
| Wrong colors | Provide exact hex codes |
| Too realistic | Emphasize "cel-shaded arcade style" |
| Wrong dimensions | Specify dimensions multiple times |
| Not transparent | Explicitly request "transparent background" |

---

## Folder Structure

```
particles/
├── fire/
│   ├── fire_particle_01.png
│   ├── fire_particle_02.png
│   ├── fire_spark.png
│   └── fire_smoke.png
├── ice/
│   ├── ice_crystal_01.png
│   ├── ice_crystal_02.png
│   ├── ice_frost.png
│   ├── ice_vapor.png
│   └── ice_sparkle.png
├── explosion/
│   ├── explosion_star.png
│   ├── explosion_diamond.png
│   ├── explosion_ring.png
│   ├── explosion_flash.png
│   └── explosion_debris.png
└── confetti/
    ├── strips/
    │   ├── confetti_strip_gold.png
    │   ├── confetti_strip_red.png
    │   ├── confetti_strip_green.png
    │   ├── confetti_strip_purple.png
    │   ├── confetti_strip_pink.png
    │   └── confetti_strip_orange.png
    ├── shapes/
    │   ├── confetti_square_gold.png
    │   ├── confetti_square_red.png
    │   ├── confetti_triangle_purple.png
    │   ├── confetti_triangle_pink.png
    │   ├── confetti_circle_gold.png
    │   └── confetti_circle_orange.png
    └── confetti_kente.png
```

---

## Priority Order

### Phase 1 (Core Gameplay)
1. Fire particles (4 files) - Highest priority
2. Ice particles (5 files) - High priority
3. Test in Phaser

### Phase 2 (Victory)
4. Explosion particles (5 files)
5. Confetti particles (17 files)
6. Test in VictoryScene

### Phase 3 (Polish)
7. Optimize all files
8. Fine-tune emitters
9. Mobile testing

---

## Quick Links

- **Full Specs:** `/PARTICLE_EFFECTS_HANDOFF.md`
- **AI Prompts:** `/AI_PROMPTS_PARTICLE_EFFECTS.md`
- **Developer Docs:** `/frontend/public/assets/particles/README.md`
- **Task Summary:** `/TASK_023_COMPLETION_SUMMARY.md`

---

**Version:** 1.0
**Last Updated:** December 18, 2025
**Total Particles:** 34 textures
**Status:** Ready for Generation
