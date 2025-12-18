# TASK-031: Framer Motion Animations Implementation Guide

## Overview

This document provides a comprehensive guide to the animation system implemented for the Spar multiplayer card game. The animations follow the "Afro-Futurism Meets Arcade Energy" aesthetic with fast, snappy, and celebratory animations.

**Implementation Date:** December 18, 2025
**Framer Motion Version:** 12.23.26
**Status:** ✅ Complete

---

## Table of Contents

1. [Animation Principles](#animation-principles)
2. [File Structure](#file-structure)
3. [Animation Utilities](#animation-utilities)
4. [Component Animations](#component-animations)
5. [Usage Examples](#usage-examples)
6. [Accessibility](#accessibility)
7. [Performance](#performance)
8. [Testing](#testing)

---

## Animation Principles

### Design Aesthetic: "Afro-Futurism Meets Arcade Energy"

- **Fast:** 0.2-0.4s for most transitions (arcade speed)
- **Energetic:** Spring physics for bounce effects
- **Celebratory:** Big actions get big animations
- **Responsive:** Respects reduced motion preferences
- **Smooth:** 60fps performance target

### Timing Guide

| Animation Type | Duration | Easing | Use Case |
|---------------|----------|--------|----------|
| Fast | 0.2s | easeOut | Button interactions, quick feedback |
| Medium | 0.3s | easeInOut | Page transitions, modal animations |
| Slow | 0.4s | easeInOut | Card animations, player joins |
| Spring | N/A | Spring physics | Celebratory actions, bounces |

---

## File Structure

```
frontend/src/
├── utils/
│   ├── animations.ts           # Core animation utilities
│   └── animations.test.ts      # Animation utility tests
├── components/
│   ├── ui/
│   │   ├── Button.tsx          # Animated button component
│   │   ├── Modal.tsx           # Animated modal component
│   │   └── Card.tsx            # Animated card component
│   ├── lobby/
│   │   ├── PlayerSlot.tsx      # Animated player slots
│   │   ├── RoomCodeDisplay.tsx # Copy feedback animations
│   │   └── LobbyScreen.tsx     # Lobby page transitions
│   └── layout/
│       ├── PageTransition.tsx  # Reusable page wrapper
│       └── PageTransition.test.tsx
└── pages/
    └── HomePage.tsx            # Main menu animations
```

---

## Animation Utilities

### Location: `frontend/src/utils/animations.ts`

This module provides all animation variants, transitions, and utility functions used throughout the app.

### Core Transitions

```typescript
import { spring, fast, medium, slow } from '@/utils/animations'

// Spring transition (bouncy, energetic)
spring  // { type: 'spring', stiffness: 300, damping: 20 }

// Fast transition (0.2s)
fast    // { duration: 0.2, ease: 'easeOut' }

// Medium transition (0.3s)
medium  // { duration: 0.3, ease: 'easeInOut' }

// Slow transition (0.4s)
slow    // { duration: 0.4, ease: 'easeInOut' }
```

### Animation Variants

#### Page Transitions

```typescript
import { pageVariants } from '@/utils/animations'

// Usage in component
<motion.div
  variants={pageVariants}
  initial="initial"
  animate="animate"
  exit="exit"
>
  {/* Page content */}
</motion.div>
```

**States:**
- `initial`: Opacity 0, Y offset 20px
- `animate`: Opacity 1, Y offset 0px
- `exit`: Opacity 0, Y offset -20px

#### Button Animations

```typescript
import { buttonVariants } from '@/utils/animations'

// Usage in component
<motion.button
  variants={buttonVariants}
  whileHover="hover"
  whileTap="tap"
>
  Click Me
</motion.button>
```

**States:**
- `hover`: Scale 1.05
- `tap`: Scale 0.95

#### Modal Animations

```typescript
import { backdropVariants, modalVariants } from '@/utils/animations'

// Backdrop fade
<motion.div variants={backdropVariants} initial="hidden" animate="visible" exit="exit" />

// Modal content scale + fade
<motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" />
```

#### Card Animations

```typescript
import { cardVariants } from '@/utils/animations'

// Usage in component
<motion.div
  variants={cardVariants}
  whileHover="hover"
  whileTap="tap"
>
  {/* Card content */}
</motion.div>
```

**States:**
- `hidden`: Opacity 0, Y offset 50px, rotate -10deg
- `visible`: Opacity 1, Y offset 0px, rotate 0deg
- `hover`: Y offset -8px, scale 1.02
- `tap`: Scale 0.98

#### Stagger Animations

```typescript
import { staggerContainer, staggerItem } from '@/utils/animations'

// Container with staggered children
<motion.div variants={staggerContainer} initial="hidden" animate="visible">
  <motion.div variants={staggerItem}>Item 1</motion.div>
  <motion.div variants={staggerItem}>Item 2</motion.div>
  <motion.div variants={staggerItem}>Item 3</motion.div>
</motion.div>
```

**Configuration:**
- Stagger delay: 0.1s between children
- Initial delay: 0.1s before first child

#### Pulse Animations

```typescript
import { pulseVariants } from '@/utils/animations'

// Subtle pulse for ready status
<motion.div
  animate="pulse"
  variants={pulseVariants}
>
  Ready!
</motion.div>
```

**Configuration:**
- Scale: 1 → 1.05 → 1
- Duration: 0.5s
- Repeat: Infinite
- Repeat delay: 2s

#### Player Join/Leave

```typescript
import { playerJoinVariants } from '@/utils/animations'

// Slide in from right, slide out to left
<motion.div
  variants={playerJoinVariants}
  initial="hidden"
  animate="visible"
  exit="exit"
>
  Player Card
</motion.div>
```

#### Copy Feedback

```typescript
import { copySuccessVariants, copiedTextVariants } from '@/utils/animations'

// Scale pulse on copy
<motion.div animate={copied ? 'pulse' : 'initial'} variants={copySuccessVariants}>
  {roomCode}
</motion.div>

// Feedback text animation
<AnimatePresence>
  {copied && (
    <motion.div variants={copiedTextVariants} initial="hidden" animate="visible" exit="exit">
      Copied!
    </motion.div>
  )}
</AnimatePresence>
```

---

## Component Animations

### Button Component

**File:** `frontend/src/components/ui/Button.tsx`

**Animations:**
- Hover: Scale up to 1.05
- Tap: Scale down to 0.95
- Disabled: No animations

**Usage:**
```tsx
import { Button } from '@/components/ui'

<Button variant="primary" size="lg">
  Click Me
</Button>
// Automatically includes hover/tap animations
```

**Features:**
- Respects reduced motion preferences
- Disabled buttons don't animate
- Type-safe props

### Modal Component

**File:** `frontend/src/components/ui/Modal.tsx`

**Animations:**
- Backdrop: Fade in/out
- Content: Scale (0.9 → 1.0) + fade
- Duration: 0.3s enter, 0.2s exit

**Usage:**
```tsx
import { Modal } from '@/components/ui'

<Modal isOpen={isOpen} onClose={onClose} title="Modal Title">
  Modal content here
</Modal>
// Automatically includes enter/exit animations
```

**Features:**
- AnimatePresence for exit animations
- Smooth backdrop fade
- Scale + fade combo for modal content

### Card Component

**File:** `frontend/src/components/ui/Card.tsx`

**Animations:**
- Hover: Lift (-8px) + scale (1.02)
- Tap: Scale down (0.98)
- Only when `hoverable` or `onClick` prop is provided

**Usage:**
```tsx
import { Card } from '@/components/ui'

// Static card (no animations)
<Card>
  Content
</Card>

// Interactive card with hover effect
<Card hoverable>
  Hoverable content
</Card>

// Clickable card
<Card onClick={handleClick}>
  Clickable content
</Card>
```

### PlayerSlot Component

**File:** `frontend/src/components/lobby/PlayerSlot.tsx`

**Animations:**
- Join: Slide in from right (x: 100 → 0) + fade
- Leave: Slide out to left (x: 0 → -100) + fade
- Ready avatar: Pulse animation
- Crown badge: Spring entrance with rotation
- Ready badge: Slide in from left

**Usage:**
```tsx
import { PlayerSlot } from '@/components/lobby'

<PlayerSlot
  player={player}
  slotNumber={1}
  isCurrentPlayer={false}
/>
```

### RoomCodeDisplay Component

**File:** `frontend/src/components/lobby/RoomCodeDisplay.tsx`

**Animations:**
- Copy success: Room code pulses (scale 1 → 1.1 → 1)
- Feedback text: Slide up + fade in, then fade out after 2s

**Usage:**
```tsx
import { RoomCodeDisplay } from '@/components/lobby'

<RoomCodeDisplay roomCode="XK9P2L" />
```

### PageTransition Component

**File:** `frontend/src/components/layout/PageTransition.tsx`

**Animations:**
- Enter: Fade in + slide up (y: 20 → 0)
- Exit: Fade out + slide up (y: 0 → -20)

**Usage:**
```tsx
import { PageTransition } from '@/components/layout'

function MyPage() {
  return (
    <PageTransition>
      <div>Page content</div>
    </PageTransition>
  )
}
```

### HomePage

**File:** `frontend/src/pages/HomePage.tsx`

**Animations:**
- Page transition on mount/unmount
- Title and subtitle: Staggered fade + slide
- Buttons: Staggered fade + slide (0.1s between each)
- Each button has individual hover/tap animations

### LobbyScreen

**File:** `frontend/src/components/lobby/LobbyScreen.tsx`

**Animations:**
- Page transition on mount/unmount
- Header, room code, settings: Staggered fade + slide
- Connection status: Fade + slide animation
- Player list items animate individually

---

## Usage Examples

### Adding Page Animations

```tsx
import { motion } from 'framer-motion'
import { pageVariants, getVariants } from '@/utils/animations'

function MyPage() {
  const variants = getVariants(pageVariants)

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <h1>My Page</h1>
    </motion.div>
  )
}
```

### Adding Stagger Effects

```tsx
import { motion } from 'framer-motion'
import { staggerContainer, staggerItem, getVariants } from '@/utils/animations'

function MyList() {
  const container = getVariants(staggerContainer)
  const item = getVariants(staggerItem)

  return (
    <motion.div variants={container} initial="hidden" animate="visible">
      {items.map((item) => (
        <motion.div key={item.id} variants={item}>
          {item.name}
        </motion.div>
      ))}
    </motion.div>
  )
}
```

### Adding Button Hover Effect

```tsx
import { motion } from 'framer-motion'
import { buttonVariants, getVariants } from '@/utils/animations'

function CustomButton() {
  const variants = getVariants(buttonVariants)

  return (
    <motion.button
      variants={variants}
      whileHover="hover"
      whileTap="tap"
      className="..."
    >
      Click Me
    </motion.button>
  )
}
```

### Adding AnimatePresence for Exit Animations

```tsx
import { AnimatePresence, motion } from 'framer-motion'
import { modalVariants, getVariants } from '@/utils/animations'

function ConditionalContent({ isVisible }) {
  const variants = getVariants(modalVariants)

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          variants={variants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          Content
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

---

## Accessibility

### Reduced Motion Support

All animations respect the user's `prefers-reduced-motion` system setting.

**Implementation:**

```typescript
import { getPrefersReducedMotion, getVariants } from '@/utils/animations'

function MyComponent() {
  const prefersReducedMotion = getPrefersReducedMotion()
  const variants = getVariants(buttonVariants) // Automatically handles reduced motion

  return (
    <motion.button
      whileHover={prefersReducedMotion ? undefined : 'hover'}
      variants={variants}
    >
      Button
    </motion.button>
  )
}
```

**Utilities:**

- `getPrefersReducedMotion()`: Returns true if user prefers reduced motion
- `getVariants(variants)`: Returns simplified variants if reduced motion is preferred
- `getTransition(transition)`: Returns instant transition if reduced motion is preferred
- `shouldReduceAnimations()`: Checks for reduced motion + low-end devices

### Best Practices

✅ **DO:**
- Always use `getVariants()` to wrap animation variants
- Check `getPrefersReducedMotion()` before adding `whileHover`/`whileTap`
- Test with reduced motion enabled
- Keep animations short (0.2-0.4s)
- Provide instant feedback for important actions

❌ **DON'T:**
- Rely on animations alone to convey information
- Use slow animations (>0.5s)
- Animate essential UI elements
- Forget to test with reduced motion

---

## Performance

### Optimization Tips

1. **Use `transform` and `opacity` properties**
   - These are GPU-accelerated
   - Avoid animating `width`, `height`, `top`, `left`

2. **Leverage Framer Motion's `layout` prop**
   - Automatically optimizes layout animations
   - Example: `<motion.div layout>`

3. **Use `AnimatePresence` for exit animations**
   - Properly handles component unmounting
   - Prevents memory leaks

4. **Avoid animating too many elements simultaneously**
   - Use stagger with reasonable delays
   - Limit concurrent animations to <10

5. **Profile with React DevTools**
   - Check for unnecessary re-renders
   - Optimize with `React.memo` if needed

### Performance Targets

- **60fps** for all animations
- **<100ms** perceived input lag
- **Smooth** on mobile devices (iOS/Android)
- **Lightweight** bundle size impact (<50kb gzipped)

**Framer Motion Bundle Size:**
- Total: ~93kb added to bundle
- Gzipped: ~29kb
- Trade-off: Excellent animation DX for minimal size

---

## Testing

### Unit Tests

All animation utilities and components have comprehensive tests.

**Run tests:**
```bash
npm test
```

**Coverage:**
- ✅ 34 tests for animation utilities
- ✅ 17 tests for Button component
- ✅ 17 tests for Modal component
- ✅ 4 tests for PageTransition component
- ✅ 106 total tests passing

### Test Examples

**Testing reduced motion:**
```typescript
import { getPrefersReducedMotion } from '@/utils/animations'

it('should detect when user prefers reduced motion', () => {
  window.matchMedia = vi.fn().mockReturnValue({ matches: true })
  expect(getPrefersReducedMotion()).toBe(true)
})
```

**Testing animations:**
```typescript
import { render } from '@testing-library/react'
import { Button } from '@/components/ui'

it('should render with motion props', () => {
  const { container } = render(<Button>Click</Button>)
  // Button uses motion.button internally
  expect(container.firstChild).toBeTruthy()
})
```

### Manual Testing Checklist

- [ ] Page transitions smooth on navigation
- [ ] Button hover/tap feels responsive
- [ ] Modal animations polished (enter/exit)
- [ ] Player join/leave animates smoothly
- [ ] Ready status pulses continuously
- [ ] Room code copy feedback works
- [ ] Reduced motion setting respected
- [ ] Performance is smooth (60fps)
- [ ] Works on iOS Safari
- [ ] Works on Chrome Mobile
- [ ] Works on Firefox
- [ ] No jank or layout shift

---

## Animation Catalog

### Quick Reference

| Component | Animation | Trigger | Duration | Easing |
|-----------|-----------|---------|----------|--------|
| Button | Scale 1.05 | Hover | 0.2s | easeOut |
| Button | Scale 0.95 | Tap | 0.1s | easeOut |
| Modal backdrop | Fade | Enter/Exit | 0.2s | easeOut |
| Modal content | Scale + fade | Enter/Exit | 0.3s / 0.2s | easeInOut |
| Page | Fade + slide | Mount/Unmount | 0.3s / 0.2s | easeInOut |
| Card | Lift + scale | Hover | 0.2s | easeOut |
| PlayerSlot | Slide + fade | Join/Leave | 0.4s / 0.3s | easeInOut |
| Ready avatar | Pulse | Continuous | 0.5s | easeInOut |
| Room code | Scale pulse | Copy | 0.3s | - |
| Copied text | Slide + fade | Show/Hide | 0.2s | easeOut |

---

## Troubleshooting

### Common Issues

**Issue:** Animations not working
- ✅ Check if `framer-motion` is installed
- ✅ Verify imports from `@/utils/animations`
- ✅ Ensure component is using `motion.*` elements

**Issue:** Animations are janky
- ✅ Check if animating non-GPU properties
- ✅ Reduce number of simultaneous animations
- ✅ Profile with React DevTools
- ✅ Use `transform` and `opacity` only

**Issue:** Exit animations not playing
- ✅ Wrap component with `<AnimatePresence>`
- ✅ Ensure component has `exit` variant
- ✅ Check that component is properly unmounting

**Issue:** Reduced motion not working
- ✅ Use `getVariants()` instead of raw variants
- ✅ Check `whileHover`/`whileTap` conditionals
- ✅ Test with system setting enabled

---

## Future Enhancements

Planned for Week 3 (Game Scene):

1. **Card Deal Animations**
   - Slide from center deck
   - Slight rotation effect
   - Stagger between cards

2. **Card Play Animations**
   - Fly to center of table
   - Scale up emphasis
   - Trail effect

3. **Win Celebrations**
   - Confetti particle effect
   - Glow/pulse on winning card
   - Trophy/badge bounce in

4. **Turn Indicators**
   - Glow pulse on active player
   - Subtle bounce attention grabber
   - Color transitions

5. **Sound Integration**
   - Sync animations with sound effects
   - Haptic feedback on mobile

---

## Resources

- [Framer Motion Docs](https://www.framer.com/motion/)
- [Animation Best Practices](https://web.dev/animations/)
- [Reduced Motion Guide](https://css-tricks.com/introduction-reduced-motion-media-query/)
- [React Spring vs Framer Motion](https://blog.logrocket.com/framer-motion-vs-react-spring/)

---

## Credits

**Implementation:** TASK-031
**Date:** December 18, 2025
**Aesthetic:** Afro-Futurism Meets Arcade Energy
**Framework:** Framer Motion 12.23.26

**Animated by Claude Code** with attention to accessibility, performance, and arcade-style polish.
