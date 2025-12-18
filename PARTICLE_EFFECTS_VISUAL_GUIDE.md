# Particle Effects Visual Guide

**Project:** Spar Card Game
**Purpose:** Visual representation of particle effects in gameplay
**Use:** Reference for understanding particle behavior and appearance

---

## Visual Context: Game Screen

```
┌─────────────────────────────────────────────────────────────┐
│  SPAR                Round 3/5                  Score: 5-3  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                      OPPONENT                               │
│                   [Hand of 4 cards]                         │
│                   🔥 ON FIRE! Streak: 3                     │
│                                                             │
│              ╔══════════════════╗                           │
│              ║                  ║                           │
│              ║  [TABLE CENTER]  ║                           │
│              ║                  ║                           │
│              ║   [Played Cards] ║                           │
│              ║                  ║                           │
│              ╚══════════════════╝                           │
│                                                             │
│                      YOUR HAND                              │
│              [7♥] [9♦] [J♣] [K♥] [A♠]                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Effect 1: Fire Particles 🔥

### When It Appears
**Trigger:** Player wins 3 consecutive rounds as leader → achieves "On Fire" status
**Location:** Around the card and trailing behind during movement
**Duration:** While "On Fire" status is active (continuous emission)

### Visual Representation
```
              🔥 Flames rise upward
               🔥 🔥 🔥
            💛 🔥 🧡 🔥 💛
         ⭐ 🧡 🔥 💛 🔥 🧡 ⭐    ← Sparks burst outward
      ┌─────────────────────┐
      │  🔥  K  🔥          │
      │     ♥               │    ← Card with fire aura
      │                     │
      │  🔥  K  🔥          │
      └─────────────────────┘
         💨 💨 💨 💨 💨      ← Smoke trails behind
```

### Particle Breakdown
```
FIRE PARTICLE 01 (Primary Flame)
    ╭─╮
   ╭───╮     64x64px
  ╭─────╮    Teardrop shape
  │█████│    Gold (center) → Orange → Red → Crimson (edge)
  │ ███ │    3px black outline
   ╰───╯     Cel-shaded hard transitions
    ╰─╯

FIRE SPARK (Accent)
    ✦        32x32px
   ✦ ✦       4-pointed star
  ✦ ✦ ✦      Gold + White center
   ✦ ✦       2px black outline
    ✦        Fast-moving

FIRE SMOKE (Trail)
   ☁☁☁       64x64px
  ☁☁☁☁☁      Soft cloud shape
 ☁☁☁☁☁☁☁     Dark gray + orange tint
  ☁☁☁☁☁      Semi-transparent, no outline
   ☁☁☁       Trails behind card
```

### Movement Pattern
```
Card Movement Path (left to right):
   Start                                    End
     🔥                                      🔥
    🔥🧡   →   💨🔥🧡   →   💨💨🔥🧡   →   💨💨🔥🧡
   [K♥]       [K♥]→       [K♥]→→       [K♥]→→→
    🔥⭐        🔥⭐         🔥⭐          🔥⭐
     🔥         💨🔥         💨💨🔥        💨💨🔥

    0ms        100ms       200ms        400ms (lands)
```

### Color Flow (Gradient)
```
  BRIGHT ↓
    💛  #FFD700 (Gold - brightest core)
    🧡  #FF8C00 (Orange - mid-tone)
    🔴  #FF4500 (Fire Red - outer)
    🟥  #DC143C (Crimson - darkest edge)
  DARK ↓
```

---

## Effect 2: Ice Particles ❄️

### When It Appears
**Trigger:** Opponent breaks your "On Fire" streak by winning a round (counter)
**Location:** Bursts from the winning card, spreads across table
**Duration:** 2-second burst effect with frost overlay

### Visual Representation
```
        ❄️ Crystals burst in all directions
    ❄️      ❄️      ❄️
  💎  ❄️  💎  ❄️  💎  ❄️  💎     ← Ice crystals spinning
     ✧  ❄️  ✧  ❄️  ✧  ❄️  ✧    ← Sparkles twinkling
    ┌─────────────────────┐
    │ ❄️   Q   ❄️         │
    │      ♥              │     ← Winning card
    │ ❄️   Q   ❄️         │
    └─────────────────────┘
    ╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲
   ░░░ Frost overlay ░░░░      ← Blue frost spreads on table
    ╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱
