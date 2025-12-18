# Spar Game Assets

This directory contains all visual and audio assets for the Spar card game.

## Directory Structure

```
assets/
├── cards/              # Playing card images (35 total)
│   ├── hearts/         # 9 cards (6-10, J, Q, K, A)
│   ├── clubs/          # 9 cards (6-10, J, Q, K, A)
│   ├── diamonds/       # 9 cards (6-10, J, Q, K, A)
│   └── spades/         # 8 cards (6-10, J, Q, K) - NO ACE
│
├── effects/            # Particle textures for visual effects
│   ├── fire_particle.png
│   ├── ice_particle.png
│   ├── explosion_particle.png
│   └── confetti_*.png (5 colors)
│
├── avatars/            # Player avatar images (5 total)
│   ├── avatar_1.png
│   ├── avatar_2.png
│   ├── avatar_3.png
│   ├── avatar_4.png
│   └── avatar_5.png
│
├── surfaces/           # Table surface backgrounds
│   └── poker_table_default.png
│
└── sounds/             # Audio files
    ├── music/          # Background music tracks
    ├── sfx/            # Sound effects
    └── announcer/      # Announcer voice clips
```

## Asset Specifications

### Playing Cards
- **Dimensions:** 512×768px (2:3 ratio)
- **Format:** PNG with alpha transparency
- **File Size:** <100KB each
- **Style:** African-inspired arcade aesthetic
- **Naming:** `[suit]_[value].png` (e.g., `hearts_ace.png`)

### Particle Textures
- **Dimensions:** 256×256px (confetti: 128×128px)
- **Format:** PNG with alpha channel
- **Purpose:** Phaser particle emitters for fire, ice, and explosion effects

### Avatars
- **Dimensions:** 256×256px
- **Format:** PNG with transparency
- **File Size:** <50KB each
- **Style:** Diverse, friendly, cartoon-style characters

### Table Surface
- **Dimensions:** 1920×1080px minimum
- **Format:** PNG or WebP
- **Theme:** Professional poker table with felt texture

## Current Status

**Week 2 - Asset Creation Phase**

### Completed
- [x] Directory structure created
- [x] Asset pipeline defined
- [x] Design specifications documented
- [x] Test card designs created (mockup)

### In Progress
- [ ] TASK-022: Generate all 35 playing cards
  - [ ] Hearts (9 cards)
  - [ ] Clubs (9 cards)
  - [ ] Diamonds (9 cards)
  - [ ] Spades (8 cards)
- [ ] TASK-023: Particle effect textures (8 files)
- [ ] TASK-024: Player avatars (5 files)
- [ ] TASK-025: Poker table surface (1 file)

### Total Assets Needed
- **Cards:** 35 files
- **Effects:** 8 files
- **Avatars:** 5 files
- **Surfaces:** 1 file
- **TOTAL:** 49 visual assets

## Design References

See project root for detailed design documentation:
- `/TASK-020_ASSET_PIPELINE_PLAN.md` - Asset creation workflow
- `/CARD_DESIGN_HANDOFF.md` - Complete visual specifications
- `/card-design-showcase.html` - Interactive design preview

## Usage in Code

### Phaser (Game Engine)
```typescript
// Load in BootScene
this.load.image('hearts_6', 'assets/cards/hearts/hearts_6.png');

// Use in GameScene
const card = this.add.sprite(x, y, 'hearts_6');
```

### React (UI Components)
```tsx
import cardImage from '/assets/cards/hearts/hearts_6.png';

<img src={cardImage} alt="6 of Hearts" />
```

## Asset Quality Guidelines

All assets must meet these criteria:
- ✅ Correct dimensions
- ✅ Proper file format (PNG with alpha where needed)
- ✅ Optimized file size (compressed)
- ✅ Consistent visual style
- ✅ Proper naming convention
- ✅ Organized in correct folder

## License & Attribution

All assets are custom-created for this project using AI generation tools:
- **AI Tools:** Midjourney, DALL-E 3, Leonardo.ai
- **Post-Processing:** Figma, TinyPNG
- **License:** Proprietary - for Spar game use only

---

**Last Updated:** December 17, 2025
**Asset Designer:** arcade-ui-designer
