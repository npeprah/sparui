# Audio Loading Debug Instructions

## Changes Made

### 1. Enhanced Debug Logging in PreloadScene.ts
- Added comprehensive logging to track audio loading process
- Added loader event handlers for `start`, `filecomplete`, and existing events
- Added `verifyAudioCache()` method to check if all 16 sounds are in Phaser's cache after loading

### 2. Enhanced Debug Logging in AudioManager.ts
- Added detailed logging to `preload()` method to track each audio file being queued
- Added cache verification in `play()` method to catch missing audio files early
- Improved error messages with helpful context

### 3. Updated Phaser Configuration (config.ts)
- Added explicit audio configuration:
  ```typescript
  audio: {
    disableWebAudio: false,
    noAudio: false,
  }
  ```
- Added explicit loader configuration:
  ```typescript
  loader: {
    baseURL: '/',
    path: '',
  }
  ```

## What to Look For in Browser Console

### Expected Output Sequence

1. **PreloadScene initialization:**
   ```
   [PreloadScene] ===== LOADING SOUND ASSETS =====
   [PreloadScene] Scene: PreloadScene
   [PreloadScene] Loader exists: true
   ```

2. **AudioManager preload:**
   ```
   [AudioManager] ===== PRELOAD CALLED =====
   [AudioManager] Scene key: PreloadScene
   [AudioManager] Loading 16 sounds from SOUND_CONFIG...
   [AudioManager] Loading: sound:card_deal from assets/sounds/sfx/cards/card_deal.wav
   [AudioManager] Loading: sound:card_flip from assets/sounds/sfx/cards/card_flip.wav
   ... (14 more sounds)
   [AudioManager] Queued 16 audio files for loading
   ```

3. **PreloadScene loader queue:**
   ```
   [PreloadScene] AudioManager.preload() called
   [PreloadScene] Loader files in queue: 50 (34 cards + 16 sounds)
   [PreloadScene] Loader total files: 50
   ```

4. **Loader starts:**
   ```
   [PreloadScene] Loader started
   ```

5. **Individual audio files load:**
   ```
   [PreloadScene] Audio file loaded: sound:card_deal
   [PreloadScene] Audio file loaded: sound:card_flip
   ... (14 more sounds)
   ```

6. **Loader completes:**
   ```
   [PreloadScene] ===== ALL ASSETS LOADED =====
   [PreloadScene] Total files loaded: 50
   [PreloadScene] Expected: 34 cards + card back + 16 sounds = 51 total
   ```

7. **Cache verification:**
   ```
   [PreloadScene] ===== VERIFYING AUDIO CACHE =====
   [PreloadScene] ✓ sound:card_deal - IN CACHE
   [PreloadScene] ✓ sound:card_flip - IN CACHE
   ... (14 more sounds)
   [PreloadScene] Audio cache verification: 16/16 found
   ```

### If Audio Files Are Missing

If you see errors like:
```
[PreloadScene] ✗ sound:card_deal - NOT IN CACHE
[PreloadScene] ERROR: 16 audio files missing from cache!
```

This means:
1. The files were queued for loading but didn't load successfully
2. Check for `loaderror` events in console
3. Check network tab in DevTools for failed audio requests
4. Verify audio file paths are correct

### When Playing Sounds

If you see:
```
[AudioManager] Audio key "sound:card_deal" not found in cache
[AudioManager] Sound must be preloaded in PreloadScene before playing
```

This confirms that:
1. The sounds are being played before they're loaded
2. The PreloadScene loader didn't complete successfully
3. Need to investigate why loader is failing

## Testing Instructions

1. **Open browser DevTools** (F12 or Cmd+Option+I)
2. **Navigate to Console tab**
3. **Clear console** (click clear button or Cmd+K)
4. **Navigate to** http://localhost:5174/game
5. **Watch console output** during loading screen
6. **Look for the patterns above** in the console logs
7. **Note any errors or missing logs**
8. **Try playing cards** to trigger sound effects
9. **Check for audio playback errors**

## Expected Behavior After Fix

- All 16 sound files load successfully during PreloadScene
- Cache verification shows 16/16 sounds found
- No "not found in cache" errors when playing cards
- Sounds play during gameplay with no errors

## Troubleshooting

### If sounds still don't load:
1. Check network tab - are audio files being requested?
2. Check audio file paths - do they match actual file locations?
3. Check browser console for CORS errors
4. Check Phaser version compatibility (currently using 3.90.0)
5. Try disabling browser extensions that might block audio
6. Check if audio context is blocked by browser (mobile Safari issue)

### If sounds load but don't play:
1. Check if audio is muted in AudioManager (UI toggle)
2. Check browser audio settings (not muted)
3. Check if audio context is suspended (mobile issue)
4. Try clicking anywhere on page to unlock audio context
5. Check volume settings in AudioManager (master + SFX)

## Files Modified

- `/frontend/src/game/scenes/PreloadScene.ts` - Added debug logging and cache verification
- `/frontend/src/services/audioManager.ts` - Added debug logging and cache checks
- `/frontend/src/game/config.ts` - Added explicit audio and loader configuration

## Next Steps

After testing in browser:
1. Review console logs and identify any errors
2. If files are loading correctly, remove debug logs or reduce verbosity
3. If files are NOT loading, investigate network requests and file paths
4. Test audio playback during actual gameplay
5. Test on mobile devices (iOS Safari, Android Chrome)
