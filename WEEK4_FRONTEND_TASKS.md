# Week 4 Frontend Implementation Tasks - Design Integration

**Date Created:** December 29, 2025
**Status:** Ready for Implementation
**Frontend Engineer:** frontend-tdd-engineer
**Design Assets:** 100% Complete (34 cards + 34 particles + 5 avatars + 4 surfaces + sounds)

---

## Overview

All design assets are complete and ready for frontend integration. This document breaks down the implementation into atomic, testable tasks that will result in pixel-perfect implementation of the designer's vision.

**Design Handoff Documents:**
- `/Users/nana/go/src/github.com/npeprah/sparui/CARD_DESIGN_HANDOFF.md` - Card animations, states, typography, colors
- `/Users/nana/go/src/github.com/npeprah/sparui/AVATAR_DESIGN_HANDOFF.md` - Avatar integration specs
- `/Users/nana/go/src/github.com/npeprah/sparui/frontend/public/assets/surfaces/SURFACE_DESIGNS.md` - Surface themes

---

## Task Breakdown Summary

**Total Tasks:** 14
**Estimated Time:** 28-44 hours (3-5 days)

### By Priority
- **P0 (Critical):** 4 tasks - Must complete first
- **P1 (High):** 6 tasks - Core functionality
- **P2 (Medium):** 4 tasks - Polish and enhancement

### By Size
- **S (< 2 hrs):** 3 tasks
- **M (2-4 hrs):** 7 tasks
- **L (4-8 hrs):** 4 tasks

---

## Phase 1: Card Visual States & Typography (P0)

### [TASK-W4-001] Implement Card Typography System
**Agent:** Frontend
**Priority:** P0 (critical)
**Size:** M (2-4 hrs)
**Status:** ⬜ TODO
**Dependencies:** None
**Blocked By:** None

**Description:**
Implement the exact typography specifications from the designer for card corner indicators and face card text. This includes loading the Orbitron font, applying correct sizes, weights, colors, and text shadows per the design specs.

**Acceptance Criteria:**
- [ ] Orbitron font family loaded and available (`@import url` or npm package)
- [ ] Corner indicator text: 40px (2.5rem) value, 28px (1.8rem) suit, weight 900, color #FF4500
- [ ] Corner text shadow: `2px 2px 0 #DC143C, 0 0 10px rgba(255, 69, 0, 0.6)`
- [ ] Face card title: Bebas Neue 40px, letter-spacing 4px, text shadow implemented
- [ ] Face card description: Barlow 16px, weight 600, opacity 0.8, line-height 1.4
- [ ] Typography applied to CardSprite component
- [ ] Tests verify correct font families, sizes, and styles are applied
- [ ] Visual regression test confirms text appearance matches design mockups

**Notes:**
- Typography specs are in `CARD_DESIGN_HANDOFF.md` lines 203-230
- Use Phaser's `TextStyle` object for configuration
- May need to preload fonts in PreloadScene
- Consider using web font loader for better control

**Files to Create/Modify:**
- `frontend/src/game/constants/typography.ts` (NEW) - Typography configuration
- `frontend/src/game/sprites/CardSprite.ts` - Apply typography to text elements
- `frontend/src/game/scenes/PreloadScene.ts` - Preload custom fonts
- `frontend/src/game/constants/typography.test.ts` (NEW) - Typography tests

---

### [TASK-W4-002] Implement Card Visual States (Default, Hover, Active, Disabled)
**Agent:** Frontend
**Priority:** P0 (critical)
**Size:** M (3-4 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-W4-001]
**Blocked By:** None

**Description:**
Implement all card visual states exactly as specified in design handoff: default state with Kente pattern, hover state with lift/glow, active state when played, and disabled state for unplayable cards.

**Acceptance Criteria:**
- [ ] **Default State:** Cream gradient background, Kente pattern overlay, gold border (4px), shadow with glow
- [ ] **Hover State:** Transform `translateY(-30px) rotateY(10deg) scale(1.05)`, enhanced shadow glow, intense neon suit symbol glow, duration 0.6s cubic-bezier(0.23, 1, 0.32, 1)
- [ ] **Active State:** Scale to table center, slight clockwise rotation, maximum glow intensity, duration 0.4s ease-out
- [ ] **Disabled State:** Opacity 0.5, grayscale filter 0.6, cursor not-allowed, no hover effects
- [ ] Kente pattern implemented as ::before pseudo-element (or Phaser equivalent)
- [ ] Pattern uses suit-specific colors per design specs
- [ ] Shadow effects use correct rgba values and blur radii
- [ ] Smooth transitions between states
- [ ] Tests verify each state's visual properties
- [ ] Visual regression tests for all 4 states

