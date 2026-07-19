import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Avatar } from './Avatar'

describe('Avatar Component', () => {
  describe('Rendering', () => {
    it('should render with default size (medium)', () => {
      render(<Avatar avatarId={1} />)
      const avatarContainer = screen.getByTestId('avatar-container')
      expect(avatarContainer).toBeInTheDocument()
      expect(avatarContainer).toHaveClass('w-32', 'h-32')
    })

    it('should render with small size', () => {
      render(<Avatar avatarId={1} size="small" />)
      const avatarContainer = screen.getByTestId('avatar-container')
      expect(avatarContainer).toHaveClass('w-16', 'h-16')
    })

    it('should render with medium size', () => {
      render(<Avatar avatarId={2} size="medium" />)
      const avatarContainer = screen.getByTestId('avatar-container')
      expect(avatarContainer).toHaveClass('w-32', 'h-32')
    })

    it('should render with large size', () => {
      render(<Avatar avatarId={3} size="large" />)
      const avatarContainer = screen.getByTestId('avatar-container')
      expect(avatarContainer).toHaveClass('w-64', 'h-64')
    })

    it('should apply custom className', () => {
      render(<Avatar avatarId={1} className="custom-class" />)
      const avatarContainer = screen.getByTestId('avatar-container')
      expect(avatarContainer).toHaveClass('custom-class')
    })
  })

  describe('Avatar Images', () => {
    it('should load correct avatar image based on avatarId', () => {
      render(<Avatar avatarId={1} />)
      const avatar = screen.getByRole('img') as HTMLImageElement
      expect(avatar.src).toContain('/assets/avatars/avatar_01.svg')
    })

    it('should have correct alt text for avatar 1 (Kofi)', () => {
      render(<Avatar avatarId={1} />)
      const avatar = screen.getByRole('img')
      expect(avatar).toHaveAttribute('alt', 'Kofi - Confident Leader')
    })

    it('should have correct alt text for avatar 2 (Ama)', () => {
      render(<Avatar avatarId={2} />)
      const avatar = screen.getByRole('img')
      expect(avatar).toHaveAttribute('alt', 'Ama - Cool Strategist')
    })

    it('should have correct alt text for avatar 3 (Kwame)', () => {
      render(<Avatar avatarId={3} />)
      const avatar = screen.getByRole('img')
      expect(avatar).toHaveAttribute('alt', 'Kwame - Playful Challenger')
    })

    it('should have correct alt text for avatar 4 (Yaa)', () => {
      render(<Avatar avatarId={4} />)
      const avatar = screen.getByRole('img')
      expect(avatar).toHaveAttribute('alt', 'Yaa - Fierce Competitor')
    })

    it('should have correct alt text for avatar 5 (Adjoa)', () => {
      render(<Avatar avatarId={5} />)
      const avatar = screen.getByRole('img')
      expect(avatar).toHaveAttribute('alt', 'Adjoa - Wise Veteran')
    })

    it('should show fallback for invalid avatarId', () => {
      render(<Avatar avatarId={99} />)
      const avatar = screen.getByRole('img')
      expect(avatar).toHaveAttribute('alt', 'Default Avatar')
    })
  })

  describe('Selected State', () => {
    it('should apply selected styles when isSelected is true', () => {
      render(<Avatar avatarId={1} isSelected={true} />)
      const avatarContainer = screen.getByTestId('avatar-container')
      // Check that the element has a class containing 'selected' (CSS modules add hash)
      expect(avatarContainer.className).toMatch(/selected/i)
    })

    it('should not apply selected styles when isSelected is false', () => {
      render(<Avatar avatarId={1} isSelected={false} />)
      const avatarContainer = screen.getByTestId('avatar-container')
      expect(avatarContainer.className).not.toMatch(/selected/i)
    })
  })

  describe('Click Handler', () => {
    it('should call onClick when clicked', () => {
      const handleClick = vi.fn()
      render(<Avatar avatarId={1} onClick={handleClick} />)
      const avatarContainer = screen.getByTestId('avatar-container')
      avatarContainer.click()
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should pass avatarId to onClick handler', () => {
      const handleClick = vi.fn()
      render(<Avatar avatarId={3} onClick={handleClick} />)
      const avatarContainer = screen.getByTestId('avatar-container')
      avatarContainer.click()
      expect(handleClick).toHaveBeenCalledWith(3)
    })
  })

  describe('Loading State', () => {
    it('should show loading state while image loads', () => {
      render(<Avatar avatarId={1} />)
      const loadingPlaceholder = screen.queryByTestId('avatar-loading')
      // Loading state should be present initially
      expect(loadingPlaceholder).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<Avatar avatarId={1} />)
      const avatar = screen.getByRole('img')
      expect(avatar).toHaveAttribute('alt')
    })

    it('should be keyboard accessible when clickable', () => {
      const handleClick = vi.fn()
      render(<Avatar avatarId={1} onClick={handleClick} />)
      const avatarContainer = screen.getByTestId('avatar-container')
      expect(avatarContainer).toHaveAttribute('tabIndex', '0')
      expect(avatarContainer).toHaveAttribute('role', 'button')
    })
  })
})