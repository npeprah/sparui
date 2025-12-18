# Particle Effects Design Handoff - Spar Game

**Date:** December 18, 2025
**Designer:** arcade-ui-designer
**Status:** Ready for AI Generation
**Project:** Spar - Traditional Ghanaian Card Game

---

## Design Philosophy

### Aesthetic: "Afro-Futurism Meets Arcade Energy"

Particle effects for Spar must embody:
- **Arcade Intensity:** Bold, high-contrast, exaggerated effects (NBA Jam, Mortal Kombat energy)
- **Celebration First:** Every effect is a moment of excitement, not subtle
- **Cultural Fusion:** Where appropriate, incorporate African-inspired patterns and colors
- **Performance Optimized:** Small sprite sizes, efficient rendering for 60 FPS gameplay
- **Phaser-Ready:** Designed specifically for Phaser particle emitters

**Key Principle:** If it doesn't make you say "WHOA!", push it bigger.

---

## Color Palette Reference (From Design System)

```css
/* Primary Effect Colors */
--fire-red: #FF4500;           /* Fire Red - primary fire color */
--fire-orange: #FF8C00;        /* Dark Orange - mid-tone fire */
--fire-gold: #FFD700;          /* Gold - bright fire highlights */
--fire-crimson: #DC143C;       /* Crimson - deep fire shadows */

--ice-blue: #00BFFF;           /* Ice Blue - primary freeze color */
--ice-cyan: #87CEEB;           /* Sky Blue - light ice highlights */
--ice-deep: #4682B4;           /* Steel Blue - deep ice shadows */
--ice-white: #E0FFFF;          /* Light Cyan - bright ice sparkles */

--explosion-gold: #FFD700;     /* Gold - primary explosion */
--explosion-purple: #8B00FF;   /* Deep Purple - secondary accent */
--explosion-white: #FFFFFF;    /* White - bright flash */
--explosion-orange: #FF6600;   /* Orange - warm explosion tones */

--confetti-gold: #FFD700;      /* Gold */
--confetti-red: #E53935;       /* Kente Red */
--confetti-green: #0A5F38;     /* Rich Green */
--confetti-purple: #8B00FF;    /* Deep Purple */
--confetti-pink: #FF1493;      /* Hot Pink */
--confetti-orange: #FF6600;    /* Orange */
```

---

## Effect 1: Fire Particles 🔥

### Design Direction
**Purpose:** Triggered when a player achieves "Fire" status (3 consecutive round wins as leader)

**Visual Style:**
- Bold, cartoonish flames (NOT realistic fire)
- High-contrast cel-shaded aesthetic
- Thick black outlines on particle edges
- Intense orange/red/yellow gradient
- Animated flickering effect
- Arcade energy - think NBA Jam "He's on Fire!"

### Visual Specifications

#### Primary Fire Particle (fire_particle_01.png)
**Type:** Teardrop flame shape

- **Dimensions:** 64x64px
- **Background:** Transparent PNG
- **Shape:** Upward-pointing teardrop/flame shape
- **Colors:**
  - Core: `#FFD700` (Gold) - brightest center
  - Mid: `#FF8C00` (Dark Orange)
  - Outer: `#FF4500` (Fire Red)
  - Edge: `#DC143C` (Crimson) with 3px black outline
- **Gradient:** Radial from center (gold) to edges (crimson)
- **Style:** Cel-shaded with hard color transitions, NOT smooth gradients
- **Outline:** 3px solid black (`#000000`) around entire flame shape
- **Glow:** Subtle outer glow 5px radius in orange (`rgba(255, 140, 0, 0.6)`)

#### Secondary Fire Particle (fire_particle_02.png)
**Type:** Rounded flame blob

- **Dimensions:** 48x48px
- **Shape:** Rounded, organic blob shape (less structured)
- **Colors:** Same palette as primary
- **Use:** Mix with primary for variety in particle emitter

#### Spark Particle (fire_spark.png)
**Type:** Small bright spark

- **Dimensions:** 32x32px
- **Shape:** Four-pointed star or diamond
- **Color:** Pure gold `#FFD700` with white (`#FFFFFF`) center
- **Outline:** 2px black outline
- **Use:** Fast-moving accent particles around main fire

#### Smoke Particle (fire_smoke.png)
**Type:** Trailing smoke cloud

- **Dimensions:** 64x64px
- **Shape:** Soft, irregular cloud shape
- **Colors:**
  - Base: `rgba(51, 51, 51, 0.4)` (dark gray, semi-transparent)
  - Highlights: `rgba(255, 140, 0, 0.2)` (orange tint)
- **Style:** Soft edges, no outline
- **Use:** Trailing behind main fire particles

### AI Generation Prompts

#### Fire Particle Primary
```
Cartoon-style flame particle for arcade game, teardrop shape pointing upward,
bold cel-shaded illustration with thick black outlines,

COLORS (exact gradient):
- Center: bright gold (#FFD700)
- Middle: dark orange (#FF8C00)
- Outer edge: fire red (#FF4500)
- Dark edge: crimson (#DC143C)

STYLE:
- Thick 3px black outline around entire flame
- Hard color transitions (cel-shaded, NOT smooth gradient)
- Arcade game aesthetic (NBA Jam, Mortal Kombat energy)
- High contrast, bold, exaggerated
- Slight outer glow in orange
- 64x64 pixels, transparent background
- Clean sprite for game particle system
- Single flame, not multiple flames

AVOID:
- Realistic fire rendering
- Smooth photographic gradients
- Multiple flames in one sprite
- Excessive detail
- Photorealistic textures

MOOD: Explosive, energetic, arcade mayhem, "HE'S ON FIRE!" energy
```

