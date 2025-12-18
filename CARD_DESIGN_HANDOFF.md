# Card Design Handoff - Visual Specifications

**Date:** December 17, 2025
**Designer:** arcade-ui-designer
**Status:** Ready for AI Generation
**Preview:** See `card-design-showcase.html` for interactive mockup

---

## Design Direction Approved

### Aesthetic: "Afro-Futurism Meets Arcade Energy"

The test cards showcase a bold, vibrant design language that combines:
- **African Heritage:** Kente cloth geometric patterns, warm cultural color palettes
- **Arcade Energy:** Bold outlines, neon glows, high-contrast cel-shading
- **Modern Digital:** Clean vector aesthetic, gradient overlays, metallic sheens

---

## Component Breakdown for Engineers

### Card Structure (React Component Mapping)

```typescript
interface Card {
  // Visual Specs
  dimensions: { width: 512, height: 768 }; // px, 2:3 ratio
  borderRadius: 24; // px, rounded corners
  border: {
    width: 4;
    color: "#FBC02D"; // Gold border
    style: "solid";
  };

  // Background
  background: {
    base: "linear-gradient(135deg, #FFF9F0 0%, #FFE8D6 50%, #FFF5E6 100%)";
    pattern: "repeating Kente cloth geometric (see CSS)";
    opacity: 0.7;
  };

  // Corner Indicators
  corners: {
    topLeft: { value: string; suit: string };
    bottomRight: { value: string; suit: string; rotation: 180 };
    font: "Orbitron, sans-serif";
    valueFontSize: 40; // px (2.5rem)
    suitFontSize: 28; // px (1.8rem)
    color: "#FF4500"; // Fire Red
    textShadow: "2px 2px 0 #DC143C, 0 0 10px rgba(255, 69, 0, 0.6)";
  };

  // Central Suit Symbol
  centerSymbol: {
    fontSize: 160; // px (10rem) for number cards
    fontSizeAce: 192; // px (12rem) for Ace
    filter: "drop-shadow(0 8px 16px rgba(220, 20, 60, 0.5))";
    animation: "suitPulse 2s ease-in-out infinite";
  };

  // Decorative Borders (corners)
  decorativeBorders: {
    topLeft: { width: 60, height: 60, borderWidth: 3, color: "#FFD700" };
    bottomRight: { width: 60, height: 60, borderWidth: 3, color: "#FFD700" };
  };
}
```

---

## States & Animations

### Default State
- **Background:** Cream gradient with Kente pattern overlay
- **Border:** 4px solid gold
- **Shadow:** `0 20px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 69, 0, 0.3)`
- **Symbol:** Pulsing glow effect (2s cycle)

### Hover State (Interactive)
- **Transform:** `translateY(-30px) rotateY(10deg) scale(1.05)`
- **Shadow:** Enhanced glow
  ```css
  box-shadow:
    0 40px 80px rgba(255, 69, 0, 0.4),
    0 0 60px rgba(255, 215, 0, 0.6),
    inset 0 0 30px rgba(255, 215, 0, 0.2);
  ```
- **Symbol:** Intense neon glow
  ```css
  filter: drop-shadow(0 0 40px rgba(255, 215, 0, 1))
          drop-shadow(0 0 80px rgba(255, 69, 0, 0.8));
  ```
- **Duration:** 0.6s cubic-bezier(0.23, 1, 0.32, 1)

### Active State (Played)
- **Transform:** Scale to table center
- **Rotation:** Slight clockwise spin
- **Glow:** Maximum intensity
- **Duration:** 0.4s ease-out

### Fire State (On Fire Streak)
- **Border:** Animated fire gradient
  ```css
  border-image: linear-gradient(45deg, #FF4500, #FF8C00, #FFD700) 1;
  animation: fireBorder 1s infinite;
  ```
- **Particles:** Orange/red flame particles around edges
- **Glow:** Pulsing orange aura
- **Symbol:** Animated flame distortion

