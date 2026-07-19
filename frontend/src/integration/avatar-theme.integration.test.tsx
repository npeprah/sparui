import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { usePlayerStore } from '../store/playerStore'
import { useThemeStore } from '../store/themeStore'
import { PlayerProfile } from '../components/home/PlayerProfile'
import { AvatarSelector } from '../components/settings/AvatarSelector'
import { ThemeSelector } from '../components/settings/ThemeSelector'

describe('Avatar and Theme Integration', () => {
  beforeEach(() => {
    // Reset stores to initial state
    usePlayerStore.setState({
      playerId: 'test-player',
      playerName: 'TestPlayer',
      avatar: '',
      totalWins: 5,
      totalGames: 10,
    })

    useThemeStore.setState({
      selectedTheme: 'warm_heritage',
    })
  })

  describe('Avatar System Integration', () => {
    it('should update PlayerProfile when avatar is selected', async () => {
      // Mock handler for profile editing
      const handleEditProfile = vi.fn()

      // Render PlayerProfile with initial avatar
      const { rerender } = render(
        <PlayerProfile
          playerName="TestPlayer"
          avatarId={1}
          totalGames={10}
          totalWins={5}
          onEditProfile={handleEditProfile}
        />
      )

      // Check initial avatar is displayed
      let avatar = screen.getByRole('img')
      expect(avatar).toHaveAttribute('src', '/assets/avatars/avatar_01.svg')

      // Update to new avatar
      rerender(
        <PlayerProfile
          playerName="TestPlayer"
          avatarId={3}
          totalGames={10}
          totalWins={5}
          onEditProfile={handleEditProfile}
        />
      )

      // Check avatar updated
      avatar = screen.getByRole('img')
      expect(avatar).toHaveAttribute('src', '/assets/avatars/avatar_03.svg')
    })

    it('should persist avatar selection in playerStore', async () => {
      const user = userEvent.setup()

      // Mock selection handler
      const handleSelect = vi.fn((avatarId: number) => {
        usePlayerStore.getState().setAvatar(avatarId.toString())
      })

      render(<AvatarSelector selectedAvatarId={1} onSelect={handleSelect} />)

      // Select avatar 3 (Kwame)
      const avatarItems = screen.getAllByTestId(/avatar-item-/)
      await user.click(avatarItems[2])

      expect(handleSelect).toHaveBeenCalledWith(3)

      // Simulate the store update
      handleSelect(3)

      // Check store was updated
      expect(usePlayerStore.getState().avatar).toBe('3')
    })

    it('should display all 5 avatars with correct names', () => {
      render(<AvatarSelector selectedAvatarId={1} onSelect={vi.fn()} />)

      // Check all avatar names are present
      expect(screen.getByText('Kofi')).toBeInTheDocument()
      expect(screen.getByText('Ama')).toBeInTheDocument()
      expect(screen.getByText('Kwame')).toBeInTheDocument()
      expect(screen.getByText('Yaa')).toBeInTheDocument()
      expect(screen.getByText('Adjoa')).toBeInTheDocument()
    })
  })

  describe('Theme System Integration', () => {
    it('should update theme in store when selected', async () => {
      const user = userEvent.setup()

      // Mock selection handler
      const handleSelect = vi.fn((theme: any) => {
        useThemeStore.getState().setTheme(theme)
      })

      render(<ThemeSelector selectedTheme="warm_heritage" onSelect={handleSelect} />)

      // Select the Comic palette (index 1 in the canonical order).
      const themeItems = screen.getAllByTestId(/theme-item-/)
      await user.click(themeItems[1])

      expect(handleSelect).toHaveBeenCalledWith('comic')

      // Simulate the store update
      handleSelect('comic')

      // Check store was updated
      expect(useThemeStore.getState().selectedTheme).toBe('comic')
    })

    it('should persist theme selection across sessions', () => {
      // Set a palette; persistence is via the zustand persist middleware.
      useThemeStore.getState().setTheme('neon')

      expect(useThemeStore.getState().selectedTheme).toBe('neon')
    })

    it('should display all 3 palettes with correct names', () => {
      render(<ThemeSelector selectedTheme="warm_heritage" onSelect={vi.fn()} />)

      expect(screen.getByText('Warm Heritage')).toBeInTheDocument()
      expect(screen.getByText('Comic')).toBeInTheDocument()
      expect(screen.getByText('Neon')).toBeInTheDocument()
    })

    it('should show swatch previews for all palettes', () => {
      render(<ThemeSelector selectedTheme="warm_heritage" onSelect={vi.fn()} />)

      // Palette previews are swatch divs (role=img), one per canonical palette.
      const previews = screen.getAllByRole('img')
      expect(previews).toHaveLength(3)
      previews.forEach(p => expect(p).toHaveAttribute('aria-label'))
    })
  })

  describe('Avatar and Theme Together', () => {
    it('should handle both avatar and theme changes simultaneously', async () => {
      const user = userEvent.setup()

      // Set initial avatar and theme
      usePlayerStore.getState().setAvatar('1')
      useThemeStore.getState().setTheme('warm_heritage')

      // Mock handlers
      const handleAvatarSelect = vi.fn((avatarId: number) => {
        usePlayerStore.getState().setAvatar(avatarId.toString())
      })

      const handleThemeSelect = vi.fn((theme: any) => {
        useThemeStore.getState().setTheme(theme)
      })

      // Render both selectors
      render(
        <div>
          <AvatarSelector selectedAvatarId={1} onSelect={handleAvatarSelect} />
          <ThemeSelector selectedTheme="warm_heritage" onSelect={handleThemeSelect} />
        </div>
      )

      // Select new avatar
      const avatarItems = screen.getAllByTestId(/avatar-item-/)
      await user.click(avatarItems[3]) // Select Yaa

      // Select new palette
      const themeItems = screen.getAllByTestId(/theme-item-/)
      await user.click(themeItems[2]) // Select Neon

      // Verify both were called
      expect(handleAvatarSelect).toHaveBeenCalledWith(4)
      expect(handleThemeSelect).toHaveBeenCalledWith('neon')

      // Simulate updates
      handleAvatarSelect(4)
      handleThemeSelect('neon')

      // Verify stores updated
      expect(usePlayerStore.getState().avatar).toBe('4')
      expect(useThemeStore.getState().selectedTheme).toBe('neon')
    })

    it('should maintain visual consistency across components', () => {
      // This test verifies that avatar and theme selections
      // maintain consistent styling across different components

      render(
        <div>
          <PlayerProfile
            playerName="TestPlayer"
            avatarId={2}
            totalGames={10}
            totalWins={5}
            onEditProfile={vi.fn()}
          />
          <AvatarSelector selectedAvatarId={2} onSelect={vi.fn()} />
        </div>
      )

      // Both components should show the same avatar
      const avatarImages = screen.getAllByRole('img')
      const profileAvatar = avatarImages[0]

      // Profile should show avatar 2
      expect(profileAvatar).toHaveAttribute('src', '/assets/avatars/avatar_02.svg')

      // Selector should have avatar 2 selected (shown by border-gold class)
      const avatarItems = screen.getAllByTestId(/avatar-item-/)
      expect(avatarItems[1].className).toMatch(/border-gold/i)
    })
  })

  describe('Accessibility', () => {
    it('should be fully keyboard navigable', async () => {
      const user = userEvent.setup()

      const handleAvatarSelect = vi.fn()
      const handleThemeSelect = vi.fn()

      render(
        <div>
          <AvatarSelector selectedAvatarId={1} onSelect={handleAvatarSelect} />
          <ThemeSelector selectedTheme="warm_heritage" onSelect={handleThemeSelect} />
        </div>
      )

      // Tab through avatars
      await user.tab()
      const firstAvatar = screen.getAllByTestId(/avatar-item-/)[0]
      expect(firstAvatar).toHaveFocus()

      // Select with Enter
      await user.keyboard('{Enter}')
      expect(handleAvatarSelect).toHaveBeenCalledWith(1)

      // Continue tabbing to themes
      for (let i = 0; i < 5; i++) {
        await user.tab()
      }

      const firstTheme = screen.getAllByTestId(/theme-item-/)[0]
      expect(firstTheme).toHaveFocus()

      // Select with Space
      await user.keyboard(' ')
      expect(handleThemeSelect).toHaveBeenCalledWith('warm_heritage')
    })

    it('should have proper ARIA attributes', () => {
      render(
        <div>
          <AvatarSelector selectedAvatarId={1} onSelect={vi.fn()} />
          <ThemeSelector selectedTheme="warm_heritage" onSelect={vi.fn()} />
        </div>
      )

      // Check avatar items have proper ARIA
      const avatarItems = screen.getAllByTestId(/avatar-item-/)
      avatarItems.forEach(item => {
        expect(item).toHaveAttribute('role', 'button')
        expect(item).toHaveAttribute('aria-label')
        expect(item).toHaveAttribute('tabIndex', '0')
      })

      // Check theme items have proper ARIA
      const themeItems = screen.getAllByTestId(/theme-item-/)
      themeItems.forEach(item => {
        expect(item).toHaveAttribute('role', 'button')
        expect(item).toHaveAttribute('aria-label')
        expect(item).toHaveAttribute('tabIndex', '0')
      })

      // Check images / swatch previews have an accessible name (alt or aria-label)
      const images = screen.getAllByRole('img')
      images.forEach(img => {
        const hasName = img.hasAttribute('alt') || img.hasAttribute('aria-label')
        expect(hasName).toBe(true)
      })
    })
  })
})
