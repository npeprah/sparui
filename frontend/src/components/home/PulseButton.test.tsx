import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { PulseButton } from './PulseButton'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div data-testid="pulse-wrapper" {...props}>{children}</div>,
  },
}))

describe('PulseButton', () => {
  it('should render children', () => {
    render(
      <PulseButton>
        <button>Click Me</button>
      </PulseButton>
    )

    expect(screen.getByText('Click Me')).toBeInTheDocument()
  })

  it('should wrap children in motion.div', () => {
    render(
      <PulseButton>
        <button>Test Button</button>
      </PulseButton>
    )

    expect(screen.getByTestId('pulse-wrapper')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { container } = render(
      <PulseButton className="custom-class">
        <button>Test</button>
      </PulseButton>
    )

    const wrapper = container.querySelector('.custom-class')
    expect(wrapper).toBeInTheDocument()
  })

  it('should disable animation when disabled prop is true', () => {
    const { container } = render(
      <PulseButton disabled>
        <button>Disabled</button>
      </PulseButton>
    )

    // Should still render but without animation
    expect(screen.getByText('Disabled')).toBeInTheDocument()
  })
})
