# HMR Protection Manual Test Plan

## Purpose
Verify that Hot Module Replacement (HMR) now properly handles Phaser game state, preventing asset corruption during development.

## Background
Previously, HMR would corrupt Phaser game state causing:
- Cards to appear as dots instead of images
- Audio to stop working
- Game functionality to break after any code change

## Fix Implemented
- Added HMR disposal handler to destroy Phaser instance before hot reload
- Configured HMR to force full page reload when PhaserGame component changes
- Added Vite config to exclude Phaser from optimization

## Manual Test Steps

### Test 1: Verify Full Reload on Component Change
1. Start dev server: `npm run dev`
2. Open browser to `http://localhost:5173`
3. Wait for game to load completely (cards should be visible)
4. Verify cards are rendered correctly (not as dots)
5. Play a sound to verify audio is working
6. Make a trivial change to `/frontend/src/components/PhaserGame.tsx` (e.g., add a comment)
7. Save the file

**Expected Result:**
- Browser should perform a FULL page reload (not HMR update)
- Console should log: `[HMR] Phaser component updated - forcing full reload`
- After reload, cards should still be visible
- Audio should still work

**Actual Result:** _[Fill in after testing]_

---

### Test 2: Verify HMR Works for Non-Phaser Components
1. With game running, make a change to a non-Phaser file (e.g., `/frontend/src/pages/HomePage.tsx`)
2. Save the file

**Expected Result:**
- Should perform fast HMR update (no full reload)
- Vite should show HMR update message
- Game state should be preserved

**Actual Result:** _[Fill in after testing]_

---

### Test 3: Verify Repeated Changes Don't Break Game
1. Make 5-10 consecutive changes to `PhaserGame.tsx` with 2-3 second pauses
2. Observe browser behavior

**Expected Result:**
- Each change should trigger a full reload
- Cards and audio should continue working after each reload
- No asset corruption should occur

**Actual Result:** _[Fill in after testing]_

---

### Test 4: Verify CSS Changes Use HMR
1. Make a change to `/frontend/src/index.css`
2. Save the file

**Expected Result:**
- Should use fast HMR (no full reload)
- Styles should update instantly

**Actual Result:** _[Fill in after testing]_

---

### Test 5: Long Development Session
1. Work on the codebase for 30+ minutes, making various changes
2. Periodically check that game continues to function correctly

**Expected Result:**
- Game should remain functional throughout development session
- No asset corruption should occur
- Cards should always render correctly
- Audio should continue working

**Actual Result:** _[Fill in after testing]_

---

## Success Criteria
All tests must pass with expected results for the fix to be considered successful.

## Rollback Plan
If HMR protection causes issues:
1. Revert changes to `PhaserGame.tsx`
2. Revert changes to `vite.config.ts`
3. Manually restart dev server after each change (workaround)

## Files Modified
- `/frontend/src/components/PhaserGame.tsx` - Added HMR disposal and accept handlers
- `/frontend/vite.config.ts` - Added optimizeDeps configuration
- `/frontend/src/components/PhaserGame.test.tsx` - Added tests for HMR behavior