### Frozen State (Freeze Counter)
- **Border:** Ice blue crystalline
  ```css
  border: 4px solid #00BFFF;
  box-shadow: 0 0 30px rgba(0, 191, 255, 0.8), inset 0 0 20px rgba(135, 206, 235, 0.4);
  ```
- **Overlay:** Frost texture with ice crystals on corners
- **Glow:** Pulsing blue aura
- **Symbol:** Slight blue tint overlay

### Disabled State (Not Playable)
- **Opacity:** 0.5
- **Filter:** `grayscale(0.6)`
- **Cursor:** `not-allowed`
- **No hover effects**

### Loading State (Being Dealt)
- **Opacity:** 0 → 1
- **Transform:** Slide from deck position with rotation
- **Duration:** 0.8s ease-out
- **Stagger:** 0.15s delay between cards

---

## Animation Parameters

### Card Deal Animation
```typescript
{
  trigger: "game_start" | "new_round",
  duration: 800, // ms
  easing: "cubic-bezier(0.34, 1.56, 0.64, 1)", // Bounce
  properties: {
    opacity: { from: 0, to: 1 },
    translateX: { from: -200, to: 0 }, // px
    translateY: { from: 100, to: 0 },
    rotate: { from: -15, to: 0 }, // degrees
  },
  stagger: 150, // ms between each card
}
```

### Card Play Animation
```typescript
{
  trigger: "card_click" | "user_action",
  duration: 400, // ms
  easing: "ease-out",
  properties: {
    translateX: { to: "table_center_x" },
    translateY: { to: "table_center_y" },
    rotate: { to: Math.random() * 10 - 5 }, // Random slight rotation
    scale: { from: 1, to: 0.9, to: 1 }, // Slight squash
  },
}
```

### Suit Symbol Pulse
```typescript
{
  trigger: "continuous",
  duration: 2000, // ms
  easing: "ease-in-out",
  loop: true,
  properties: {
    scale: { from: 1, to: 1.05, to: 1 },
    filter: {
      from: "drop-shadow(0 8px 16px rgba(220, 20, 60, 0.5))",
      to: "drop-shadow(0 12px 24px rgba(255, 215, 0, 0.7))",
      to: "drop-shadow(0 8px 16px rgba(220, 20, 60, 0.5))",
    },
  },
}
```

### Hover Float Animation
```typescript
{
  trigger: "hover",
  duration: 600, // ms
  easing: "cubic-bezier(0.23, 1, 0.32, 1)",
  properties: {
    translateY: { to: -30 }, // px
    rotateY: { to: 10 }, // degrees (3D tilt)
    scale: { to: 1.05 },
  },
}
```

---

## Typography Specifications

### Corner Indicators
- **Font Family:** "Orbitron", sans-serif (or similar geometric/futuristic font)
- **Value Size:** 40px (2.5rem)
- **Suit Size:** 28px (1.8rem)
- **Weight:** 900 (Black)
- **Color:** `#FF4500` (Fire Red)
- **Text Shadow:** `2px 2px 0 #DC143C, 0 0 10px rgba(255, 69, 0, 0.6)`
- **Line Height:** 1

### Face Card Title (Jack/Queen/King)
- **Font Family:** "Bebas Neue", sans-serif
- **Size:** 40px (2.5rem)
- **Weight:** Regular (400)
- **Color:** `#FF4500`
- **Letter Spacing:** 4px
- **Text Shadow:** `2px 2px 0 #212121, 0 0 20px rgba(255, 215, 0, 0.8)`

### Face Card Description
- **Font Family:** "Barlow", sans-serif
- **Size:** 16px (1rem)
- **Weight:** 600 (Semi-Bold)
- **Color:** `#212121` (Kente Black)
- **Line Height:** 1.4
- **Opacity:** 0.8
- **Text Align:** center

---

## Color Palette by Suit

