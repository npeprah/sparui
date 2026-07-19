import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeSelector } from './ThemeSelector'

describe('ThemeSelector Component', () => {
  const mockOnSelect = vi.fn()

  beforeEach(() => {
    mockOnSelect.mockClear()
  })

  describe('Rendering', () => {
    it('should render all 3 canonical palettes', () => {
      render(<ThemeSelector selectedTheme="warm_heritage" onSelect={mockOnSelect} />)

      const themePreviews = screen.getAllByTestId(/theme-preview-/)
      expect(themePreviews).toHaveLength(3)
    })

    it('should display palette names', () => {
      render(<ThemeSelector selectedTheme="warm_heritage" onSelect={mockOnSelect} />)

      expect(screen.getByText('Warm Heritage')).toBeInTheDocument()
      expect(screen.getByText('Comic')).toBeInTheDocument()
      expect(screen.getByText('Neon')).toBeInTheDocument()
    })

    it('should display palette descriptions', () => {
      render(<ThemeSelector selectedTheme="warm_heritage" onSelect={mockOnSelect} />)

      // Each item shows its authored description.
      const items = screen.getAllByTestId(/theme-item-/)
      items.forEach(item => {
        expect(item.querySelector('p')?.textContent).toBeTruthy()
      })
    })

    it('should have a heading', () => {
      render(<ThemeSelector selectedTheme="warm_heritage" onSelect={mockOnSelect} />)

      const heading = screen.getByRole('heading', { name: /choose your palette/i })
      expect(heading).toBeInTheDocument()
    })

    it('should show a swatch preview per palette (no image assets)', () => {
      render(<ThemeSelector selectedTheme="warm_heritage" onSelect={mockOnSelect} />)

      // Previews are palette-honest swatch divs (role=img), not surface images.
      const previews = screen.getAllByRole('img')
      expect(previews).toHaveLength(3)
      previews.forEach(p => expect(p.querySelector('div')).toBeTruthy())
    })
  })

  describe('Selection', () => {
    it('should highlight the selected palette', () => {
      render(<ThemeSelector selectedTheme="comic" onSelect={mockOnSelect} />)

      const themeItems = screen.getAllByTestId(/theme-item-/)
      // Comic is index 1 in the canonical order.
      expect(themeItems[1].className).toMatch(/border-gold/i)
      expect(themeItems[0].className).not.toMatch(/border-gold/i)
      expect(themeItems[2].className).not.toMatch(/border-gold/i)
    })

    it('should call onSelect when a palette is clicked', async () => {
      const user = userEvent.setup()
      render(<ThemeSelector selectedTheme="warm_heritage" onSelect={mockOnSelect} />)

      const themeItems = screen.getAllByTestId(/theme-item-/)
      await user.click(themeItems[1])

      expect(mockOnSelect).toHaveBeenCalledTimes(1)
      expect(mockOnSelect).toHaveBeenCalledWith('comic')
    })

    it('should call onSelect with correct id for each palette', async () => {
      const user = userEvent.setup()
      render(<ThemeSelector selectedTheme="warm_heritage" onSelect={mockOnSelect} />)

      const themes = ['warm_heritage', 'comic', 'neon']
      const themeItems = screen.getAllByTestId(/theme-item-/)

      for (let i = 0; i < 3; i++) {
        mockOnSelect.mockClear()
        await user.click(themeItems[i])
        expect(mockOnSelect).toHaveBeenCalledWith(themes[i])
      }
    })
  })

  describe('Grid Layout', () => {
    it('should display palettes in a grid', () => {
      render(<ThemeSelector selectedTheme="warm_heritage" onSelect={mockOnSelect} />)

      const grid = screen.getByTestId('theme-grid')
      expect(grid).toHaveClass('grid')
    })

    it('should be responsive', () => {
      render(<ThemeSelector selectedTheme="warm_heritage" onSelect={mockOnSelect} />)

      const grid = screen.getByTestId('theme-grid')
      expect(grid.className).toMatch(/grid-cols-/i)
    })
  })

  describe('Hover Effects', () => {
    it('should have hover state on palette items', () => {
      render(<ThemeSelector selectedTheme="warm_heritage" onSelect={mockOnSelect} />)

      const themeItems = screen.getAllByTestId(/theme-item-/)
      themeItems.forEach(item => {
        expect(item.className).toMatch(/hover:/i)
      })
    })
  })

  describe('Accessibility', () => {
    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      render(<ThemeSelector selectedTheme="warm_heritage" onSelect={mockOnSelect} />)

      const themeItems = screen.getAllByTestId(/theme-item-/)

      await user.tab()
      expect(themeItems[0]).toHaveFocus()

      await user.keyboard('{Enter}')
      expect(mockOnSelect).toHaveBeenCalledWith('warm_heritage')
    })

    it('should have proper ARIA labels', () => {
      render(<ThemeSelector selectedTheme="warm_heritage" onSelect={mockOnSelect} />)

      const themeItems = screen.getAllByTestId(/theme-item-/)
      themeItems.forEach(item => {
        expect(item).toHaveAttribute('role', 'button')
        expect(item).toHaveAttribute('aria-label')
      })
    })

    it('should have accessible labels for the swatch previews', () => {
      render(<ThemeSelector selectedTheme="warm_heritage" onSelect={mockOnSelect} />)

      const previews = screen.getAllByRole('img')
      previews.forEach(img => {
        expect(img).toHaveAttribute('aria-label')
      })
    })
  })

  describe('Custom className', () => {
    it('should apply custom className', () => {
      render(
        <ThemeSelector
          selectedTheme="warm_heritage"
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
          selectedTheme="warm_heritage"
          onSelect={mockOnSelect}
          showApplyButton={true}
        />
      )

      const applyButton = screen.getByRole('button', { name: /apply palette/i })
      expect(applyButton).toBeInTheDocument()
    })

    it('should not show Apply button by default', () => {
      render(<ThemeSelector selectedTheme="warm_heritage" onSelect={mockOnSelect} />)

      const applyButton = screen.queryByRole('button', { name: /apply palette/i })
      expect(applyButton).not.toBeInTheDocument()
    })
  })
})
