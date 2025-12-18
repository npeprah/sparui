# Click vs Drag Detection: Visual Flowchart

## State Machine Diagram

```
                    ┌─────────────────┐
                    │   POINTER DOWN  │
                    │  Store position │
                    │ (x, y recorded) │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   WAITING       │
                    │ isDragging=false│
                    └────────┬────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
       ┌────────────────┐      ┌─────────────────┐
       │ POINTER MOVE   │      │  POINTER UP     │
       │ Calculate dist │      │ (no move event) │
       └────────┬───────┘      └────────┬────────┘
                │                       │
                │                       │
         ┌──────┴──────┐                │
         │ dist > 10px?│                │
         └──────┬──────┘                │
                │                       │
         Yes    │    No                 │
                │    (ignore)           │
                ▼                       │
       ┌────────────────┐               │
       │ DRAGGING       │               │
       │ isDragging=true│               │
       │ Move card Y    │               │
       └────────┬───────┘               │
                │                       │
                │                       │
                ▼                       │
       ┌────────────────┐               │
       │  POINTER UP    │               │
       │ (after drag)   │               │
       └────────┬───────┘               │
                │                       │
                │                       │
         ┌──────┴───────┐               │
         │ dist >= 100px?│              │
         └──────┬───────┘               │
                │                       │
         Yes    │    No                 │
                │                       │
                ▼                       ▼
       ┌────────────────┐      ┌────────────────┐
       │  PLAY CARD     │      │  RETURN TO     │
       │  (drag play)   │      │  POSITION      │
       │ onDragPlay()   │      │  (cancelled)   │
       └────────────────┘      └────────────────┘
                │
                │
                └──────────────┬────────────────┘
                               │
                               │ dist <= 10px
                               │
                               ▼
                      ┌────────────────┐
                      │  PLAY CARD     │
                      │  (click)       │
                      │ onClick()      │
                      └────────────────┘
```

## Decision Tree

```
User taps/clicks card
│
├─> Pointer Down: Store (x1, y1)
│
├─> Pointer Move?
│   │
│   ├─> NO → Go to Pointer Up (likely a click)
│   │
│   └─> YES → Calculate distance from (x1, y1)
│       │
│       ├─> Distance <= 10px?
│       │   └─> YES → Ignore (not dragging yet)
│       │
│       └─> Distance > 10px?
│           └─> YES → Enter DRAG mode
│               │
│               ├─> Update card Y position
│               ├─> Show drag glow if dist >= 100px
│               │
│               └─> Pointer Up → Check distance
│                   │
│                   ├─> Distance >= 100px?
│                   │   └─> YES → PLAY CARD (drag)
│                   │
│                   └─> Distance < 100px?
│                       └─> YES → RETURN TO POSITION
│
└─> Pointer Up (never entered drag mode)
    │
    └─> Calculate distance from (x1, y1)
        │
        ├─> Distance <= 10px?
        │   └─> YES → PLAY CARD (click) ✅
        │
        └─> Distance > 10px?
            └─> YES → (should not happen, but handle gracefully)
```

## Threshold Visualization

```
Pixel Distance from Starting Position:

0px ─────┐
         │ CLICK ZONE
         │ (trigger click)
5px      │
         │
10px ────┴─── CLICK THRESHOLD

11px ─────┐
          │
20px      │
          │
50px      │ LIMBO ZONE
          │ (return to position)
          │ (not enough for play)
75px      │
          │
99px      │
          │
100px ────┴─── DRAG THRESHOLD

101px ─────┐
           │ DRAG-TO-PLAY ZONE
120px      │ (card plays)
           │
150px ─────┴─── MAX DRAG (constrained)
```

## Example Scenarios

### Scenario 1: Quick Click (Desktop)
```
Time: 0ms    → pointerdown at (400, 500)
Time: 100ms  → pointerup at (400, 500)
Distance: 0px
Result: CLICK → Play card ✅
```

### Scenario 2: Click with Touchscreen Jitter
```
Time: 0ms    → pointerdown at (400, 500)
Time: 150ms  → pointerup at (403, 504)
Distance: 5px
Result: CLICK (within threshold) → Play card ✅
```

### Scenario 3: Small Drag (Cancelled)
```
Time: 0ms    → pointerdown at (400, 500)
Time: 100ms  → pointermove at (400, 480)  [20px, enter drag mode]
Time: 200ms  → pointermove at (400, 450)  [50px, dragging]
Time: 300ms  → pointerup at (400, 450)    [50px total]
Distance: 50px
Result: Drag < 100px → Return to position
```

### Scenario 4: Full Drag to Play
```
Time: 0ms    → pointerdown at (400, 500)
Time: 100ms  → pointermove at (400, 480)  [20px, enter drag mode]
Time: 200ms  → pointermove at (400, 430)  [70px, dragging]
Time: 300ms  → pointermove at (400, 400)  [100px, GLOW ON]
Time: 400ms  → pointerup at (400, 390)    [110px total]
Distance: 110px
Result: Drag >= 100px → Play card ✅
```

### Scenario 5: Hover (No Click)
```
Time: 0ms    → pointerover card
Time: 50ms   → Card lifts up, glow appears
Time: 500ms  → pointerout
Time: 550ms  → Card returns to position
Result: Hover effect only (no play)
```

## Code Mapping

### Before Fix (Broken)
```typescript
on('pointerdown', (pointer) => {
  this.isDragging = true  // ❌ ALWAYS true!
  this.dragStartY = pointer.y
})

on('pointerup', () => {
  if (!this.isDragging) return  // ❌ Never false!
  // onCardClick NEVER called ❌
})
```

### After Fix (Working)
```typescript
on('pointerdown', (pointer) => {
  // ✅ Store position, don't set isDragging yet
  this.dragStartX = pointer.x
  this.dragStartY = pointer.y
})

on('pointermove', (pointer) => {
  const distance = Math.sqrt(deltaX² + deltaY²)

  if (!isDragging && distance > 10) {
    // ✅ Only enter drag mode if moved beyond threshold
    this.isDragging = true
  }

  if (isDragging) {
    // Update card position
  }
})

on('pointerup', (pointer) => {
  const distance = Math.sqrt(deltaX² + deltaY²)

  if (!isDragging && distance <= 10) {
    // ✅ This is a click!
    this.onCardClick?.(this)
    return
  }

  if (isDragging) {
    // Check drag distance for play
  }
})
```

## Testing Matrix

| Test Case | Start | End | Distance | isDragging | Result |
|-----------|-------|-----|----------|------------|--------|
| Click (no move) | (400,500) | (400,500) | 0px | false | CLICK ✅ |
| Click (jitter) | (400,500) | (403,504) | 5px | false | CLICK ✅ |
| Small drag | (400,500) | (400,450) | 50px | true | RETURN |
| Full drag | (400,500) | (400,400) | 100px | true | PLAY ✅ |
| Over-drag | (400,500) | (400,380) | 120px | true | PLAY ✅ |

## Summary

**Problem:** All interactions treated as drags → clicks never fired

**Solution:**
1. Don't assume drag until movement > 10px
2. Check distance on pointerup to determine intent
3. Call appropriate handler (click or drag)

**Result:** Both click AND drag work independently ✅
