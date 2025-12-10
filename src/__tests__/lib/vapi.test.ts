/**
 * @fileoverview Unit tests for Vapi helper functions
 */

import { describe, it, expect } from 'vitest'
import {
  formatPhoneForSpeech,
  formatTicketIdForSpeech,
  formatAddressForSpeech,
  getGreetingByTime,
  isValidIndonesianPhone,
  getAssistantConfig,
  isVapiConfigured,
  getWebhookUrl,
} from '@/lib/vapi'

// ============================================================================
// SPEECH FORMATTING TESTS
// ============================================================================

describe('formatPhoneForSpeech', () => {
  it('should format phone number with spaces between digit words', () => {
    const result = formatPhoneForSpeech('085155347701')
    
    // Should contain Indonesian digit words
    expect(result).toContain('nol')
    expect(result).toContain('delapan')
    expect(result).toContain('lima')
  })

  it('should group digits for easier pronunciation', () => {
    const result = formatPhoneForSpeech('081234567890')
    
    // Should have comma separators for grouping
    expect(result).toContain(',')
  })

  it('should handle phone numbers with non-digits', () => {
    const result = formatPhoneForSpeech('+62 812-3456-7890')
    
    // Should still produce valid output
    expect(result).toBeTruthy()
    expect(result).toContain('enam')
    expect(result).toContain('dua')
  })
})

describe('formatTicketIdForSpeech', () => {
  it('should format ticket ID with spelled out components', () => {
    const result = formatTicketIdForSpeech('SP-20251209-0001')
    
    // Should spell out SP
    expect(result).toContain('S P')
    
    // Should contain digit words
    expect(result).toContain('dua')
    expect(result).toContain('nol')
  })

  it('should separate parts with commas', () => {
    const result = formatTicketIdForSpeech('SP-20251209-0001')
    
    expect(result.split(',').length).toBeGreaterThan(1)
  })
})

describe('formatAddressForSpeech', () => {
  it('should expand Jl. to Jalan', () => {
    expect(formatAddressForSpeech('Jl. Dago No. 10')).toContain('Jalan')
  })

  it('should expand Kel. to Kelurahan', () => {
    expect(formatAddressForSpeech('Kel. Lebakgede')).toContain('Kelurahan')
  })

  it('should expand Kec. to Kecamatan', () => {
    expect(formatAddressForSpeech('Kec. Coblong')).toContain('Kecamatan')
  })

  it('should expand No. to Nomor', () => {
    expect(formatAddressForSpeech('No. 123')).toContain('Nomor')
  })

  it('should expand RT and RW', () => {
    const result = formatAddressForSpeech('RT 05 RW 10')
    expect(result).toContain('R T')
    expect(result).toContain('R W')
  })
})

describe('getGreetingByTime', () => {
  it('should return valid greeting', () => {
    const greeting = getGreetingByTime()
    
    expect(['pagi', 'siang', 'sore', 'malam']).toContain(greeting)
  })
})

// ============================================================================
// PHONE VALIDATION TESTS
// ============================================================================

describe('isValidIndonesianPhone', () => {
  it('should validate correct 08xx format', () => {
    expect(isValidIndonesianPhone('081234567890')).toBe(true)
    expect(isValidIndonesianPhone('085155347701')).toBe(true)
    expect(isValidIndonesianPhone('087777888999')).toBe(true)
  })

  it('should validate correct 628xx format', () => {
    expect(isValidIndonesianPhone('6281234567890')).toBe(true)
    expect(isValidIndonesianPhone('6285155347701')).toBe(true)
  })

  it('should reject invalid formats', () => {
    expect(isValidIndonesianPhone('12345')).toBe(false)
    expect(isValidIndonesianPhone('')).toBe(false)
    expect(isValidIndonesianPhone('abcdefghijk')).toBe(false)
  })

  it('should handle numbers with special characters', () => {
    // The function cleans the input, so these should be valid
    expect(isValidIndonesianPhone('+62 812 3456 7890')).toBe(true)
    expect(isValidIndonesianPhone('0812-3456-7890')).toBe(true)
  })
})

// ============================================================================
// ASSISTANT CONFIG TESTS
// ============================================================================

