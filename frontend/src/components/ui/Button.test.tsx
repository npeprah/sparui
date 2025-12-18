import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('should render children', () => {
    render(<Button>Click Me</Button>)
    expect(screen.getByText('Click Me')).toBeInTheDocument()
  })

  it('should apply primary variant styles', () => {
    render(<Button variant="primary">Primary</Button>)
    const button = screen.getByText('Primary')
    expect(button.className).toContain('bg-fireRed')
  })

  it('should apply secondary variant styles', () => {
    render(<Button variant="secondary">Secondary</Button>)
    const button = screen.getByText('Secondary')
    expect(button.className).toContain('bg-deepPurple')
  })

  it('should apply danger variant styles', () => {
    render(<Button variant="danger">Danger</Button>)
    const button = screen.getByText('Danger')
    expect(button.className).toContain('bg-red-600')
  })

  it('should apply success variant styles', () => {
    render(<Button variant="success">Success</Button>)
    const button = screen.getByText('Success')
    expect(button.className).toContain('bg-green-600')
  })

  it('should apply ghost variant styles', () => {
    render(<Button variant="ghost">Ghost</Button>)
    const button = screen.getByText('Ghost')
    expect(button.className).toContain('bg-gray-700')
  })

  it('should apply small size styles', () => {
    render(<Button size="sm">Small</Button>)
    const button = screen.getByText('Small')
    expect(button.className).toContain('px-4')
    expect(button.className).toContain('py-2')
  })

  it('should apply medium size styles by default', () => {
    render(<Button>Medium</Button>)
    const button = screen.getByText('Medium')
    expect(button.className).toContain('px-6')
    expect(button.className).toContain('py-3')
  })

  it('should apply large size styles', () => {
    render(<Button size="lg">Large</Button>)
    const button = screen.getByText('Large')
    expect(button.className).toContain('px-8')
    expect(button.className).toContain('py-4')
  })

  it('should apply minimum touch target on mobile for all sizes', () => {
    render(<Button size="sm">Touch Target</Button>)
    const button = screen.getByText('Touch Target')
    expect(button.className).toContain('min-h-[48px]')
  })

  it('should apply full width when fullWidth is true', () => {
    render(<Button fullWidth>Full Width</Button>)
    const button = screen.getByText('Full Width')
    expect(button.className).toContain('w-full')
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    const button = screen.getByText('Disabled')
    expect(button).toBeDisabled()
  })

  it('should apply disabled styles', () => {
    render(<Button disabled>Disabled</Button>)
    const button = screen.getByText('Disabled')
    expect(button.className).toContain('disabled:opacity-50')
    expect(button.className).toContain('disabled:cursor-not-allowed')
  })

  it('should apply custom className', () => {
    render(<Button className="custom-class">Custom</Button>)
    const button = screen.getByText('Custom')
    expect(button.className).toContain('custom-class')
  })

  it('should apply responsive text sizes', () => {
    render(<Button size="lg">Responsive Text</Button>)
    const button = screen.getByText('Responsive Text')
    // Should have responsive text classes
    expect(button.className).toMatch(/text-(lg|xl)/)
  })

  it('should handle onClick events', () => {
    let clicked = false
    const handleClick = () => {
      clicked = true
    }

    render(<Button onClick={handleClick}>Click Handler</Button>)
    const button = screen.getByText('Click Handler')
    button.click()

    expect(clicked).toBe(true)
  })

  it('should pass through other button attributes', () => {
    render(
      <Button type="submit" aria-label="Submit Form">
        Submit
      </Button>
    )
    const button = screen.getByText('Submit')
    expect(button.getAttribute('type')).toBe('submit')
    expect(button.getAttribute('aria-label')).toBe('Submit Form')
  })
})
