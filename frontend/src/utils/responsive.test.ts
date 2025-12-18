import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { BREAKPOINTS, getDeviceType, isTouchDevice, getViewportDimensions } from './responsive'

describe('responsive utilities', () => {
  describe('BREAKPOINTS', () => {
    it('should have correct breakpoint values', () => {
      expect(BREAKPOINTS.mobile).toBe(767)
      expect(BREAKPOINTS.tablet).toBe(1023)
      expect(BREAKPOINTS.desktop).toBe(1024)
    })
  })

  describe('getDeviceType', () => {
    let originalInnerWidth: number

    beforeEach(() => {
      originalInnerWidth = window.innerWidth
    })

    afterEach(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: originalInnerWidth,
      })
    })

    it('should return "mobile" for width < 768px', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      expect(getDeviceType()).toBe('mobile')
    })

    it('should return "mobile" for width at 767px', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 767,
      })

      expect(getDeviceType()).toBe('mobile')
    })

    it('should return "tablet" for width 768px', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      })

      expect(getDeviceType()).toBe('tablet')
    })

    it('should return "tablet" for width at 1023px', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1023,
      })

      expect(getDeviceType()).toBe('tablet')
    })

    it('should return "desktop" for width >= 1024px', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      })

      expect(getDeviceType()).toBe('desktop')
    })

    it('should return "desktop" for large screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      })

      expect(getDeviceType()).toBe('desktop')
    })
  })

  describe('getViewportDimensions', () => {
    let originalInnerWidth: number
    let originalInnerHeight: number

    beforeEach(() => {
      originalInnerWidth = window.innerWidth
      originalInnerHeight = window.innerHeight
    })

    afterEach(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: originalInnerWidth,
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: originalInnerHeight,
      })
    })

    it('should return current viewport dimensions', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 768,
      })

      const dimensions = getViewportDimensions()

      expect(dimensions.width).toBe(1024)
      expect(dimensions.height).toBe(768)
    })

    it('should calculate aspect ratio', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 1080,
      })

      const dimensions = getViewportDimensions()

      expect(dimensions.aspectRatio).toBeCloseTo(1.778, 2)
    })

    it('should determine if portrait', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      })

      const dimensions = getViewportDimensions()

      expect(dimensions.isPortrait).toBe(true)
      expect(dimensions.isLandscape).toBe(false)
    })

    it('should determine if landscape', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 667,
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 375,
      })

      const dimensions = getViewportDimensions()

      expect(dimensions.isPortrait).toBe(false)
      expect(dimensions.isLandscape).toBe(true)
    })
  })

  describe('isTouchDevice', () => {
    it('should detect touch support', () => {
      // Note: In jsdom, this will typically return false
      const result = isTouchDevice()

      expect(typeof result).toBe('boolean')
    })
  })
})
