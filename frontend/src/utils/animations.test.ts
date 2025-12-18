import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  spring,
  fast,
  medium,
  slow,
  pageVariants,
  buttonVariants,
  modalVariants,
  cardVariants,
  staggerContainer,
  staggerItem,
  pulseVariants,
  playerJoinVariants,
  toastVariants,
  copySuccessVariants,
  copiedTextVariants,
  getPrefersReducedMotion,
  getTransition,
  getVariants,
  shouldReduceAnimations,
  getAnimationConfig,
  ANIMATION_CONFIG_NORMAL,
  ANIMATION_CONFIG_REDUCED,
} from './animations'

describe('Animation Utilities', () => {
  describe('Transition Presets', () => {
    it('should define spring transition with correct properties', () => {
      expect(spring).toEqual({
        type: 'spring',
        stiffness: 300,
        damping: 20,
      })
    })

    it('should define fast transition with 0.2s duration', () => {
      expect(fast).toEqual({
        duration: 0.2,
        ease: 'easeOut',
      })
    })

    it('should define medium transition with 0.3s duration', () => {
      expect(medium).toEqual({
        duration: 0.3,
        ease: 'easeInOut',
      })
    })

    it('should define slow transition with 0.4s duration', () => {
      expect(slow).toEqual({
        duration: 0.4,
        ease: 'easeInOut',
      })
    })
  })

  describe('Page Variants', () => {
    it('should have initial state with opacity 0 and y offset', () => {
      expect(pageVariants.initial).toEqual({
        opacity: 0,
        y: 20,
      })
    })

    it('should have animate state with opacity 1 and y 0', () => {
      expect(pageVariants.animate).toMatchObject({
        opacity: 1,
        y: 0,
      })
    })

    it('should have exit state with negative y offset', () => {
      expect(pageVariants.exit).toMatchObject({
        opacity: 0,
        y: -20,
      })
    })
  })

  describe('Button Variants', () => {
    it('should scale up on hover', () => {
      expect(buttonVariants.hover).toMatchObject({
        scale: 1.05,
      })
    })

    it('should scale down on tap', () => {
      expect(buttonVariants.tap).toMatchObject({
        scale: 0.95,
      })
    })
  })

  describe('Modal Variants', () => {
    it('should have hidden state with opacity 0 and scale 0.9', () => {
      expect(modalVariants.hidden).toEqual({
        opacity: 0,
        scale: 0.9,
      })
    })

    it('should have visible state with opacity 1 and scale 1', () => {
      expect(modalVariants.visible).toMatchObject({
        opacity: 1,
        scale: 1,
      })
    })
  })

  describe('Card Variants', () => {
    it('should have hidden state with rotation', () => {
      expect(cardVariants.hidden).toMatchObject({
        opacity: 0,
        y: 50,
        rotateZ: -10,
      })
    })

    it('should have hover state with lift effect', () => {
      expect(cardVariants.hover).toMatchObject({
        y: -8,
        scale: 1.02,
      })
    })
  })

  describe('Stagger Animations', () => {
    it('should define stagger container with staggerChildren', () => {
      expect(staggerContainer.visible).toMatchObject({
        opacity: 1,
        transition: {
          staggerChildren: 0.1,
          delayChildren: 0.1,
        },
      })
    })

    it('should define stagger item with fade and slide', () => {
      expect(staggerItem.hidden).toEqual({
        opacity: 0,
        y: 20,
      })
      expect(staggerItem.visible).toMatchObject({
        opacity: 1,
        y: 0,
      })
    })
  })

  describe('Pulse Variants', () => {
    it('should define pulse animation with repeat', () => {
      expect(pulseVariants.pulse).toMatchObject({
        scale: [1, 1.05, 1],
        transition: {
          duration: 0.5,
          repeat: Infinity,
          repeatDelay: 2,
        },
      })
    })
  })

  describe('Player Join Variants', () => {
    it('should slide in from right', () => {
      expect(playerJoinVariants.hidden).toMatchObject({
        opacity: 0,
        x: 100,
      })
    })

    it('should slide out to left on exit', () => {
      expect(playerJoinVariants.exit).toMatchObject({
        opacity: 0,
        x: -100,
      })
    })
  })

  describe('Toast Variants', () => {
    it('should slide from top with bounce', () => {
      expect(toastVariants.hidden).toMatchObject({
        opacity: 0,
        y: -50,
        scale: 0.9,
      })
    })

    it('should use spring transition', () => {
      expect(toastVariants.visible).toMatchObject({
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
          type: 'spring',
        },
      })
    })
  })

  describe('Copy Feedback Variants', () => {
    it('should define scale pulse for copy success', () => {
      expect(copySuccessVariants.pulse).toMatchObject({
        scale: [1, 1.1, 1],
        transition: { duration: 0.3 },
      })
    })

    it('should define slide up animation for copied text', () => {
      expect(copiedTextVariants.hidden).toMatchObject({
        opacity: 0,
        y: 10,
      })
      expect(copiedTextVariants.exit).toMatchObject({
        opacity: 0,
        y: -10,
      })
    })
  })

  describe('Reduced Motion Support', () => {
    let matchMediaMock: any

    beforeEach(() => {
      matchMediaMock = vi.fn()
      window.matchMedia = matchMediaMock
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('should detect when user prefers reduced motion', () => {
      matchMediaMock.mockReturnValue({ matches: true })
      expect(getPrefersReducedMotion()).toBe(true)
    })

    it('should return false when user does not prefer reduced motion', () => {
      matchMediaMock.mockReturnValue({ matches: false })
      expect(getPrefersReducedMotion()).toBe(false)
    })

    it('should return instant transition when reduced motion is preferred', () => {
      matchMediaMock.mockReturnValue({ matches: true })
      const result = getTransition(fast)
      expect(result).toEqual({ duration: 0.01 })
    })

    it('should return original transition when reduced motion is not preferred', () => {
      matchMediaMock.mockReturnValue({ matches: false })
      const result = getTransition(fast)
      expect(result).toEqual(fast)
    })

    it('should return simplified variants when reduced motion is preferred', () => {
      matchMediaMock.mockReturnValue({ matches: true })
      const result = getVariants(buttonVariants)
      expect(result.hover).toMatchObject({ transition: { duration: 0.01 } })
      expect(result.tap).toMatchObject({ transition: { duration: 0.01 } })
    })

    it('should return original variants when reduced motion is not preferred', () => {
      matchMediaMock.mockReturnValue({ matches: false })
      const result = getVariants(buttonVariants)
      expect(result).toEqual(buttonVariants)
    })
  })

  describe('Performance Utilities', () => {
    let matchMediaMock: any

    beforeEach(() => {
      matchMediaMock = vi.fn()
      window.matchMedia = matchMediaMock
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('should reduce animations when prefers-reduced-motion is set', () => {
      matchMediaMock.mockReturnValue({ matches: true })
      expect(shouldReduceAnimations()).toBe(true)
    })

    it('should not reduce animations by default', () => {
      matchMediaMock.mockReturnValue({ matches: false })
      expect(shouldReduceAnimations()).toBe(false)
    })

    it('should return reduced config when animations should be reduced', () => {
      matchMediaMock.mockReturnValue({ matches: true })
      const config = getAnimationConfig()
      expect(config).toEqual(ANIMATION_CONFIG_REDUCED)
    })

    it('should return normal config when animations are enabled', () => {
      matchMediaMock.mockReturnValue({ matches: false })
      const config = getAnimationConfig()
      expect(config).toEqual(ANIMATION_CONFIG_NORMAL)
    })
  })

  describe('Animation Config Presets', () => {
    it('should define normal animation config', () => {
      expect(ANIMATION_CONFIG_NORMAL).toEqual({
        useSpring: true,
        stagger: 0.1,
        duration: 0.3,
      })
    })

    it('should define reduced animation config', () => {
      expect(ANIMATION_CONFIG_REDUCED).toEqual({
        useSpring: false,
        stagger: 0,
        duration: 0.01,
      })
    })
  })
})