#### Fire Spark
```
Arcade-style fire spark particle, four-pointed star shape,
bright gold with white center, thick black outline,

STYLE:
- Pure gold color (#FFD700) with white (#FFFFFF) core
- 2px solid black outline
- Simple geometric star or diamond shape
- High contrast, bold arcade aesthetic
- 32x32 pixels, transparent background
- Clean sprite for particle emitter
- Single spark only

MOOD: Fast, bright, energetic, arcade spark effect
```

#### Fire Smoke
```
Stylized smoke trail particle for arcade fire effect,
soft irregular cloud shape, dark gray with orange tint,

COLORS:
- Base: dark gray (rgba 51, 51, 51, 0.4)
- Hints of orange glow (rgba 255, 140, 0, 0.2)

STYLE:
- Soft edges, no outline
- Semi-transparent
- Organic cloud shape
- 64x64 pixels, transparent background
- Simple, stylized (not realistic)
- Arcade game aesthetic

MOOD: Trailing smoke effect, subtle accent
```

### Phaser Integration Notes

#### Fire Emitter Configuration (Phaser 3)
```typescript
// Fire particle emitter for "On Fire" card effect
const fireEmitter = this.add.particles(cardX, cardY, 'fire_particle_01', {
  // Emission
  frequency: 50,           // Emit every 50ms
  lifespan: 1500,          // Particles live 1.5 seconds
  quantity: 2,             // 2 particles per emission

  // Movement
  speed: { min: 80, max: 150 },
  angle: { min: -110, max: -70 },  // Upward cone
  gravityY: -100,          // Float upward

  // Appearance
  scale: { start: 0.8, end: 0.2 },   // Shrink over time
  alpha: { start: 1, end: 0 },        // Fade out
  rotate: { min: -180, max: 180 },    // Random rotation

  // Color tint (optional intensity boost)
  tint: 0xFF6600,

  // Blend mode for glow effect
  blendMode: 'ADD',

  // Bounding box (emit from card edges)
  emitZone: {
    type: 'edge',
    source: new Phaser.Geom.Rectangle(-60, -90, 120, 180),
    quantity: 24
  }
});

// Add spark particles
const sparkEmitter = this.add.particles(cardX, cardY, 'fire_spark', {
  frequency: 80,
  lifespan: 600,
  speed: { min: 150, max: 250 },
  scale: { start: 0.5, end: 0 },
  alpha: { start: 1, end: 0 },
  blendMode: 'ADD'
});

// Add smoke trail
const smokeEmitter = this.add.particles(cardX, cardY, 'fire_smoke', {
  frequency: 100,
  lifespan: 2000,
  speed: { min: 20, max: 50 },
  angle: { min: -100, max: -80 },
  scale: { start: 0.3, end: 0.8 },
  alpha: { start: 0.4, end: 0 }
});

// Animation: Card plays with fire trail
this.tweens.add({
  targets: card,
  x: tableCenterX,
  y: tableCenterY,
  duration: 400,
  ease: 'Power2',
  onUpdate: () => {
    // Move emitters with card
    fireEmitter.setPosition(card.x, card.y);
    sparkEmitter.setPosition(card.x, card.y);
    smokeEmitter.setPosition(card.x, card.y);
  },
  onComplete: () => {
    // Stop emitting after card lands
    fireEmitter.stop();
    sparkEmitter.stop();
    smokeEmitter.stop();
  }
});
```

### Animation Behavior

**Fire Card Play Sequence:**
1. **0ms:** Card lifts from hand, fire emitters activate
2. **0-400ms:** Card flies to table center with fire trail
3. **400ms:** Card lands, fire emitters stop but existing particles complete
4. **400-1900ms:** Particles fade out naturally
5. **Background:** Pulsing orange glow on table surface during fire state

**Performance Note:** Maximum 50 active fire particles on screen at once. Older particles despawn as new ones emit.

---

## Effect 2: Ice/Freeze Particles ❄️

### Design Direction
**Purpose:** Triggered when a player breaks an opponent's fire streak (counter mechanic)

**Visual Style:**
- Crystalline ice shards and frost particles
- Sharp, geometric shapes (contrasts with organic fire)
- Cool blue/cyan/white palette
- Shimmering, sparkle effect
- Frozen vapor clouds
- "Ice Cold!" arcade energy

### Visual Specifications

#### Ice Crystal Shard (ice_crystal_01.png)
**Type:** Sharp geometric crystal

- **Dimensions:** 48x48px
- **Background:** Transparent PNG
- **Shape:** Six-pointed star or hexagonal crystal
- **Colors:**
  - Core: `#E0FFFF` (Light Cyan) - brightest center
  - Mid: `#87CEEB` (Sky Blue)
  - Outer: `#00BFFF` (Ice Blue)
  - Edge: `#4682B4` (Steel Blue) with 2px black outline
- **Style:** Geometric, sharp edges, cel-shaded
- **Outline:** 2px solid black
- **Shimmer:** White sparkle points at crystal tips

