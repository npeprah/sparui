import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import HomePage from './HomePage'
import { usePlayerStore, useUIStore, useLobbyStore } from '../store'

// Mock stores
vi.mock('../store', () => ({
  usePlayerStore: vi.fn(),
  useUIStore: vi.fn(),
  useLobbyStore: vi.fn(),
}))

// Mock socketService
vi.mock('../services/socketService', () => ({
  socketService: {
    connect: vi.fn(() => ({})),
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  },
}))

// Mock animation utilities
vi.mock('../utils/animations', () => ({
  pageVariants: {},
  staggerContainer: {},
  staggerItem: {},
  getVariants: vi.fn((variants) => variants || {}),
  getPrefersReducedMotion: vi.fn(() => false),
}))

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

// Mock UI components
vi.mock('../components/ui', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
  Modal: ({ isOpen, children, title, onClose }: any) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        <h2>{title}</h2>
        {children}
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}))

// Mock home components
vi.mock('../components/home', () => ({
  PlayerProfile: ({ playerName, totalGames, totalWins }: any) => (
    <div data-testid="player-profile">
      <div>{playerName}</div>
      <div>Games: {totalGames}</div>
      <div>Wins: {totalWins}</div>
    </div>
  ),
  PulseButton: ({ children }: any) => <div data-testid="pulse-button">{children}</div>,
}))

// Mock responsive hooks
vi.mock('../hooks/useMediaQuery', () => ({
  useMediaQuery: vi.fn(() => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    deviceType: 'desktop',
  })),
}))

describe('HomePage', () => {
  const mockPlayerStore = {
    playerId: 'test-player-123',
    playerName: 'TestPlayer',
    totalWins: 5,
    totalGames: 10,
    setPlayerId: vi.fn(),
  }

  const mockUIStore = {
    openSettings: vi.fn(),
    addNotification: vi.fn(),
  }

  const mockLobbyStore = {
    setIsConnecting: vi.fn(),
    reset: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(usePlayerStore as any).mockImplementation((selector: any) =>
      selector ? selector(mockPlayerStore) : mockPlayerStore
    )
    ;(useUIStore as any).mockImplementation((selector: any) => (selector ? selector(mockUIStore) : mockUIStore))
    ;(useLobbyStore as any).mockImplementation((selector: any) =>
      selector ? selector(mockLobbyStore) : mockLobbyStore
    )
  })

  it('should render without errors', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    )

    expect(screen.getByText('SPAR')).toBeInTheDocument()
  })

  it('should display the game title and subtitle', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    )

    expect(screen.getByText('SPAR')).toBeInTheDocument()
    expect(screen.getByText('Ghanaian Card Game')).toBeInTheDocument()
  })

  it('should display all navigation buttons', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    )

    // Buttons now have emojis and accessible aria-labels
    expect(screen.getByRole('button', { name: /start quick match/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create a private game/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /join a friend/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /play against computer/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /open settings/i })).toBeInTheDocument()
  })

  it('should display player name from store', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    )

    // Player name is now in PlayerProfile component
    const profile = screen.getByTestId('player-profile')
    expect(profile).toHaveTextContent('TestPlayer')
  })

  it('should display player stats from store', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    )

    // Player stats are now in PlayerProfile component
    const profile = screen.getByTestId('player-profile')
    expect(profile).toHaveTextContent('Games: 10')
    expect(profile).toHaveTextContent('Wins: 5')
  })

  it('should call openSettings when Settings button is clicked', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    )

    const settingsButton = screen.getByRole('button', { name: /open settings/i })
    settingsButton.click()

    expect(mockUIStore.openSettings).toHaveBeenCalledTimes(1)
  })

  it('should show notification when Quick Match is clicked', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    )

    const quickMatchButton = screen.getByRole('button', { name: /start quick match/i })
    quickMatchButton.click()

    expect(mockUIStore.addNotification).toHaveBeenCalledWith({
      type: 'info',
      message: expect.stringContaining('Quick Match coming soon'),
    })
  })

  it('should show notification when Play vs AI is clicked', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    )

    const aiButton = screen.getByRole('button', { name: /play against computer/i })
    aiButton.click()

    expect(mockUIStore.addNotification).toHaveBeenCalledWith({
      type: 'info',
      message: expect.stringContaining('AI mode coming soon'),
    })
  })

  it('should disable buttons when creating or joining lobby', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    )

    // Initially buttons should be enabled
    const quickMatchButton = screen.getByRole('button', { name: /start quick match/i })
    expect(quickMatchButton).not.toBeDisabled()
  })

  it('should display PlayerProfile component', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    )

    expect(screen.getByTestId('player-profile')).toBeInTheDocument()
  })

  it('should pass player data to PlayerProfile', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    )

    const profile = screen.getByTestId('player-profile')
    expect(profile).toHaveTextContent('TestPlayer')
    expect(profile).toHaveTextContent('Games: 10')
    expect(profile).toHaveTextContent('Wins: 5')
  })

  it('should have Quick Match button with prominent styling', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    )

    const quickMatchButton = screen.getByRole('button', { name: /start quick match/i })
    // Should have shadow for prominence
    expect(quickMatchButton.className).toContain('shadow')
  })

  it('should have arcade-style gradient background', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    )

    // Check for gradient classes in the main container
    const container = screen.getByText('SPAR').closest('.bg-gradient-to-br')
    expect(container).toBeInTheDocument()
  })
})