```

### Particle Breakdown
```
ICE CRYSTAL 01 (Primary)
     ╱▲╲       48x48px
    ◄ ✦ ►      Hexagonal star / 6-pointed
     ╲▼╱       Cyan → Sky Blue → Ice Blue → Steel Blue
    2px outline Sharp geometric edges

ICE CRYSTAL 02 (Diamond Shard)
      ◆         40x40px
     ◆◆◆        Elongated diamond
    ◆◆◆◆◆       Same color gradient
     ◆◆◆        Spins rapidly
      ◆

ICE SPARKLE (Twinkle)
      ✧         24x24px
     ✧✦✧        4-pointed star burst
      ✧         Pure white + cyan glow
                Fast twinkling effect

ICE VAPOR (Frozen Mist)
    ☁☁☁        64x64px
   ☁☁☁☁☁       Wispy cloud
  ☁☁☁☁☁☁☁      Sky blue semi-transparent
   ☁☁☁☁☁       Soft edges, ethereal
    ☁☁☁        Floats upward slowly
```

### Freeze Sequence
```
Freeze Counter Animation (2 seconds):

0ms:  Screen flash blue
      ⚡ [FLASH] ⚡

100ms: Crystal burst from card (360° spread)
      💎 ❄️ ❄️ 💎
     ❄️  [Q♥]  ❄️
      💎 ❄️ ❄️ 💎

300ms: Crystals spread outward, sparkles appear
    💎   ❄️   ✧   ❄️   💎
  ❄️  ✧  [Q♥]  ✧  ❄️
    💎   ✧   ❄️   ✧   💎

600ms: Frost overlay pulses on table
      ░░░░░░░░░░░
      ░ [Q♥] ░        ← Blue tint overlay
      ░░░░░░░░░░░

2000ms: Effect fades, crystals disappear
```

### Color Flow (Gradient)
```
  BRIGHT ↓
    💠  #E0FFFF (Light Cyan - brightest)
    🔷  #87CEEB (Sky Blue - mid-tone)
    🔵  #00BFFF (Ice Blue - primary)
    ⬛  #4682B4 (Steel Blue - darkest)
  DARK ↓
```

---

## Effect 3: Explosion Particles 💥

### When It Appears
**Trigger:** Round win, game completion, achievement unlocked
**Location:** Explodes from winning card at table center
**Duration:** 1.2-second burst with screen flash

### Visual Representation
```
    Screen flash (white) at 0ms
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    ▓  💥  BOOM!  💥  ▓
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

    ⭐   💎   ⭐   💎   ⭐     ← Stars & diamonds burst
  ⭐  💎  ⭐  💎  ⭐  💎  ⭐
 💎  ⭐ ((( A♠ ))) ⭐  💎    ← Winning card
  ⭐  💎  ⭐  💎  ⭐  💎  ⭐  ← Expanding ring shockwave
    ⭐   💎   ⭐   💎   ⭐
      ··  ··  ··  ··        ← Small debris
```

### Particle Breakdown
```
EXPLOSION STAR (Primary)
      ★         56x56px
     ★★★        5-pointed star, rounded points
    ★★★★★       White (center) → Gold → Orange
   ★★★★★★★      Purple glow around entire star
    ★★★★★       2px black outline
     ★★★        Comic book style
      ★

EXPLOSION RING (Shockwave)
   ╭─────╮      128x128px
  ╱       ╲     Circular ring/donut shape
 │         │    White (inner) → Gold (outer)
  ╲       ╱     12px thick ring
   ╰─────╯      Expands from 0.1x to 3x scale

EXPLOSION FLASH (Starburst)
      │         96x96px
   ─ ✦ ─        8-pointed rays from center
   ╱  │  ╲      White center, gold ray tips
 ─╱   │   ╲─    Rotates while fading
  ╲   │   ╱     Bright, instant impact
   ─ ✦ ─
      │