#### Ice Shard Variant (ice_crystal_02.png)
**Type:** Diamond-shaped shard

- **Dimensions:** 40x40px
- **Shape:** Elongated diamond/shard shape
- **Colors:** Same ice palette
- **Use:** Mix with primary crystal for variety

#### Frost Particle (ice_frost.png)
**Type:** Small frost cluster

- **Dimensions:** 32x32px
- **Shape:** Small clustered snowflake/frost pattern
- **Color:** White `#FFFFFF` with cyan tint `#87CEEB`
- **Style:** Delicate, intricate pattern
- **Outline:** 1px light blue outline

#### Ice Vapor (ice_vapor.png)
**Type:** Frozen mist cloud

- **Dimensions:** 64x64px
- **Shape:** Soft, wispy cloud shape
- **Colors:**
  - Base: `rgba(135, 206, 235, 0.5)` (sky blue, semi-transparent)
  - Highlights: `rgba(224, 255, 255, 0.3)` (cyan tint)
- **Style:** Soft edges, ethereal
- **Use:** Atmospheric effect around ice crystals

#### Sparkle Particle (ice_sparkle.png)
**Type:** Bright twinkle

- **Dimensions:** 24x24px
- **Shape:** Four-pointed star burst
- **Color:** Pure white `#FFFFFF` with cyan glow
- **Style:** Bright, sharp points
- **Use:** Fast twinkling accents

### AI Generation Prompts

#### Ice Crystal Primary
```
Geometric ice crystal particle for arcade game, six-pointed star or hexagonal shape,
bold cel-shaded illustration with black outlines,

COLORS (exact gradient):
- Center: light cyan (#E0FFFF)
- Middle: sky blue (#87CEEB)
- Outer: ice blue (#00BFFF)
- Edge: steel blue (#4682B4)

STYLE:
- Sharp geometric edges (hexagon or six-pointed star)
- 2px black outline around entire crystal
- Hard color transitions (cel-shaded)
- White sparkle points at tips
- Arcade game aesthetic
- High contrast, bold, crystalline
- 48x48 pixels, transparent background
- Clean sprite for particle system
- Single crystal, not multiple

AVOID:
- Realistic ice rendering
- Organic shapes (keep geometric)
- Smooth gradients (use cel-shading)
- Excessive detail
- Photorealistic textures

MOOD: Cold, sharp, crystalline, "ICE COLD!" arcade freeze effect
```

#### Ice Sparkle
```
Bright ice sparkle particle for arcade game, four-pointed star burst,
pure white with cyan glow,

STYLE:
- Pure white (#FFFFFF) with cyan outer glow
- Sharp pointed star shape
- High contrast, bright arcade aesthetic
- 24x24 pixels, transparent background
- Single sparkle only
- Clean sprite for particle emitter

MOOD: Fast twinkle, bright shimmer, ice sparkle effect
```

#### Ice Vapor
```
Stylized frozen vapor particle for arcade ice effect,
soft wispy cloud shape, sky blue with cyan highlights,

COLORS:
- Base: sky blue (rgba 135, 206, 235, 0.5)
- Highlights: light cyan (rgba 224, 255, 255, 0.3)

STYLE:
- Soft edges, ethereal
- Semi-transparent
- Wispy cloud shape
- 64x64 pixels, transparent background
- Simple, stylized (not realistic)
- Arcade game aesthetic

MOOD: Frozen mist, cold vapor trail
```

### Phaser Integration Notes

#### Freeze Emitter Configuration (Phaser 3)
```typescript
// Ice crystal emitter for freeze counter effect
const iceEmitter = this.add.particles(cardX, cardY, 'ice_crystal_01', {
  // Emission
  frequency: 60,
  lifespan: 2000,
  quantity: 3,

  // Movement
  speed: { min: 100, max: 200 },
  angle: { min: 0, max: 360 },      // Burst in all directions
  gravityY: 50,                     // Slight fall

  // Appearance
  scale: { start: 0.6, end: 0.1 },
  alpha: { start: 1, end: 0 },
  rotate: { min: 0, max: 360, easing: 'Linear' },  // Spin continuously

  // Color tint
  tint: 0x00BFFF,

  // Blend mode
  blendMode: 'ADD',

  // Emit from center burst
  emitZone: {
    type: 'random',
    source: new Phaser.Geom.Circle(0, 0, 20)
  }
});

// Ice sparkles
const sparkleEmitter = this.add.particles(cardX, cardY, 'ice_sparkle', {
  frequency: 40,
  lifespan: 800,
  speed: { min: 80, max: 150 },
  scale: { start: 0.8, end: 0 },
  alpha: { start: 1, end: 0 },
  blendMode: 'ADD',
  tint: [0xFFFFFF, 0x87CEEB, 0x00BFFF]  // Cycle through colors
});

// Freeze vapor
const vaporEmitter = this.add.particles(cardX, cardY, 'ice_vapor', {
  frequency: 120,
  lifespan: 2500,
  speed: { min: 10, max: 30 },
  scale: { start: 0.2, end: 0.6 },
  alpha: { start: 0.6, end: 0 },
  angle: { min: -120, max: -60 }    // Spread upward
});

// Freeze effect overlay on table
const freezeOverlay = this.add.rectangle(
  tableCenterX, tableCenterY,
  tableWidth, tableHeight,
  0x00BFFF, 0.15
);

this.tweens.add({
  targets: freezeOverlay,
  alpha: { from: 0, to: 0.15 },
  duration: 300,
  yoyo: true,
  repeat: 2
});
```

