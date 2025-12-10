/**
 * @fileoverview Unit tests for MobileNav Component (Track H)
 * 
 * Test Coverage:
 * - Open/close state rendering
 * - Navigation link rendering
 * - Body scroll lock behavior
 * - Accessibility (close button, backdrop)
 * - Animation presence
 * - Link click handling (onClose callback)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MobileNav } from '@/components/MobileNav'

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

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, onClick, className }: { 
    children: React.ReactNode
    href: string
    onClick?: () => void
    className?: string
  }) => (
    <a href={href} onClick={onClick} className={className} data-testid="nav-link">
      {children}
    </a>
  ),
}))

// ============================================================================
// TEST DATA
// ============================================================================

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
}

const NAVIGATION_ITEMS = [
  { label: 'Beranda', href: '/' },
  { label: 'Fitur', href: '#features' },
  { label: 'Lapor', href: '#report' },
  { label: 'Cara Kerja', href: '#how-it-works' },
  { label: 'Lacak Laporan', href: '/track/SP-20251203-0001' },
  { label: 'Login Dinas', href: '/login' },
]

// ============================================================================
// TEST SUITES
// ============================================================================

describe('MobileNav Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    document.body.style.overflow = ''
  })

  afterEach(() => {
    document.body.style.overflow = ''
  })

  describe('Rendering', () => {
    it('should render when isOpen is true', () => {
      // Arrange & Act
      render(<MobileNav {...defaultProps} isOpen={true} />)
      
      // Assert - Logo is now an image with alt text
      expect(screen.getByAltText('SatuPintu')).toBeInTheDocument()
    })

    it('should NOT render when isOpen is false', () => {
      // Arrange & Act
      render(<MobileNav {...defaultProps} isOpen={false} />)
      
      // Assert
      expect(screen.queryByAltText('SatuPintu')).not.toBeInTheDocument()
    })

    it('should render brand logo and name', () => {
      // Arrange & Act
      render(<MobileNav {...defaultProps} />)
      
      // Assert - Logo is now an image
      expect(screen.getByAltText('SatuPintu')).toBeInTheDocument()
    })

    it('should render close button', () => {
      // Arrange & Act
      render(<MobileNav {...defaultProps} />)
      
      // Assert
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThanOrEqual(1)
    })

    it('should render "Lapor Sekarang" CTA button', () => {
      // Arrange & Act
      render(<MobileNav {...defaultProps} />)
      
      // Assert
      expect(screen.getByText('Lapor Sekarang')).toBeInTheDocument()
    })
  })

  describe('Navigation Links', () => {
    it.each(NAVIGATION_ITEMS)('should render navigation link: $label', ({ label }) => {
      // Arrange & Act
      render(<MobileNav {...defaultProps} />)
      
      // Assert
      expect(screen.getByText(label)).toBeInTheDocument()
    })

    it('should call onClose when a navigation link is clicked', () => {
      // Arrange
      const onClose = vi.fn()
      render(<MobileNav isOpen={true} onClose={onClose} />)
      
      // Act
      const fiturLink = screen.getByText('Fitur')
      fireEvent.click(fiturLink)
      
      // Assert
      expect(onClose).toHaveBeenCalled()
    })

    it('should have correct href for each navigation link', () => {
      // Arrange & Act
      render(<MobileNav {...defaultProps} />)
      
      // Assert - navigation now includes Beranda and Lapor
      const links = screen.getAllByTestId('nav-link')
      expect(links[0]).toHaveAttribute('href', '/')
      expect(links[1]).toHaveAttribute('href', '#features')
      expect(links[2]).toHaveAttribute('href', '#report')
      expect(links[3]).toHaveAttribute('href', '#how-it-works')
      expect(links[4]).toHaveAttribute('href', '/track/SP-20251203-0001')
      expect(links[5]).toHaveAttribute('href', '/login')
    })
  })

  describe('Close Functionality', () => {
    it('should call onClose when close button is clicked', () => {
      // Arrange
      const onClose = vi.fn()
      render(<MobileNav isOpen={true} onClose={onClose} />)
      
      // Act
      const buttons = screen.getAllByRole('button')
      const closeButton = buttons[0] // First button is close
      fireEvent.click(closeButton)
      
      // Assert
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should call onClose when backdrop is clicked', () => {
      // Arrange
      const onClose = vi.fn()
      render(<MobileNav isOpen={true} onClose={onClose} />)
      
      // Act
      const motionDivs = screen.getAllByTestId('motion-div')
      const backdrop = motionDivs[0] // First motion div is backdrop
      fireEvent.click(backdrop)
      
      // Assert
      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('Body Scroll Lock', () => {
    it('should set body overflow to hidden when opened', () => {
      // Arrange & Act
      render(<MobileNav isOpen={true} onClose={vi.fn()} />)
      
      // Assert
      expect(document.body.style.overflow).toBe('hidden')
    })

    it('should reset body overflow to unset when closed', () => {
      // Arrange
      const { rerender } = render(<MobileNav isOpen={true} onClose={vi.fn()} />)
      expect(document.body.style.overflow).toBe('hidden')
      
      // Act
      rerender(<MobileNav isOpen={false} onClose={vi.fn()} />)
      
      // Assert
      expect(document.body.style.overflow).toBe('unset')
    })

    it('should cleanup body overflow on unmount', () => {
      // Arrange
      const { unmount } = render(<MobileNav isOpen={true} onClose={vi.fn()} />)
      expect(document.body.style.overflow).toBe('hidden')
      
      // Act
      unmount()
      
      // Assert
      expect(document.body.style.overflow).toBe('unset')
    })
  })

  describe('Accessibility', () => {
    it('should have clickable close button', () => {
      // Arrange & Act
      render(<MobileNav {...defaultProps} />)
      
      // Assert
      const buttons = screen.getAllByRole('button')
      expect(buttons[0]).toBeInTheDocument()
    })

    it('should render all navigation items as links', () => {
      // Arrange & Act
      render(<MobileNav {...defaultProps} />)
      
      // Assert
      const links = screen.getAllByTestId('nav-link')
      expect(links.length).toBe(NAVIGATION_ITEMS.length)
    })
  })

  describe('Responsive Design', () => {
    it('should have md:hidden class for mobile-only visibility', () => {
      // Arrange & Act
      render(<MobileNav {...defaultProps} />)
      
      // Assert - Check backdrop has md:hidden
      const backdrop = screen.getAllByTestId('motion-div')[0]
      expect(backdrop.className).toContain('md:hidden')
    })

    it('should have max-width constraint on menu panel', () => {
      // Arrange & Act
      render(<MobileNav {...defaultProps} />)
      
      // Assert - Check menu panel has max-w-sm
      const menuPanel = screen.getAllByTestId('motion-div')[1]
      expect(menuPanel.className).toContain('max-w-sm')
    })
  })

  describe('Animation Properties', () => {
    it('should render with AnimatePresence wrapper', () => {
      // Arrange & Act
      render(<MobileNav {...defaultProps} />)
      
      // Assert - Component should render motion elements
      const motionDivs = screen.getAllByTestId('motion-div')
      expect(motionDivs.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('Edge Cases', () => {
    it('should handle rapid open/close transitions', () => {
      // Arrange
      const onClose = vi.fn()
      const { rerender } = render(<MobileNav isOpen={false} onClose={onClose} />)
      
      // Act - Rapid state changes
      rerender(<MobileNav isOpen={true} onClose={onClose} />)
      rerender(<MobileNav isOpen={false} onClose={onClose} />)
      rerender(<MobileNav isOpen={true} onClose={onClose} />)
      
      // Assert - Should be in final (open) state - logo is now an image
      expect(screen.getByAltText('SatuPintu')).toBeInTheDocument()
    })

    it('should handle onClose being called multiple times', () => {
      // Arrange
      const onClose = vi.fn()
      render(<MobileNav isOpen={true} onClose={onClose} />)
      
      // Act - Click close button multiple times
      const buttons = screen.getAllByRole('button')
      fireEvent.click(buttons[0])
      fireEvent.click(buttons[0])
      fireEvent.click(buttons[0])
      
      // Assert
      expect(onClose).toHaveBeenCalledTimes(3)
    })
  })
})

describe('MobileNav - Memory Leak Prevention', () => {
  it('should cleanup useEffect on unmount', () => {
    // Arrange
    const { unmount } = render(<MobileNav isOpen={true} onClose={vi.fn()} />)
    expect(document.body.style.overflow).toBe('hidden')
    
    // Act
    unmount()
    
    // Assert
    expect(document.body.style.overflow).toBe('unset')
  })

  it('should not leak body styles after multiple mount/unmount cycles', () => {
    // Arrange & Act
    for (let i = 0; i < 10; i++) {
      const { unmount } = render(<MobileNav isOpen={true} onClose={vi.fn()} />)
      unmount()
    }
    
    // Assert
    expect(document.body.style.overflow).toBe('unset')
  })
})
