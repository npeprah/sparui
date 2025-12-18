# Player Avatars - Spar Game

## Overview

This directory contains 5 diverse player avatars for the Spar card game. Each avatar represents a distinct personality and playing style with authentic African representation and arcade energy.

---

## Avatar Set

| File | Name | Personality | Description |
|------|------|-------------|-------------|
| `avatar_01.png` | Confident Leader | Bold, commanding | Medium skin, short fade, gold chain, fire red accent |
| `avatar_02.png` | Cool Strategist | Calm, analytical | Dark skin, box braids, gold hoops, ice blue accent |
| `avatar_03.png` | Playful Challenger | Energetic, friendly | Light-medium skin, afro twist-out, Kente scarf, gold accent |
| `avatar_04.png` | Fierce Competitor | Intense, competitive | Very dark skin, long locs, gold cuffs, purple accent |
| `avatar_05.png` | Wise Veteran | Experienced, mentor | Medium-dark skin, salt & pepper beard, traditional necklace, gold accent |

---

## Technical Specifications

- **Format:** PNG with alpha transparency
- **Dimensions:** 256x256px (square)
- **File Size:** <50KB per avatar
- **Color Space:** sRGB
- **Resolution:** 72 DPI
- **Style:** Cel-shaded with 2-3px bold black outlines

---

## Display Sizes

### Large (256x256px)
- Player profile card (main menu)
- Settings/profile page
- Avatar selection grid

### Medium (128x128px)
- Lobby screen player slots
- Match history
- Leaderboards

### Small (64x64px)
- Game table player positions
- In-game HUD
- Chat messages

All avatars are designed to be recognizable and clear at all three sizes.

---

## Usage in React

### Basic Avatar Component

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
  showGlow?: boolean;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  avatarId,
  size = 'medium',
  showGlow = false,
  className = ''
}) => {
  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-32 h-32',
    large: 'w-64 h-64',
  };

  return (
    <div className={`avatar-container ${sizeClasses[size]} ${className}`}>
      <img
        src={avatarMap[avatarId]}
        alt={`Player Avatar ${avatarId}`}
        className={`w-full h-full rounded-full ${showGlow ? 'avatar-glow' : ''}`}
      />
    </div>
  );
};
```

### CSS Styling

```css
.avatar-container {
  position: relative;
  display: inline-block;
}

.avatar-container img {
  border-radius: 50%;
  border: 3px solid var(--gold);
  background: linear-gradient(135deg, #4B0082, #8B00FF);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.avatar-container img:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
}

.avatar-glow {
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.3),
    0 0 20px rgba(255, 215, 0, 0.6) !important;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow:
      0 4px 8px rgba(0, 0, 0, 0.3),
      0 0 20px rgba(255, 215, 0, 0.6);
  }
  50% {
    box-shadow:
      0 4px 8px rgba(0, 0, 0, 0.3),
      0 0 40px rgba(255, 215, 0, 0.9);
  }
}
```

### Avatar Selection Component

```tsx
const avatarOptions = [1, 2, 3, 4, 5];

export const AvatarSelector: React.FC<{
  selectedId: number;
  onSelect: (id: number) => void;
}> = ({ selectedId, onSelect }) => {
  return (
    <div className="grid grid-cols-3 gap-4 p-4">
      {avatarOptions.map(id => (
        <button
          key={id}
          onClick={() => onSelect(id)}
          className={`relative cursor-pointer transition-transform hover:scale-105 ${
            selectedId === id ? 'ring-4 ring-gold rounded-full' : ''
          }`}
        >
          <Avatar avatarId={id} size="medium" showGlow={selectedId === id} />
          {selectedId === id && (
            <div className="absolute top-0 right-0 bg-gold text-black rounded-full w-8 h-8 flex items-center justify-center font-bold">
              ✓
            </div>
          )}
        </button>
      ))}
    </div>
  );
};
```

---

## Phaser Integration

### Loading Avatars

```typescript
// In BootScene.ts
class BootScene extends Phaser.Scene {
  preload() {
    // Load avatars
    for (let i = 1; i <= 5; i++) {
      this.load.image(`avatar_${i}`, `assets/avatars/avatar_0${i}.png`);
    }
  }
}
```

### Displaying in Game Scene

```typescript
// In GameScene.ts
class GameScene extends Phaser.Scene {
  createPlayerAvatar(x: number, y: number, avatarId: number) {
    const avatar = this.add.image(x, y, `avatar_${avatarId}`);
    avatar.setDisplaySize(64, 64); // Small size for game table
    avatar.setOrigin(0.5, 0.5);

    // Add circular mask
    const mask = this.make.graphics({});
    mask.fillStyle(0xffffff);
    mask.fillCircle(x, y, 32);
    avatar.setMask(mask.createGeometryMask());

    // Add glow effect
    avatar.setPostPipeline('Glow');

    return avatar;
  }
}
```

---

## Accessibility Considerations

### Alt Text Patterns

```tsx
// Good alt text examples
<img src={avatar01} alt="Confident Leader avatar with short fade haircut" />
<img src={avatar02} alt="Cool Strategist avatar with box braids" />
<img src={avatar03} alt="Playful Challenger avatar with natural afro" />
<img src={avatar04} alt="Fierce Competitor avatar with long locs" />
<img src={avatar05} alt="Wise Veteran avatar with gray beard" />
```

### ARIA Labels for Interactive Avatars

```tsx
<button
  onClick={() => selectAvatar(1)}
  aria-label="Select Confident Leader avatar"
  aria-pressed={selectedId === 1}