### Animation Behavior

**Freeze Counter Sequence:**
1. **0ms:** Opponent plays winning card, breaking fire streak
2. **0-100ms:** Screen flash blue tint
3. **100ms:** Ice crystal burst from card
4. **100-600ms:** Crystals spread outward in all directions
5. **600-2600ms:** Sparkles twinkle around card, vapor rises
6. **Background:** Blue frost overlay spreads across table (pulse 3 times)

**Audio Sync:** Ice crack sound at 0ms, crystalline chime at 100ms

---

## Effect 3: Explosion/Win Particles 💥

### Design Direction
**Purpose:** Round wins, game completion victories, special achievements

**Visual Style:**
- Burst explosion with star shapes
- Confetti-like celebration
- Gold and purple accent colors
- Screen flash on detonation
- High energy arcade impact
- "BOOM!" comic book style energy

### Visual Specifications

#### Star Burst Particle (explosion_star.png)
**Type:** Five-pointed star

- **Dimensions:** 56x56px
- **Background:** Transparent PNG
- **Shape:** Five-pointed star with rounded points
- **Colors:**
  - Core: `#FFFFFF` (White) - brightest center
  - Mid: `#FFD700` (Gold)
  - Outer: `#FF6600` (Orange)
  - Edge glow: `#8B00FF` (Deep Purple) with 2px outline
- **Style:** Bold, comic book style with black outline
- **Outline:** 2px solid black
- **Glow:** Purple glow around entire star

#### Diamond Burst (explosion_diamond.png)
**Type:** Four-pointed diamond

- **Dimensions:** 48x48px
- **Shape:** Diamond/rhombus shape
- **Colors:** Gold `#FFD700` with white center
- **Outline:** 2px black
- **Use:** Mix with stars for variety

#### Ring Shockwave (explosion_ring.png)
**Type:** Expanding ring

- **Dimensions:** 128x128px (larger for scale animation)
- **Shape:** Circular ring/donut shape
- **Colors:**
  - Inner edge: White `#FFFFFF`
  - Outer edge: Gold `#FFD700` fading to transparent
- **Style:** Thick ring, 12px width
- **Outline:** 2px black on both edges
- **Use:** Initial burst expanding outward

#### Flash Particle (explosion_flash.png)
**Type:** Bright burst rays

- **Dimensions:** 96x96px
- **Shape:** 8-pointed starburst with sharp rays
- **Color:** Pure white `#FFFFFF` with gold tips
- **Style:** Sharp, radiating rays
- **Use:** Initial explosion flash

#### Debris Particle (explosion_debris.png)
**Type:** Small geometric shapes

- **Dimensions:** 32x32px
- **Shapes:** Mix of small squares, triangles, circles
- **Colors:** Gold, orange, purple, white (varied)
- **Style:** Simple geometric shapes with outlines
- **Use:** Scattered debris in explosion

### AI Generation Prompts

#### Explosion Star
```
Comic book style explosion star particle for arcade game,
five-pointed star with rounded points, bold colors,

COLORS (gradient from center out):
- Center: pure white (#FFFFFF)
- Inner: gold (#FFD700)
- Outer: orange (#FF6600)
- Glow: deep purple (#8B00FF) outer glow

STYLE:
- Bold comic book / arcade aesthetic
- 2px solid black outline
- Rounded star points (not sharp)
- High contrast, vibrant
- Purple glow effect around entire star
- 56x56 pixels, transparent background
- Clean sprite for particle system
- Single star only

AVOID:
- Realistic explosion rendering
- Multiple stars in one sprite
- Excessive detail
- Photorealistic shading

MOOD: Explosive, energetic, arcade impact, "BOOM!" energy
```

#### Explosion Ring
```
Expanding shockwave ring for arcade explosion effect,
circular donut shape, bold outline,

COLORS:
- Inner edge: white (#FFFFFF)
- Outer edge: gold (#FFD700) fading to transparent
- Ring width: 12px thick

STYLE:
- Clean circular ring/donut shape
- 2px black outline on both inner and outer edges
- Simple, bold arcade aesthetic
- 128x128 pixels, transparent background
- Single ring only

MOOD: Expanding shockwave, explosion impact ring
```

#### Explosion Flash
```
Bright starburst flash for arcade explosion,
8-pointed sharp rays radiating from center,

COLORS:
- Center: pure white (#FFFFFF)
- Ray tips: gold (#FFD700)

STYLE:
- Sharp radiating rays (8 points)
- High contrast, bright arcade aesthetic
- 96x96 pixels, transparent background
- Single starburst only
- Bold comic book style

MOOD: Bright explosion flash, instant impact burst
```

### Phaser Integration Notes

