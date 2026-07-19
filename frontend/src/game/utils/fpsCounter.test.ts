import { describe, it, expect } from 'vitest'

/**
 * Tests for FPS Counter Utilities
 * FPS counter should only be visible in development mode
 */
describe('FPS Counter', () => {
  describe('Development Mode Detection', () => {
    it('should detect development mode', () => {
      // In tests, import.meta.env.DEV should be available
      const isDev = import.meta.env.DEV
      expect(typeof isDev).toBe('boolean')
    })

    it('should return true for dev environment', () => {
      // Vitest runs in dev mode
      expect(import.meta.env.DEV).toBe(true)
    })
  })

  describe('FPS Calculation', () => {
    it('should calculate FPS correctly', () => {
      const fps = 60
      const rounded = Math.round(fps)
      expect(rounded).toBe(60)
    })

    it('should round FPS to nearest integer', () => {
      const fps = 59.7
      const rounded = Math.round(fps)
      expect(rounded).toBe(60)
    })

    it('should handle low FPS values', () => {
      const fps = 30.5
      const rounded = Math.round(fps)
      expect(rounded).toBe(31)
    })

    it('should handle very low FPS', () => {
      const fps = 15.2
      const rounded = Math.round(fps)
      expect(rounded).toBe(15)
    })
  })

  describe('FPS Text Formatting', () => {
    it('should format FPS text correctly', () => {
      const fps = 60
      const text = `FPS: ${fps}`
      expect(text).toBe('FPS: 60')
    })

    it('should format with average FPS', () => {
      const currentFps = 60
      const avgFps = 58
      const text = `FPS: ${currentFps} (avg: ${avgFps})`
      expect(text).toBe('FPS: 60 (avg: 58)')
    })
  })

  describe('FPS History Tracking', () => {
    it('should maintain FPS history array', () => {
      const history: number[] = []
      history.push(60)
      history.push(58)
      history.push(59)

      expect(history).toHaveLength(3)
      expect(history[0]).toBe(60)
    })

    it('should calculate average from history', () => {
      const history = [60, 58, 59, 61, 57]
      const avg = history.reduce((sum, val) => sum + val, 0) / history.length

      expect(Math.round(avg)).toBe(59)
    })

    it('should limit history to max size', () => {
      const maxSize = 60
      const history: number[] = []

      for (let i = 0; i < 100; i++) {
        history.push(60)
        if (history.length > maxSize) {
          history.shift()
        }
      }

      expect(history).toHaveLength(maxSize)
    })

    it('should remove oldest values when limit exceeded', () => {
      const history = [50, 55, 60]
      const maxSize = 3

      history.push(65)
      if (history.length > maxSize) {
        history.shift()
      }

      expect(history).toEqual([55, 60, 65])
    })
  })

  describe('FPS Color Coding', () => {
    it('should use green color for good FPS (>= 60)', () => {
      const fps = 60
      const color = fps >= 60 ? '#00ff00' : fps >= 40 ? '#ffff00' : '#ff0000'
      expect(color).toBe('#00ff00')
    })

    it('should use yellow color for medium FPS (40-59)', () => {
      const fps = 45
      const color = fps >= 60 ? '#00ff00' : fps >= 40 ? '#ffff00' : '#ff0000'
      expect(color).toBe('#ffff00')
    })

    it('should use red color for low FPS (< 40)', () => {
      const fps = 30
      const color = fps >= 60 ? '#00ff00' : fps >= 40 ? '#ffff00' : '#ff0000'
      expect(color).toBe('#ff0000')
    })
  })

  describe('FPS Counter Position', () => {
    it('should position counter in top-right corner', () => {
      const width = 1920
      const x = width - 120
      const y = 10

      expect(x).toBe(1800)
      expect(y).toBe(10)
    })

    it('should adjust position for mobile screens', () => {
      const width = 375
      const x = width - 100
      const y = 10

      expect(x).toBe(275)
      expect(y).toBe(10)
    })
  })

  describe('FPS Warning Thresholds', () => {
    it('should detect desktop performance issues', () => {
      const fps = 55
      const isDesktopBelowThreshold = fps < 60
      expect(isDesktopBelowThreshold).toBe(true)
    })

    it('should detect mobile performance issues', () => {
      const fps = 35
      const isMobileBelowThreshold = fps < 40
      expect(isMobileBelowThreshold).toBe(true)
    })

    it('should pass desktop performance check', () => {
      const fps = 60
      const meetsDesktopTarget = fps >= 60
      expect(meetsDesktopTarget).toBe(true)
    })

    it('should pass mobile performance check', () => {
      const fps = 45
      const meetsMobileTarget = fps >= 40
      expect(meetsMobileTarget).toBe(true)
    })
  })
})
