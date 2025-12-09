/**
 * @fileoverview Test setup file for Vitest
 * 
 * This file is loaded before all tests run.
 * It sets up testing utilities and global mocks.
 */

import '@testing-library/jest-dom/vitest'

// Mock window.matchMedia for components that use media queries
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

// Mock IntersectionObserver for lazy-loading components
class MockIntersectionObserver {
  readonly root: Element | null = null
  readonly rootMargin: string = ''
  readonly thresholds: ReadonlyArray<number> = []
  
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] { return [] }
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: MockIntersectionObserver,
})

// Mock ResizeObserver for components that track size
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: MockResizeObserver,
})

// Mock scrollTo for components that scroll
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: () => {},
})

// Mock AudioContext for sound components (dashboard critical alerts)
class MockAudioContext {
  state = 'running'
  resume() { return Promise.resolve() }
  createOscillator() {
    return {
      connect: () => {},
      start: () => {},
      stop: () => {},
      frequency: { value: 0 },
      type: 'sine',
    }
  }
  createGain() {
    return {
      connect: () => {},
      gain: {
        setValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {},
      },
    }
  }
  get destination() { return {} }
  get currentTime() { return 0 }
}

Object.defineProperty(window, 'AudioContext', {
  writable: true,
  value: MockAudioContext,
})

// Suppress console errors during tests (optional - remove if you want to see them)
// const originalError = console.error
// console.error = (...args: unknown[]) => {
//   if (typeof args[0] === 'string' && args[0].includes('Warning: ReactDOM.render')) {
//     return
//   }
//   originalError.call(console, ...args)
// }