#### Explosion Emitter Configuration (Phaser 3)
```typescript
// Explosion burst on round win
function createExplosionEffect(scene, x, y) {
  // Screen flash
  const flash = scene.add.rectangle(0, 0, scene.scale.width, scene.scale.height, 0xFFFFFF, 0);
  flash.setOrigin(0, 0);
  flash.setDepth(1000);

  scene.tweens.add({
    targets: flash,
    alpha: { from: 0, to: 0.6, to: 0 },
    duration: 200,
    onComplete: () => flash.destroy()
  });

  // Camera shake
  scene.cameras.main.shake(200, 0.005);

  // Ring shockwave
  const ring = scene.add.sprite(x, y, 'explosion_ring');
  ring.setBlendMode(Phaser.BlendModes.ADD);
  ring.setAlpha(1);
  ring.setScale(0.1);

  scene.tweens.add({
    targets: ring,
    scale: 3,
    alpha: 0,
    duration: 600,
    ease: 'Power2',
    onComplete: () => ring.destroy()
  });

  // Star particles
  const starEmitter = scene.add.particles(x, y, 'explosion_star', {
    speed: { min: 150, max: 350 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.8, end: 0 },
    alpha: { start: 1, end: 0 },
    rotate: { min: 0, max: 360 },
    lifespan: 1200,
    quantity: 25,
    gravityY: 200,
    blendMode: 'ADD',
    emitting: false
  });

  starEmitter.explode(25, x, y);

  // Diamond particles
  const diamondEmitter = scene.add.particles(x, y, 'explosion_diamond', {
    speed: { min: 100, max: 250 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.6, end: 0 },
    alpha: { start: 1, end: 0 },
    rotate: { min: -180, max: 180 },
    lifespan: 1000,
    quantity: 15,
    gravityY: 150,
    blendMode: 'ADD',
    emitting: false
  });

  diamondEmitter.explode(15, x, y);

  // Flash burst
  const flash = scene.add.sprite(x, y, 'explosion_flash');
  flash.setBlendMode(Phaser.BlendModes.ADD);
  flash.setScale(0.5);

  scene.tweens.add({
    targets: flash,
    scale: 2,
    alpha: { from: 1, to: 0 },
    angle: 180,
    duration: 400,
    ease: 'Power2',
    onComplete: () => flash.destroy()
  });

  // Cleanup after 2 seconds
  scene.time.delayedCall(2000, () => {
    starEmitter.destroy();
    diamondEmitter.destroy();
  });
}
```

### Animation Behavior

**Round Win Explosion:**
1. **0ms:** Screen flash white (200ms)
2. **0ms:** Camera shake (subtle)
3. **0ms:** Ring shockwave expands from card (600ms)
4. **50ms:** Star burst particles explode outward (25 stars)
5. **50ms:** Diamond particles scatter (15 diamonds)
6. **0-400ms:** Flash starburst rotates and fades
7. **0-1200ms:** Particles fly and fall with gravity
8. **Audio:** Explosion boom at 0ms, sparkle sounds at 50ms

---

## Effect 4: Confetti/Celebration Particles 🎉

### Design Direction
**Purpose:** Game victory screen, match completion, achievements unlocked

**Visual Style:**
- Colorful paper confetti strips
- African-inspired geometric shapes (optional accent)
- Rainbow of colors from design system
- Festive, joyful, party energy
- Continuous falling/floating effect
- Maximum celebration vibes

### Visual Specifications

#### Paper Strip Confetti (confetti_strip_01.png)
**Type:** Rectangular paper strip

- **Dimensions:** 16x48px (vertical strip)
- **Background:** Transparent PNG
- **Shape:** Thin rectangular strip with slight curve
- **Colors:** Create 6 variations:
  - Gold `#FFD700`
  - Kente Red `#E53935`
  - Rich Green `#0A5F38`
  - Deep Purple `#8B00FF`
  - Hot Pink `#FF1493`
  - Orange `#FF6600`
- **Style:** Simple flat color with subtle gradient
- **Outline:** 1px darker shade of base color (not black)
- **Shimmer:** Optional white highlight on one edge

#### Square Confetti (confetti_square.png)
**Type:** Small square

- **Dimensions:** 24x24px
- **Shape:** Perfect square
- **Colors:** Same 6-color variations as strips
- **Style:** Flat color with slight gradient
- **Outline:** 1px darker shade

#### Triangle Confetti (confetti_triangle.png)
**Type:** Equilateral triangle

- **Dimensions:** 28x28px
- **Shape:** Equilateral triangle
- **Colors:** Same 6-color variations
- **Style:** Flat color with gradient
- **Outline:** 1px darker shade

#### Circle Confetti (confetti_circle.png)
**Type:** Small circle/dot

- **Dimensions:** 20x20px
- **Shape:** Perfect circle
- **Colors:** Same 6-color variations
- **Style:** Solid color with white highlight
- **Outline:** 1px darker shade

#### Kente Pattern Confetti (confetti_kente.png)
**Type:** Geometric pattern piece (optional cultural accent)

- **Dimensions:** 32x32px
- **Shape:** Small geometric pattern inspired by Kente cloth
- **Colors:** Multi-color geometric pattern (gold, red, green)
- **Style:** Simplified Kente pattern, recognizable but small
- **Use:** 10-20% of total confetti for cultural accent

### AI Generation Prompts

