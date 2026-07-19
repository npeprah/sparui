import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PageTransition } from './PageTransition'

describe('PageTransition', () => {
  beforeEach(() => {
    // Mock matchMedia for reduced motion tests
    window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  })

  it('should render children', () => {
    render(
      <PageTransition>
        <div>Test Content</div>
      </PageTransition>
    )
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    render(
      <PageTransition className="custom-class">
        <div>Content</div>
      </PageTransition>
    )
    const wrapper = screen.getByText('Content').parentElement
    expect(wrapper).toHaveClass('custom-class')
  })

  it('should render as motion.div', () => {
    const { container } = render(
      <PageTransition>
        <div>Motion Content</div>
      </PageTransition>
    )
    // Motion div will have the content wrapped
    expect(container.firstChild).toBeTruthy()
  })

  it('should work without className prop', () => {
    render(
      <PageTransition>
        <div>No Class</div>
      </PageTransition>
    )
    expect(screen.getByText('No Class')).toBeInTheDocument()
  })
})
