# Particle Effects Assets - Spar Game

## Overview
This directory contains particle texture sprites for Spar's arcade-style visual effects. All particles follow the "Afro-Futurism Meets Arcade Energy" design philosophy with bold colors, cel-shaded aesthetics, and high-contrast arcade vibes.

## Directory Structure

```
particles/
├── fire/           # Fire streak effects (4 files)
├── ice/            # Freeze counter effects (5 files)
├── explosion/      # Win/impact effects (5 files)
└── confetti/       # Victory celebration (17 files)
    ├── strips/     # Paper strip confetti (6 colors)
    ├── shapes/     # Geometric confetti (6 files)
    └── confetti_kente.png
```

## Effect Types

### 🔥 Fire Effects (fire/)
**Trigger:** "On Fire" status (3 consecutive round wins)
**Files:**
- `fire_particle_01.png` (64x64px) - Primary teardrop flame
- `fire_particle_02.png` (48x48px) - Secondary blob flame
- `fire_spark.png` (32x32px) - Gold spark accent
- `fire_smoke.png` (64x64px) - Smoke trail

**Colors:** Fire Red (#FF4500), Dark Orange (#FF8C00), Gold (#FFD700)

### ❄️ Ice Effects (ice/)
**Trigger:** Breaking opponent's fire streak (freeze counter)
**Files:**
- `ice_crystal_01.png` (48x48px) - Hexagonal crystal
- `ice_crystal_02.png` (40x40px) - Diamond shard
- `ice_frost.png` (32x32px) - Frost cluster
- `ice_vapor.png` (64x64px) - Frozen mist
- `ice_sparkle.png` (24x24px) - Twinkle sparkle

**Colors:** Ice Blue (#00BFFF), Sky Blue (#87CEEB), Light Cyan (#E0FFFF)

### 💥 Explosion Effects (explosion/)
**Trigger:** Round wins, game completion
**Files:**
- `explosion_star.png` (56x56px) - Five-pointed star burst
- `explosion_diamond.png` (48x48px) - Four-pointed diamond
- `explosion_ring.png` (128x128px) - Shockwave ring
- `explosion_flash.png` (96x96px) - Starburst flash
- `explosion_debris.png` (32x32px) - Small debris shapes

**Colors:** Gold (#FFD700), White (#FFFFFF), Orange (#FF6600), Purple (#8B00FF)

### 🎉 Confetti Effects (confetti/)
**Trigger:** Victory screens, achievements
**Files:**
- 6 colored paper strips (16x48px each)
- 6 geometric shapes (20-28px)
- 1 Kente pattern accent (32x32px)

**Colors:** Gold, Kente Red, Rich Green, Deep Purple, Hot Pink, Orange

## Technical Specifications

### File Format
- **Type:** PNG with alpha transparency
- **Color Space:** sRGB
- **Bit Depth:** 32-bit (RGBA)
- **Resolution:** 72 DPI
- **Compression:** Optimized PNG
- **Size Target:** <20KB per file

### Performance Limits (60 FPS Target)
- Fire: Max 50 particles
- Ice: Max 75 particles
- Explosion: Max 100 particles (burst)
- Confetti: Max 200 particles (victory only)

### Mobile Optimization
- Reduce particle counts by 40% on mobile
- Use simpler emitter configurations
- Disable smoke trails on low-end devices

## Usage in Phaser 3

### Loading Assets (BootScene)
```typescript
// Fire particles
this.load.image('fire_particle_01', 'assets/particles/fire/fire_particle_01.png');
this.load.image('fire_spark', 'assets/particles/fire/fire_spark.png');

// Ice particles
this.load.image('ice_crystal_01', 'assets/particles/ice/ice_crystal_01.png');
this.load.image('ice_sparkle', 'assets/particles/ice/ice_sparkle.png');

// Explosion particles
this.load.image('explosion_star', 'assets/particles/explosion/explosion_star.png');
this.load.image('explosion_ring', 'assets/particles/explosion/explosion_ring.png');

// Confetti particles
const colors = ['gold', 'red', 'green', 'purple', 'pink', 'orange'];
colors.forEach(color => {
  this.load.image(
    `confetti_strip_${color}`,
    `assets/particles/confetti/strips/confetti_strip_${color}.png`
  );
});
```

### Basic Emitter Example
```typescript
// Fire effect on card
const fireEmitter = this.add.particles(x, y, 'fire_particle_01', {
  speed: { min: 80, max: 150 },
  angle: { min: -110, max: -70 },
  scale: { start: 0.8, end: 0.2 },
  alpha: { start: 1, end: 0 },
  lifespan: 1500,
  blendMode: 'ADD',
  frequency: 50
});
```

## Asset Status

### ✅ Completed
- Directory structure created
- Design specifications finalized
- Phaser integration code ready

### 🔄 In Progress
- AI generation of particle textures

### ⏳ To Do
- [ ] Generate fire particles (4 files)
- [ ] Generate ice particles (5 files)
- [ ] Generate explosion particles (5 files)
- [ ] Generate confetti particles (17 files)
- [ ] Optimize file sizes with TinyPNG
- [ ] Test in Phaser game scenes
- [ ] Performance testing on mobile devices

## AI Generation Notes

### Recommended Tools
- **Midjourney** - Best for stylized particles with bold outlines
- **DALL-E 3** - Good for geometric shapes and consistent styles
- **Leonardo.ai** - Fast iteration, good for variations
- **Ideogram** - Excellent for text-free graphic elements

### Prompt Tips
- Specify "single particle only" to avoid multiple elements
- Emphasize "thick black outline" for arcade aesthetic
- Include exact hex color codes in prompts
- Request "cel-shaded" style, not realistic rendering
- Specify exact dimensions in prompt

### Quality Checklist
- [ ] Transparent background (pure alpha, no semi-transparent edges)
- [ ] Exact dimensions match specifications
- [ ] Colors match design system palette
- [ ] Black outlines are visible and crisp
- [ ] File size optimized (<20KB)
- [ ] Looks good at 50% scale (in-game size)

## Documentation

**Full Design Specifications:** See `/PARTICLE_EFFECTS_HANDOFF.md`
**Design System Reference:** See `/CARD_DESIGN_HANDOFF.md`
**Product Vision:** See `/PRD.md`

---

**Last Updated:** December 18, 2025
**Status:** Awaiting Asset Generation
**Contact:** arcade-ui-designer