#### Confetti Strip (6 Color Variations)
```
Paper confetti strip for arcade game celebration effect,
simple rectangular strip with slight curve,

COLOR: [SPECIFY ONE]:
- Version 1: Gold (#FFD700)
- Version 2: Kente Red (#E53935)
- Version 3: Rich Green (#0A5F38)
- Version 4: Deep Purple (#8B00FF)
- Version 5: Hot Pink (#FF1493)
- Version 6: Orange (#FF6600)

STYLE:
- Simple flat color with subtle gradient
- Thin rectangular strip shape (vertical orientation)
- Slight curve/bend in the strip
- 1px darker outline (not black, darker shade of base color)
- Optional white shimmer on one edge
- 16x48 pixels, transparent background
- Clean sprite for particle system
- Single strip only

AVOID:
- Photorealistic rendering
- Complex textures
- Multiple strips in one sprite

MOOD: Festive, celebration, party confetti
```

#### Confetti Geometric Shapes (Square/Triangle/Circle)
```
Simple geometric confetti particle for arcade celebration,
[SHAPE: square/triangle/circle], flat color,

COLOR: [Gold/Red/Green/Purple/Pink/Orange]

STYLE:
- Simple flat color with subtle gradient
- Clean geometric shape
- 1px darker outline (not black)
- Arcade game aesthetic
- [SIZE] pixels, transparent background
- Single shape only

MOOD: Festive celebration, party confetti
```

#### Kente Pattern Confetti
```
Small Kente cloth-inspired geometric pattern confetti,
simplified African textile pattern, multi-color,

COLORS:
- Gold (#FFD700)
- Kente Red (#E53935)
- Rich Green (#0A5F38)

STYLE:
- Simplified geometric Kente pattern
- Small scale, recognizable pattern
- Bold colors, high contrast
- 32x32 pixels, transparent background
- Single pattern piece
- Cultural accent, not complex detail

MOOD: Celebratory, African heritage, festive
```

### Phaser Integration Notes

#### Confetti Emitter Configuration (Phaser 3)
```typescript
// Victory celebration confetti
function createConfettiEffect(scene) {
  const confettiTextures = [
    'confetti_strip_gold',
    'confetti_strip_red',
    'confetti_strip_green',
    'confetti_strip_purple',
    'confetti_strip_pink',
    'confetti_strip_orange',
    'confetti_square_gold',
    'confetti_square_red',
    'confetti_triangle_purple',
    'confetti_circle_pink',
    'confetti_kente'
  ];

  // Main confetti emitter (from top of screen)
  const confettiEmitter = scene.add.particles(
    scene.scale.width / 2, -50,
    confettiTextures[0],  // Will cycle through all
    {
      // Emission
      frequency: 30,
      lifespan: 4000,
      quantity: 3,

      // Movement
      speed: { min: 100, max: 200 },
      angle: { min: 70, max: 110 },   // Mostly downward with spread
      gravityY: 150,

      // Appearance
      scale: { start: 1, end: 0.8 },
      alpha: { start: 1, end: 0.7 },
      rotate: { min: -360, max: 360, easing: 'Linear' },  // Continuous spin

      // Emit zone (across top of screen)
      emitZone: {
        type: 'random',
        source: new Phaser.Geom.Rectangle(-100, 0, scene.scale.width + 200, 50)
      },

      // Randomize textures
      frame: confettiTextures
    }
  );

  // Side confetti bursts (left and right)
  const leftBurst = scene.add.particles(0, scene.scale.height / 2, confettiTextures[0], {
    speed: { min: 200, max: 400 },
    angle: { min: -60, max: -30 },
    gravityY: 200,
    scale: { start: 1, end: 0.5 },
    alpha: { start: 1, end: 0 },
    rotate: { min: 0, max: 360 },
    lifespan: 3000,
    quantity: 15,
    emitting: false,
    frame: confettiTextures
  });

  const rightBurst = scene.add.particles(scene.scale.width, scene.scale.height / 2, confettiTextures[0], {
    speed: { min: 200, max: 400 },
    angle: { min: -150, max: -120 },
    gravityY: 200,
    scale: { start: 1, end: 0.5 },
    alpha: { start: 1, end: 0 },
    rotate: { min: 0, max: 360 },
    lifespan: 3000,
    quantity: 15,
    emitting: false,
    frame: confettiTextures
  });

  // Trigger side bursts periodically
  scene.time.addEvent({
    delay: 800,
    callback: () => {
      leftBurst.explode(15);
      rightBurst.explode(15);
    },
    repeat: 5
  });

  // Stop after 10 seconds
  scene.time.delayedCall(10000, () => {
    confettiEmitter.stop();
    scene.time.delayedCall(4000, () => {
      confettiEmitter.destroy();
      leftBurst.destroy();
      rightBurst.destroy();
    });
  });

  return confettiEmitter;
}
```

### Animation Behavior

**Victory Confetti Sequence:**
1. **0ms:** Continuous confetti falls from top of screen
2. **800ms:** Side bursts explode from left and right edges
3. **1600ms:** Second side burst
4. **2400ms:** Third side burst
5. **Continues:** Confetti falls continuously for 10 seconds
6. **10000ms:** Stop emitting new confetti
7. **14000ms:** All particles complete, cleanup

**Variation Ideas:**
- **Quick Win:** 3-second confetti burst
- **Perfect Game:** 15-second extended celebration
- **Achievement:** Specific color burst (all gold for high achievement)

---

## Asset Checklist

### Fire Effects (7 files)
- [ ] `fire_particle_01.png` (64x64px) - Primary teardrop flame
- [ ] `fire_particle_02.png` (48x48px) - Secondary blob flame
- [ ] `fire_spark.png` (32x32px) - Gold spark
- [ ] `fire_smoke.png` (64x64px) - Smoke trail