EXPLOSION DEBRIS (Small shapes)
  ■ ▲ ● ▼       32x32px
  △ ◆ □ ◇       Mixed geometric shapes
  ● ■ ▲ △       Gold, orange, purple, white
                Scattered randomly
```

### Explosion Sequence
```
Explosion Animation (1.2 seconds):

0ms:  Screen flash white (200ms)
      [FULL SCREEN WHITE FLASH]
      Camera shake (subtle)

0ms:  Ring shockwave starts expanding
      ╭─╮  →  ╭───╮  →  ╭─────╮
      ╰─╯     ╰───╯     ╰─────╯
      0.1x    0.5x      1.0x

50ms: Stars burst outward (25 particles)
         ⭐ ⭐ ⭐
      ⭐ ⭐ [A♠] ⭐ ⭐
         ⭐ ⭐ ⭐

50ms: Diamonds scatter (15 particles)
         💎 💎
      💎  ⭐  💎
         💎 💎

0-400ms: Flash starburst rotates and fades
        ✦ (rotates 180°, scales 0.5x → 2x, fades)

400-1200ms: Particles fly outward and fall
           ⭐↗  ⭐↑  ⭐↖
         💎→ ⭐  [A♠]  ⭐ ←💎
           ⭐↘  ⭐↓  ⭐↙
           (gravity pulls particles down)
```

### Color Flow
```
  BRIGHT ↓
    ⚪  #FFFFFF (White - flash/core)
    💛  #FFD700 (Gold - primary)
    🟧  #FF6600 (Orange - warm accent)
    🟣  #8B00FF (Purple - glow)
  DARK ↓
```

---

## Effect 4: Confetti Particles 🎉

### When It Appears
**Trigger:** Game victory, achievement unlock, celebration moment
**Location:** Falls from top of screen, side bursts from edges
**Duration:** 10 seconds continuous (extended celebration)

### Visual Representation
```
Top of screen - continuous fall:
    | | | | | | | | | |    ← Confetti strips falling
    ▓ ■ ▓ ● ▓ ▲ ▓ ■ ▓     ← Mixed shapes
    | ● | ▲ | ■ | ● |     ← Rotating, floating
    ■ | ● | ▲ | ▓ | ■
    | ▲ | ■ | ● | ▲ |

Side bursts (every 800ms):
Left edge:              Right edge:
   →→→                     ←←←
  →→→→                   ←←←←
 →→→→→                 ←←←←←
  | ■ ● ▓ ▲ →        ← ▲ ▓ ● ■ |
   →→→→                 ←←←←
    →→                     ←←

Victory text in center:
    ╔═══════════════════╗
    ║  🎉 VICTORY! 🎉   ║
    ║                   ║
    ║   YOU WIN!        ║
    ╚═══════════════════╝
    (confetti falls around and over text)
```

### Particle Breakdown
```
CONFETTI STRIPS (6 colors)
    │      16x48px vertical
    │      Thin rectangular strips
    ╱      Slight curve/bend
   ╱       Colors: Gold, Red, Green, Purple, Pink, Orange
  │        1px darker outline (not black)
  │        Rotate slowly while falling
  ╲
   ╲

CONFETTI SQUARE
  ┌──┐     24x24px
  │▓▓│     Perfect square
  └──┘     Flat color with gradient
           Colors: Gold, Red

CONFETTI TRIANGLE
    ▲       28x28px
   ▲▲▲      Equilateral triangle
  ▲▲▲▲▲     Colors: Purple, Pink
   ▲▲▲
    ▲

CONFETTI CIRCLE
    ●       20x20px
   ●●●      Perfect circle
  ●●●●●     Colors: Gold, Orange
   ●●●      White highlight accent
    ●

CONFETTI KENTE (Cultural Accent)
  ╔══╗      32x32px
  ║▓▓║      Geometric pattern
  ║██║      Gold, Red, Green colors
  ╚══╝      Simplified Kente cloth design
           10-20% of total confetti
