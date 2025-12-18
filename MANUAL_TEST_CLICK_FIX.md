# Manual Testing: Click vs Drag Fix

## Bug Description
Cards were not responding to clicks after drag functionality was implemented. The `pointerup` event was always treating interactions as drags, never as clicks.

## Fix Applied
Modified `/Users/nana/go/src/github.com/npeprah/sparui/frontend/src/game/sprites/CardSprite.ts` to:

1. Track both X and Y coordinates on pointer down
2. Calculate total distance moved (Euclidean distance)
3. Only enter "drag mode" if movement exceeds 10px threshold
4. If never entered drag mode AND distance <= 10px, treat as click
5. If in drag mode AND vertical distance >= 100px, play card via drag

## Test Cases

### Test 1: Simple Click (Desktop)
**Action:** Click a card without moving the mouse
**Expected:** Card should be selected and played immediately
**Status:** [ ] Pass [ ] Fail

### Test 2: Click with Small Movement (Touchscreen)
**Action:** Tap card with 1-5px of movement (simulate touchscreen jitter)
**Expected:** Card should be treated as clicked (play card)
**Status:** [ ] Pass [ ] Fail

### Test 3: Small Drag (<100px)
**Action:** Click and drag card upward 50px, then release
**Expected:** Card should return to original position (not played)
**Status:** [ ] Pass [ ] Fail

### Test 4: Full Drag (>=100px)
**Action:** Click and drag card upward 100px or more, then release
**Expected:** Card should be played via drag gesture
**Status:** [ ] Pass [ ] Fail

### Test 5: Drag Cancellation
**Action:** Start dragging card upward, then drag it back down before releasing
**Expected:** Card should return to original position (not played)
**Status:** [ ] Pass [ ] Fail

### Test 6: Hover Effects Still Work
**Action:** Hover over a playable card (without clicking)
**Expected:** Card should lift up and show glow effect
**Status:** [ ] Pass [ ] Fail

### Test 7: Non-Playable Cards Don't Respond
**Action:** Click or drag a non-playable card (grayed out)
**Expected:** No response, card stays in place
**Status:** [ ] Pass [ ] Fail

### Test 8: Mobile Touch (iOS/Android)
**Action:** Tap card on mobile device
**Expected:** Card should be played (treated as click)
**Status:** [ ] Pass [ ] Fail

### Test 9: Mobile Drag (iOS/Android)
**Action:** Swipe card upward 100px on mobile
**Expected:** Card should be played via drag gesture
**Status:** [ ] Pass [ ] Fail

### Test 10: Rapid Clicks
**Action:** Click multiple cards in rapid succession
**Expected:** Each click should register independently
**Status:** [ ] Pass [ ] Fail

## How to Run Manual Tests

1. Start the frontend development server:
   ```bash
   cd /Users/nana/go/src/github.com/npeprah/sparui/frontend
   npm run dev
   ```

2. Open browser to http://localhost:5173

3. Wait for 5 test cards to be dealt to bottom of screen

4. Execute each test case above and check the box

5. If any test fails, note the details and report back

## Success Criteria

- [ ] All 10 manual tests pass
- [ ] Click functionality restored to pre-Phase 8 behavior
- [ ] Drag functionality still works as expected
- [ ] No regressions in hover effects or visual feedback

## Code Changes Summary

**File:** `/Users/nana/go/src/github.com/npeprah/sparui/frontend/src/game/sprites/CardSprite.ts`

**Key Changes:**
1. Added `dragStartX` tracking (line 42)
2. Added `clickThreshold` constant (10px) (line 44)
3. Split event handlers into `onPointerDown`, `onPointerMove`, `onPointerUp`
4. `onPointerDown`: Only stores position, doesn't set `isDragging` yet
5. `onPointerMove`: Calculates total distance, enters drag mode if > 10px
6. `onPointerUp`: Determines if click (<=10px) or drag completion

**Tests Added:**
- 18 unit tests in `/Users/nana/go/src/github.com/npeprah/sparui/frontend/src/game/sprites/__tests__/CardSprite.click.test.ts`
- All tests passing

## Rollback Instructions (If Needed)

If this fix causes issues, revert with:
```bash
git checkout HEAD -- frontend/src/game/sprites/CardSprite.ts
```
