# Particle Effects Assets - Spar Game

## Overview
This directory contains particle texture sprites for Spar's arcade-style visual effects. All particles follow the "Afro-Futurism Meets Arcade Energy" design philosophy with bold colors, cel-shaded aesthetics, thick black outlines, and high-contrast arcade vibes inspired by NBA Jam, NFL Blitz, and Mortal Kombat.

---

## Directory Structure

```
particles/
├── fire/           # Fire streak effects (8 files)
├── ice/            # Freeze counter effects (8 files)
├── explosion/      # Win/impact effects (10 files)
└── confetti/       # Victory celebration (8 files)
```

**Total:** 34 particle texture files

---

## Effect Types & Specifications

### 🔥 Fire Effects (fire/)
**Trigger:** "On Fire" status (3+ consecutive round wins)
**Count:** 8 textures
**Files:**
1. `flame_small.png` - Small flickering flame (teardrop shape)
2. `flame_large.png` - Large burning flame (organic swirling)
3. `embers.png` - Floating embers/sparks (3-5 cluster)
4. `firebolt.png` - Fast-moving fire projectile (comet shape)
5. `fire_burst.png` - Explosive fire burst (starburst)
6. `fire_ring.png` - Circular fire ring (torus)
7. `fire_trail.png` - Trailing fire effect (swoosh ribbon)
8. `firestorm.png` - Intense fire storm (chaotic vortex)

**Color Palette:**
- Fire Red: `#FF4500`
- Dark Orange: `#FF8C00`
- Gold: `#FFD700`
- Bright Yellow: `#FFFF00`

**Use Cases:**
- Trail behind player avatar during fire streak
- Burst effect when extending streak
- Background ambient flames
- Card play enhancement effects

---

### ❄️ Ice Effects (ice/)
**Trigger:** Breaking opponent's fire streak (freeze counter mechanic)
**Count:** 8 textures
**Files:**
1. `snowflake_small.png` - Delicate small snowflake (6-pointed)
2. `snowflake_large.png` - Large detailed snowflake (intricate mandala)
3. `frost.png` - Frost spreading effect (crystalline cluster)
4. `ice_shard.png` - Sharp ice crystal (angular prism)
5. `ice_burst.png` - Ice explosion (radiating crystal spikes)
6. `ice_ring.png` - Circular ice ring (crystalline circle)
7. `freeze_wave.png` - Freezing wave effect (curved flow)
8. `blizzard.png` - Intense blizzard (swirling snowstorm)

**Color Palette:**
- Ice Blue: `#00BFFF`
- Sky Blue: `#87CEEB`
- Light Cyan: `#E0FFFF`
- White: `#FFFFFF`

**Use Cases:**
- Opponent's fire streak broken visual
- 6 of Spades special power effect
- Freeze opponent card play animations
- Ice-themed background ambience

---

### 💥 Explosion Effects (explosion/)
**Trigger:** Round wins, game completion, special plays
**Count:** 10 textures
**Files:**
1. `burst_small.png` - Small energy burst (compact explosion)
2. `burst_large.png` - Large dramatic explosion (massive burst)
3. `flash_white.png` - Bright white flash (intense light)
4. `flash_gold.png` - Golden flash (victory celebration)
5. `shockwave.png` - Expanding shockwave ring (impact ripple)
6. `smoke_puff.png` - Smoke cloud (puffy cumulus)
7. `smoke_trail.png` - Trailing smoke (wispy ribbon)
8. `spark_shower.png` - Shower of sparks (fountain pattern)
9. `energy_wave.png` - Energy ripple effect (concentric waves)
10. `impact_hit.png` - Impact/hit effect (explosive starburst)

**Color Palette:**
- Gold: `#FFD700`
- White: `#FFFFFF`
- Orange: `#FF6600`
- Purple: `#8B00FF`
- Bright Yellow: `#FFFF00`

**Use Cases:**
- Round win celebration
- Card play impact effects
- Trump card reveal animations
- Special power activations
- Game over final explosion

---

