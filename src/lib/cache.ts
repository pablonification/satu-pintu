/**
 * Simple in-memory cache for API responses
 * For production, consider using Redis or Vercel KV
 */

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Cleanup expired entries every minute
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => this.cleanup(), 60000)
    }
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data as T
  }

  set<T>(key: string, data: T, ttlSeconds: number): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + (ttlSeconds * 1000)
    })
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  // Delete all keys matching a pattern
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern)
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  // Clear all cache
  clear(): void {
    this.cache.clear()
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }
}

// Singleton instance
export const cache = new MemoryCache()

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  STATS: 30,        // Stats refresh every 30s (dashboard polls every 30s)
  TICKETS_LIST: 10, // Ticket list cache for 10s
  TICKET_DETAIL: 60,// Individual ticket cache for 60s
  ANALYTICS: 300,   // Analytics cache for 5 minutes
  MAP_DATA: 60,     // Map data cache for 60s
} as const

// Helper to generate cache keys
export function getCacheKey(prefix: string, params: Record<string, string | undefined>): string {
  const sortedParams = Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&')
  
  return `${prefix}:${sortedParams || 'default'}`
}

// Invalidate ticket-related caches when ticket is updated
export function invalidateTicketCaches(ticketId?: string): void {
  cache.invalidatePattern('^stats:')
  cache.invalidatePattern('^tickets:')
  cache.invalidatePattern('^analytics:')
  cache.invalidatePattern('^map:')
  
  if (ticketId) {
    cache.delete(`ticket:${ticketId}`)
  }
}
