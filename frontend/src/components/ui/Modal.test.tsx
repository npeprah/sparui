import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Modal, ConfirmModal } from './Modal'

describe('Modal', () => {
  it('should not render when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={() => {}}>
        <div>Modal Content</div>
      </Modal>
    )

    expect(screen.queryByText('Modal Content')).not.toBeInTheDocument()
  })

  it('should render when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        <div>Modal Content</div>
      </Modal>
    )

    expect(screen.getByText('Modal Content')).toBeInTheDocument()
  })

  it('should render title when provided', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Title">
        <div>Content</div>
      </Modal>
    )

    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  it('should render close button by default', () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        <div>Content</div>
      </Modal>
    )

    const closeButton = screen.getByRole('button', { name: 'Close modal' })
    expect(closeButton).toBeInTheDocument()
  })

  it('should not render close button when showCloseButton is false', () => {
    const { container } = render(
      <Modal isOpen={true} onClose={() => {}} showCloseButton={false}>
        <div>Content</div>
      </Modal>
    )

    const buttons = container.querySelectorAll('button')
    expect(buttons.length).toBe(0)
  })

  it('should call onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(
      <Modal isOpen={true} onClose={onClose}>
        <div>Content</div>
      </Modal>
    )

    const closeButton = screen.getByRole('button', { name: 'Close modal' })
    closeButton.click()

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should call onClose when backdrop is clicked', () => {
    const onClose = vi.fn()
    const { container } = render(
      <Modal isOpen={true} onClose={onClose}>
        <div>Content</div>
      </Modal>
    )

    const backdrop = container.querySelector('.fixed')
    backdrop?.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(onClose).toHaveBeenCalled()
  })

  it('should not close when modal content is clicked', () => {
    const onClose = vi.fn()
    render(
      <Modal isOpen={true} onClose={onClose}>
        <div>Content</div>
      </Modal>
    )

    const content = screen.getByText('Content')
    content.click()

    expect(onClose).not.toHaveBeenCalled()
  })

  it('should apply sm size', () => {
    const { container } = render(
      <Modal isOpen={true} onClose={() => {}} size="sm">
        <div>Content</div>
      </Modal>
    )

    const modalContent = container.querySelector('.bg-gray-800')
    expect(modalContent?.className).toContain('max-w-md')
  })

  it('should apply md size by default', () => {
    const { container } = render(
      <Modal isOpen={true} onClose={() => {}}>
        <div>Content</div>
      </Modal>
    )

    const modalContent = container.querySelector('.bg-gray-800')
    expect(modalContent?.className).toContain('max-w-2xl')
  })

  it('should apply lg size', () => {
    const { container } = render(
      <Modal isOpen={true} onClose={() => {}} size="lg">
        <div>Content</div>
      </Modal>
    )

    const modalContent = container.querySelector('.bg-gray-800')
    expect(modalContent?.className).toContain('max-w-4xl')
  })

  it('should be full-screen on mobile', () => {
    const { container } = render(
      <Modal isOpen={true} onClose={() => {}}>
        <div>Content</div>
      </Modal>
    )

    const modalContent = container.querySelector('.bg-gray-800')
    // Should have responsive classes for full-screen on mobile
    expect(modalContent?.className).toMatch(/md:max-w/)
  })
})

describe('ConfirmModal', () => {
  it('should render with provided title and message', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onClose={() => {}}
        onConfirm={() => {}}
        title="Confirm Action"
        message="Are you sure?"
      />
    )

    expect(screen.getByText('Confirm Action')).toBeInTheDocument()
    expect(screen.getByText('Are you sure?')).toBeInTheDocument()
  })

  it('should render default button text', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onClose={() => {}}
        onConfirm={() => {}}
        title="Confirm Action"
        message="Message"
      />
    )

    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('should render custom button text', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onClose={() => {}}
        onConfirm={() => {}}
        title="Delete"
        message="Message"
        confirmText="Delete Now"
        cancelText="Go Back"
      />
    )

    expect(screen.getByText('Delete Now')).toBeInTheDocument()
    expect(screen.getByText('Go Back')).toBeInTheDocument()
  })

  it('should call onConfirm and onClose when confirm button is clicked', () => {
    const onConfirm = vi.fn()
    const onClose = vi.fn()

    render(
      <ConfirmModal
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        title="Confirm Action"
        message="Message"
      />
    )

    const confirmButton = screen.getByRole('button', { name: 'Confirm' })
    confirmButton.click()

    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should call only onClose when cancel button is clicked', () => {
    const onConfirm = vi.fn()
    const onClose = vi.fn()

    render(
      <ConfirmModal
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        title="Confirm"
        message="Message"
      />
    )

    const cancelButton = screen.getByText('Cancel')
    cancelButton.click()

    expect(onConfirm).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
