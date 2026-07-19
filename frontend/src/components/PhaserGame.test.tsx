import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'

// Mock the entire game config to prevent Phaser initialization issues in tests
vi.mock('../game/config', () => ({
  gameConfig: {
    type: 'AUTO',
    parent: 'phaser-game',
    width: 1280,
    height: 720,
  },
}))

// Mock Phaser Game class with proper constructor
const mockDestroy = vi.fn()

class MockGame {
  destroy = mockDestroy
}

const mockGameConstructor = vi.fn().mockImplementation(function (this: any) {
  return new MockGame()
})

vi.mock('phaser', () => ({
  default: {
    Game: mockGameConstructor,
  },
}))

// Import component after mocks are set up
const { default: PhaserGame } = await import('./PhaserGame')

describe('PhaserGame Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDestroy.mockClear()
    mockGameConstructor.mockClear()
  })

  afterEach(() => {
    cleanup()
  })

  it('should create a Phaser game instance on mount', () => {
    render(<PhaserGame />)

    expect(mockGameConstructor).toHaveBeenCalledTimes(1)
    expect(mockGameConstructor).toHaveBeenCalledWith(expect.objectContaining({
      parent: 'phaser-game',
    }))
  })

  it('should destroy Phaser game instance on unmount', () => {
    const { unmount } = render(<PhaserGame />)
    unmount()

    expect(mockDestroy).toHaveBeenCalledWith(true)
  })

  it('should not create multiple game instances on re-render', () => {
    const { rerender } = render(<PhaserGame />)

    expect(mockGameConstructor).toHaveBeenCalledTimes(1)

    rerender(<PhaserGame />)

    // Should still be called only once
    expect(mockGameConstructor).toHaveBeenCalledTimes(1)
  })

  it('should render the game container element', () => {
    const { container } = render(<PhaserGame />)

    const gameContainer = container.querySelector('#phaser-game')
    expect(gameContainer).toBeInTheDocument()
    expect(gameContainer).toHaveClass('rounded-lg', 'overflow-hidden', 'shadow-2xl')
  })

  describe('HMR Handling', () => {
    it('should not break when import.meta.hot is undefined (production)', () => {
      // In production and test environments, import.meta.hot is undefined
      // This test ensures the component still works correctly

      render(<PhaserGame />)

      expect(mockGameConstructor).toHaveBeenCalledTimes(1)
    })
  })
})
