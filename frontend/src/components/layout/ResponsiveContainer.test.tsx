import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ResponsiveContainer } from './ResponsiveContainer'

describe('ResponsiveContainer', () => {
  it('should render children', () => {
    render(
      <ResponsiveContainer>
        <div>Test Content</div>
      </ResponsiveContainer>
    )

    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('should apply default max-width of lg', () => {
    const { container } = render(
      <ResponsiveContainer>
        <div>Content</div>
      </ResponsiveContainer>
    )

    const element = container.firstChild as HTMLElement
    expect(element.className).toContain('max-w-7xl')
  })

  it('should apply sm max-width', () => {
    const { container } = render(
      <ResponsiveContainer maxWidth="sm">
        <div>Content</div>
      </ResponsiveContainer>
    )

    const element = container.firstChild as HTMLElement
    expect(element.className).toContain('max-w-3xl')
  })

  it('should apply md max-width', () => {
    const { container } = render(
      <ResponsiveContainer maxWidth="md">
        <div>Content</div>
      </ResponsiveContainer>
    )

    const element = container.firstChild as HTMLElement
    expect(element.className).toContain('max-w-5xl')
  })

  it('should apply xl max-width', () => {
    const { container } = render(
      <ResponsiveContainer maxWidth="xl">
        <div>Content</div>
      </ResponsiveContainer>
    )

    const element = container.firstChild as HTMLElement
    expect(element.className).toContain('max-w-screen-xl')
  })

  it('should apply full max-width', () => {
    const { container } = render(
      <ResponsiveContainer maxWidth="full">
        <div>Content</div>
      </ResponsiveContainer>
    )

    const element = container.firstChild as HTMLElement
    expect(element.className).toContain('max-w-full')
  })

  it('should apply padding by default', () => {
    const { container } = render(
      <ResponsiveContainer>
        <div>Content</div>
      </ResponsiveContainer>
    )

    const element = container.firstChild as HTMLElement
    expect(element.className).toContain('px-4')
  })

  it('should not apply padding when padding is false', () => {
    const { container } = render(
      <ResponsiveContainer padding={false}>
        <div>Content</div>
      </ResponsiveContainer>
    )

    const element = container.firstChild as HTMLElement
    expect(element.className).not.toContain('px-4')
  })

  it('should center content with mx-auto', () => {
    const { container } = render(
      <ResponsiveContainer>
        <div>Content</div>
      </ResponsiveContainer>
    )

    const element = container.firstChild as HTMLElement
    expect(element.className).toContain('mx-auto')
  })

  it('should apply custom className', () => {
    const { container } = render(
      <ResponsiveContainer className="custom-class">
        <div>Content</div>
      </ResponsiveContainer>
    )

    const element = container.firstChild as HTMLElement
    expect(element.className).toContain('custom-class')
  })

  it('should combine all classes correctly', () => {
    const { container } = render(
      <ResponsiveContainer maxWidth="md" padding={true} className="bg-gray-900">
        <div>Content</div>
      </ResponsiveContainer>
    )

    const element = container.firstChild as HTMLElement
    expect(element.className).toContain('max-w-5xl')
    expect(element.className).toContain('mx-auto')
    expect(element.className).toContain('px-4')
    expect(element.className).toContain('bg-gray-900')
  })

  it('should render as a div by default', () => {
    const { container } = render(
      <ResponsiveContainer>
        <div>Content</div>
      </ResponsiveContainer>
    )

    expect(container.firstChild?.nodeName).toBe('DIV')
  })
})