describe('getAssistantConfig', () => {
  it('should return valid assistant configuration', () => {
    const config = getAssistantConfig()
    
    expect(config).toHaveProperty('name')
    expect(config).toHaveProperty('firstMessage')
    expect(config).toHaveProperty('model')
    expect(config).toHaveProperty('voice')
    expect(config).toHaveProperty('server')
    expect(config).toHaveProperty('serverMessages')
    expect(config).toHaveProperty('transcriber')
  })

  it('should have correct model configuration', () => {
    const config = getAssistantConfig()
    
    expect(config.model.provider).toBe('openai')
    expect(config.model.model).toBe('gpt-4o-mini')
    expect(config.model.messages).toHaveLength(1)
    expect(config.model.messages[0].role).toBe('system')
  })

  it('should have tools configured', () => {
    const config = getAssistantConfig()
    
    expect(config.model.tools).toBeDefined()
    expect(Array.isArray(config.model.tools)).toBe(true)
    expect(config.model.tools.length).toBeGreaterThan(0)
  })

  it('should include createTicket tool', () => {
    const config = getAssistantConfig()
    
    const createTicketTool = config.model.tools.find(
      (t: Record<string, unknown>) => 
        t.type === 'function' && 
        (t.function as Record<string, unknown>)?.name === 'createTicket'
    )
    
    expect(createTicketTool).toBeDefined()
  })

  it('should include logEmergency tool', () => {
    const config = getAssistantConfig()
    
    const logEmergencyTool = config.model.tools.find(
      (t: Record<string, unknown>) => 
        t.type === 'function' && 
        (t.function as Record<string, unknown>)?.name === 'logEmergency'
    )
    
    expect(logEmergencyTool).toBeDefined()
  })

  it('should include transferCall tool', () => {
    const config = getAssistantConfig()
    
    const transferCallTool = config.model.tools.find(
      (t: Record<string, unknown>) => t.type === 'transferCall'
    )
    
    expect(transferCallTool).toBeDefined()
  })

  it('should include endCall tool for programmatic call ending', () => {
    const config = getAssistantConfig()
    
    const endCallTool = config.model.tools.find(
      (t: Record<string, unknown>) => t.type === 'endCall'
    )
    
    expect(endCallTool).toBeDefined()
  })

  it('should have Indonesian transcriber with Google Chirp', () => {
    const config = getAssistantConfig()
    
    expect(config.transcriber.provider).toBe('google')
    expect(config.transcriber.model).toBe('chirp')
    expect(config.transcriber.language).toBe('id-ID')
  })

  // Note: Google Chirp doesn't support keyword boosting like Deepgram
  // Accuracy improvement comes from Google's native Indonesian language model

  it('should have ElevenLabs voice configured for Indonesian', () => {
    const config = getAssistantConfig()
    
    expect(config.voice.provider).toBe('11labs')
    expect(config.voice.voiceId).toBe('kSzQ9oZF2iytkgNNztpH')
  })

  it('should accept customerPhone parameter for system prompt', () => {
    const config = getAssistantConfig(undefined, '+6281234567890')
    
    // System prompt should contain the phone number
    const systemPrompt = config.model.messages[0].content
    expect(systemPrompt).toContain('+6281234567890')
  })

  it('should handle missing customerPhone gracefully', () => {
    const config = getAssistantConfig()
    
    // System prompt should indicate phone not detected
    const systemPrompt = config.model.messages[0].content
    expect(systemPrompt).toContain('tidak terdeteksi')
  })

  it('should have stopSpeakingPlan configured for responsive turn-taking', () => {
    const config = getAssistantConfig()
    
    expect(config.stopSpeakingPlan).toBeDefined()
    expect(config.stopSpeakingPlan.numWords).toBe(1) // Stop after 1 word like "ya"
    expect(config.stopSpeakingPlan.voiceSeconds).toBe(0.1) // Detect voice quickly
    expect(config.stopSpeakingPlan.backoffSeconds).toBe(0.8) // Wait before resuming
  })

  it('should have acknowledgementPhrases in stopSpeakingPlan for Indonesian', () => {
    const config = getAssistantConfig()
    
    expect(config.stopSpeakingPlan.acknowledgementPhrases).toBeDefined()
    expect(Array.isArray(config.stopSpeakingPlan.acknowledgementPhrases)).toBe(true)
    
    const phrases = config.stopSpeakingPlan.acknowledgementPhrases as string[]
    // Should include common Indonesian acknowledgement phrases
    expect(phrases).toContain('iya')
    expect(phrases).toContain('ya')
    expect(phrases).toContain('oke')
    expect(phrases).toContain('betul')
    expect(phrases).toContain('bukan')
    expect(phrases).toContain('ga')
  })

  it('should have startSpeakingPlan configured for Indonesian turn detection', () => {
    const config = getAssistantConfig()
    
    expect(config.startSpeakingPlan).toBeDefined()
    expect(config.startSpeakingPlan.smartEndpointingPlan).toBeDefined()
    expect(config.startSpeakingPlan.smartEndpointingPlan.provider).toBe('vapi') // For non-English
    expect(config.startSpeakingPlan.waitSeconds).toBe(0.4)
  })

  it('should have transcriptionEndpointingPlan in startSpeakingPlan', () => {
    const config = getAssistantConfig()
    
    expect(config.startSpeakingPlan.transcriptionEndpointingPlan).toBeDefined()
    expect(config.startSpeakingPlan.transcriptionEndpointingPlan.onPunctuationSeconds).toBe(0.1)
    expect(config.startSpeakingPlan.transcriptionEndpointingPlan.onNoPunctuationSeconds).toBe(1.5)
    expect(config.startSpeakingPlan.transcriptionEndpointingPlan.onNumberSeconds).toBe(0.5)
  })

  it('should have silenceTimeoutSeconds configured for auto-end', () => {
    const config = getAssistantConfig()
    
    // Should be configured to end call after 30 seconds of silence (increased for web calls)
    expect(config.silenceTimeoutSeconds).toBe(30)
  })

  it('should have server URL configured', () => {
    const config = getAssistantConfig()
    
    expect(config.server.url).toBeDefined()
    expect(config.server.url).toContain('/api/vapi/webhook')
  })

  it('should use custom webhook URL when provided', () => {
    const customUrl = 'https://custom.example.com/webhook'
    const config = getAssistantConfig(customUrl)
    
    expect(config.server.url).toBe(customUrl)
  })

  it('should have required serverMessages', () => {
    const config = getAssistantConfig()
    
    expect(config.serverMessages).toContain('tool-calls')
    expect(config.serverMessages).toContain('status-update')
    expect(config.serverMessages).toContain('end-of-call-report')
  })
})