### 🎉 Confetti Effects (confetti/)
**Trigger:** Winner celebrations, achievements, game over
**Count:** 8 textures
**Files:**
1. `streamers.png` - Colorful paper streamers (curled ribbons)
2. `confetti_multi.png` - Multi-colored confetti pieces (scattered)
3. `sparkle_small.png` - Small sparkles/twinkles (4-pointed star)
4. `sparkle_large.png` - Large star sparkles (5-pointed bold)
5. `star_gold.png` - Golden star particles (triumphant)
6. `star_multi.png` - Multi-colored stars (3-5 cluster)
7. `coin_gold.png` - Gold coins (reward feel, Adinkra embossed)
8. `celebration.png` - General celebration particles (mixed cluster)

**Color Palette (Kente-Inspired):**
- Gold: `#FFD700`
- Kente Red: `#DC143C`
- Rich Green: `#228B22`
- Deep Purple: `#8B00FF`
- Hot Pink: `#FF1493`
- Orange: `#FF6600`

**Use Cases:**
- Game winner celebration screen
- Achievement unlocks
- Milestone animations (10 wins, etc.)
- Victory fanfare backgrounds
- End-of-round winner highlight

---

## Technical Specifications

### File Format
- **Type:** PNG-24 with alpha transparency
- **Dimensions:** 512x512 pixels (1:1 ratio)
- **Color Space:** sRGB
- **Bit Depth:** 32-bit (RGBA)
- **Resolution:** 72 DPI
- **Compression:** Optimized PNG (TinyPNG/pngquant)
- **Size Target:** <50KB per file (ideal 20-35KB)

### Visual Style Requirements
- **Outlines:** Thick black outlines (3-5px) for arcade cel-shaded look
- **Colors:** High saturation, neon glow effects, bold contrast
- **Transparency:** Pure alpha channel, no semi-transparent halos
- **Patterns:** Subtle African geometric patterns (Kente, Adinkra) integrated
- **Aesthetic:** NBA Jam/NFL Blitz arcade energy meets Afro-futurism

### Performance Limits (60 FPS Target)
- **Fire:** Max 50 particles simultaneously
- **Ice:** Max 75 particles simultaneously
- **Explosion:** Max 100 particles (short burst)
- **Confetti:** Max 200 particles (victory only, short duration)

### Mobile Optimization
- Reduce particle counts by 40% on mobile devices
- Use simpler emitter configurations (fewer velocity variations)
- Disable smoke trails and complex multi-particle effects on low-end devices
- Consider particle pooling for memory efficiency

---

## Usage in Phaser 3

### Loading Assets (BootScene)
```typescript
export class BootScene extends Phaser.Scene {
  preload() {
    // Fire particles
    this.load.image('flame_small', 'assets/particles/fire/flame_small.png');
    this.load.image('flame_large', 'assets/particles/fire/flame_large.png');
    this.load.image('embers', 'assets/particles/fire/embers.png');
    this.load.image('firebolt', 'assets/particles/fire/firebolt.png');
    this.load.image('fire_burst', 'assets/particles/fire/fire_burst.png');
    this.load.image('fire_ring', 'assets/particles/fire/fire_ring.png');
    this.load.image('fire_trail', 'assets/particles/fire/fire_trail.png');
    this.load.image('firestorm', 'assets/particles/fire/firestorm.png');

    // Ice particles
    this.load.image('snowflake_small', 'assets/particles/ice/snowflake_small.png');
    this.load.image('snowflake_large', 'assets/particles/ice/snowflake_large.png');
    this.load.image('frost', 'assets/particles/ice/frost.png');
    this.load.image('ice_shard', 'assets/particles/ice/ice_shard.png');
    this.load.image('ice_burst', 'assets/particles/ice/ice_burst.png');
    this.load.image('ice_ring', 'assets/particles/ice/ice_ring.png');
    this.load.image('freeze_wave', 'assets/particles/ice/freeze_wave.png');
    this.load.image('blizzard', 'assets/particles/ice/blizzard.png');

    // Explosion particles
    this.load.image('burst_small', 'assets/particles/explosion/burst_small.png');
    this.load.image('burst_large', 'assets/particles/explosion/burst_large.png');
    this.load.image('flash_white', 'assets/particles/explosion/flash_white.png');
    this.load.image('flash_gold', 'assets/particles/explosion/flash_gold.png');
    this.load.image('shockwave', 'assets/particles/explosion/shockwave.png');
    this.load.image('smoke_puff', 'assets/particles/explosion/smoke_puff.png');
    this.load.image('smoke_trail', 'assets/particles/explosion/smoke_trail.png');
    this.load.image('spark_shower', 'assets/particles/explosion/spark_shower.png');
    this.load.image('energy_wave', 'assets/particles/explosion/energy_wave.png');
    this.load.image('impact_hit', 'assets/particles/explosion/impact_hit.png');

    // Confetti particles
    this.load.image('streamers', 'assets/particles/confetti/streamers.png');
    this.load.image('confetti_multi', 'assets/particles/confetti/confetti_multi.png');
    this.load.image('sparkle_small', 'assets/particles/confetti/sparkle_small.png');
    this.load.image('sparkle_large', 'assets/particles/confetti/sparkle_large.png');
    this.load.image('star_gold', 'assets/particles/confetti/star_gold.png');
    this.load.image('star_multi', 'assets/particles/confetti/star_multi.png');
    this.load.image('coin_gold', 'assets/particles/confetti/coin_gold.png');
    this.load.image('celebration', 'assets/particles/confetti/celebration.png');
  }
}
```

