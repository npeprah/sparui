import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AvatarSelector } from './AvatarSelector'

describe('AvatarSelector Component', () => {
  const mockOnSelect = vi.fn()

  beforeEach(() => {
    mockOnSelect.mockClear()
  })

  describe('Rendering', () => {
    it('should render all 5 avatars', () => {
      render(<AvatarSelector selectedAvatarId={1} onSelect={mockOnSelect} />)

      // Check for all 5 avatar containers
      const avatars = screen.getAllByTestId(/avatar-container/)
      expect(avatars).toHaveLength(5)
    })

    it('should display avatar names', () => {
      render(<AvatarSelector selectedAvatarId={1} onSelect={mockOnSelect} />)

      expect(screen.getByText('Kofi')).toBeInTheDocument()
      expect(screen.getByText('Ama')).toBeInTheDocument()
      expect(screen.getByText('Kwame')).toBeInTheDocument()
      expect(screen.getByText('Yaa')).toBeInTheDocument()
      expect(screen.getByText('Adjoa')).toBeInTheDocument()
    })

    it('should display avatar descriptions', () => {
      render(<AvatarSelector selectedAvatarId={1} onSelect={mockOnSelect} />)

      expect(screen.getByText('Confident Leader')).toBeInTheDocument()
      expect(screen.getByText('Cool Strategist')).toBeInTheDocument()
      expect(screen.getByText('Playful Challenger')).toBeInTheDocument()
      expect(screen.getByText('Fierce Competitor')).toBeInTheDocument()
      expect(screen.getByText('Wise Veteran')).toBeInTheDocument()
    })

    it('should have a heading', () => {
      render(<AvatarSelector selectedAvatarId={1} onSelect={mockOnSelect} />)

      const heading = screen.getByRole('heading', { name: /choose your avatar/i })
      expect(heading).toBeInTheDocument()
    })
  })

  describe('Selection', () => {
    it('should highlight the selected avatar', () => {
      render(<AvatarSelector selectedAvatarId={3} onSelect={mockOnSelect} />)

      const avatarContainers = screen.getAllByTestId(/avatar-container/)
      // Avatar 3 (Kwame) should be selected (index 2 in 0-based array)
      expect(avatarContainers[2].className).toMatch(/selected/i)

      // Others should not be selected
      expect(avatarContainers[0].className).not.toMatch(/selected/i)
      expect(avatarContainers[1].className).not.toMatch(/selected/i)
      expect(avatarContainers[3].className).not.toMatch(/selected/i)
      expect(avatarContainers[4].className).not.toMatch(/selected/i)
    })

    it('should call onSelect when an avatar is clicked', async () => {
      const user = userEvent.setup()
      render(<AvatarSelector selectedAvatarId={1} onSelect={mockOnSelect} />)

      const avatarContainers = screen.getAllByTestId(/avatar-container/)
      // Click on the second avatar (Ama, id=2)
      await user.click(avatarContainers[1])

      expect(mockOnSelect).toHaveBeenCalledTimes(1)
      expect(mockOnSelect).toHaveBeenCalledWith(2)
    })

    it('should call onSelect with correct avatar id for each avatar', async () => {
      const user = userEvent.setup()
      render(<AvatarSelector selectedAvatarId={1} onSelect={mockOnSelect} />)

      const avatarContainers = screen.getAllByTestId(/avatar-container/)

      // Click each avatar and verify correct id is passed
      for (let i = 0; i < 5; i++) {
        mockOnSelect.mockClear()
        await user.click(avatarContainers[i])
        expect(mockOnSelect).toHaveBeenCalledWith(i + 1)
      }
    })
  })

  describe('Grid Layout', () => {
    it('should display avatars in a grid', () => {
      render(<AvatarSelector selectedAvatarId={1} onSelect={mockOnSelect} />)

      const grid = screen.getByTestId('avatar-grid')
      expect(grid).toHaveClass('grid')
    })

    it('should be responsive', () => {
      render(<AvatarSelector selectedAvatarId={1} onSelect={mockOnSelect} />)

      const grid = screen.getByTestId('avatar-grid')
      // Should have responsive grid columns
      expect(grid.className).toMatch(/grid-cols-/i)
    })
  })

  describe('Hover Effects', () => {
    it('should have hover state on avatar items', () => {
      render(<AvatarSelector selectedAvatarId={1} onSelect={mockOnSelect} />)

      const avatarItems = screen.getAllByTestId(/avatar-item-/)
      avatarItems.forEach(item => {
        expect(item.className).toMatch(/hover:/i)
      })
    })
  })

  describe('Accessibility', () => {
    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      render(<AvatarSelector selectedAvatarId={1} onSelect={mockOnSelect} />)

      const avatarItems = screen.getAllByTestId(/avatar-item-/)

      // Tab to first avatar
      await user.tab()
      expect(avatarItems[0]).toHaveFocus()

      // Press Enter to select
      await user.keyboard('{Enter}')
      expect(mockOnSelect).toHaveBeenCalledWith(1)
    })

    it('should have proper ARIA labels', () => {
      render(<AvatarSelector selectedAvatarId={1} onSelect={mockOnSelect} />)

      const avatarItems = screen.getAllByTestId(/avatar-item-/)
      avatarItems.forEach(item => {
        expect(item).toHaveAttribute('role', 'button')
        expect(item).toHaveAttribute('aria-label')
      })
    })
  })

  describe('Custom className', () => {
    it('should apply custom className', () => {
      render(
        <AvatarSelector
          selectedAvatarId={1}
          onSelect={mockOnSelect}
          className="custom-selector-class"
        />
      )

      const selector = screen.getByTestId('avatar-selector')
      expect(selector).toHaveClass('custom-selector-class')
    })
  })
})
