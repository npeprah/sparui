# Spar Game - Audio Integration Guide

**Created:** December 19, 2025
**Target Audience:** Frontend Engineers
**Purpose:** Step-by-step instructions for integrating audio assets into Spar

---

## Overview

This guide provides complete instructions for integrating the Spar audio system into the frontend application. It covers audio library setup, asset loading, playback implementation, volume management, and performance optimization.

---

## Table of Contents

1. [Audio Library Selection](#audio-library-selection)
2. [Project Setup](#project-setup)
3. [Asset Organization](#asset-organization)
4. [Audio Manager Implementation](#audio-manager-implementation)
5. [Phaser Integration](#phaser-integration)
6. [React Component Integration](#react-component-integration)
7. [Volume Management](#volume-management)
8. [Performance Optimization](#performance-optimization)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)

---

## Audio Library Selection

### Recommended: Howler.js

**Why Howler.js:**
- Automatic fallback between formats (OGG → MP3)
- Web Audio API with HTML5 Audio fallback
- Sprite support (multiple sounds in one file)
- Volume, fade, rate, loop control
- Mobile-friendly (unlocks audio on first touch)
- Excellent performance and stability

**Installation:**
```bash
cd frontend
npm install howler
npm install --save-dev @types/howler
```

### Alternative: Phaser Built-in Audio

Phaser has a robust audio system that works well for game scenes. For UI sounds outside Phaser, use Howler.js.

---

## Project Setup

### 1. Install Dependencies

```bash
# In /frontend directory
npm install howler
npm install --save-dev @types/howler
```

### 2. Verify Audio Asset Structure

Ensure the following directory structure exists:

```
/frontend/public/assets/sounds/
├── sfx/
│   ├── cards/
│   │   ├── card_shuffle.ogg
│   │   ├── card_shuffle.mp3
│   │   ├── card_deal.ogg
│   │   ├── card_deal.mp3
│   │   ├── card_flip.ogg
│   │   ├── card_flip.mp3
│   │   ├── card_play.ogg
│   │   ├── card_play.mp3
│   │   ├── card_collect.ogg
│   │   ├── card_collect.mp3
│   │   ├── card_hover.ogg
│   │   └── card_hover.mp3
│   ├── game_events/
│   │   ├── round_win.ogg
│   │   ├── round_win.mp3
│   │   ├── round_loss.ogg
│   │   ├── round_loss.mp3
│   │   ├── game_victory.ogg
│   │   ├── game_victory.mp3
│   │   ├── game_defeat.ogg
│   │   ├── game_defeat.mp3
│   │   ├── dry_declaration.ogg
│   │   ├── dry_declaration.mp3
│   │   ├── show_dry_declaration.ogg
│   │   ├── show_dry_declaration.mp3
│   │   ├── fire_streak.ogg
│   │   ├── fire_streak.mp3
│   │   ├── freeze_effect.ogg
│   │   ├── freeze_effect.mp3
│   │   ├── invalid_move.ogg
│   │   ├── invalid_move.mp3
│   │   ├── phase_transition.ogg
│   │   └── phase_transition.mp3
│   ├── ui/
│   └── effects/
├── music/
├── announcer/
└── AUDIO_MANIFEST.json
```

---

## Asset Organization

### File Naming Convention

All audio files follow this pattern:
```
[category]_[name]_[variant].[ext]

Examples:
- card_play.ogg (primary format)
- card_play.mp3 (fallback format)
- round_win_01.ogg (with variant number)
```

### Format Priority

Howler.js will automatically try formats in order:
1. **OGG Vorbis** (best compression, smaller files)
2. **MP3** (fallback for older browsers)

Always provide both formats for each sound.

---

## Audio Manager Implementation

### Create Audio Manager Class

**File:** `/frontend/src/game/audio/AudioManager.ts`

```typescript
import { Howl, Howler } from 'howler';

export type SoundCategory = 'sfx' | 'music' | 'voice' | 'ui';

export interface SoundConfig {
  src: string[];
  volume?: number;
  loop?: boolean;
  sprite?: { [key: string]: [number, number] };
}

export interface VolumeSettings {
  master: number;
  sfx: number;
  music: number;
  voice: number;
  ui: number;
}

export class AudioManager {
  private sounds: Map<string, Howl> = new Map();
  private music: Howl | null = null;
  private volumes: VolumeSettings = {
    master: 0.8,
    sfx: 0.85,
    music: 0.6,
    voice: 0.95,
    ui: 0.7,
  };
  private muted: Set<SoundCategory> = new Set();
  private unlocked = false;

  constructor() {
    this.setupMobileUnlock();
  }

  /**
   * Setup mobile audio unlock on first user interaction
   * Required for iOS and some Android browsers
   */
  private setupMobileUnlock(): void {
    if (typeof window === 'undefined') return;

    const unlock = () => {
      if (this.unlocked) return;

      // Create and play a silent sound to unlock audio context
      const silentSound = new Howl({
        src: ['data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'],
        volume: 0,
      });
      silentSound.play();
      this.unlocked = true;

      // Remove listeners after unlock
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('touchend', unlock);
      document.removeEventListener('click', unlock);
    };

    document.addEventListener('touchstart', unlock, { once: true });
    document.addEventListener('touchend', unlock, { once: true });
    document.addEventListener('click', unlock, { once: true });
  }

  /**
   * Preload a sound effect
   */
  preloadSound(name: string, config: SoundConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      const sound = new Howl({
        src: config.src,
        volume: config.volume ?? 1.0,
        loop: config.loop ?? false,
        sprite: config.sprite,
        preload: true,
        onload: () => resolve(),
        onloaderror: (id, error) => reject(new Error(`Failed to load ${name}: ${error}`)),
      });

      this.sounds.set(name, sound);
    });
  }

  /**
   * Preload multiple sounds (with progress callback)
   */
  async preloadSounds(
    sounds: Record<string, SoundConfig>,
    onProgress?: (loaded: number, total: number) => void
  ): Promise<void> {
    const names = Object.keys(sounds);
    const total = names.length;
    let loaded = 0;

    const promises = names.map((name) =>
      this.preloadSound(name, sounds[name]).then(() => {
        loaded++;
        onProgress?.(loaded, total);
      })
    );

    await Promise.all(promises);
  }

  /**
   * Play a sound effect
   */
  playSound(name: string, options?: { volume?: number; rate?: number }): number | undefined {
    const sound = this.sounds.get(name);
    if (!sound) {
      console.warn(`Sound not found: ${name}`);
      return undefined;
    }

    // Apply category volume
    const category = this.getSoundCategory(name);
    const categoryVolume = this.volumes[category];
    const masterVolume = this.volumes.master;
    const finalVolume = (options?.volume ?? 1.0) * categoryVolume * masterVolume;

    sound.volume(finalVolume);
    if (options?.rate) sound.rate(options.rate);

    return sound.play() as number;
  }

  /**
   * Play a sound sprite
   */
  playSprite(name: string, sprite: string, options?: { volume?: number }): number | undefined {
    const sound = this.sounds.get(name);
    if (!sound) {
      console.warn(`Sound not found: ${name}`);
      return undefined;
    }

    const category = this.getSoundCategory(name);
    const categoryVolume = this.volumes[category];
    const masterVolume = this.volumes.master;
    const finalVolume = (options?.volume ?? 1.0) * categoryVolume * masterVolume;

    sound.volume(finalVolume);
    return sound.play(sprite) as number;
  }

  /**
   * Stop a playing sound
   */
  stopSound(name: string, id?: number): void {
    const sound = this.sounds.get(name);
    if (sound) {
      if (id !== undefined) {
        sound.stop(id);
      } else {
        sound.stop();
      }
    }
  }

  /**
   * Play background music
   */
  playMusic(name: string, fade = true): void {
    // Stop current music
    if (this.music) {
      if (fade) {
        this.music.fade(this.music.volume(), 0, 500);
        setTimeout(() => {
          this.music?.stop();
          this.loadAndPlayMusic(name, fade);
        }, 500);
      } else {
        this.music.stop();
        this.loadAndPlayMusic(name, fade);
      }
    } else {
      this.loadAndPlayMusic(name, fade);
    }
  }

  private loadAndPlayMusic(name: string, fade: boolean): void {
    const musicVolume = this.volumes.music * this.volumes.master;

    this.music = new Howl({
      src: [
        `/assets/sounds/music/${name}.ogg`,
        `/assets/sounds/music/${name}.mp3`,
      ],
      volume: fade ? 0 : musicVolume,
      loop: true,
      html5: true, // Stream for large music files
    });

    this.music.play();

    if (fade) {
      this.music.fade(0, musicVolume, 1000);
    }
  }

  /**
   * Stop current music
   */
  stopMusic(fade = true): void {
    if (!this.music) return;

    if (fade) {
      this.music.fade(this.music.volume(), 0, 1000);
      setTimeout(() => {
        this.music?.stop();
        this.music = null;
      }, 1000);
    } else {
      this.music.stop();
      this.music = null;
    }
  }

  /**
   * Duck music volume (for voice lines or important SFX)
   */
  duckMusic(targetVolume = 0.4, duration = 300): void {
    if (!this.music) return;
    const currentVolume = this.music.volume();
    const duckVolume = this.volumes.music * this.volumes.master * targetVolume;
    this.music.fade(currentVolume, duckVolume, duration);
  }

  /**
   * Restore music volume after ducking
   */
  restoreMusic(duration = 500): void {
    if (!this.music) return;
    const currentVolume = this.music.volume();
    const fullVolume = this.volumes.music * this.volumes.master;
    this.music.fade(currentVolume, fullVolume, duration);
  }

  /**
   * Set volume for a category
   */
  setVolume(category: keyof VolumeSettings, volume: number): void {
    this.volumes[category] = Math.max(0, Math.min(1, volume));

    // Update all playing sounds in this category
    if (category === 'master') {
      Howler.volume(volume);
    } else if (category === 'music' && this.music) {
      this.music.volume(this.volumes.music * this.volumes.master);
    }
  }

  /**
   * Get current volume for a category
   */
  getVolume(category: keyof VolumeSettings): number {
    return this.volumes[category];
  }

  /**
   * Mute/unmute a category
   */
  toggleMute(category: SoundCategory): void {
    if (this.muted.has(category)) {
      this.muted.delete(category);
    } else {
      this.muted.add(category);
    }

    // Apply mute state
    if (category === 'music' && this.music) {
      this.music.mute(this.muted.has('music'));
    }

    // For SFX/UI/Voice, check mute state when playing
  }

  /**
   * Check if a category is muted
   */
  isMuted(category: SoundCategory): boolean {
    return this.muted.has(category);
  }

  /**
   * Mute all audio
   */
  muteAll(): void {
    Howler.mute(true);
  }

  /**
   * Unmute all audio
   */
  unmuteAll(): void {
    Howler.mute(false);
  }

  /**
   * Clean up all sounds
   */
  destroy(): void {
    this.sounds.forEach((sound) => sound.unload());
    this.sounds.clear();
    if (this.music) {
      this.music.unload();
      this.music = null;
    }
  }

  /**
   * Get sound category from name
   */
  private getSoundCategory(name: string): SoundCategory {
    if (name.startsWith('ui_')) return 'ui';
    if (name.includes('music') || name.includes('theme')) return 'music';
    if (name.includes('announcer') || name.includes('voice')) return 'voice';
    return 'sfx';
  }
}

// Singleton instance
export const audioManager = new AudioManager();
```

---

## Phaser Integration

### 1. Preload Audio Assets in PreloadScene

**File:** `/frontend/src/game/scenes/PreloadScene.ts`

```typescript
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    // Existing asset loading...

    // Load card sounds (P0 - Priority 1)
    this.loadCardSounds();

    // Load game event sounds (P0 - Priority 1)
    this.loadGameEventSounds();

    // Show loading progress
    this.setupLoadingProgress();
  }

  private loadCardSounds(): void {
    const cardSounds = [
      'card_shuffle',
      'card_deal',
      'card_flip',
      'card_play',
      'card_collect',
      'card_hover',
    ];

    cardSounds.forEach((sound) => {
      this.load.audio(sound, [
        `assets/sounds/sfx/cards/${sound}.ogg`,
        `assets/sounds/sfx/cards/${sound}.mp3`,
      ]);
    });
  }

  private loadGameEventSounds(): void {
    const eventSounds = [
      'round_win',
      'round_loss',
      'game_victory',
      'game_defeat',
      'dry_declaration',
      'show_dry_declaration',
      'fire_streak',
      'freeze_effect',
      'invalid_move',
      'phase_transition',
    ];

    eventSounds.forEach((sound) => {
      this.load.audio(sound, [
        `assets/sounds/sfx/game_events/${sound}.ogg`,
        `assets/sounds/sfx/game_events/${sound}.mp3`,
      ]);
    });
  }

  private setupLoadingProgress(): void {
    this.load.on('progress', (value: number) => {
      console.log(`Loading: ${Math.round(value * 100)}%`);
      // Update loading bar UI here
    });

    this.load.on('complete', () => {
      console.log('All assets loaded');
      this.scene.start('GameScene');
    });
  }
}
```

### 2. Play Sounds in GameScene

**File:** `/frontend/src/game/scenes/GameScene.ts`

```typescript
export class GameScene extends Phaser.Scene {
  // ... existing code

  private playSoundEffect(soundName: string, volume = 1.0): void {
    this.sound.play(soundName, { volume });
  }

  private handleCardPlay(card: CardSprite): void {
    // Play signature card sound
    this.playSoundEffect('card_play', 0.85);

    // ... rest of card play logic
  }

  private handleCardHover(card: CardSprite): void {
    // Play subtle hover sound
    this.playSoundEffect('card_hover', 0.5);
  }

  private handleRoundWin(winnerId: string): void {
    // Play victory sound
    this.playSoundEffect('round_win', 1.0);

    // ... victory animation logic
  }

  private handleInvalidMove(): void {
    // Play gentle error sound
    this.playSoundEffect('invalid_move', 0.7);
  }
}
```

---

## React Component Integration

### 1. Create Audio Hook

**File:** `/frontend/src/hooks/useAudio.ts`

```typescript
import { useEffect, useRef, useCallback } from 'react';
import { audioManager, SoundCategory } from '../game/audio/AudioManager';

export const useAudio = () => {
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!isInitialized.current) {
      // Initialize audio manager
      initializeAudio();
      isInitialized.current = true;
    }

    return () => {
      // Cleanup on unmount
      audioManager.destroy();
    };
  }, []);

  const playSound = useCallback((name: string, volume?: number) => {
    audioManager.playSound(name, { volume });
  }, []);

  const playMusic = useCallback((name: string, fade = true) => {
    audioManager.playMusic(name, fade);
  }, []);

  const stopMusic = useCallback((fade = true) => {
    audioManager.stopMusic(fade);
  }, []);

  const setVolume = useCallback((category: SoundCategory, volume: number) => {
    audioManager.setVolume(category, volume);
  }, []);

  return {
    playSound,
    playMusic,
    stopMusic,
    setVolume,
  };
};

async function initializeAudio() {
  // Preload P0 UI sounds
  await audioManager.preloadSounds({
    ui_button_click: {
      src: [
        '/assets/sounds/sfx/ui/ui_button_click.ogg',
        '/assets/sounds/sfx/ui/ui_button_click.mp3',
      ],
      volume: 0.7,
    },
    ui_button_hover: {
      src: [
        '/assets/sounds/sfx/ui/ui_button_hover.ogg',
        '/assets/sounds/sfx/ui/ui_button_hover.mp3',
      ],
      volume: 0.4,
    },
  });

  console.log('Audio initialized');
}
```

### 2. Use Audio in UI Components

**File:** `/frontend/src/components/Button.tsx`

```typescript
import React from 'react';
import { audioManager } from '../game/audio/AudioManager';

interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  playSound?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  onClick,
  children,
  playSound = true,
}) => {
  const handleClick = () => {
    if (playSound) {
      audioManager.playSound('ui_button_click', { volume: 0.7 });
    }
    onClick();
  };

  const handleHover = () => {
    if (playSound) {
      audioManager.playSound('ui_button_hover', { volume: 0.4 });
    }
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={handleHover}
      className="game-button"
    >
      {children}
    </button>
  );
};
```

---

## Volume Management

### Settings Component

**File:** `/frontend/src/components/AudioSettings.tsx`

```typescript
import React, { useState } from 'react';
import { audioManager } from '../game/audio/AudioManager';

export const AudioSettings: React.FC = () => {
  const [masterVolume, setMasterVolume] = useState(audioManager.getVolume('master'));
  const [musicVolume, setMusicVolume] = useState(audioManager.getVolume('music'));
  const [sfxVolume, setSfxVolume] = useState(audioManager.getVolume('sfx'));

  const handleMasterChange = (value: number) => {
    setMasterVolume(value);
    audioManager.setVolume('master', value);
  };

  const handleMusicChange = (value: number) => {
    setMusicVolume(value);
    audioManager.setVolume('music', value);
  };

  const handleSfxChange = (value: number) => {
    setSfxVolume(value);
    audioManager.setVolume('sfx', value);
  };

  return (
    <div className="audio-settings">
      <h3>Audio Settings</h3>

      <div className="volume-slider">
        <label>Master Volume</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={masterVolume}
          onChange={(e) => handleMasterChange(parseFloat(e.target.value))}
        />
        <span>{Math.round(masterVolume * 100)}%</span>
      </div>

      <div className="volume-slider">
        <label>Music Volume</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={musicVolume}
          onChange={(e) => handleMusicChange(parseFloat(e.target.value))}
        />
        <span>{Math.round(musicVolume * 100)}%</span>
      </div>

      <div className="volume-slider">
        <label>Sound Effects Volume</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={sfxVolume}
          onChange={(e) => handleSfxChange(parseFloat(e.target.value))}
        />
        <span>{Math.round(sfxVolume * 100)}%</span>
      </div>
    </div>
  );
};
```

---

## Performance Optimization

### 1. Audio Sprites (Combine Small Sounds)

For frequently-used UI sounds, combine them into a sprite:

```typescript
// Create audio sprite
audioManager.preloadSound('ui_sprite', {
  src: ['/assets/sounds/sprites/ui_sprite.ogg', '/assets/sounds/sprites/ui_sprite.mp3'],
  sprite: {
    click: [0, 200],      // 0ms to 200ms
    hover: [200, 100],    // 200ms to 300ms
    open: [300, 500],     // 300ms to 800ms
    close: [800, 500],    // 800ms to 1300ms
  },
});

// Play from sprite
audioManager.playSprite('ui_sprite', 'click');
```

### 2. Lazy Loading (Non-Critical Sounds)

```typescript
// Load announcer voices only when needed
async function loadAnnouncerSounds() {
  await audioManager.preloadSounds({
    on_fire: {
      src: ['/assets/sounds/announcer/on_fire.ogg', '/assets/sounds/announcer/on_fire.mp3'],
    },
    ice_cold: {
      src: ['/assets/sounds/announcer/ice_cold.ogg', '/assets/sounds/announcer/ice_cold.mp3'],
    },
  });
}

// Call when first streak occurs
if (streak >= 3 && !announcerLoaded) {
  await loadAnnouncerSounds();
  announcerLoaded = true;
}
```

### 3. Preload Priority System

**Priority 1 (Load Immediately):**
- Card sounds
- UI button click/hover
- Invalid move sound

**Priority 2 (Load on Game Start):**
- Game event sounds
- Special effects

**Priority 3 (Lazy Load):**
- Background music (stream)
- Announcer voices
- Ambient sounds

---

## Testing

### Unit Tests for AudioManager

**File:** `/frontend/src/game/audio/AudioManager.test.ts`

```typescript
import { AudioManager } from './AudioManager';

describe('AudioManager', () => {
  let audioManager: AudioManager;

  beforeEach(() => {
    audioManager = new AudioManager();
  });

  afterEach(() => {
    audioManager.destroy();
  });

  it('should preload sounds successfully', async () => {
    await audioManager.preloadSound('test_sound', {
      src: ['/assets/sounds/test.ogg', '/assets/sounds/test.mp3'],
    });

    expect(audioManager['sounds'].has('test_sound')).toBe(true);
  });

  it('should play sound with correct volume', () => {
    const playId = audioManager.playSound('test_sound', { volume: 0.5 });
    expect(playId).toBeDefined();
  });

  it('should set volume for category', () => {
    audioManager.setVolume('sfx', 0.7);
    expect(audioManager.getVolume('sfx')).toBe(0.7);
  });

  it('should mute and unmute categories', () => {
    audioManager.toggleMute('music');
    expect(audioManager.isMuted('music')).toBe(true);

    audioManager.toggleMute('music');
    expect(audioManager.isMuted('music')).toBe(false);
  });
});
```

### Integration Tests

**File:** `/frontend/src/game/audio/AudioManager.integration.test.ts`

```typescript
import { AudioManager } from './AudioManager';

describe('AudioManager Integration', () => {
  it('should load and play card sounds', async () => {
    const manager = new AudioManager();

    await manager.preloadSound('card_play', {
      src: [
        '/assets/sounds/sfx/cards/card_play.ogg',
        '/assets/sounds/sfx/cards/card_play.mp3',
      ],
    });

    const playId = manager.playSound('card_play');
    expect(playId).toBeDefined();

    manager.destroy();
  });

  it('should duck and restore music', async () => {
    const manager = new AudioManager();

    manager.playMusic('menu_theme');
    const initialVolume = manager['music']?.volume();

    manager.duckMusic(0.4);
    // Wait for fade
    await new Promise((resolve) => setTimeout(resolve, 400));

    const duckedVolume = manager['music']?.volume();
    expect(duckedVolume).toBeLessThan(initialVolume!);

    manager.restoreMusic();
    await new Promise((resolve) => setTimeout(resolve, 600));

    const restoredVolume = manager['music']?.volume();
    expect(restoredVolume).toBeCloseTo(initialVolume!);

    manager.destroy();
  });
});
```

---

## Troubleshooting

### Common Issues

#### 1. Audio Not Playing on Mobile

**Problem:** iOS/Android blocks audio until user interaction

**Solution:** Ensure mobile unlock is implemented (already in AudioManager)

```typescript
// User must tap/click before audio plays
document.addEventListener('touchstart', () => {
  audioManager.playSound('silent_unlock');
}, { once: true });
```

#### 2. Audio Files Not Found (404)

**Problem:** Incorrect path to audio assets

**Solution:** Verify paths are relative to `/public` directory:
```typescript
// Correct
src: ['/assets/sounds/sfx/cards/card_play.ogg']

// Incorrect
src: ['../assets/sounds/sfx/cards/card_play.ogg']
```

#### 3. Sounds Cut Off Too Early

**Problem:** Sound stops before natural end

**Solution:** Check sound duration and ensure no premature `stop()` calls

```typescript
// Don't stop too early
const playId = audioManager.playSound('round_win');
// Wait for sound to finish before stopping
setTimeout(() => audioManager.stopSound('round_win', playId), 2000);
```

#### 4. Volume Too Loud/Quiet

**Problem:** Inconsistent loudness across sounds

**Solution:** Verify LUFS normalization (should be -12 LUFS for SFX)

Use Audacity: Analyze > Loudness Normalization

#### 5. Memory Leaks from Not Unloading

**Problem:** Memory usage grows over time

**Solution:** Always call `destroy()` when cleaning up:

```typescript
useEffect(() => {
  return () => {
    audioManager.destroy();
  };
}, []);
```

---

## Performance Monitoring

### Track Audio Performance

```typescript
class AudioManager {
  // ... existing code

  getPerformanceMetrics() {
    return {
      totalSoundsLoaded: this.sounds.size,
      musicPlaying: this.music !== null,
      unlocked: this.unlocked,
      mutedCategories: Array.from(this.muted),
    };
  }
}

// In dev tools
console.log('Audio Stats:', audioManager.getPerformanceMetrics());
```

---

## Next Steps

1. **Implement AudioManager class** in `/frontend/src/game/audio/AudioManager.ts`
2. **Integrate into PreloadScene** for Phaser sounds
3. **Create useAudio hook** for React components
4. **Add AudioSettings component** to settings page
5. **Test on multiple browsers and devices**
6. **Monitor performance and file sizes**

---

## Resources

- **Howler.js Documentation:** https://howlerjs.com/
- **Phaser Audio Guide:** https://photonstorm.github.io/phaser3-docs/Phaser.Sound.html
- **Web Audio API:** https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- **Audio Optimization:** https://web.dev/fast/audio-on-the-web

---

**Last Updated:** December 19, 2025
**Status:** Ready for implementation once P0 audio assets are delivered
**Maintained By:** audio-designer agent