### Particle Emitter Examples

#### Fire Streak Effect (On Fire Mode)
```typescript
// Create fire trail behind player avatar
const fireEmitter = this.add.particles(0, 0, 'flame_small', {
  speed: { min: 80, max: 150 },
  angle: { min: -110, max: -70 },
  scale: { start: 0.8, end: 0.2 },
  alpha: { start: 1, end: 0 },
  lifespan: 1500,
  blendMode: 'ADD',
  frequency: 50,
  tint: [0xFF4500, 0xFF8C00, 0xFFD700],
  emitZone: {
    type: 'edge',
    source: new Phaser.Geom.Circle(0, 0, 30),
    quantity: 2
  }
});

// Attach to player avatar
fireEmitter.startFollow(playerAvatar);
```

#### Ice Freeze Burst (Breaking Fire Streak)
```typescript
// Create ice explosion effect
const iceFreeze = this.add.particles(x, y, 'ice_burst', {
  speed: { min: 200, max: 400 },
  angle: { min: 0, max: 360 },
  scale: { start: 1.2, end: 0 },
  alpha: { start: 1, end: 0 },
  lifespan: 1000,
  blendMode: 'NORMAL',
  frequency: -1, // One-time burst
  quantity: 20,
  tint: [0x00BFFF, 0x87CEEB, 0xE0FFFF]
});

// Add freeze ring shockwave
const iceRing = this.add.particles(x, y, 'ice_ring', {
  speed: 0,
  scale: { start: 0.2, end: 2 },
  alpha: { start: 1, end: 0 },
  lifespan: 800,
  blendMode: 'ADD',
  frequency: -1,
  quantity: 1
});

// Trigger both effects
iceFreeze.explode();
iceRing.explode();
```

#### Round Win Explosion
```typescript
// Create dramatic win explosion
const winExplosion = this.add.particles(centerX, centerY, 'burst_large', {
  speed: { min: 300, max: 600 },
  angle: { min: 0, max: 360 },
  scale: { start: 1.5, end: 0.3 },
  alpha: { start: 1, end: 0 },
  lifespan: 1200,
  blendMode: 'ADD',
  frequency: -1,
  quantity: 30,
  tint: [0xFFD700, 0xFFFFFF, 0xFF6600]
});

// Add shockwave ring
const shockwave = this.add.particles(centerX, centerY, 'shockwave', {
  speed: 0,
  scale: { start: 0.5, end: 3 },
  alpha: { start: 1, end: 0 },
  lifespan: 1000,
  blendMode: 'ADD',
  frequency: -1,
  quantity: 2,
  tint: 0xFFFFFF
});

// Add spark shower
const sparks = this.add.particles(centerX, centerY, 'spark_shower', {
  speed: { min: 150, max: 300 },
  angle: { min: -120, max: -60 },
  scale: { start: 0.6, end: 0.2 },
  alpha: { start: 1, end: 0 },
  lifespan: 1500,
  gravity: 400,
  blendMode: 'ADD',
  frequency: 30,
  duration: 1000,
  tint: [0xFFD700, 0xFFFF00]
});

// Trigger all effects
winExplosion.explode();
shockwave.explode();
sparks.start();
```