### Hearts (Passion/Love)
```css
--hearts-primary: #FF4500;      /* Fire Red */
--hearts-secondary: #FFD700;    /* Gold */
--hearts-accent: #DC143C;       /* Crimson */
--hearts-background-start: #FFF9F0;
--hearts-background-mid: #FFE8D6;
--hearts-background-end: #FFF5E6;
--hearts-pattern: rgba(229, 57, 53, 0.15); /* Kente Red */
```

### Clubs (Strength/Power)
```css
--clubs-primary: #0A5F38;       /* Rich Green */
--clubs-secondary: #FFD700;     /* Gold */
--clubs-accent: #006400;        /* Dark Forest */
--clubs-background-start: #F0FFF4;
--clubs-background-mid: #D6F5E0;
--clubs-background-end: #E6FFF0;
--clubs-pattern: rgba(0, 100, 0, 0.15);
```

### Diamonds (Wealth/Prosperity)
```css
--diamonds-primary: #FFD700;    /* Gold */
--diamonds-secondary: #8B00FF;  /* Deep Purple */
--diamonds-accent: #FFBF00;     /* Amber */
--diamonds-background-start: #FFFAF0;
--diamonds-background-mid: #FFF0D6;
--diamonds-background-end: #FFF8E6;
--diamonds-pattern: rgba(255, 215, 0, 0.15);
```

### Spades (Wisdom/Strategy)
```css
--spades-primary: #8B00FF;      /* Deep Purple */
--spades-secondary: #00BFFF;    /* Ice Blue */
--spades-accent: #191970;       /* Midnight Blue */
--spades-background-start: #F5F0FF;
--spades-background-mid: #E8D6FF;
--spades-background-end: #F0E6FF;
--spades-pattern: rgba(139, 0, 255, 0.15);
```

---

## Kente Pattern Implementation

### CSS Pattern (Applied as ::before pseudo-element)
```css
.card-inner::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  height: 85%;
  background-image:
    /* Vertical stripes */
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 10px,
      rgba(229, 57, 53, 0.15) 10px,
      rgba(229, 57, 53, 0.15) 20px
    ),
    /* Horizontal stripes */
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 10px,
      rgba(251, 192, 45, 0.1) 10px,
      rgba(251, 192, 45, 0.1) 20px
    ),
    /* Diagonal stripes */
    repeating-linear-gradient(
      45deg,
      transparent,
      transparent 15px,
      rgba(255, 69, 0, 0.08) 15px,
      rgba(255, 69, 0, 0.08) 30px
    );
  opacity: 0.7;
  border-radius: 12px;
  z-index: 1;
}
```

**Variations by Suit:**
- Change the `rgba` colors to match suit primary/secondary colors
- Keep opacity and spacing consistent across all suits
- Pattern should be subtle background texture, not overwhelming

---

## Assets Needed for Production

### AI Generation Prompts (Per Card)

**Number Cards (6-10):**
```
African-inspired playing card design, [VALUE] of [SUIT],
vibrant [SUIT_PRIMARY_COLOR] and gold color scheme,
arcade game art style, high contrast, cel-shaded digital illustration,

LAYOUT:
- Large centered [SUIT_SYMBOL] with gradient shading
- [SUIT_COLOR]-tinted Kente cloth geometric pattern in background
- Geometric gold border with 24px rounded corners
- Corner indicators: "[VALUE]" top-left, "[SUIT_SYMBOL]" below
- Mirrored corner bottom-right (rotated 180°)

STYLE:
- Bold black outlines (4px), cel-shaded rendering
- Metallic gold accents (#FFD700)
- Neon glow effect on suit symbol
- Cream felt texture background (#FFF5E6 gradient)
- 512×768px vertical format
- Clean, professional game asset quality

ELEMENTS TO AVOID:
- Photorealistic rendering
- Excessive detail that loses clarity at small sizes
- Cultural symbols that could be appropriative
- Busy backgrounds that distract from suit symbol

MOOD: Energetic, vibrant, bold, modern African aesthetic,
arcade game energy, high contrast for readability
```