```

### Confetti Flow Pattern
```
Continuous Fall (10 seconds):

Top emission zone (across full screen width):
  ─────────────────────────────────────────
  | ● ▲ ▓ ■ | ● ▲ ▓ ■ | ● ▲ ▓ ■ |  ← Emit continuously
  ─────────────────────────────────────────

Fall pattern (with rotation and drift):
  Emit  →  ▓  →  ▓  →  ▓  →   ▓   →  (lands/fades)
           |      ╱      ╲      |
           |     ╱        ╲     |
           ↓    ↓          ↓    ↓

           (Rotate while falling)
           (Slight side-to-side drift)
           (Gravity pulls down)

Side bursts (every 800ms, 15 particles each):
  0ms:     Left ════→ Burst    Right ←════ Burst
  800ms:   Left ════→ Burst    Right ←════ Burst
  1600ms:  Left ════→ Burst    Right ←════ Burst
  2400ms:  Left ════→ Burst    Right ←════ Burst
  3200ms:  Left ════→ Burst    Right ←════ Burst
  4000ms:  Left ════→ Burst    Right ←════ Burst
```

### Color Distribution
```
Strip Colors (equal distribution):
  | Gold    16.7%
  | Red     16.7%
  | Green   16.7%
  | Purple  16.7%
  | Pink    16.7%
  | Orange  16.7%

Shape Colors (accent distribution):
  ■ Squares: Gold, Red
  ▲ Triangles: Purple, Pink
  ● Circles: Gold, Orange

Cultural Accent:
  ▓ Kente Pattern: 10-20% of total
```

---

## Particle Performance Visualization

### On-Screen Particle Count Over Time

```
Fire Effect (Continuous - 1.5s lifespan):
Particles
   50 │        ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
      │      ▓▓▓
      │    ▓▓
   25 │  ▓▓
      │▓▓
    0 └────────────────────────→ Time
      0s  0.5s  1s  1.5s  2s

Ice Effect (Burst - 2s lifespan):
Particles
   75 │  ▓▓▓
      │ ▓   ▓
      │▓     ▓
   50 │       ▓
      │        ▓▓
   25 │          ▓▓
      │            ▓▓▓
    0 └────────────────────────→ Time
      0s  0.5s  1s  1.5s  2s

Explosion Effect (One-time burst - 1.2s):
Particles
  100 │▓
      │ ▓▓
   75 │   ▓▓
      │     ▓▓
   50 │       ▓▓
      │         ▓▓
   25 │           ▓▓
      │             ▓▓
    0 └────────────────────────→ Time
      0s  0.4s  0.8s  1.2s

Confetti Effect (Continuous - 10s):
Particles
  200 │      ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
      │    ▓▓                ▓▓
      │  ▓▓                    ▓▓
  100 │▓▓
      │
    0 └────────────────────────→ Time
      0s  2s  4s  6s  8s  10s
```

---

## Layering & Depth

### Z-Index Stacking Order
```
Layer 10: UI Overlays (timer, score)
Layer 9:  Screen flash effects
Layer 8:  Particle effects (top layer)
Layer 7:  Cards (when playing)
Layer 6:  Particle effects (mid layer)
Layer 5:  Table center zone
Layer 4:  Particle effects (bottom layer - smoke, vapor)
Layer 3:  Table surface
Layer 2:  Table decorations
Layer 1:  Background
```

### Visual Example
```
         ┌─ Screen Flash (Layer 9)
         │
      🔥 │ 🔥 ← Fire particles (Layer 8)
    ┌────┴────┐
    │ [CARD]  │ ← Active card (Layer 7)
    └────┬────┘
      💨 │ 💨 ← Smoke trail (Layer 4)
         │
    ═════╧═════ ← Table surface (Layer 3)