**Notes:**
- Design specs in `CARD_DESIGN_HANDOFF.md` lines 73-134
- Kente pattern CSS in lines 283-322
- Use Phaser tweens for smooth state transitions
- Consider performance with filters (grayscale may impact FPS on mobile)
- Maintain existing CardSprite functionality while adding visual states

**Files to Create/Modify:**
- `frontend/src/game/constants/cardStates.ts` (NEW) - State configuration constants
- `frontend/src/game/sprites/CardSprite.ts` - Implement state rendering
- `frontend/src/game/utils/cardVisuals.ts` (NEW) - Helper functions for visual effects
- `frontend/src/game/sprites/CardSprite.visual.test.ts` (NEW) - Visual state tests

---

### [TASK-W4-003] Implement Fire and Frozen Card States
**Agent:** Frontend
**Priority:** P0 (critical)
**Size:** M (3-4 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-W4-002]
**Blocked By:** None

**Description:**
Implement special Fire state (on fire streak) and Frozen state (freeze counter) with animated borders, particle effects, glows, and overlays as specified in design handoff.

**Acceptance Criteria:**
- [ ] **Fire State:** Animated fire gradient border (linear-gradient with keyframes), orange/red flame particles around edges, pulsing orange aura, flame distortion effect on symbol
- [ ] **Frozen State:** Ice blue crystalline border (4px solid #00BFFF), frost texture overlay, ice crystals on corners, pulsing blue aura, blue tint on symbol
- [ ] Fire border animation: `linear-gradient(45deg, #FF4500, #FF8C00, #FFD700)` with 1s infinite loop
- [ ] Fire particles use particle system (see TASK-W4-007)
- [ ] Frozen overlay with ice crystal texture (may need custom asset or procedural generation)
- [ ] Shadow glows: Fire uses orange rgba values, Frozen uses blue rgba values
- [ ] Symbol tint overlays applied correctly
- [ ] Animations loop seamlessly
- [ ] Performance: 60 FPS desktop, 40 FPS mobile maintained with effects
- [ ] Tests verify fire/frozen states activate correctly
- [ ] Visual regression tests for both special states

**Notes:**
- Design specs in `CARD_DESIGN_HANDOFF.md` lines 102-121
- Fire particles should use fire textures from TASK-W4-007
- Frozen state may require custom frost overlay texture (check with designer)
- Use Phaser shaders or filters for efficient rendering
- These states triggered by game logic (win streaks)

**Files to Create/Modify:**
- `frontend/src/game/constants/specialCardStates.ts` (NEW) - Fire/Frozen configuration
- `frontend/src/game/sprites/CardSprite.ts` - Add fire/frozen rendering
- `frontend/src/game/utils/cardEffects.ts` (NEW) - Special effect helpers
- `frontend/src/game/sprites/CardSprite.special.test.ts` (NEW) - Special state tests

---

### [TASK-W4-004] Implement Card Color Palettes by Suit
**Agent:** Frontend
**Priority:** P0 (critical)
**Size:** S (1-2 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-W4-001]
**Blocked By:** None

**Description:**
Implement the exact color palettes for each suit (Hearts, Clubs, Diamonds, Spades) with all gradient backgrounds, pattern colors, border colors, and accent colors per design specifications.

**Acceptance Criteria:**
- [ ] Hearts palette: Primary #FF4500, Secondary #FFD700, Accent #DC143C, background gradients (#FFF9F0 → #FFE8D6 → #FFF5E6)
- [ ] Clubs palette: Primary #0A5F38, Secondary #FFD700, Accent #006400, background gradients (#F0FFF4 → #D6F5E0 → #E6FFF0)
- [ ] Diamonds palette: Primary #FFD700, Secondary #8B00FF, Accent #FFBF00, background gradients (#FFFAF0 → #FFF0D6 → #FFF8E6)
- [ ] Spades palette: Primary #8B00FF, Secondary #00BFFF, Accent #191970, background gradients (#F5F0FF → #E8D6FF → #F0E6FF)
- [ ] Pattern colors match suit (rgba overlays with 0.15 opacity)
- [ ] Color utility functions for retrieving suit colors
- [ ] CardSprite uses correct colors based on card suit
- [ ] Tests verify all color values match specifications exactly
- [ ] Visual test confirms distinct suit color schemes

**Notes:**
- Design specs in `CARD_DESIGN_HANDOFF.md` lines 232-277
- Store as CSS custom properties or TypeScript constants
- Consider color accessibility (already validated in design)
- All hex values must match exactly (no approximations)

**Files to Create/Modify:**
- `frontend/src/game/constants/cardColors.ts` (NEW) - Color palette constants by suit
- `frontend/src/game/utils/colorHelpers.ts` (NEW) - Color utility functions
- `frontend/src/game/sprites/CardSprite.ts` - Apply suit-specific colors
- `frontend/src/game/constants/cardColors.test.ts` (NEW) - Color palette tests

---

## Phase 2: Card Animations (P1)

### [TASK-W4-005] Implement Card Deal Animation
**Agent:** Frontend
**Priority:** P1 (high)
**Size:** M (2-3 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-W4-002]
**Blocked By:** None

**Description:**
Implement the card deal animation exactly as specified: cards fly from deck to player hands with rotation, fade-in, and stagger timing per design specs.

**Acceptance Criteria:**
- [ ] Animation trigger: "game_start" or "new_round" event
- [ ] Duration: 800ms per card
- [ ] Easing: cubic-bezier(0.34, 1.56, 0.64, 1) for bounce effect
- [ ] Properties animated:
  - Opacity: 0 → 1
  - TranslateX: -200px → 0
  - TranslateY: 100px → 0
  - Rotate: -15° → 0°
- [ ] Stagger: 150ms delay between each card
- [ ] Cards deal to correct player positions (bottom, left, top, right)
- [ ] Sound hook: "card_deal" sound plays during animation
- [ ] Animation queues properly (no overlapping deal animations)
- [ ] Performance: 60 FPS desktop, 40 FPS mobile during animation
- [ ] Tests verify animation properties and timing
- [ ] Integration test with game state triggers animation

**Notes:**
- Design specs in `CARD_DESIGN_HANDOFF.md` lines 138-151
- Use Phaser timeline for precise control
- Existing deal animation may need updates to match exact specs
- Test with 2-4 players (different hand sizes)

**Files to Create/Modify:**
- `frontend/src/game/constants/animations.ts` - Update deal animation constants
- `frontend/src/game/utils/animations.ts` - Update deal animation function
- `frontend/src/game/scenes/GameScene.ts` - Trigger deal animation
- `frontend/src/game/utils/animations.deal.test.ts` (NEW) - Deal animation tests

---

### [TASK-W4-006] Implement Card Play, Flip, Win, Lose, Collect Animations
**Agent:** Frontend
**Priority:** P1 (high)
**Size:** L (4-6 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-W4-005]
**Blocked By:** None

**Description:**
Implement all card play animations: play (card moves to center), flip (180° rotation reveal), win pulse (green glow), lose fade (red fade out), and collect (winner takes cards) per design specifications.

**Acceptance Criteria:**
- [ ] **Play Animation:** Duration 400ms ease-out, card moves to table center with random slight rotation (-5° to 5°), scale squash effect (1 → 0.9 → 1)
- [ ] **Flip Animation:** Duration 400ms, 180° rotation around Y-axis with scale effects for perspective
- [ ] **Win Pulse:** Duration 300ms, scale 1 → 1.05 → 1, green glow filter, shadow enhancement
- [ ] **Lose Fade:** Duration 600ms, opacity 1 → 0, red tint overlay, scale down slightly
- [ ] **Collect Animation:** Cards move from center to winner's score pile, duration 500ms, slight arc path
- [ ] All animations use correct easing functions per spec
- [ ] Sound hooks: "card_play", "card_flip", "round_win", "round_loss" sounds play at correct times
- [ ] Animations chain correctly (play → flip → win/lose → collect)
- [ ] Performance maintained during simultaneous animations
- [ ] Tests verify each animation's properties, timing, and sequencing
- [ ] Integration tests with game state

**Notes:**
- Design specs in `CARD_DESIGN_HANDOFF.md` lines 154-186
- Existing animation system in place, may need refinement
- Collect animation needs winner's position calculation
- Test with all 4 players playing simultaneously

**Files to Create/Modify:**
- `frontend/src/game/utils/animations.ts` - Implement all animation functions
- `frontend/src/game/scenes/GameScene.ts` - Trigger animations on game events
- `frontend/src/game/constants/animations.ts` - Animation timing constants
- `frontend/src/game/utils/animations.play.test.ts` (NEW) - Play animation tests
- `frontend/src/game/utils/animations.winlose.test.ts` (NEW) - Win/lose tests

---

## Phase 3: Particle Effects Integration (P1)

### [TASK-W4-007] Integrate Particle Effect Textures
**Agent:** Frontend
**Priority:** P1 (high)
**Size:** M (3-4 hrs)
**Status:** ⬜ TODO
**Dependencies:** None
**Blocked By:** None

**Description:**
Load and configure all 34 particle textures (fire, ice, explosion, confetti) into Phaser particle system. Create particle emitter configurations for each effect type.

**Acceptance Criteria:**
- [ ] All 34 particle textures loaded in PreloadScene:
  - Fire: 8 textures (flame_01.png - flame_08.png)
  - Ice: 8 textures (ice_01.png - ice_08.png)
  - Explosion: 10 textures (explosion_01.png - explosion_10.png)
  - Confetti: 8 textures (confetti_01.png - confetti_08.png)
- [ ] Particle manager utility created with emitter configurations
- [ ] Fire emitter: Orange/red particles, upward movement, fade out, 1-2s lifespan
- [ ] Ice emitter: Blue/white particles, floating/falling, sparkle effect, 1-3s lifespan
- [ ] Explosion emitter: Multi-color burst, radial spread, quick fade, 0.5-1s lifespan
- [ ] Confetti emitter: Colorful streamers, gravity affected, tumbling rotation, 2-4s lifespan
- [ ] Particle pools for performance (reuse particles)
- [ ] Emitters start/stop correctly
- [ ] Performance: 60 FPS desktop with multiple emitters active
- [ ] Tests verify particle systems initialize and emit correctly
- [ ] Visual test confirms particle appearances match design intent

**Notes:**
- Particle textures in `frontend/public/assets/particles/`
- Design intent in `CARD_DESIGN_HANDOFF.md` lines 102-110 (fire/frozen context)
- Use Phaser's built-in particle system
- Consider WebGL for better particle performance
- Test on mobile devices (may need reduced particle counts)

**Files to Create/Modify:**
- `frontend/src/game/utils/particleManager.ts` (NEW) - Particle system manager
- `frontend/src/game/constants/particleConfig.ts` (NEW) - Emitter configurations
- `frontend/src/game/scenes/PreloadScene.ts` - Load particle textures
- `frontend/src/game/utils/particleManager.test.ts` (NEW) - Particle system tests

---

### [TASK-W4-008] Implement Winner Celebration Particle Effects
**Agent:** Frontend
**Priority:** P1 (high)
**Size:** M (2-3 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-W4-007]
**Blocked By:** None

**Description:**
Implement celebration particle effects when a player wins a round or game. Use confetti and explosion particles with coordinated timing and positioning.

**Acceptance Criteria:**
- [ ] Round win: Confetti burst above winner's card (500-1000 particles), 2s duration
- [ ] Game win: Multiple explosion bursts + sustained confetti rain (1500+ particles), 5s duration
- [ ] Particles emit from correct positions (winner's card location, screen center for game win)
- [ ] Color scheme matches winner's card suit or general celebration
- [ ] Particle animations layer correctly (behind/above cards as appropriate)
- [ ] Performance maintained during particle burst (may need particle count adjustment on mobile)
- [ ] Sound hook: "round_win" or "game_victory" sound plays with particles
- [ ] Particles clean up properly after effect ends
- [ ] Tests verify particle emissions trigger on win events
- [ ] Visual test confirms celebration effect feels impactful

**Notes:**
- Particle textures from TASK-W4-007
- Existing particle system may be in place (see TASK-030 completion)
- Coordinate with game state events (roundWon, gameEnded)
- Balance visual impact with performance

**Files to Create/Modify:**
- `frontend/src/game/utils/celebrationEffects.ts` (NEW) - Celebration particle logic
- `frontend/src/game/scenes/GameScene.ts` - Trigger celebrations on win events
- `frontend/src/game/utils/celebrationEffects.test.ts` (NEW) - Celebration tests

---

### [TASK-W4-009] Implement Fire and Freeze Particle Effects for Card States
**Agent:** Frontend
**Priority:** P1 (high)
**Size:** S (1-2 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-W4-007], [TASK-W4-003]
**Blocked By:** None

**Description:**
Add fire particle effects around cards in Fire state (on fire streak) and ice particle effects around cards in Frozen state (freeze counter active).

**Acceptance Criteria:**
- [ ] Fire state: Fire particles emit around card edges (circular pattern), continuous while in fire state
- [ ] Fire particles: Orange/red, upward drift, 50-100 particles visible at once
- [ ] Frozen state: Ice particles emit from card (sparkle/frost effect), continuous while frozen
- [ ] Frozen particles: Blue/white, floating/falling, 30-60 particles visible at once
- [ ] Particle emissions follow card movement (attached to card sprite)
- [ ] Particles start when state activates, stop when state ends
- [ ] Performance: No FPS drop with 4 cards simultaneously in special states
- [ ] Sound hooks: "fire_streak" or "freeze_effect" sounds play when state activates
- [ ] Tests verify particles attach to correct cards and states
- [ ] Visual test confirms effects enhance fire/frozen visual identity

**Notes:**
- Integrates with TASK-W4-003 fire/frozen states
- Particles should enhance but not overwhelm card visibility
- Consider particle count limits on mobile
- Fire/frozen states driven by game logic (win streaks, 6 of spades)

**Files to Create/Modify:**
- `frontend/src/game/sprites/CardSprite.ts` - Attach particle emitters to cards
- `frontend/src/game/utils/cardEffects.ts` - Particle attachment logic
- `frontend/src/game/sprites/CardSprite.particles.test.ts` (NEW) - Particle attachment tests

---

## Phase 4: Avatar System Integration (P1)

### [TASK-W4-010] Implement Avatar Component and Selection
**Agent:** Frontend
**Priority:** P1 (high)
**Size:** M (2-3 hrs)
**Status:** ⬜ TODO
**Dependencies:** None
**Blocked By:** None

**Description:**
Create Avatar React component that displays player avatars at multiple sizes, integrates with player profiles, and supports avatar selection in settings.

**Acceptance Criteria:**
- [ ] Avatar component supports 3 sizes:
  - Small: 64px (game table, leaderboard)
  - Medium: 128px (lobby, player slots)
  - Large: 256px (profile, settings, avatar selection)
- [ ] All 5 avatars loaded and available:
  - avatar_01.png (Confident Leader)
  - avatar_02.png (Cool Strategist)
  - avatar_03.png (Playful Challenger)
  - avatar_04.png (Fierce Competitor)
  - avatar_05.png (Wise Veteran)
- [ ] Avatar displays in circular frame with gold border (3px solid #FFD700)
- [ ] Arcade glow effect: `box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3), 0 0 20px rgba(255, 215, 0, 0.4)`
- [ ] Hover effect: Scale 1.05, enhanced glow
- [ ] Selected state: Pulsing animation, border color bright gold
- [ ] Avatar selection UI in Settings page (grid of 5 avatars)
- [ ] Selected avatar persists in playerStore
- [ ] Avatar displays correctly in PlayerProfile component
- [ ] Avatar displays correctly in Lobby player slots
- [ ] Tests verify avatar rendering, selection, and persistence
- [ ] Accessibility: Alt text, keyboard navigation for selection

**Notes:**
- Design specs in `AVATAR_DESIGN_HANDOFF.md` lines 657-758
- Avatar files in `frontend/public/assets/avatars/`
- Integration with existing PlayerProfile component (TASK-027)
- Update Lobby PlayerSlot components to show avatars

**Files to Create/Modify:**
- `frontend/src/components/shared/Avatar.tsx` (NEW) - Avatar component
- `frontend/src/components/shared/Avatar.test.tsx` (NEW) - Avatar tests
- `frontend/src/pages/SettingsPage.tsx` - Add avatar selection UI
- `frontend/src/components/home/PlayerProfile.tsx` - Use Avatar component
- `frontend/src/components/lobby/PlayerSlot.tsx` - Use Avatar component
- `frontend/src/store/playerStore.ts` - Add selectedAvatar state

---

## Phase 5: Surface Background System (P2)

### [TASK-W4-011] Implement Surface Background Loading and Switching
**Agent:** Frontend
**Priority:** P2 (medium)
**Size:** M (3-4 hrs)
**Status:** ⬜ TODO
**Dependencies:** None
**Blocked By:** None

**Description:**
Load all 4 surface background themes, implement theme switching in Settings, and apply selected surface to game scene with smooth transitions.

**Acceptance Criteria:**
- [ ] All 4 surfaces loaded in PreloadScene:
  - surface_afro_heritage.png (default)
  - surface_neon_arcade.png
  - surface_royal_gold.png
  - surface_ocean_breeze.png
- [ ] Surface selection UI in Settings page (grid preview of 4 themes)
- [ ] Selected surface persists in uiStore or playerStore
- [ ] GameScene applies correct surface background on load
- [ ] Surface scales to fit screen (cover mode, maintain aspect ratio)
- [ ] Surface at depth -1 (behind all game elements)
- [ ] Smooth fade transition (300ms) when changing surface mid-game (optional feature)
- [ ] Default surface: Afro-Heritage
- [ ] Surface visible on all screen sizes (responsive)
- [ ] Tests verify surface loading, selection, and application
- [ ] Visual test confirms all 4 surfaces display correctly

**Notes:**
- Design specs in `SURFACE_DESIGNS.md` full document
- Surface files in `frontend/public/assets/surfaces/`
- Integration guide in `SURFACE_DESIGNS.md` lines 231-321
- Responsive scaling considerations in lines 216-229

**Files to Create/Modify:**
- `frontend/src/game/scenes/PreloadScene.ts` - Load surface textures
- `frontend/src/game/scenes/GameScene.ts` - Apply surface background
- `frontend/src/pages/SettingsPage.tsx` - Add surface selection UI
- `frontend/src/store/uiStore.ts` - Add selectedSurface state
- `frontend/src/game/scenes/GameScene.surface.test.ts` (NEW) - Surface tests

---

## Phase 6: Polish and Optimization (P2)

### [TASK-W4-012] Optimize Rendering Performance with Design Assets
**Agent:** Frontend
**Priority:** P2 (medium)
**Size:** M (2-3 hrs)
**Status:** ⬜ TODO
**Dependencies:** All previous tasks
**Blocked By:** None

**Description:**
Profile and optimize rendering performance with all design assets integrated. Ensure 60 FPS desktop and 40 FPS mobile targets are met with cards, particles, animations, and surfaces active.

**Acceptance Criteria:**
- [ ] Performance profiling conducted with all assets active
- [ ] Desktop (1920x1080): Consistent 58-62 FPS during gameplay
- [ ] Mobile (375x667): Consistent 38-42 FPS during gameplay
- [ ] Tablet (1024x768): Consistent 48-52 FPS during gameplay
- [ ] Particle count optimized per device (higher on desktop, reduced on mobile)
- [ ] Texture atlases used for cards and particles (reduce draw calls)
- [ ] Object pooling for frequently created/destroyed objects (cards, particles)
- [ ] GPU-accelerated transforms used for animations (translateX/Y, scale, rotate)
- [ ] Heavy filters (grayscale, blur) optimized or replaced with lighter alternatives on mobile
- [ ] Memory leaks checked (20+ rounds with no memory growth)
- [ ] Load time: < 2 seconds for all assets on 4G connection
- [ ] Performance report document updated with results
- [ ] Tests include performance benchmarks

**Notes:**
- Existing performance report: `frontend/PERFORMANCE_REPORT.md`
- Use Chrome DevTools Performance profiler
- Consider WebGL renderer over Canvas for better particle performance
- May need level-of-detail adjustments on mobile (fewer particles, simpler effects)

**Files to Create/Modify:**
- `frontend/PERFORMANCE_REPORT.md` - Update with asset integration results
- `frontend/src/game/config.ts` - Performance optimization flags
- `frontend/src/game/utils/performanceOptimizations.ts` (NEW) - Optimization utilities
- `frontend/src/game/config.performance.test.ts` (NEW) - Performance tests

---

### [TASK-W4-013] Implement Design Consistency Validation
**Agent:** Frontend
**Priority:** P2 (medium)
**Size:** S (1-2 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-W4-001], [TASK-W4-002], [TASK-W4-004]
**Blocked By:** None

**Description:**
Create visual regression tests and design consistency checks to ensure all implemented visuals match designer specifications exactly.

**Acceptance Criteria:**
- [ ] Visual regression test suite created (using Playwright or similar)
- [ ] Snapshot tests for all card states (default, hover, active, fire, frozen, disabled)
- [ ] Snapshot tests for all 4 suit color schemes
- [ ] Snapshot tests for all 4 surface backgrounds
- [ ] Snapshot tests for avatar displays (small, medium, large sizes)
- [ ] Color value validation tests (verify exact hex codes)
- [ ] Typography validation tests (verify font families, sizes, weights)
- [ ] Animation timing validation tests (verify durations and easing functions)
- [ ] Design consistency report generated
- [ ] All tests passing with zero visual regressions

**Notes:**
- Use Playwright for visual regression testing
- Compare against design mockups or approved baseline screenshots
- Automate in CI pipeline for continuous validation
- Document any intentional deviations from design specs

**Files to Create/Modify:**
- `frontend/src/game/visual-regression/` (NEW DIR) - Visual regression test suite
- `frontend/src/game/visual-regression/cardStates.spec.ts` (NEW)
- `frontend/src/game/visual-regression/colors.spec.ts` (NEW)
- `frontend/src/game/visual-regression/typography.spec.ts` (NEW)
- `frontend/src/game/visual-regression/surfaces.spec.ts` (NEW)
- `frontend/DESIGN_CONSISTENCY_REPORT.md` (NEW) - Consistency validation results

---

### [TASK-W4-014] Implement Accessibility Enhancements for Visual Assets
**Agent:** Frontend
**Priority:** P2 (medium)
**Size:** M (2-3 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-W4-010], [TASK-W4-011]
**Blocked By:** None

**Description:**
Ensure all visual assets meet accessibility standards: proper alt text, keyboard navigation, reduced motion support, colorblind-friendly considerations.

**Acceptance Criteria:**
- [ ] All avatar images have descriptive alt text
- [ ] Avatar selection navigable via keyboard (Tab, Enter, Arrow keys)
- [ ] Surface selection navigable via keyboard
- [ ] Reduced motion preference respected: `prefers-reduced-motion` CSS query
  - Animations reduced/disabled when preference detected
  - Particles reduced or disabled
  - Transitions simplified
- [ ] Color contrast verified for all text on surfaces (WCAG AA: 4.5:1 minimum)
- [ ] Colorblind simulation tested (Deuteranopia, Protanopia, Tritanopia filters)
- [ ] Cards distinguishable by shape/pattern, not just color
- [ ] Screen reader announcements for important game events (round won, your turn)
- [ ] Focus indicators visible on interactive elements
- [ ] Tests verify accessibility features
- [ ] Accessibility audit report created

**Notes:**
- Surface contrast already validated (see `SURFACE_DESIGNS.md` lines 393-412)
- Framer Motion respects reduced motion by default (TASK-031)
- Consider card pattern/symbol clarity for colorblind users
- Use ARIA live regions for game state announcements

**Files to Create/Modify:**
- `frontend/src/game/utils/accessibilityHelpers.ts` (NEW) - Accessibility utilities
- `frontend/src/components/shared/Avatar.tsx` - Add keyboard navigation
- `frontend/src/pages/SettingsPage.tsx` - Add keyboard navigation for selections
- `frontend/src/game/config.ts` - Add reduced motion flag
- `frontend/ACCESSIBILITY_AUDIT.md` (NEW) - Accessibility audit report
- `frontend/src/game/utils/accessibilityHelpers.test.ts` (NEW) - Accessibility tests

---

## Task Dependencies Diagram

```
Phase 1: Card Visual States & Typography (P0)
├─ [W4-001] Typography System (no deps)
├─ [W4-002] Card Visual States (depends: W4-001)
├─ [W4-003] Fire & Frozen States (depends: W4-002)
└─ [W4-004] Color Palettes (depends: W4-001)

Phase 2: Card Animations (P1)
├─ [W4-005] Deal Animation (depends: W4-002)
└─ [W4-006] Play/Flip/Win/Lose/Collect (depends: W4-005)

Phase 3: Particle Effects (P1)
├─ [W4-007] Particle Textures (no deps)
├─ [W4-008] Winner Celebrations (depends: W4-007)
└─ [W4-009] Fire & Freeze Particles (depends: W4-007, W4-003)

Phase 4: Avatar System (P1)
└─ [W4-010] Avatar Component (no deps)

Phase 5: Surface Backgrounds (P2)
└─ [W4-011] Surface System (no deps)

Phase 6: Polish (P2)
├─ [W4-012] Performance Optimization (depends: ALL previous)
├─ [W4-013] Design Consistency (depends: W4-001, W4-002, W4-004)
└─ [W4-014] Accessibility (depends: W4-010, W4-011)
```

---

## Suggested Execution Order

**Day 1 (8 hours):**
1. [W4-001] Typography System (2-4 hrs) - P0
2. [W4-004] Color Palettes (1-2 hrs) - P0
3. [W4-002] Card Visual States (3-4 hrs) - P0

**Day 2 (8 hours):**
4. [W4-003] Fire & Frozen States (3-4 hrs) - P0
5. [W4-007] Particle Textures (3-4 hrs) - P1

**Day 3 (8 hours):**
6. [W4-005] Deal Animation (2-3 hrs) - P1
7. [W4-006] Play/Flip/Win/Lose/Collect (4-6 hrs) - P1

**Day 4 (8 hours):**
8. [W4-008] Winner Celebrations (2-3 hrs) - P1
9. [W4-009] Fire & Freeze Particles (1-2 hrs) - P1
10. [W4-010] Avatar Component (2-3 hrs) - P1
11. [W4-011] Surface System (3-4 hrs) - P2

**Day 5 (8 hours):**
12. [W4-012] Performance Optimization (2-3 hrs) - P2
13. [W4-013] Design Consistency (1-2 hrs) - P2
14. [W4-014] Accessibility (2-3 hrs) - P2

**Total Estimated Time:** 28-44 hours (3.5-5.5 days)

---

## Testing Strategy

### Unit Tests
- All utility functions (color helpers, animation helpers, particle manager)
- Component rendering (Avatar, surface selection UI)
- Store integration (selected avatar, selected surface)
- Typography configuration validation
- Color palette validation

### Integration Tests
- Card visual state transitions
- Animation sequencing (deal → play → flip → win/lose → collect)
- Particle system with game events
- Avatar selection flow
- Surface switching flow

### Visual Regression Tests
- Card states snapshots (all 4 suits × 6 states = 24 snapshots)
- Animation frame captures (key frames of each animation)
- Surface backgrounds (4 snapshots)
- Avatar displays (5 avatars × 3 sizes = 15 snapshots)

### Performance Tests
- FPS benchmarks during heavy animation/particle load
- Memory leak tests (20+ round cycles)
- Load time tests (all assets loading)

### Accessibility Tests
- Keyboard navigation flows
- Reduced motion compliance
- Color contrast validation
- Colorblind simulation

---

## Success Criteria

**Visual Fidelity:**
- [ ] All card visual states match design handoff pixel-perfect
- [ ] Typography exactly matches specifications (fonts, sizes, weights, shadows)
- [ ] Color palettes match hex codes exactly (no approximations)
- [ ] Animations match timing, easing, and property values from specs
- [ ] Particle effects match design intent (type, color, behavior)
- [ ] Avatars display correctly at all sizes with proper styling
- [ ] Surfaces display correctly and scale responsively

**Performance:**
- [ ] Desktop: 58-62 FPS sustained during gameplay
- [ ] Mobile: 38-42 FPS sustained during gameplay
- [ ] Tablet: 48-52 FPS sustained during gameplay
- [ ] Load time: < 2 seconds on 4G connection
- [ ] Zero memory leaks after 20+ rounds

**Code Quality:**
- [ ] All new code passes TypeScript strict mode
- [ ] Test coverage: 85%+ for new code
- [ ] Zero ESLint errors or warnings
- [ ] All tests passing (unit, integration, visual, performance)
- [ ] Code reviewed and approved

**Accessibility:**
- [ ] WCAG AA compliance for contrast ratios
- [ ] Keyboard navigation functional for all interactive elements
- [ ] Reduced motion preference respected
- [ ] Screen reader announcements for game events
- [ ] Colorblind-friendly design validated

**Documentation:**
- [ ] All new components/utilities documented with JSDoc comments
- [ ] Integration guides updated
- [ ] Performance report updated with asset integration results
- [ ] Design consistency report created
- [ ] Accessibility audit report created

---

## Notes for Frontend Engineer

### Design Philosophy
The designer's vision is "Afro-Futurism Meets Arcade Energy" - bold, vibrant, culturally authentic. Every visual detail matters. Aim for pixel-perfect implementation of the specifications.

### Key Design Documents
1. **CARD_DESIGN_HANDOFF.md** - Your primary reference for all card-related visuals
2. **AVATAR_DESIGN_HANDOFF.md** - Complete avatar system specifications
3. **SURFACE_DESIGNS.md** - Surface background themes and integration guide

### Performance Considerations
- Use GPU-accelerated transforms (translateX/Y, scale, rotate) for animations
- Implement texture atlases for cards and particles to reduce draw calls
- Use object pooling for particles and frequently created/destroyed objects
- Test on actual mobile devices, not just browser emulation
- Profile regularly with Chrome DevTools Performance tab

### Testing Approach
- Write tests first (TDD) for complex logic (animation timing, color helpers)
- Use visual regression testing to catch unintended visual changes
- Test on multiple browsers (Chrome, Safari, Firefox, Edge)
- Test on multiple devices (desktop, tablet, mobile)
- Validate accessibility with real assistive technologies when possible

### Communication
- If design specs are ambiguous or conflicting, ask designer for clarification
- If performance targets can't be met, communicate early with trade-off options
- Document any intentional deviations from design specs with rationale
- Update PROJECT_STATE.md as tasks complete

### Asset Locations
- Cards: `/Users/nana/go/src/github.com/npeprah/sparui/frontend/public/assets/cards/{suit}/`
- Particles: `/Users/nana/go/src/github.com/npeprah/sparui/frontend/public/assets/particles/`
- Avatars: `/Users/nana/go/src/github.com/npeprah/sparui/frontend/public/assets/avatars/`
- Surfaces: `/Users/nana/go/src/github.com/npeprah/sparui/frontend/public/assets/surfaces/`
- Sounds: `/Users/nana/go/src/github.com/npeprah/sparui/frontend/public/assets/sounds/sfx/`

---

## Risk Mitigation

**Risk: Performance targets not met with all effects**
- Mitigation: Implement progressive enhancement (reduce particles on mobile, simplify animations)
- Fallback: Device detection with quality presets (high/medium/low)

**Risk: Visual regressions during integration**
- Mitigation: Visual regression test suite catches issues early
- Fallback: Baseline screenshots approved by designer

**Risk: Typography fonts not loading**
- Mitigation: Font preloading, fallback fonts specified
- Fallback: System fonts that approximate design intent

**Risk: Accessibility conflicts with design**
- Mitigation: Early accessibility review, designer collaboration on solutions
- Fallback: Accessibility toggle for users needing accommodations

---

## Definition of Done

A task is considered DONE when:
1. All acceptance criteria met and verified
2. All tests written and passing (unit, integration, visual, performance as applicable)
3. Code passes TypeScript strict mode with zero errors
4. Code passes ESLint with zero errors or warnings
5. Visual regression tests passing (for visual tasks)
6. Performance benchmarks met (for animation/particle tasks)
7. Code reviewed (self-review at minimum)
8. Documentation updated (JSDoc comments, integration guides)
9. Task marked complete in PROJECT_STATE.md

---

## Questions or Blockers?

If you encounter any issues:
1. Check design handoff documents for clarification
2. Review existing code for similar patterns
3. Consult PROJECT_STATE.md for context
4. If truly blocked, escalate to tech-lead-pm

---

**Ready to Begin!**

All design assets are complete and waiting. The designer has delivered pixel-perfect specifications. Your mission is to bring this vision to life with production-quality code.

Start with Phase 1 (Typography & Card States) to establish the visual foundation, then build up through animations, particles, avatars, and surfaces. Test continuously. Profile performance. Validate accessibility.

Let's build something exceptional! 🚀