**Face Cards (Jack, Queen, King):**
```
African-inspired [FACE_CARD] of [SUIT] playing card,
character portrait in [SUIT_PRIMARY_COLOR] and gold,
arcade game character art, high contrast cel-shaded illustration,

CHARACTER:
- [CHARACTER_AGE_DESCRIPTION] with confident presence
- Modern African fashion with geometric patterns
- [FACE_CARD]-appropriate regalia (crown, warrior attire, etc.)
- Stylized portrait (comic book style, not photorealistic)
- Direct eye contact, commanding pose

BACKGROUND:
- [SUIT_COLOR]-tinted Kente cloth pattern
- Geometric borders with gold accents
- Corner indicators: "[FACE_LETTER]" and "[SUIT_SYMBOL]"

STYLE:
- Bold comic book outlines, cel-shaded
- Vibrant colors with metallic highlights
- 512×768px vertical format
- Arcade game character portrait aesthetic
- Cultural pride without stereotypes

MOOD: [Confident/Regal/Wise], powerful, culturally proud
```

**Aces (Special Treatment):**
```
African-inspired Ace of [SUIT] playing card,
premium luxury design, [SUIT_PRIMARY_COLOR] and gold,
arcade game art, high contrast digital illustration,

LAYOUT:
- LARGE centered [SUIT_SYMBOL] (60% of card height)
- Premium ornate Kente cloth pattern
- Enhanced golden decorative borders
- Corner indicators: "A" and [SUIT_SYMBOL]

SPECIAL FEATURES:
- Extra large suit symbol with gradient mesh
- Metallic sheen and reflections
- Enhanced neon glow effect
- Ornate Art Deco style corner decorations
- Premium luxury feel (highest value card)

STYLE:
- Bold outlines, maximum visual impact
- Vibrant gradients with metallic accents
- 512×768px vertical format
- Most impressive card in the deck

MOOD: Premium, powerful, prestigious, show-stopping
```

---

## File Delivery Specifications

### Export Settings (Per Card)
- **Format:** PNG with alpha transparency
- **Dimensions:** Exactly 512×768px (verify in image editor)
- **Color Space:** sRGB
- **Bit Depth:** 8-bit per channel (24-bit RGB + 8-bit alpha = 32-bit)
- **Resolution:** 72 DPI (web-optimized)
- **Compression:** PNG-8 or PNG-24 with optimization
- **Target File Size:** <100KB per card (use TinyPNG after generation)

### Naming Convention
```
[suit]_[value].png

Examples:
- hearts_6.png
- hearts_7.png
- hearts_8.png
- hearts_9.png
- hearts_10.png
- hearts_jack.png
- hearts_queen.png
- hearts_king.png
- hearts_ace.png

Repeat for clubs, diamonds, spades (spades has no ace)
```

### Folder Structure
```
frontend/public/assets/cards/
├── hearts/
│   ├── hearts_6.png
│   ├── hearts_7.png
│   ├── hearts_8.png
│   ├── hearts_9.png
│   ├── hearts_10.png
│   ├── hearts_jack.png
│   ├── hearts_queen.png
│   ├── hearts_king.png
│   └── hearts_ace.png (9 total)
├── clubs/
│   └── [9 cards same structure]
├── diamonds/
│   └── [9 cards same structure]
└── spades/
    ├── spades_6.png
    ├── spades_7.png
    ├── spades_8.png
    ├── spades_9.png
    ├── spades_10.png
    ├── spades_jack.png
    ├── spades_queen.png
    └── spades_king.png (8 total - NO ACE)
```

---

## Quality Checklist (Per Card)

### Visual Quality
- [ ] Suit symbol clearly visible and recognizable
- [ ] Corner indicators readable at thumbnail size (64×96px test)
- [ ] Colors match suit palette specifications
- [ ] Kente pattern visible but not overwhelming
- [ ] Gold border present and prominent
- [ ] No compression artifacts or pixelation
- [ ] Consistent style with other cards in suit
- [ ] Professional game asset quality