#### Victory Confetti Celebration
```typescript
// Create multi-layered confetti celebration
const confettiEmitters = [];

// Layer 1: Streamers from top
confettiEmitters.push(
  this.add.particles(centerX, -50, 'streamers', {
    speed: { min: 200, max: 400 },
    angle: { min: 45, max: 135 },
    scale: { start: 1, end: 0.8 },
    alpha: { start: 1, end: 0.7 },
    lifespan: 3000,
    gravity: 300,
    rotate: { min: -360, max: 360 },
    blendMode: 'NORMAL',
    frequency: 80,
    duration: 2000,
    tint: [0xFFD700, 0xDC143C, 0x228B22, 0x8B00FF]
  })
);

// Layer 2: Confetti pieces
confettiEmitters.push(
  this.add.particles(centerX, -50, 'confetti_multi', {
    speed: { min: 150, max: 350 },
    angle: { min: 30, max: 150 },
    scale: { start: 0.8, end: 0.6 },
    alpha: { start: 1, end: 0.8 },
    lifespan: 3500,
    gravity: 250,
    rotate: { start: 0, end: 720 },
    blendMode: 'NORMAL',
    frequency: 40,
    duration: 2500
  })
);

// Layer 3: Gold stars
confettiEmitters.push(
  this.add.particles(centerX, centerY, 'star_gold', {
    speed: { min: 200, max: 500 },
    angle: { min: 0, max: 360 },
    scale: { start: 1.2, end: 0.4 },
    alpha: { start: 1, end: 0 },
    lifespan: 2000,
    blendMode: 'ADD',
    frequency: 100,
    duration: 2000,
    tint: 0xFFD700
  })
);

// Layer 4: Sparkles
confettiEmitters.push(
  this.add.particles(centerX, centerY, 'sparkle_large', {
    speed: { min: 100, max: 300 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.8, end: 0.2 },
    alpha: { start: 1, end: 0 },
    lifespan: 1500,
    blendMode: 'ADD',
    frequency: 60,
    duration: 2500,
    tint: [0xFFFFFF, 0xFFD700]
  })
);

// Start all celebration emitters
confettiEmitters.forEach(emitter => emitter.start());

// Stop after duration
this.time.delayedCall(3000, () => {
  confettiEmitters.forEach(emitter => emitter.stop());
});
```

---

## Asset Status

### ✅ Completed
- [x] Directory structure created (fire, ice, explosion, confetti)
- [x] Design specifications finalized (34 textures)
- [x] AI generation prompts documented (see AI_GENERATION_PROMPTS.md)
- [x] Phaser 3 integration code examples written
- [x] Color palette defined (Afro-futurism + arcade energy)
- [x] Technical requirements specified (512x512px, <50KB)

### 🔄 In Progress
- [ ] AI generation of all 34 particle textures

### ⏳ To Do
- [ ] Generate fire particles (8 files)
- [ ] Generate ice particles (8 files)
- [ ] Generate explosion particles (10 files)
- [ ] Generate confetti particles (8 files)
- [ ] Post-process all textures (background removal, size verification)
- [ ] Optimize file sizes with TinyPNG/pngquant (<50KB each)
- [ ] Test particles in Phaser game scenes
- [ ] Performance testing on mobile devices
- [ ] Create particle emitter configuration presets
- [ ] Document particle animation timing with audio cues

---

## AI Generation Workflow

