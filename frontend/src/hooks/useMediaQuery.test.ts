import { renderHook } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useMediaQuery } from './useMediaQuery'

describe('useMediaQuery', () => {
  let matchMediaMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // Mock window.matchMedia
    matchMediaMock = vi.fn()
    window.matchMedia = matchMediaMock
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should detect mobile breakpoint (< 768px)', () => {
    matchMediaMock.mockImplementation((query: string) => ({
      matches: query.includes('max-width: 767px'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    const { result } = renderHook(() => useMediaQuery())

    expect(result.current.isMobile).toBe(true)
    expect(result.current.isTablet).toBe(false)
    expect(result.current.isDesktop).toBe(false)
  })

  it('should detect tablet breakpoint (768px - 1023px)', () => {
    matchMediaMock.mockImplementation((query: string) => ({
      matches:
        query.includes('min-width: 768px') && query.includes('max-width: 1023px'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    const { result } = renderHook(() => useMediaQuery())

    expect(result.current.isMobile).toBe(false)
    expect(result.current.isTablet).toBe(true)
    expect(result.current.isDesktop).toBe(false)
  })

  it('should detect desktop breakpoint (>= 1024px)', () => {
    matchMediaMock.mockImplementation((query: string) => ({
      matches: query.includes('min-width: 1024px') && !query.includes('max-width'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    const { result } = renderHook(() => useMediaQuery())

    expect(result.current.isMobile).toBe(false)
    expect(result.current.isTablet).toBe(false)
    expect(result.current.isDesktop).toBe(true)
  })

  it('should return device type string', () => {
    matchMediaMock.mockImplementation((query: string) => ({
      matches: query.includes('max-width: 767px'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    const { result } = renderHook(() => useMediaQuery())

    expect(result.current.deviceType).toBe('mobile')
  })

  it('should set up and clean up event listeners', () => {
    const addEventListenerMock = vi.fn()
    const removeEventListenerMock = vi.fn()

    matchMediaMock.mockImplementation(() => ({
      matches: false,
      media: '',
      addEventListener: addEventListenerMock,
      removeEventListener: removeEventListenerMock,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    const { unmount } = renderHook(() => useMediaQuery())

    // Should register listeners for all breakpoints
    expect(addEventListenerMock).toHaveBeenCalledWith('change', expect.any(Function))

    unmount()

    // Should clean up listeners
    expect(removeEventListenerMock).toHaveBeenCalledWith('change', expect.any(Function))
  })
})