### Ice Effects (5 files)
- [ ] `ice_crystal_01.png` (48x48px) - Primary hexagonal crystal
- [ ] `ice_crystal_02.png` (40x40px) - Diamond shard
- [ ] `ice_frost.png` (32x32px) - Frost cluster
- [ ] `ice_vapor.png` (64x64px) - Frozen mist
- [ ] `ice_sparkle.png` (24x24px) - Twinkle sparkle

### Explosion Effects (5 files)
- [ ] `explosion_star.png` (56x56px) - Five-pointed star
- [ ] `explosion_diamond.png` (48x48px) - Four-pointed diamond
- [ ] `explosion_ring.png` (128x128px) - Shockwave ring
- [ ] `explosion_flash.png` (96x96px) - Starburst flash
- [ ] `explosion_debris.png` (32x32px) - Small debris shapes

### Confetti Effects (17 files)
**Strips (6 color variations):**
- [ ] `confetti_strip_gold.png` (16x48px)
- [ ] `confetti_strip_red.png` (16x48px)
- [ ] `confetti_strip_green.png` (16x48px)
- [ ] `confetti_strip_purple.png` (16x48px)
- [ ] `confetti_strip_pink.png` (16x48px)
- [ ] `confetti_strip_orange.png` (16x48px)

**Geometric Shapes (3 types × 6 colors = 18, prioritize 6 total):**
- [ ] `confetti_square_gold.png` (24x24px)
- [ ] `confetti_square_red.png` (24x24px)
- [ ] `confetti_triangle_purple.png` (28x28px)
- [ ] `confetti_triangle_pink.png` (28x28px)
- [ ] `confetti_circle_gold.png` (20x20px)
- [ ] `confetti_circle_orange.png` (20x20px)

**Cultural Accent:**
- [ ] `confetti_kente.png` (32x32px)

**Total Assets:** ~34 particle textures

---

## File Organization

### Folder Structure
```
frontend/public/assets/particles/
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

## Technical Specifications

### Export Settings (All Particles)
- **Format:** PNG with alpha transparency
- **Color Space:** sRGB
- **Bit Depth:** 32-bit (8-bit RGB + 8-bit alpha)
- **Resolution:** 72 DPI (web-optimized)
- **Compression:** PNG-8 or PNG-24 optimized
- **Target File Size:** <20KB per particle (most will be 5-10KB)
- **Optimization Tool:** TinyPNG or similar after generation

### Naming Convention
```
[effect_type]_[particle_name]_[variation].png

