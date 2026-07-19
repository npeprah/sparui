import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeSelector } from './ThemeSelector'

describe('ThemeSelector Component', () => {
  const mockOnSelect = vi.fn()

  beforeEach(() => {
    mockOnSelect.mockClear()
  })

  describe('Rendering', () => {
    it('should render all 4 themes', () => {
      render(<ThemeSelector selectedTheme="afro_heritage" onSelect={mockOnSelect} />)

      // Check for all 4 theme previews
      const themePreviews = screen.getAllByTestId(/theme-preview-/)
      expect(themePreviews).toHaveLength(4)
    })

    it('should display theme names', () => {
      render(<ThemeSelector selectedTheme="afro_heritage" onSelect={mockOnSelect} />)

      expect(screen.getByText('Afro Heritage')).toBeInTheDocument()
      expect(screen.getByText('Neon Arcade')).toBeInTheDocument()
      expect(screen.getByText('Royal Gold')).toBeInTheDocument()
      expect(screen.getByText('Ocean Breeze')).toBeInTheDocument()
    })

    it('should display theme descriptions', () => {
      render(<ThemeSelector selectedTheme="afro_heritage" onSelect={mockOnSelect} />)

      expect(screen.getByText('Traditional Kente patterns with gold accents')).toBeInTheDocument()
      expect(screen.getByText('Vibrant neon glow with rainbow energy')).toBeInTheDocument()
      expect(screen.getByText('Deep purple majesty with golden highlights')).toBeInTheDocument()
      expect(screen.getByText('Turquoise coastal vibes')).toBeInTheDocument()
    })

    it('should have a heading', () => {
      render(<ThemeSelector selectedTheme="afro_heritage" onSelect={mockOnSelect} />)

      const heading = screen.getByRole('heading', { name: /choose your theme/i })
      expect(heading).toBeInTheDocument()
    })

    it('should show theme preview images', () => {
      render(<ThemeSelector selectedTheme="afro_heritage" onSelect={mockOnSelect} />)

      const images = screen.getAllByRole('img')
      expect(images).toHaveLength(4)

      // Check that images have correct src
      expect(images[0]).toHaveAttribute('src', '/assets/surfaces/surface_afro_heritage.png')
      expect(images[1]).toHaveAttribute('src', '/assets/surfaces/surface_neon_arcade.png')
      expect(images[2]).toHaveAttribute('src', '/assets/surfaces/surface_royal_gold.png')
      expect(images[3]).toHaveAttribute('src', '/assets/surfaces/surface_ocean_breeze.png')
    })
  })

  describe('Selection', () => {
    it('should highlight the selected theme', () => {
      render(<ThemeSelector selectedTheme="neon_arcade" onSelect={mockOnSelect} />)

      const themeItems = screen.getAllByTestId(/theme-item-/)
      // Neon Arcade should be selected (index 1)
      expect(themeItems[1].className).toMatch(/border-gold/i)

      // Others should not be selected
      expect(themeItems[0].className).not.toMatch(/border-gold/i)
      expect(themeItems[2].className).not.toMatch(/border-gold/i)
      expect(themeItems[3].className).not.toMatch(/border-gold/i)
    })

    it('should call onSelect when a theme is clicked', async () => {
      const user = userEvent.setup()
      render(<ThemeSelector selectedTheme="afro_heritage" onSelect={mockOnSelect} />)

      const themeItems = screen.getAllByTestId(/theme-item-/)
      // Click on the second theme (Neon Arcade)
      await user.click(themeItems[1])

      expect(mockOnSelect).toHaveBeenCalledTimes(1)
      expect(mockOnSelect).toHaveBeenCalledWith('neon_arcade')
    })

    it('should call onSelect with correct theme id for each theme', async () => {
      const user = userEvent.setup()
      render(<ThemeSelector selectedTheme="afro_heritage" onSelect={mockOnSelect} />)

      const themes = ['afro_heritage', 'neon_arcade', 'royal_gold', 'ocean_breeze']
      const themeItems = screen.getAllByTestId(/theme-item-/)

      for (let i = 0; i < 4; i++) {
        mockOnSelect.mockClear()
        await user.click(themeItems[i])
        expect(mockOnSelect).toHaveBeenCalledWith(themes[i])
      }
    })
  })

  describe('Grid Layout', () => {
    it('should display themes in a grid', () => {
      render(<ThemeSelector selectedTheme="afro_heritage" onSelect={mockOnSelect} />)

      const grid = screen.getByTestId('theme-grid')
      expect(grid).toHaveClass('grid')
    })

    it('should be responsive', () => {
      render(<ThemeSelector selectedTheme="afro_heritage" onSelect={mockOnSelect} />)

      const grid = screen.getByTestId('theme-grid')
      // Should have responsive grid columns
      expect(grid.className).toMatch(/grid-cols-/i)
    })
  })

  describe('Hover Effects', () => {
    it('should have hover state on theme items', () => {
      render(<ThemeSelector selectedTheme="afro_heritage" onSelect={mockOnSelect} />)

      const themeItems = screen.getAllByTestId(/theme-item-/)
      themeItems.forEach(item => {
        expect(item.className).toMatch(/hover:/i)
      })
    })
  })

  describe('Accessibility', () => {
    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      render(<ThemeSelector selectedTheme="afro_heritage" onSelect={mockOnSelect} />)

      const themeItems = screen.getAllByTestId(/theme-item-/)

      // Tab to first theme
      await user.tab()
      expect(themeItems[0]).toHaveFocus()

      // Press Enter to select
      await user.keyboard('{Enter}')
      expect(mockOnSelect).toHaveBeenCalledWith('afro_heritage')
    })

    it('should have proper ARIA labels', () => {
      render(<ThemeSelector selectedTheme="afro_heritage" onSelect={mockOnSelect} />)

      const themeItems = screen.getAllByTestId(/theme-item-/)
      themeItems.forEach(item => {
        expect(item).toHaveAttribute('role', 'button')
        expect(item).toHaveAttribute('aria-label')
      })
    })

    it('should have alt text for images', () => {
      render(<ThemeSelector selectedTheme="afro_heritage" onSelect={mockOnSelect} />)

      const images = screen.getAllByRole('img')
      images.forEach(img => {
        expect(img).toHaveAttribute('alt')
      })
    })
  })

  describe('Custom className', () => {
    it('should apply custom className', () => {
      render(
        <ThemeSelector
          selectedTheme="afro_heritage"
          onSelect={mockOnSelect}
          className="custom-theme-class"
        />
      )

      const selector = screen.getByTestId('theme-selector')
      expect(selector).toHaveClass('custom-theme-class')
    })
  })

  describe('Preview Mode', () => {
    it('should show Apply button when showApplyButton is true', () => {
      render(
        <ThemeSelector
          selectedTheme="afro_heritage"
          onSelect={mockOnSelect}
          showApplyButton={true}
        />
      )

      const applyButton = screen.getByRole('button', { name: /apply theme/i })
      expect(applyButton).toBeInTheDocument()
    })

    it('should not show Apply button by default', () => {
      render(<ThemeSelector selectedTheme="afro_heritage" onSelect={mockOnSelect} />)

      const applyButton = screen.queryByRole('button', { name: /apply theme/i })
      expect(applyButton).not.toBeInTheDocument()
    })
  })
})
