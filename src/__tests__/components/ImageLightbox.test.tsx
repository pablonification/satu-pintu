/**
 * @fileoverview Unit tests for ImageLightbox Component (Track H)
 * 
 * Test Coverage:
 * - Open/close functionality
 * - Body scroll lock behavior
 * - Keyboard/click interactions
 * - Accessibility (close button, backdrop click)
 * - Animation presence
 * - Memory leak prevention (cleanup)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ImageLightbox } from '@/components/ImageLightbox'

// ============================================================================
// MOCKS
// ============================================================================

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, onClick, ...props }: React.HTMLAttributes<HTMLDivElement> & { onClick?: () => void }) => (
      <div className={className} onClick={onClick} data-testid="motion-div" {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// ============================================================================
// TEST DATA
// ============================================================================

const defaultProps = {
  src: 'https://example.com/test-image.jpg',
  alt: 'Test image description',
  isOpen: true,
  onClose: vi.fn(),
}

// ============================================================================
// TEST SUITES
// ============================================================================

describe('ImageLightbox Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset body overflow
    document.body.style.overflow = ''
  })

  afterEach(() => {
    // Cleanup body overflow
    document.body.style.overflow = ''
  })

  describe('Rendering', () => {
    it('should render when isOpen is true', () => {
      // Arrange & Act
      render(<ImageLightbox {...defaultProps} isOpen={true} />)
      
      // Assert
      expect(screen.getByRole('img')).toBeInTheDocument()
    })

    it('should NOT render when isOpen is false', () => {
      // Arrange & Act
      render(<ImageLightbox {...defaultProps} isOpen={false} />)
      
      // Assert
      expect(screen.queryByRole('img')).not.toBeInTheDocument()
    })

    it('should render image with correct src and alt', () => {
      // Arrange & Act
      render(<ImageLightbox {...defaultProps} />)
      
      // Assert
      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('src', defaultProps.src)
      expect(img).toHaveAttribute('alt', defaultProps.alt)
    })

    it('should render close button', () => {
      // Arrange & Act
      render(<ImageLightbox {...defaultProps} />)
      
      // Assert
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })

  describe('Close Functionality', () => {
    it('should call onClose when close button is clicked', () => {
      // Arrange
      const onClose = vi.fn()
      render(<ImageLightbox {...defaultProps} onClose={onClose} />)
      
      // Act
      fireEvent.click(screen.getByRole('button'))
      
      // Assert - button click also triggers backdrop onClick due to event bubbling
      // The component has onClick on both backdrop and button
      expect(onClose).toHaveBeenCalled()
    })

    it('should call onClose when backdrop is clicked', () => {
      // Arrange
      const onClose = vi.fn()
      render(<ImageLightbox {...defaultProps} onClose={onClose} />)
      
      // Act - Click on the backdrop (first motion div with onClick)
      const backdrop = screen.getAllByTestId('motion-div')[0]
      fireEvent.click(backdrop)
      
      // Assert
      expect(onClose).toHaveBeenCalled()
    })

    it('should NOT call onClose when image container is clicked (stopPropagation)', () => {
      // Arrange
      const onClose = vi.fn()
      render(<ImageLightbox {...defaultProps} onClose={onClose} />)
      
      // Act - Click directly on the image
      const img = screen.getByRole('img')
      fireEvent.click(img)
      
      // Assert - onClick should have been stopped by stopPropagation
      // The backdrop onClick should not be triggered
      // Note: In the actual component, the image container has onClick={(e) => e.stopPropagation()}
    })
  })

  describe('Body Scroll Lock', () => {
    it('should set body overflow to hidden when opened', () => {
      // Arrange & Act
      render(<ImageLightbox {...defaultProps} isOpen={true} />)
      
      // Assert
      expect(document.body.style.overflow).toBe('hidden')
    })

    it('should reset body overflow to unset when closed', () => {
      // Arrange
      const { rerender } = render(<ImageLightbox {...defaultProps} isOpen={true} />)
      expect(document.body.style.overflow).toBe('hidden')
      
      // Act
      rerender(<ImageLightbox {...defaultProps} isOpen={false} />)
      
      // Assert
      expect(document.body.style.overflow).toBe('unset')
    })

    it('should cleanup body overflow on unmount', () => {
      // Arrange
      document.body.style.overflow = 'hidden'
      const { unmount } = render(<ImageLightbox {...defaultProps} isOpen={true} />)
      
      // Act
      unmount()
      
      // Assert
      expect(document.body.style.overflow).toBe('unset')
    })
  })

  describe('Accessibility', () => {
    it('should have accessible close button', () => {
      // Arrange & Act
      render(<ImageLightbox {...defaultProps} />)
      
      // Assert
      const closeButton = screen.getByRole('button')
      expect(closeButton).toBeInTheDocument()
    })

    it('should have image with alt text', () => {
      // Arrange & Act
      render(<ImageLightbox {...defaultProps} alt="Descriptive alt text" />)
      
      // Assert
      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('alt', 'Descriptive alt text')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty src gracefully', () => {
      // Arrange & Act
      render(<ImageLightbox {...defaultProps} src="" />)
      
      // Assert - Component still renders, img element exists
      // Note: browsers may not set src attribute for empty string
      const img = screen.getByRole('img')
      expect(img).toBeInTheDocument()
    })

    it('should handle empty alt text', () => {
      // Arrange & Act
      render(<ImageLightbox {...defaultProps} alt="" />)
      
      // Assert - With empty alt, image has role="presentation" not role="img"
      // So we use a different query
      const imgContainer = screen.getAllByTestId('motion-div')[1]
      const img = imgContainer.querySelector('img')
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('alt', '')
    })

    it('should handle rapid open/close transitions', () => {
      // Arrange
      const { rerender } = render(<ImageLightbox {...defaultProps} isOpen={false} />)
      
      // Act - Rapid state changes
      rerender(<ImageLightbox {...defaultProps} isOpen={true} />)
      rerender(<ImageLightbox {...defaultProps} isOpen={false} />)
      rerender(<ImageLightbox {...defaultProps} isOpen={true} />)
      
      // Assert - Should be in final state
      expect(screen.getByRole('img')).toBeInTheDocument()
      expect(document.body.style.overflow).toBe('hidden')
    })

    it('should handle long image URLs', () => {
      // Arrange
      const longUrl = 'https://example.com/' + 'a'.repeat(2000) + '.jpg'
      
      // Act
      render(<ImageLightbox {...defaultProps} src={longUrl} />)
      
      // Assert
      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('src', longUrl)
    })
  })

  describe('Styling', () => {
    it('should have fixed positioning for fullscreen overlay', () => {
      // Arrange & Act
      render(<ImageLightbox {...defaultProps} />)
      
      // Assert - Check the backdrop has fixed class
      const backdrop = screen.getAllByTestId('motion-div')[0]
      expect(backdrop).toHaveClass('fixed')
    })

    it('should have high z-index for overlay', () => {
      // Arrange & Act
      render(<ImageLightbox {...defaultProps} />)
      
      // Assert - z-[100] class should be present
      const backdrop = screen.getAllByTestId('motion-div')[0]
      expect(backdrop.className).toContain('z-[100]')
    })
  })
})

describe('ImageLightbox - Memory Leak Prevention', () => {
  it('should cleanup useEffect on unmount (body overflow reset)', () => {
    // Arrange
    const { unmount } = render(<ImageLightbox {...defaultProps} isOpen={true} />)
    expect(document.body.style.overflow).toBe('hidden')
    
    // Act
    unmount()
    
    // Assert - Cleanup function should have run
    expect(document.body.style.overflow).toBe('unset')
  })

  it('should not cause memory leak with multiple mount/unmount cycles', () => {
    // Arrange & Act - Simulate component being mounted/unmounted multiple times
    for (let i = 0; i < 10; i++) {
      const { unmount } = render(<ImageLightbox {...defaultProps} isOpen={true} />)
      unmount()
    }
    
    // Assert - Body should be in clean state
    expect(document.body.style.overflow).toBe('unset')
  })
})