### Step 1: Generate Using AI Tools
Use the comprehensive prompts in `AI_GENERATION_PROMPTS.md` with tools like:
- **Midjourney** (best for stylized arcade aesthetic)
- **DALL-E 3** (good for geometric precision)
- **Leonardo.ai** (fast iterations)
- **Ideogram** (clean graphic elements)

### Step 2: Post-Processing
1. **Background Removal** - Ensure pure alpha transparency
2. **Size Verification** - Confirm 512x512px dimensions
3. **Color Correction** - Match exact hex codes from palette
4. **Outline Enhancement** - Ensure thick black outlines are bold
5. **File Optimization** - Compress to <50KB using TinyPNG

### Step 3: Quality Check
- [ ] Transparent background (no halos)
- [ ] Exact 512x512 dimensions
- [ ] Colors match design system palette
- [ ] Black outlines visible and crisp
- [ ] File size <50KB
- [ ] Looks good at 50% scale (in-game size)
- [ ] Captures arcade mayhem energy

### Step 4: Organization
- Place files in correct category folder
- Follow naming convention: `{category}_{descriptor}.png`
- Update this README with generation notes
- Commit with descriptive message

---

## Performance Optimization Tips

### Particle Count Management
```typescript
// Adjust particle counts based on device performance
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const particleMultiplier = isMobile ? 0.6 : 1.0;

const fireEmitter = this.add.particles(x, y, 'flame_small', {
  // ... other config
  quantity: Math.floor(10 * particleMultiplier),
  frequency: Math.floor(50 / particleMultiplier)
});
```

### Particle Pooling
```typescript
// Reuse particle emitters instead of creating new ones
class ParticleManager {
  private firePool: Phaser.GameObjects.Particles.ParticleEmitter[];

  getFireEmitter() {
    const emitter = this.firePool.find(e => !e.on);
    if (emitter) {
      emitter.start();
      return emitter;
    }
    // Create new if pool empty
    return this.createFireEmitter();
  }

  releaseEmitter(emitter: Phaser.GameObjects.Particles.ParticleEmitter) {
    emitter.stop();
    this.firePool.push(emitter);
  }
}
```

### Blend Mode Optimization
- Use `'ADD'` blend mode for glowing effects (fire, explosions, sparkles)
- Use `'NORMAL'` blend mode for solid effects (confetti, smoke)
- Avoid `'MULTIPLY'` or complex blend modes on mobile

### Culling Off-Screen Particles
```typescript
const emitter = this.add.particles(x, y, 'flame_small', {
  // ... other config
  bounds: new Phaser.Geom.Rectangle(0, 0, gameWidth, gameHeight),
  collideBottom: false,
  collideTop: false,
  collideLeft: false,
  collideRight: false
});
```

---

## Audio Synchronization

### Recommended Sound Pairings
- **Fire Effects** → `fire_whoosh.mp3`, `flame_ignite.mp3`
- **Ice Effects** → `freeze_crack.mp3`, `ice_shatter.mp3`
- **Explosion Effects** → `explosion_boom.mp3`, `impact_hit.mp3`
- **Confetti Effects** → `celebration_fanfare.mp3`, `victory_chime.mp3`

### Timing Example
```typescript
// Synchronize particle burst with sound effect
this.sound.play('explosion_boom');
this.time.delayedCall(50, () => {
  explosionEmitter.explode(); // Slight delay for visual punch
});
```

---

## Documentation Links

- **Full AI Prompts:** [AI_GENERATION_PROMPTS.md](./AI_GENERATION_PROMPTS.md)
- **Card Design System:** [/CARD_DESIGN_HANDOFF.md](/CARD_DESIGN_HANDOFF.md)
- **Surface Designs:** [/frontend/public/assets/surfaces/SURFACE_DESIGNS.md](/frontend/public/assets/surfaces/SURFACE_DESIGNS.md)
- **Product Vision:** [/PRD.md](/PRD.md)

---

**Last Updated:** December 20, 2025
**Status:** Ready for AI Texture Generation
**Designer:** arcade-ui-designer
**Total Textures:** 34 (8 fire + 8 ice + 10 explosion + 8 confetti)