>
  <Avatar avatarId={1} />
</button>
```

---

## Performance Considerations

### Lazy Loading

```tsx
import { lazy, Suspense } from 'react';

const AvatarImage = lazy(() => import('./Avatar'));

export const LazyAvatar = ({ avatarId }: { avatarId: number }) => (
  <Suspense fallback={<div className="w-32 h-32 bg-purple-900 rounded-full animate-pulse" />}>
    <AvatarImage avatarId={avatarId} />
  </Suspense>
);
```

### Image Optimization

All avatars are already optimized:
- ✅ Compressed to <50KB
- ✅ Proper dimensions (256x256px)
- ✅ PNG-24 format with alpha
- ✅ sRGB color space

If additional optimization is needed:
```bash
# Using pngquant
pngquant --quality=80-95 avatar_*.png

# Using TinyPNG API
# Upload to https://tinypng.com/
```

---

## Animation Examples

### Hover Grow Effect

```css
.avatar-hover {
  transition: transform 0.3s cubic-bezier(0.23, 1, 0.32, 1);
}

.avatar-hover:hover {
  transform: scale(1.1);
}
```

### Selection Bounce

```css
@keyframes select-bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}

.avatar-selected {
  animation: select-bounce 0.4s ease-in-out;
}
```

### Victory Celebration

```tsx
const celebrateVictory = (avatarElement: HTMLElement) => {
  avatarElement.style.animation = 'victory-spin 0.8s ease-in-out';
};

// CSS
@keyframes victory-spin {
  0% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(180deg) scale(1.2); }
  100% { transform: rotate(360deg) scale(1); }
}
```

---

## Color Theming

Each avatar has an associated accent color that can be used in UI:

```tsx
const avatarTheme = {
  1: { accent: '#FF4500', name: 'fire-red' },    // Confident Leader
  2: { accent: '#00D4FF', name: 'ice-blue' },    // Cool Strategist
  3: { accent: '#FFD700', name: 'gold' },        // Playful Challenger
  4: { accent: '#4B0082', name: 'deep-purple' }, // Fierce Competitor
  5: { accent: '#FFD700', name: 'gold' },        // Wise Veteran
};

// Usage
const PlayerCard = ({ avatarId }: { avatarId: number }) => (
  <div
    className="player-card"
    style={{
      borderColor: avatarTheme[avatarId].accent,
      boxShadow: `0 0 20px ${avatarTheme[avatarId].accent}40`
    }}
  >
    <Avatar avatarId={avatarId} />
  </div>
);
```

---

## Troubleshooting

### Avatar Not Displaying
1. Check file path is correct
2. Verify file exists in `/public/assets/avatars/`
3. Check network tab for 404 errors
4. Ensure avatarId is 1-5

### Blurry Avatar
1. Use correct size prop ('small', 'medium', 'large')
2. Don't scale beyond original 256px
3. Use CSS `image-rendering: crisp-edges` if needed

### White Fringe Around Avatar
1. Avatar may not have proper transparency
2. Re-export with alpha channel
3. Use background removal tool (remove.bg)

### Performance Issues
1. Lazy load avatars not immediately visible
2. Use sprite sheet for Phaser (combine all 5)
3. Preload in BootScene for game use

---

## Future Enhancements

### Potential Additions
- [ ] Animated avatars (subtle breathing effect)
- [ ] Avatar frames/borders (earned through gameplay)
- [ ] Custom avatar creation tool
- [ ] Seasonal avatar variations
- [ ] Avatar emotes/reactions

### Expansion Ideas
- More diverse body types
- Additional age ranges
- Regional African fashion variations
- Disability representation
- Extended gender expression spectrum

---

## Credits

**Design:** arcade-ui-designer
**Art Style:** Afro-Futurism Meets Arcade Energy
**Inspiration:** NBA Jam, Street Fighter, Black Panther
**Created:** December 18, 2025

---

## Related Documentation

- **Design Specs:** `/AVATAR_DESIGN_HANDOFF.md`
- **Card Design:** `/CARD_DESIGN_HANDOFF.md`
- **Product Requirements:** `/PRD.md`
- **Project State:** `/PROJECT_STATE.md`

---

## Questions or Issues?

If you encounter any issues with the avatars or need additional variations, please:
1. Check the design handoff document (`AVATAR_DESIGN_HANDOFF.md`)
2. Review the quality checklist
3. Contact the design team
4. Open an issue in the project repository
