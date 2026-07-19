import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { PlayerProfile } from './PlayerProfile'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}))

// Mock Card and Button components
vi.mock('../ui', () => ({
  Card: ({ children, ...props }: any) => <div data-testid="card" {...props}>{children}</div>,
  Button: ({ children, onClick, ...props }: any) => <button onClick={onClick} {...props}>{children}</button>,
}))

describe('PlayerProfile', () => {
  const defaultProps = {
    playerName: 'TestPlayer',
    totalGames: 10,
    totalWins: 5,
    onEditProfile: vi.fn(),
  }

  it('should render without errors', () => {
    render(
      <BrowserRouter>
        <PlayerProfile {...defaultProps} />
      </BrowserRouter>
    )

    expect(screen.getByText('TestPlayer')).toBeInTheDocument()
  })

  it('should display the player avatar image', () => {
    render(
      <BrowserRouter>
        <PlayerProfile {...defaultProps} />
      </BrowserRouter>
    )

    // Avatar is now an image-based component, not a first-letter placeholder
    expect(screen.getByTestId('avatar-container')).toBeInTheDocument()
  })

  it('should display username', () => {
    render(
      <BrowserRouter>
        <PlayerProfile {...defaultProps} />
      </BrowserRouter>
    )

    expect(screen.getByText('TestPlayer')).toBeInTheDocument()
  })

  it('should display total games', () => {
    render(
      <BrowserRouter>
        <PlayerProfile {...defaultProps} />
      </BrowserRouter>
    )

    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText(/games played/i)).toBeInTheDocument()
  })

  it('should display total wins', () => {
    render(
      <BrowserRouter>
        <PlayerProfile {...defaultProps} />
      </BrowserRouter>
    )

    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText(/wins/i)).toBeInTheDocument()
  })

  it('should calculate and display win rate correctly', () => {
    render(
      <BrowserRouter>
        <PlayerProfile {...defaultProps} />
      </BrowserRouter>
    )

    // Win rate: 5/10 = 50%
    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(screen.getByText(/win rate/i)).toBeInTheDocument()
  })

  it('should display 0% win rate when no games played', () => {
    render(
      <BrowserRouter>
        <PlayerProfile {...defaultProps} totalGames={0} totalWins={0} />
      </BrowserRouter>
    )

    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('should round win rate to nearest integer', () => {
    render(
      <BrowserRouter>
        <PlayerProfile {...defaultProps} totalGames={3} totalWins={2} />
      </BrowserRouter>
    )

    // Win rate: 2/3 = 66.666... should round to 67%
    expect(screen.getByText('67%')).toBeInTheDocument()
  })

  it('should display Edit Profile button', () => {
    render(
      <BrowserRouter>
        <PlayerProfile {...defaultProps} />
      </BrowserRouter>
    )

    const editButton = screen.getByRole('button', { name: /edit profile/i })
    expect(editButton).toBeInTheDocument()
  })

  it('should call onEditProfile when Edit Profile button is clicked', () => {
    const onEditProfile = vi.fn()

    render(
      <BrowserRouter>
        <PlayerProfile {...defaultProps} onEditProfile={onEditProfile} />
      </BrowserRouter>
    )

    const editButton = screen.getByRole('button', { name: /edit profile/i })
    editButton.click()

    expect(onEditProfile).toHaveBeenCalledTimes(1)
  })

  it('should use Card component for layout', () => {
    render(
      <BrowserRouter>
        <PlayerProfile {...defaultProps} />
      </BrowserRouter>
    )

    expect(screen.getByTestId('card')).toBeInTheDocument()
  })

  it('should handle single-letter names', () => {
    render(
      <BrowserRouter>
        <PlayerProfile {...defaultProps} playerName="A" />
      </BrowserRouter>
    )

    // Username is rendered verbatim (avatar is image-based, not a letter)
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('should fall back to "Guest" for an empty username', () => {
    render(
      <BrowserRouter>
        <PlayerProfile {...defaultProps} playerName="" />
      </BrowserRouter>
    )

    expect(screen.getByText('Guest')).toBeInTheDocument()
  })

  it('should render the username verbatim', () => {
    render(
      <BrowserRouter>
        <PlayerProfile {...defaultProps} playerName="testplayer" />
      </BrowserRouter>
    )

    expect(screen.getByText('testplayer')).toBeInTheDocument()
  })
})
