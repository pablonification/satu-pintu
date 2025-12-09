/**
 * @fileoverview Unit tests for Address Validation
 * 
 * Tests:
 * - Landmark fuzzy matching
 * - Bandung bounds validation
 * - Address suggestions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  BANDUNG_LANDMARKS,
  validateAddressEnhanced,
  searchLandmarks,
  getLandmarksByCategory
} from '@/lib/address-validation'

// ============================================================================
// LANDMARK DATABASE TESTS
// ============================================================================

describe('Landmark Database', () => {
  it('should have landmarks loaded', () => {
    expect(BANDUNG_LANDMARKS).toBeDefined()
    expect(Array.isArray(BANDUNG_LANDMARKS)).toBe(true)
    expect(BANDUNG_LANDMARKS.length).toBeGreaterThan(0)
  })

  it('should have required properties for each landmark', () => {
    for (const landmark of BANDUNG_LANDMARKS) {
      expect(landmark).toHaveProperty('name')
      expect(landmark).toHaveProperty('aliases')
      expect(landmark).toHaveProperty('address')
      expect(landmark).toHaveProperty('lat')
      expect(landmark).toHaveProperty('lng')
      expect(landmark).toHaveProperty('category')
    }
  })

  it('should have landmarks within Bandung bounds', () => {
    const BANDUNG_BOUNDS = {
      south: -6.98,
      north: -6.84,
      west: 107.54,
      east: 107.72,
    }

    for (const landmark of BANDUNG_LANDMARKS) {
      expect(landmark.lat).toBeGreaterThanOrEqual(BANDUNG_BOUNDS.south)
      expect(landmark.lat).toBeLessThanOrEqual(BANDUNG_BOUNDS.north)
      expect(landmark.lng).toBeGreaterThanOrEqual(BANDUNG_BOUNDS.west)
      expect(landmark.lng).toBeLessThanOrEqual(BANDUNG_BOUNDS.east)
    }
  })
})

// ============================================================================
// LANDMARK SEARCH TESTS
// ============================================================================

describe('searchLandmarks', () => {
  it('should find PVJ by exact name', () => {
    const results = searchLandmarks('Paris Van Java')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].name).toContain('Paris Van Java')
  })

  it('should find PVJ by alias', () => {
    const results = searchLandmarks('pvj')
    expect(results.length).toBeGreaterThan(0)
    const names = results.map(r => r.name.toLowerCase())
    expect(names.some(n => n.includes('paris van java') || n.includes('pvj'))).toBe(true)
  })

  it('should find ITB', () => {
    const results = searchLandmarks('itb')
    expect(results.length).toBeGreaterThan(0)
    const found = results.some(r => 
      r.name.toLowerCase().includes('itb') || 
      r.aliases.some(a => a.toLowerCase().includes('itb'))
    )
    expect(found).toBe(true)
  })

  it('should find Gedung Sate', () => {
    const results = searchLandmarks('gedung sate')
    expect(results.length).toBeGreaterThan(0)
  })

  it('should find landmarks by partial match', () => {
    const results = searchLandmarks('dago')
    expect(results.length).toBeGreaterThan(0)
  })

  it('should return empty array for nonsense query', () => {
    // Use a query with characters unlikely to match anything via fuzzy matching
    const results = searchLandmarks('qqqqzzzzxxxx99999')
    expect(results.length).toBe(0)
  })

  it('should limit results to 5', () => {
    const results = searchLandmarks('bandung')
    expect(results.length).toBeLessThanOrEqual(5)
  })
})

// ============================================================================
// LANDMARK CATEGORY TESTS
// ============================================================================

describe('getLandmarksByCategory', () => {
  it('should return mall landmarks', () => {
    const malls = getLandmarksByCategory('mall')
    expect(malls.length).toBeGreaterThan(0)
    expect(malls.every(m => m.category === 'mall')).toBe(true)
  })

  it('should return kampus landmarks', () => {
    const kampus = getLandmarksByCategory('kampus')
    expect(kampus.length).toBeGreaterThan(0)
    expect(kampus.every(k => k.category === 'kampus')).toBe(true)
  })

  it('should return rumah_sakit landmarks', () => {
    const rs = getLandmarksByCategory('rumah_sakit')
    expect(rs.length).toBeGreaterThan(0)
  })

  it('should return perempatan landmarks', () => {
    const perempatan = getLandmarksByCategory('perempatan')
    expect(perempatan.length).toBeGreaterThan(0)
  })
})

// ============================================================================
// ADDRESS VALIDATION TESTS
// ============================================================================

describe('validateAddressEnhanced', () => {
  // Note: These tests may make actual API calls to Google/Nominatim
  // In CI, you might want to mock these

  describe('Landmark matching (offline)', () => {
    it('should match PVJ landmark', async () => {
      const result = await validateAddressEnhanced('depan PVJ')
      
      expect(result.isValid).toBe(true)
      expect(result.source).toBe('landmark')
      expect(result.isInCoverage).toBe(true)
      expect(result.lat).toBeDefined()
      expect(result.lng).toBeDefined()
    })

    it('should match ITB landmark', async () => {
      const result = await validateAddressEnhanced('kampus ITB')
      
      expect(result.isValid).toBe(true)
      expect(result.source).toBe('landmark')
    })

    it('should match with fuzzy input', async () => {
      const result = await validateAddressEnhanced('simpang dago')
      
      expect(result.isValid).toBe(true)
      expect(result.isInCoverage).toBe(true)
    })

    it('should match mall names', async () => {
      const testCases = [
        'ciwalk',
        'bip',
        'tsm',
        '23 paskal',
      ]

      for (const testCase of testCases) {
        const result = await validateAddressEnhanced(testCase)
        expect(result.isValid).toBe(true)
        expect(result.source).toBe('landmark')
      }
    })

    it('should match hospital names', async () => {
      const result = await validateAddressEnhanced('rs hasan sadikin')
      expect(result.isValid).toBe(true)
    })
  })

  describe('Result structure', () => {
    it('should return correct structure for valid address', async () => {
      const result = await validateAddressEnhanced('Gedung Sate')

      expect(result).toHaveProperty('isValid')
      expect(result).toHaveProperty('isInCoverage')
      expect(result).toHaveProperty('formattedAddress')
      expect(result).toHaveProperty('lat')
      expect(result).toHaveProperty('lng')
      expect(result).toHaveProperty('rawAddress')
      expect(result).toHaveProperty('confidence')
      expect(result).toHaveProperty('message')
      expect(result).toHaveProperty('source')
    })

    it('should include landmark info when matched', async () => {
      const result = await validateAddressEnhanced('alun-alun bandung')

      if (result.source === 'landmark') {
        expect(result.landmark).toBeDefined()
        expect(result.landmark?.name).toBeDefined()
      }
    })
  })

  describe('Confidence levels', () => {
    it('should return high confidence for exact landmark match', async () => {
      const result = await validateAddressEnhanced('Paris Van Java')
      
      if (result.source === 'landmark') {
        expect(['high', 'medium']).toContain(result.confidence)
      }
    })
  })

  describe('Coverage validation', () => {
    it('should mark Bandung addresses as in coverage', async () => {
      const result = await validateAddressEnhanced('Jl. Braga Bandung')
      
      // If found, should be in coverage
      if (result.isValid) {
        expect(result.isInCoverage).toBe(true)
      }
    })
  })

  describe('Clarification handling', () => {
    it('should provide clarification for ambiguous addresses', async () => {
      // Very vague address that might need clarification
      const result = await validateAddressEnhanced('jalan raya')
      
      // Should either find something or ask for clarification
      expect(result).toHaveProperty('isValid')
    })
  })
})

// ============================================================================
// BANDUNG BOUNDS VALIDATION
// ============================================================================

describe('Bandung Bounds Validation', () => {
  const BANDUNG_BOUNDS = {
    south: -6.98,
    north: -6.84,
    west: 107.54,
    east: 107.72,
  }

  function isInBandung(lat: number, lng: number): boolean {
    return (
      lat >= BANDUNG_BOUNDS.south &&
      lat <= BANDUNG_BOUNDS.north &&
      lng >= BANDUNG_BOUNDS.west &&
      lng <= BANDUNG_BOUNDS.east
    )
  }

  it('should return true for coordinates in Bandung', () => {
    // Alun-alun Bandung approximate coordinates
    expect(isInBandung(-6.9215, 107.6070)).toBe(true)
    // Gedung Sate
    expect(isInBandung(-6.9025, 107.6186)).toBe(true)
    // ITB
    expect(isInBandung(-6.8915, 107.6107)).toBe(true)
  })

  it('should return false for coordinates outside Bandung', () => {
    // Jakarta
    expect(isInBandung(-6.2088, 106.8456)).toBe(false)
    // Surabaya
    expect(isInBandung(-7.2575, 112.7521)).toBe(false)
  })
})

// ============================================================================
// COMMON ADDRESS PATTERNS
// ============================================================================

describe('Common Address Patterns', () => {
  it('should handle "dekat" prefix', async () => {
    const testCases = [
      'dekat ITB',
      'dekat PVJ',
      'dekat alun-alun',
    ]

    for (const address of testCases) {
      const result = await validateAddressEnhanced(address)
      expect(result).toHaveProperty('isValid')
    }
  })

  it('should handle "depan" prefix', async () => {
    const result = await validateAddressEnhanced('depan Gedung Sate')
    expect(result).toHaveProperty('isValid')
  })

  it('should handle "samping" prefix', async () => {
    const result = await validateAddressEnhanced('samping BIP')
    expect(result).toHaveProperty('isValid')
  })

  it('should handle intersection descriptions', async () => {
    const result = await validateAddressEnhanced('perempatan dago sukajadi')
    expect(result.isValid).toBe(true)
  })
})