Examples:
- fire_particle_01.png
- ice_crystal_02.png
- explosion_star.png
- confetti_strip_gold.png
```

### Quality Requirements
- **Crisp Edges:** All particles must have clean, anti-aliased edges
- **Transparent Background:** Pure transparency (no semi-transparent background)
- **Outline Clarity:** Black outlines must be visible at full size
- **Color Accuracy:** Colors must match exact hex codes from palette
- **Size Consistency:** Particles of same type must be consistent dimensions

---

## Phaser Loading (Boot Scene)

### Asset Preload Code
```typescript
// src/game/scenes/BootScene.ts
export class BootScene extends Phaser.Scene {
  preload() {
    // Fire particles
    this.load.image('fire_particle_01', 'assets/particles/fire/fire_particle_01.png');
    this.load.image('fire_particle_02', 'assets/particles/fire/fire_particle_02.png');
    this.load.image('fire_spark', 'assets/particles/fire/fire_spark.png');
    this.load.image('fire_smoke', 'assets/particles/fire/fire_smoke.png');

    // Ice particles
    this.load.image('ice_crystal_01', 'assets/particles/ice/ice_crystal_01.png');
    this.load.image('ice_crystal_02', 'assets/particles/ice/ice_crystal_02.png');
    this.load.image('ice_frost', 'assets/particles/ice/ice_frost.png');
    this.load.image('ice_vapor', 'assets/particles/ice/ice_vapor.png');
    this.load.image('ice_sparkle', 'assets/particles/ice/ice_sparkle.png');

    // Explosion particles
    this.load.image('explosion_star', 'assets/particles/explosion/explosion_star.png');
    this.load.image('explosion_diamond', 'assets/particles/explosion/explosion_diamond.png');
    this.load.image('explosion_ring', 'assets/particles/explosion/explosion_ring.png');
    this.load.image('explosion_flash', 'assets/particles/explosion/explosion_flash.png');
    this.load.image('explosion_debris', 'assets/particles/explosion/explosion_debris.png');

    // Confetti particles (strips)
    const confettiColors = ['gold', 'red', 'green', 'purple', 'pink', 'orange'];
    confettiColors.forEach(color => {
      this.load.image(
        `confetti_strip_${color}`,
        `assets/particles/confetti/strips/confetti_strip_${color}.png`
      );
    });

    // Confetti particles (shapes)
    this.load.image('confetti_square_gold', 'assets/particles/confetti/shapes/confetti_square_gold.png');
    this.load.image('confetti_square_red', 'assets/particles/confetti/shapes/confetti_square_red.png');
    this.load.image('confetti_triangle_purple', 'assets/particles/confetti/shapes/confetti_triangle_purple.png');
    this.load.image('confetti_triangle_pink', 'assets/particles/confetti/shapes/confetti_triangle_pink.png');
    this.load.image('confetti_circle_gold', 'assets/particles/confetti/shapes/confetti_circle_gold.png');
    this.load.image('confetti_circle_orange', 'assets/particles/confetti/shapes/confetti_circle_orange.png');
    this.load.image('confetti_kente', 'assets/particles/confetti/confetti_kente.png');
  }
}
```

---

## Performance Considerations

### Particle Limits (60 FPS Target)
- **Fire Effect:** Max 50 particles on screen
- **Ice Effect:** Max 75 particles on screen
- **Explosion Effect:** Max 100 particles on screen (burst, not continuous)
- **Confetti Effect:** Max 200 particles on screen (victory only)

### Optimization Techniques
1. **Pooling:** Reuse particle emitters instead of creating new ones
2. **Culling:** Don't emit particles outside camera view
3. **Texture Atlas:** Consider combining all particles into single atlas (optional)
4. **Blend Modes:** Use 'ADD' blend mode for glow effects (GPU-accelerated)
5. **Lifespan Management:** Remove particles immediately when no longer visible

### Mobile Optimizations
- Reduce particle count by 40% on mobile devices
- Use simpler particles (fewer per effect)
- Disable smoke trails on low-end devices
- Limit confetti to 100 particles max on mobile

---

## Testing Checklist

### Visual Quality
- [ ] All particles have transparent backgrounds
- [ ] Outlines are visible and crisp at full size
- [ ] Colors match design system palette exactly
- [ ] Particles look good at 50% scale (in-game view)
- [ ] No compression artifacts or pixelation
- [ ] Particles read clearly against dark and light backgrounds

### Technical Quality
- [ ] All files are exact specified dimensions
- [ ] File sizes are under 20KB each
- [ ] PNG format with alpha channel
- [ ] Files load correctly in Phaser
- [ ] No console errors when loading assets

### Animation Quality
- [ ] Fire effect feels energetic and powerful
- [ ] Ice effect feels cold and sharp (contrasts with fire)
- [ ] Explosion effect has strong impact
- [ ] Confetti effect feels celebratory and joyful
- [ ] All effects run at 60 FPS on test devices
- [ ] Particle lifespans feel natural (not too quick or slow)

### Integration Testing
- [ ] Effects trigger on correct game events
- [ ] Multiple effects can run simultaneously without lag
- [ ] Effects cleanup properly (no memory leaks)
- [ ] Effects sync with sound effects
- [ ] Effects work across all screen sizes

---

## AI Generation Workflow

### Recommended Process
1. **Start with Primary Particles:**
   - Generate fire_particle_01, ice_crystal_01, explosion_star first
   - Review and iterate until style is perfect
   - These set the visual standard for all others

2. **Generate Variations:**
   - Use successful prompts as templates
   - Maintain consistent style across effect type
   - Generate 4 variations, select best

3. **Post-Processing:**
   - Resize to exact dimensions in image editor
   - Add/adjust outlines if AI missed them
   - Ensure transparent background is pure
   - Compress with TinyPNG

4. **Test in Phaser:**
   - Load into BootScene
   - Test in particle emitter
   - Check appearance at different scales
   - Verify performance (FPS)

5. **Iterate:**
   - Adjust colors if needed
   - Tweak particle sizes based on in-game appearance
   - Refine emitter settings for best effect

### Prompt Refinement Tips
- If AI adds multiple particles, specify "single particle only"
- If outlines are missing, emphasize "thick black outline"
- If colors are wrong, provide exact hex codes in prompt
- If style is too realistic, emphasize "cel-shaded arcade style"
- If shapes are organic, specify "geometric" or "sharp edges"

---

## Next Steps

### Phase 1: Core Effects (Priority)
1. Generate **Fire Particles** (4 files)
   - These are most visible in gameplay
   - "On Fire" is a key game mechanic
2. Generate **Ice Particles** (5 files)
   - Direct counter to fire effect
   - High visibility moment
3. Test fire and ice in Phaser
   - Integrate into GameScene
   - Verify performance and visual impact

### Phase 2: Victory Effects
4. Generate **Explosion Particles** (5 files)
   - Round win celebrations
5. Generate **Confetti Particles** (17 files)
   - Game victory screen
6. Test victory effects
   - Integrate into VictoryScene

### Phase 3: Polish
7. Refine particle emitter settings
8. Add sound effect synchronization
9. Optimize for mobile devices
10. Final quality pass and testing

---

## Success Criteria

### Visual Impact
✅ Effects capture arcade energy ("WHOA!" factor)
✅ Fire feels hot, explosive, powerful
✅ Ice feels cold, sharp, contrasting
✅ Explosions feel impactful and celebratory
✅ Confetti feels joyful and festive

### Technical Performance
✅ All effects run at 60 FPS
✅ File sizes are optimized (<20KB each)
✅ Assets load quickly (<1 second total)
✅ No memory leaks or performance degradation
✅ Mobile performance is acceptable (40 FPS minimum)

### Integration Success
✅ Effects trigger correctly on game events
✅ Effects sync with sound effects
✅ Effects enhance gameplay without distracting
✅ Effects work across all screen sizes
✅ Effects match established visual language

---

**Document Version:** 1.0
**Last Updated:** December 18, 2025
**Status:** Ready for AI Asset Generation
**Next Action:** Generate Fire Particles (Priority 1)
