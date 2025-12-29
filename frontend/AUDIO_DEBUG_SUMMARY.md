# Audio Loading Debug Summary

## Problem Identified

The audio files were not loading into Phaser's cache due to **React StrictMode double-mounting** in development mode.

### Root Cause

1. React StrictMode (enabled in `main.tsx`) causes `useEffect` to run twice in development
2. First render cycle:
   - PhaserGame component mounts
   - Creates new Phaser.Game instance
   - PreloadScene.preload() runs
   - AudioManager.preload() is called successfully with `preloaded = false`
   - Audio files are queued for loading
3. Cleanup cycle (StrictMode behavior):
   - PhaserGame component unmounts
   - Phaser.Game is destroyed
   - **BUT AudioManager singleton persists with `preloaded = true`**
4. Second render cycle:
   - PhaserGame component re-mounts
   - Creates new Phaser.Game instance
   - PreloadScene.preload() runs again
   - AudioManager.preload() sees `preloaded = true` and **SKIPS loading**
   - No audio files are loaded!

## Solution Implemented

### 1. AudioManager Singleton Reset
**File**: `/Users/nana/go/src/github.com/npeprah/sparui/frontend/src/components/PhaserGame.tsx`

Added AudioManager.resetInstance() call in the cleanup function:
```typescript
return () => {
  if (gameRef.current) {
    gameRef.current.destroy(true)
    gameRef.current = null

    // Reset AudioManager singleton to allow fresh initialization
    AudioManager.resetInstance()
  }
}
```

### 2. Force Reload in Development
**File**: `/Users/nana/go/src/github.com/npeprah/sparui/frontend/src/game/scenes/PreloadScene.ts`

Added force parameter to allow reloading in development mode:
```typescript
const isDevelopment = import.meta.env.DEV
audioManager.preload(this, isDevelopment)
```

### 3. Enhanced Debug Logging
**Files**:
- `/Users/nana/go/src/github.com/npeprah/sparui/frontend/src/services/audioManager.ts`
- `/Users/nana/go/src/github.com/npeprah/sparui/frontend/src/game/scenes/PreloadScene.ts`

Added comprehensive logging to trace:
- AudioManager state (preloaded, initialized, hasScene)
- Phaser loader state (isLoading, isReady, totalToLoad, listSize)
- Individual audio file queueing success/failure
- File load errors with detailed information

## Expected Console Output

After the fix, you should see these logs in the browser console:

```
[PhaserGame] useEffect running
[PhaserGame] Creating new Phaser.Game instance
[PreloadScene] ===== LOADING CARD ASSETS =====
[PreloadScene] Queued 34 cards for loading
[PreloadScene] ===== LOADING SOUND ASSETS =====
[PreloadScene] Scene: PreloadScene
[PreloadScene] Loader exists: true
[PreloadScene] Development mode: true
[AudioManager] ===== PRELOAD CALLED =====
[AudioManager] Current state: {preloaded: false, initialized: false, hasScene: false, force: true}
[AudioManager] Scene key: PreloadScene
[AudioManager] Loader state: {isLoading: false, isReady: true, totalToLoad: 34, listSize: 34}
[AudioManager] Loading 16 sounds from SOUND_CONFIG...
[AudioManager] Queueing audio: sound:card_deal from path: assets/sounds/sfx/cards/card_deal.wav
[AudioManager] ✓ Successfully queued: sound:card_deal
... (repeated for all 16 sounds)
[AudioManager] Queued 16 audio files for loading
[AudioManager] Loader state after queueing: {totalToLoad: 50, listSize: 50}
[PreloadScene] After AudioManager.preload():
[PreloadScene] - Loader files in queue: 50
[PreloadScene] - Loader total files: 50
[PreloadScene] ===== ALL ASSETS LOADED =====
[PreloadScene] Total files loaded: 50
[PreloadScene] ===== VERIFYING AUDIO CACHE =====
[PreloadScene] ✓ sound:card_deal - IN CACHE
... (repeated for all 16 sounds)
[PreloadScene] Audio cache verification: 16/16 found
```

## Audio File Configuration

All audio files are correctly located and accessible:

**Card Sounds** (6 files):
- `assets/sounds/sfx/cards/card_deal.wav` ✓
- `assets/sounds/sfx/cards/card_flip.wav` ✓
- `assets/sounds/sfx/cards/card_play.wav` ✓
- `assets/sounds/sfx/cards/card_hover.wav` ✓
- `assets/sounds/sfx/cards/card_shuffle.wav` ✓
- `assets/sounds/sfx/cards/card_collect.wav` ✓

**Game Event Sounds** (10 files):
- `assets/sounds/sfx/game_events/round_win.wav` ✓
- `assets/sounds/sfx/game_events/round_loss.wav` ✓
- `assets/sounds/sfx/game_events/game_victory.wav` ✓
- `assets/sounds/sfx/game_events/game_defeat.wav` ✓
- `assets/sounds/sfx/game_events/dry_declaration.wav` ✓
- `assets/sounds/sfx/game_events/show_dry_declaration.wav` ✓
- `assets/sounds/sfx/game_events/fire_streak.wav` ✓
- `assets/sounds/sfx/game_events/freeze_effect.wav` ✓
- `assets/sounds/sfx/game_events/invalid_move.wav` ✓
- `assets/sounds/sfx/game_events/phase_transition.wav` ✓

**Verified**: HTTP GET requests return 200 OK with correct Content-Type: audio/wav

## Testing Instructions

1. Open browser DevTools (F12)
2. Go to Console tab
3. Reload the page (Cmd+R or Ctrl+R)
4. Search for "[AudioManager]" in the console
5. Verify you see the logs above
6. Check that "Audio cache verification: 16/16 found" appears
7. Try playing a card - you should hear audio

## If Audio Still Doesn't Load

If you still see permission errors or audio not loading:

1. **Check browser console for [AudioManager] logs**
   - If logs don't appear, the preload() method isn't being called
   - Check if PreloadScene is being initialized correctly

2. **Check for load errors**
   - Look for "[PreloadScene] ===== LOAD ERROR ====="
   - Check the error details (URL, status code)

3. **Verify file paths**
   - All paths should NOT have leading slash
   - Format: `assets/sounds/sfx/cards/card_deal.wav`
   - NOT: `/assets/sounds/sfx/cards/card_deal.wav`

4. **Clear browser cache**
   - Hard reload: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
   - Or clear browser cache completely

5. **Check Vite dev server**
   - Ensure dev server is running on http://localhost:5173
   - Try accessing audio files directly in browser:
     - http://localhost:5173/assets/sounds/sfx/cards/card_deal.wav
   - Should download or play the file (not 404 or 403)

## Files Modified

1. `/Users/nana/go/src/github.com/npeprah/sparui/frontend/src/components/PhaserGame.tsx`
   - Added AudioManager.resetInstance() in cleanup
   - Added debug logging for component lifecycle

2. `/Users/nana/go/src/github.com/npeprah/sparui/frontend/src/services/audioManager.ts`
   - Added force parameter to preload() method
   - Enhanced debug logging with state tracking
   - Added individual file queueing error handling

3. `/Users/nana/go/src/github.com/npeprah/sparui/frontend/src/game/scenes/PreloadScene.ts`
   - Pass isDevelopment flag to force reload in dev mode
   - Enhanced debug logging for load flow
   - Improved error logging with detailed file information

## Next Steps

After verifying audio loads correctly:

1. Test audio playback by playing cards
2. Verify volume controls work
3. Test mute/unmute functionality
4. Check mobile audio unlock (iOS/Safari)
5. Consider disabling StrictMode in production build (already done in `vite build`)