### Technical Quality
- [ ] Exactly 512×768px dimensions
- [ ] PNG format with alpha channel
- [ ] File size under 100KB
- [ ] Transparent background edges (if needed for effects)
- [ ] Proper filename convention
- [ ] Placed in correct folder
- [ ] sRGB color space
- [ ] 72 DPI resolution

### Consistency Check
- [ ] Face cards have similar character style across suits
- [ ] Number cards have similar layout across suits
- [ ] Aces have premium treatment consistent across suits
- [ ] Color palettes distinct but cohesive
- [ ] Pattern intensity consistent
- [ ] Border style consistent

---

## Implementation Notes for Engineers

### Phaser Integration
```typescript
// Load cards in BootScene
this.load.image('hearts_6', 'assets/cards/hearts/hearts_6.png');
this.load.image('hearts_king', 'assets/cards/hearts/hearts_king.png');
// ... load all 35 cards

// Create card sprite in GameScene
const card = this.add.sprite(x, y, 'hearts_6');
card.setOrigin(0.5, 0.5);
card.setScale(0.5); // Adjust for table size

// Add glow effect (shader or filter)
const glowFilter = this.plugins.get('rexGlowFilterPipeline');
card.setPipeline(glowFilter);
```

### React Component Wrapper
```tsx
interface CardProps {
  suit: 'hearts' | 'clubs' | 'diamonds' | 'spades';
  value: string; // '6'-'10', 'jack', 'queen', 'king', 'ace'
  state?: 'default' | 'hover' | 'active' | 'fire' | 'frozen' | 'disabled';
  onClick?: () => void;
  animated?: boolean;
}

const Card: React.FC<CardProps> = ({ suit, value, state = 'default', onClick, animated = true }) => {
  const imageSrc = `/assets/cards/${suit}/${suit}_${value}.png`;

  return (
    <div
      className={`card card--${state} ${animated ? 'card--animated' : ''}`}
      onClick={onClick}
    >
      <img src={imageSrc} alt={`${value} of ${suit}`} />
      {state === 'fire' && <FireParticles />}
      {state === 'frozen' && <FreezeOverlay />}
    </div>
  );
};
```

### CSS Classes for States
```css
.card {
  width: 160px; /* Scale down from 512px */
  height: 240px; /* Scale down from 768px */
  transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
  cursor: pointer;
}

.card--hover {
  transform: translateY(-15px) scale(1.05);
  filter: drop-shadow(0 20px 40px rgba(255, 69, 0, 0.6));
}

.card--active {
  transform: scale(0.95);
  filter: brightness(1.2);
}

.card--fire {
  animation: fireGlow 1s infinite;
  filter: drop-shadow(0 0 20px rgba(255, 69, 0, 0.8));
}

.card--frozen {
  animation: freezePulse 2s infinite;
  filter: drop-shadow(0 0 20px rgba(0, 191, 255, 0.8)) hue-rotate(180deg);
}

.card--disabled {
  opacity: 0.5;
  filter: grayscale(0.6);
  cursor: not-allowed;
  pointer-events: none;
}
```

---

## Next Steps

1. **Generate 3 Test Cards First:**
   - 6 of Hearts (number card test)
   - King of Hearts (face card test)
   - Ace of Hearts (premium card test)

2. **Review & Iterate:**
   - Share with team
   - Get feedback on style, readability, energy
   - Adjust prompts if needed

3. **Full Production:**
   - Generate all Hearts (9 cards)
   - Generate all Clubs (9 cards)
   - Generate all Diamonds (9 cards)
   - Generate all Spades (8 cards)

4. **Post-Processing:**
   - Resize to exactly 512×768px
   - Compress with TinyPNG
   - Organize in folder structure
   - Quality check all cards

5. **Handoff to Engineers:**
   - Deliver all 35 cards
   - Provide this specification document
   - Include preview HTML for reference
   - Support integration questions

---

**Document Version:** 1.0
**Last Updated:** December 17, 2025
**Status:** Ready for AI Generation Phase