describe('getWebhookUrl', () => {
  it('should return webhook URL', () => {
    const url = getWebhookUrl()
    expect(url).toContain('/api/vapi/webhook')
  })
})

describe('isVapiConfigured', () => {
  it('should return configuration status object', () => {
    const status = isVapiConfigured()
    
    expect(status).toHaveProperty('serverReady')
    expect(status).toHaveProperty('clientReady')
    expect(status).toHaveProperty('phoneReady')
    expect(status).toHaveProperty('missing')
    
    expect(typeof status.serverReady).toBe('boolean')
    expect(typeof status.clientReady).toBe('boolean')
    expect(typeof status.phoneReady).toBe('boolean')
    expect(Array.isArray(status.missing)).toBe(true)
  })
})

// ============================================================================
// SYSTEM PROMPT TESTS
// ============================================================================

describe('System Prompt Content', () => {
  it('should include conversation flow stages', () => {
    const config = getAssistantConfig()
    const systemPrompt = config.model.messages[0].content
    
    // Check for key flow stages
    expect(systemPrompt).toContain('PENERIMAAN KELUHAN')
    expect(systemPrompt).toContain('KONFIRMASI PEMAHAMAN')
    expect(systemPrompt).toContain('PENGUMPULAN DATA')
    expect(systemPrompt).toContain('PEMBUATAN TIKET')
  })

  it('should include category definitions', () => {
    const config = getAssistantConfig()
    const systemPrompt = config.model.messages[0].content
    
    expect(systemPrompt).toContain('DARURAT')
    expect(systemPrompt).toContain('INFRA')
    expect(systemPrompt).toContain('KEBERSIHAN')
    expect(systemPrompt).toContain('SOSIAL')
    expect(systemPrompt).toContain('LAINNYA')
  })

  it('should include urgency levels', () => {
    const config = getAssistantConfig()
    const systemPrompt = config.model.messages[0].content
    
    expect(systemPrompt).toContain('CRITICAL')
    expect(systemPrompt).toContain('HIGH')
    expect(systemPrompt).toContain('MEDIUM')
    expect(systemPrompt).toContain('LOW')
  })

  it('should include landmark references', () => {
    const config = getAssistantConfig()
    const systemPrompt = config.model.messages[0].content
    
    expect(systemPrompt).toContain('PVJ')
    expect(systemPrompt).toContain('ITB')
    expect(systemPrompt).toContain('Gedung Sate')
  })

  it('should include emergency handling instructions', () => {
    const config = getAssistantConfig()
    const systemPrompt = config.model.messages[0].content
    
    expect(systemPrompt).toContain('logEmergency')
    expect(systemPrompt).toContain('transferCall')
    expect(systemPrompt).toContain('112')
  })
})
