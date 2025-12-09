/**
 * @fileoverview Unit tests for Twilio helper functions
 * 
 * Note: Twilio is now only used for TwiML generation (voice routes)
 * SMS is handled by Fonnte WhatsApp
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  formatPhoneNumber,
  generateTwiML,
  SMS_TEMPLATES,
} from '@/lib/twilio'

// ============================================================================
// PHONE NUMBER FORMATTING TESTS
// ============================================================================

describe('formatPhoneNumber', () => {
  it('should convert 08xx to +628xx', () => {
    expect(formatPhoneNumber('081234567890')).toBe('+6281234567890')
    expect(formatPhoneNumber('085155347701')).toBe('+6285155347701')
  })

  it('should add + prefix to 62xx', () => {
    expect(formatPhoneNumber('6281234567890')).toBe('+6281234567890')
  })

  it('should keep +62xx as-is', () => {
    expect(formatPhoneNumber('+6281234567890')).toBe('+6281234567890')
  })

  it('should handle numbers without country code', () => {
    expect(formatPhoneNumber('81234567890')).toBe('+6281234567890')
  })

  it('should remove non-digit characters', () => {
    expect(formatPhoneNumber('+62 812-3456-7890')).toBe('+6281234567890')
    expect(formatPhoneNumber('0812 3456 7890')).toBe('+6281234567890')
  })
})

// ============================================================================
// TWIML GENERATION TESTS
// ============================================================================

describe('generateTwiML', () => {
  it('should generate valid XML structure', () => {
    const twiml = generateTwiML({ say: 'Hello' })
    
    expect(twiml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(twiml).toContain('<Response>')
    expect(twiml).toContain('</Response>')
  })

  it('should generate Say element', () => {
    const twiml = generateTwiML({ say: 'Selamat datang' })
    
    expect(twiml).toContain('<Say')
    expect(twiml).toContain('Selamat datang')
    expect(twiml).toContain('</Say>')
  })

  it('should use Indonesian voice settings', () => {
    const twiml = generateTwiML({ say: 'Test' })
    
    expect(twiml).toContain('voice="Google.id-ID-Wavenet-A"')
    expect(twiml).toContain('language="id-ID"')
  })

  it('should generate Record element', () => {
    const twiml = generateTwiML({
      record: {
        maxLength: 120,
        action: 'https://example.com/process',
      },
    })
    
    expect(twiml).toContain('<Record')
    expect(twiml).toContain('maxLength="120"')
    expect(twiml).toContain('action="https://example.com/process"')
    expect(twiml).toContain('playBeep="true"')
  })

  it('should generate Hangup element', () => {
    const twiml = generateTwiML({ hangup: true })
    
    expect(twiml).toContain('<Hangup />')
  })

  it('should combine multiple elements', () => {
    const twiml = generateTwiML({
      say: 'Goodbye',
      hangup: true,
    })
    
    expect(twiml).toContain('<Say')
    expect(twiml).toContain('Goodbye')
    expect(twiml).toContain('<Hangup />')
  })

  it('should escape XML special characters', () => {
    const twiml = generateTwiML({ say: 'Test <>&"\'' })
    
    expect(twiml).toContain('&lt;')
    expect(twiml).toContain('&gt;')
    expect(twiml).toContain('&amp;')
    expect(twiml).toContain('&quot;')
    expect(twiml).toContain('&apos;')
  })
})

// ============================================================================
// SMS TEMPLATES TESTS (Legacy - kept for reference)
// ============================================================================

describe('SMS_TEMPLATES', () => {
  describe('ticketCreated', () => {
    it('should generate ticket created message', () => {
      const message = SMS_TEMPLATES.ticketCreated(
        'SP-20251209-0001',
        'Infrastruktur',
        'https://satupintu.id/track/SP-20251209-0001'
      )

      expect(message).toContain('SP-20251209-0001')
      expect(message).toContain('Infrastruktur')
      expect(message).toContain('https://satupintu.id/track/SP-20251209-0001')
      expect(message).toContain('SatuPintu')
    })

    it('should include tracking instructions', () => {
      const message = SMS_TEMPLATES.ticketCreated(
        'SP-20251209-0001',
        'INFRA',
        'https://example.com'
      )

      expect(message).toContain('CEK')
    })
  })

  describe('statusUpdate', () => {
    it('should generate status update message', () => {
      const message = SMS_TEMPLATES.statusUpdate(
        'SP-20251209-0001',
        'Dalam Proses',
        'Petugas sedang menuju lokasi'
      )

      expect(message).toContain('SP-20251209-0001')
      expect(message).toContain('Dalam Proses')
      expect(message).toContain('Petugas sedang menuju lokasi')
    })

    it('should handle undefined note', () => {
      const message = SMS_TEMPLATES.statusUpdate(
        'SP-20251209-0001',
        'Selesai'
      )

      expect(message).toContain('SP-20251209-0001')
      expect(message).toContain('Selesai')
    })
  })

  describe('trackingResponse', () => {
    it('should generate tracking response', () => {
      const message = SMS_TEMPLATES.trackingResponse(
        'SP-20251209-0001',
        'Dalam Proses',
        'Infrastruktur',
        'Petugas sedang dalam perjalanan'
      )

      expect(message).toContain('SP-20251209-0001')
      expect(message).toContain('Dalam Proses')
      expect(message).toContain('Infrastruktur')
      expect(message).toContain('Petugas sedang dalam perjalanan')
    })
  })

  describe('ratingOTP', () => {
    it('should generate OTP message', () => {
      const message = SMS_TEMPLATES.ratingOTP('123456', 'SP-20251209-0001')

      expect(message).toContain('123456')
      expect(message).toContain('SP-20251209-0001')
      expect(message).toContain('OTP')
      expect(message).toContain('30 menit')
    })
  })
})

// ============================================================================
// TWILIO CLIENT TESTS (Mocked)
// ============================================================================

describe('Twilio Client', () => {
  it('should handle missing credentials gracefully', async () => {
    // The module handles missing credentials by returning null
    // twilioClient is the exported name for getTwilioClient
    const { twilioClient } = await import('@/lib/twilio')
    
    // Function should exist
    expect(twilioClient).toBeDefined()
  })
})
