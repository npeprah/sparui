import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useOrientation } from './useOrientation'

describe('useOrientation', () => {
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

  it('should detect portrait orientation (height > width)', () => {
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

    const { result } = renderHook(() => useOrientation())

    expect(result.current.orientation).toBe('portrait')
    expect(result.current.isPortrait).toBe(true)
    expect(result.current.isLandscape).toBe(false)
  })

  it('should detect landscape orientation (width > height)', () => {
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

    const { result } = renderHook(() => useOrientation())

    expect(result.current.orientation).toBe('landscape')
    expect(result.current.isPortrait).toBe(false)
    expect(result.current.isLandscape).toBe(true)
  })

  it('should treat square screens as portrait', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500,
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 500,
    })

    const { result } = renderHook(() => useOrientation())

    expect(result.current.orientation).toBe('portrait')
    expect(result.current.isPortrait).toBe(true)
    expect(result.current.isLandscape).toBe(false)
  })

  it('should update orientation on resize', () => {
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

    const { result } = renderHook(() => useOrientation())

    expect(result.current.orientation).toBe('portrait')

    // Simulate rotation to landscape
    act(() => {
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

      window.dispatchEvent(new Event('resize'))
    })

    expect(result.current.orientation).toBe('landscape')
  })

  it('should clean up event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

    const { unmount } = renderHook(() => useOrientation())

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))

    removeEventListenerSpy.mockRestore()
  })
})