```

---

## Mobile Optimization Visual

### Desktop (Full Effect)
```
Fire particles: 50 on screen
🔥 🔥 🔥 🔥 🔥
🔥 🔥 🔥 🔥 🔥
🔥 [K♥] 🔥
🔥 🔥 🔥 🔥 🔥
💨 💨 💨 💨 💨
```

### Mobile (40% Reduction)
```
Fire particles: 30 on screen
🔥  🔥  🔥
🔥 [K♥] 🔥
💨  💨  💨
(Smoke disabled on low-end)
```

---

## Blend Mode Comparison

### Normal Blend Mode
```
  Background: [████████]
  Particle:   [▓▓▓▓]
  Result:     [████▓▓▓▓████]
  (Particle covers background)
```

### ADD Blend Mode (Used for Glow)
```
  Background: [████████]
  Particle:   [▓▓▓▓]
  Result:     [██████████]
            (Colors add, creating bright glow)
```

---

## Audio Sync Visualization

### Fire Effect Audio
```
0ms:    Fire ignition sound  🔊 WHOOSH
100ms:  Crackling loop       🎵 crackle crackle
400ms:  Impact landing       🔊 THUD
```

### Ice Effect Audio
```
0ms:    Ice crack           🔊 CRACK
100ms:  Crystalline chime   🎵 DING ding ding
600ms:  Freeze impact       🔊 FSSSSH
```

### Explosion Effect Audio
```
0ms:    Explosion boom      🔊 BOOM
50ms:   Sparkle scatter     🎵 twinkle twinkle
200ms:  Screen flash sting  🔊 WHOOSH
```

### Confetti Effect Audio
```
0ms:    Celebration fanfare 🎺 TA-DAA
800ms:  Confetti burst      🎵 pop pop pop
(Continuous upbeat music playing throughout)
```

---

## Implementation Workflow Visual

```
┌─────────────────────────────────────────────────────────┐
│ 1. DESIGN PHASE (COMPLETE ✅)                          │
│    ├─ Visual specifications created                     │
│    ├─ Color palettes defined                           │
│    ├─ AI prompts written                               │
│    └─ Documentation complete                            │
├─────────────────────────────────────────────────────────┤
│ 2. GENERATION PHASE (READY TO START)                   │
│    ├─ Use AI tool (Midjourney/DALL-E/Leonardo)        │
│    ├─ Generate 4 variations per particle               │
│    ├─ Select best option                               │
│    ├─ Post-process (resize, optimize)                  │
│    └─ Save to correct folder                           │
├─────────────────────────────────────────────────────────┤
│ 3. INTEGRATION PHASE (AFTER ASSETS READY)             │
│    ├─ Load into Phaser BootScene                       │
│    ├─ Configure particle emitters                      │
│    ├─ Test in GameScene                                │
│    ├─ Optimize performance                             │
│    └─ Polish and fine-tune                             │
└─────────────────────────────────────────────────────────┘
```

---

## Quick Visual Reference Card

```
╔═══════════════════════════════════════════════════════╗
║  SPAR PARTICLE EFFECTS - VISUAL QUICK REFERENCE      ║
╠═══════════════════════════════════════════════════════╣
║                                                       ║
║  🔥 FIRE: Gold→Orange→Red flames + sparks + smoke    ║
║     Usage: "On Fire" streak (3 wins)                 ║
║     Max: 50 particles, continuous emission           ║
║                                                       ║
║  ❄️ ICE: Cyan→Blue crystals + sparkles + vapor      ║
║     Usage: Freeze counter (breaks fire streak)       ║
║     Max: 75 particles, burst emission                ║
║                                                       ║
║  💥 EXPLOSION: Stars + diamonds + ring + flash       ║
║     Usage: Round wins, game completion               ║
║     Max: 100 particles, one-time burst               ║
║                                                       ║
║  🎉 CONFETTI: Strips + shapes (6 colors) + Kente    ║
║     Usage: Victory screen, achievements              ║
║     Max: 200 particles, 10s celebration              ║
║                                                       ║
║  Style: Cel-shaded, bold outlines, arcade energy     ║
║  Target: 60 FPS desktop, 40 FPS mobile               ║
╚═══════════════════════════════════════════════════════╝
```

---

**Version:** 1.0
**Last Updated:** December 18, 2025
**Purpose:** Visual guide for understanding particle effects in context
**Status:** Ready for AI Generation Phase
