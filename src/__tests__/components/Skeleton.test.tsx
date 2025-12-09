/**
 * @fileoverview Unit tests for Skeleton Component (Track H)
 * 
 * Test Coverage:
 * - Basic rendering
 * - Custom className merging
 * - HTML attributes passthrough
 * - Animation class presence
 * - Accessibility considerations
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Skeleton } from '@/components/ui/skeleton'

// ============================================================================
// TEST SUITES
// ============================================================================

describe('Skeleton Component', () => {
  describe('Rendering', () => {
    it('should render a div element', () => {
      // Arrange & Act
      render(<Skeleton data-testid="skeleton" />)
      
      // Assert
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toBeInTheDocument()
      expect(skeleton.tagName).toBe('DIV')
    })

    it('should have default animation class', () => {
      // Arrange & Act
      render(<Skeleton data-testid="skeleton" />)
      
      // Assert
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveClass('animate-pulse')
    })

    it('should have default styling classes', () => {
      // Arrange & Act
      render(<Skeleton data-testid="skeleton" />)
      
      // Assert
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveClass('rounded-md')
      expect(skeleton).toHaveClass('bg-white/10')
    })
  })

  describe('Custom Styling', () => {
    it('should merge custom className with defaults', () => {
      // Arrange & Act
      render(<Skeleton data-testid="skeleton" className="h-10 w-10" />)
      
      // Assert
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveClass('animate-pulse')
      expect(skeleton).toHaveClass('h-10')
      expect(skeleton).toHaveClass('w-10')
    })

    it('should allow overriding default classes', () => {
      // Arrange & Act
      render(<Skeleton data-testid="skeleton" className="rounded-full" />)
      
      // Assert
      const skeleton = screen.getByTestId('skeleton')
      // cn() from tailwind-merge should handle class conflicts
      expect(skeleton).toHaveClass('rounded-full')
    })

    it('should accept complex className combinations', () => {
      // Arrange & Act
      render(
        <Skeleton 
          data-testid="skeleton" 
          className="h-[300px] w-full rounded-lg bg-red-500/10" 
        />
      )
      
      // Assert
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveClass('h-[300px]')
      expect(skeleton).toHaveClass('w-full')
    })
  })

  describe('HTML Attributes Passthrough', () => {
    it('should pass through data-testid attribute', () => {
      // Arrange & Act
      render(<Skeleton data-testid="custom-skeleton" />)
      
      // Assert
      expect(screen.getByTestId('custom-skeleton')).toBeInTheDocument()
    })

    it('should pass through aria attributes', () => {
      // Arrange & Act
      render(
        <Skeleton 
          data-testid="skeleton" 
          aria-label="Loading content"
          aria-busy="true"
        />
      )
      
      // Assert
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveAttribute('aria-label', 'Loading content')
      expect(skeleton).toHaveAttribute('aria-busy', 'true')
    })

    it('should pass through role attribute', () => {
      // Arrange & Act
      render(<Skeleton data-testid="skeleton" role="progressbar" />)
      
      // Assert
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveAttribute('role', 'progressbar')
    })

    it('should pass through style attribute', () => {
      // Arrange & Act
      render(
        <Skeleton 
          data-testid="skeleton" 
          style={{ width: '200px', height: '50px' }}
        />
      )
      
      // Assert
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveStyle({ width: '200px', height: '50px' })
    })
  })

  describe('Common Usage Patterns', () => {
    it('should work as text placeholder', () => {
      // Arrange & Act
      render(<Skeleton data-testid="text-skeleton" className="h-4 w-48" />)
      
      // Assert
      const skeleton = screen.getByTestId('text-skeleton')
      expect(skeleton).toHaveClass('h-4')
      expect(skeleton).toHaveClass('w-48')
    })

    it('should work as avatar placeholder', () => {
      // Arrange & Act
      render(<Skeleton data-testid="avatar-skeleton" className="h-12 w-12 rounded-full" />)
      
      // Assert
      const skeleton = screen.getByTestId('avatar-skeleton')
      expect(skeleton).toHaveClass('h-12')
      expect(skeleton).toHaveClass('w-12')
      expect(skeleton).toHaveClass('rounded-full')
    })

    it('should work as card placeholder', () => {
      // Arrange & Act
      render(<Skeleton data-testid="card-skeleton" className="h-48 w-full rounded-lg" />)
      
      // Assert
      const skeleton = screen.getByTestId('card-skeleton')
      expect(skeleton).toHaveClass('h-48')
      expect(skeleton).toHaveClass('w-full')
      expect(skeleton).toHaveClass('rounded-lg')
    })

    it('should work in a loading group', () => {
      // Arrange & Act
      render(
        <div data-testid="skeleton-group">
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-4 w-28" />
        </div>
      )
      
      // Assert
      const group = screen.getByTestId('skeleton-group')
      const skeletons = group.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBe(3)
    })
  })

  describe('Edge Cases', () => {
    it('should render with no props', () => {
      // Arrange & Act
      const { container } = render(<Skeleton />)
      
      // Assert
      const skeleton = container.firstChild
      expect(skeleton).toBeInTheDocument()
      expect(skeleton).toHaveClass('animate-pulse')
    })

    it('should handle empty className', () => {
      // Arrange & Act
      render(<Skeleton data-testid="skeleton" className="" />)
      
      // Assert
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveClass('animate-pulse')
    })

    it('should handle undefined className', () => {
      // Arrange & Act
      render(<Skeleton data-testid="skeleton" className={undefined} />)
      
      // Assert
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveClass('animate-pulse')
    })
  })

  describe('Accessibility', () => {
    it('should be accessible with proper ARIA attributes', () => {
      // Arrange & Act
      render(
        <Skeleton 
          data-testid="skeleton"
          role="status"
          aria-label="Loading"
        />
      )
      
      // Assert
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveAttribute('role', 'status')
      expect(skeleton).toHaveAttribute('aria-label', 'Loading')
    })

    it('should support screen reader text via aria-label', () => {
      // Arrange & Act
      render(
        <Skeleton 
          data-testid="skeleton"
          aria-label="Content is loading, please wait"
        />
      )
      
      // Assert
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveAttribute('aria-label', 'Content is loading, please wait')
    })
  })
})

describe('Skeleton - Visual Regression Safeguards', () => {
  it('should maintain consistent default appearance', () => {
    // Arrange & Act
    render(<Skeleton data-testid="skeleton" />)
    
    // Assert - Verify critical styling classes
    const skeleton = screen.getByTestId('skeleton')
    const classes = skeleton.className.split(' ')
    
    // Must have animation
    expect(classes).toContain('animate-pulse')
    
    // Must have rounded corners
    expect(classes.some(c => c.startsWith('rounded'))).toBe(true)
    
    // Must have background color
    expect(classes.some(c => c.includes('bg-'))).toBe(true)
  })
})
