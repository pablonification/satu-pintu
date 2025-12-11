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
  it('should format phone number with Indonesian digit words', () => {
    const result = formatPhoneForSpeech('085155347701')
    
    // Should contain Indonesian digit words
    expect(result).toContain('nol')
    expect(result).toContain('delapan')
    expect(result).toContain('lima')
    
    // Should be grouped per 4 digits with comma separator
    expect(result).toBe('nol delapan lima satu, lima lima tiga empat, tujuh tujuh nol satu')
  })

  it('should group digits per 4 for easier pronunciation', () => {
    const result = formatPhoneForSpeech('081234567890')
    
    // Should have comma separators for grouping (per 4 digits)
    expect(result).toContain(',')
    // 12 digits = 3 groups of 4
    expect(result.split(',').length).toBe(3)
  })

  it('should convert +62 prefix to 0', () => {
    const result = formatPhoneForSpeech('+6285155347701')
    
    // Should start with "nol" not "enam dua"
    expect(result.startsWith('nol')).toBe(true)
    expect(result).not.toContain('enam dua')
    
    // Should produce same output as without +62
    expect(result).toBe('nol delapan lima satu, lima lima tiga empat, tujuh tujuh nol satu')
  })

  it('should convert 62 prefix (without +) to 0', () => {
    const result = formatPhoneForSpeech('6285155347701')
    
    // Should start with "nol"
    expect(result.startsWith('nol')).toBe(true)
    expect(result).toBe('nol delapan lima satu, lima lima tiga empat, tujuh tujuh nol satu')
  })

  it('should handle phone numbers with special characters', () => {
    const result = formatPhoneForSpeech('+62 812-3456-7890')
    
    // Should clean and format properly
    expect(result).toBeTruthy()
    expect(result.startsWith('nol')).toBe(true)
    // After cleaning: 081234567890 (12 digits)
    expect(result).toBe('nol delapan satu dua, tiga empat lima enam, tujuh delapan sembilan nol')
  })

  it('should handle short phone numbers', () => {
    const result = formatPhoneForSpeech('08123')
    
    // 5 digits = 1 group of 4 + 1 group of 1
    expect(result).toBe('nol delapan satu dua, tiga')
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

  it('should have Gladia transcriber configured for Indonesian with real-time streaming', () => {
    const config = getAssistantConfig()
    
    // Using Deepgram Nova-2 for Indonesian with keywords support
    // Switched from Gladia due to customVocabularyConfig API issues
    expect(config.transcriber.provider).toBe('deepgram')
    expect(config.transcriber.model).toBe('nova-2')
    expect(config.transcriber.language).toBe('id')
    expect(config.transcriber.smartFormat).toBe(true)
  })

  it('should have keywords configured for domain-specific terms', () => {
    const config = getAssistantConfig()
    
    expect(config.transcriber.keywords).toBeDefined()
    expect(Array.isArray(config.transcriber.keywords)).toBe(true)
    
    // Should include key Bandung terms with intensifiers
    const keywords = config.transcriber.keywords as string[]
    expect(keywords.some(k => k.startsWith('SatuPintu'))).toBe(true)
    expect(keywords.some(k => k.startsWith('PUPR'))).toBe(true)
    expect(keywords.some(k => k.startsWith('PDAM'))).toBe(true)
    expect(keywords.some(k => k.startsWith('PVJ'))).toBe(true)
    expect(keywords.some(k => k.startsWith('Dago'))).toBe(true)
  })

  // Note: keyterm is only available for Nova-3/Flux models, not Nova-2

  it('should have endpointing configured for turn detection', () => {
    const config = getAssistantConfig()
    
    // Endpointing in milliseconds - wait time before speech considered ended
    // VAPI limit: minimum 10ms
    expect(config.transcriber.endpointing).toBeDefined()
    expect(config.transcriber.endpointing).toBeGreaterThanOrEqual(10)
    expect(config.transcriber.endpointing).toBeLessThanOrEqual(5000) // Max 5 seconds reasonable
  })

  it('should have ElevenLabs voice configured for Indonesian', () => {
    const config = getAssistantConfig()
    
    expect(config.voice.provider).toBe('11labs')
    expect(config.voice.voiceId).toBe('kSzQ9oZF2iytkgNNztpH')
  })

  it('should accept customerPhone parameter for system prompt', () => {
    const config = getAssistantConfig(undefined, '+6281234567890')
    
    // System prompt should contain the phone number (raw for reference)
    const systemPrompt = config.model.messages[0].content
    expect(systemPrompt).toContain('+6281234567890')
    
    // System prompt should also contain the spoken format for TTS
    // +6281234567890 -> 081234567890 -> "nol delapan satu dua, tiga empat lima enam, tujuh delapan sembilan nol"
    expect(systemPrompt).toContain('nol delapan satu dua')
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
    expect(config.stopSpeakingPlan.numWords).toBe(2) // Stop after 2 words (lebih robust terhadap noise)
    expect(config.stopSpeakingPlan.voiceSeconds).toBe(0.2) // 200ms buffer untuk filter noise
    expect(config.stopSpeakingPlan.backoffSeconds).toBe(0.8) // Wait before resuming
  })

  it('should have backgroundSpeechDenoisingPlan with smart denoising enabled', () => {
    const config = getAssistantConfig()
    
    expect(config.backgroundSpeechDenoisingPlan).toBeDefined()
    expect(config.backgroundSpeechDenoisingPlan.smartDenoisingPlan).toBeDefined()
    expect(config.backgroundSpeechDenoisingPlan.smartDenoisingPlan.enabled).toBe(true)
  })

  it('should have acknowledgementPhrases in stopSpeakingPlan with pure backchannels only', () => {
    const config = getAssistantConfig()
    
    expect(config.stopSpeakingPlan.acknowledgementPhrases).toBeDefined()
    expect(Array.isArray(config.stopSpeakingPlan.acknowledgementPhrases)).toBe(true)
    
    const phrases = config.stopSpeakingPlan.acknowledgementPhrases as string[]
    // Should include ONLY pure backchannel sounds (not answer words)
    expect(phrases).toContain('oh')
    expect(phrases).toContain('hmm')
    expect(phrases).toContain('he eh')
    
    // Should NOT include words that are valid answers to confirmation questions
    // These words should trigger AI response, not be ignored as backchannels
    expect(phrases).not.toContain('ya')
    expect(phrases).not.toContain('iya')
    expect(phrases).not.toContain('oke')
    expect(phrases).not.toContain('betul')
    expect(phrases).not.toContain('benar')
    expect(phrases).not.toContain('tidak')
    expect(phrases).not.toContain('bukan')
  })

  it('should have startSpeakingPlan configured for Indonesian turn detection with aggressive timing', () => {
    const config = getAssistantConfig()
    
    expect(config.startSpeakingPlan).toBeDefined()
    expect(config.startSpeakingPlan.smartEndpointingPlan).toBeDefined()
    expect(config.startSpeakingPlan.smartEndpointingPlan.provider).toBe('vapi') // For non-English
    expect(config.startSpeakingPlan.waitSeconds).toBe(0.2) // Fast response after endpointing
  })

  it('should have transcriptionEndpointingPlan with balanced timing', () => {
    const config = getAssistantConfig()
    
    expect(config.startSpeakingPlan.transcriptionEndpointingPlan).toBeDefined()
    expect(config.startSpeakingPlan.transcriptionEndpointingPlan.onPunctuationSeconds).toBe(0.1) // Slightly tolerant for stability
    expect(config.startSpeakingPlan.transcriptionEndpointingPlan.onNoPunctuationSeconds).toBe(0.4) // Middle ground
    expect(config.startSpeakingPlan.transcriptionEndpointingPlan.onNumberSeconds).toBe(0.5) // More tolerant for phone numbers
  })

  it('should have customEndpointingRules for context-aware timeout', () => {
    const config = getAssistantConfig()
    
    expect(config.startSpeakingPlan.customEndpointingRules).toBeDefined()
    expect(config.startSpeakingPlan.customEndpointingRules.length).toBeGreaterThan(0)
    
    // Should have rule for complaints/reports
    const reportRule = config.startSpeakingPlan.customEndpointingRules.find(
      (r: { type: string; regex: string }) => r.regex.includes('keluhan') || r.regex.includes('laporan')
    )
    expect(reportRule).toBeDefined()
    expect(reportRule!.type).toBe('assistant')
    expect(reportRule!.timeoutSeconds).toBeGreaterThanOrEqual(1.0)
    
    // Should have rule for phone numbers
    const phoneRule = config.startSpeakingPlan.customEndpointingRules.find(
      (r: { type: string; regex: string }) => r.regex.includes('telepon') || r.regex.includes('whatsapp')
    )
    expect(phoneRule).toBeDefined()
    expect(phoneRule!.timeoutSeconds).toBeGreaterThanOrEqual(1.5)
    
    // Should have rule for address/location
    const addressRule = config.startSpeakingPlan.customEndpointingRules.find(
      (r: { type: string; regex: string }) => r.regex.includes('alamat') || r.regex.includes('lokasi')
    )
    expect(addressRule).toBeDefined()
    expect(addressRule!.timeoutSeconds).toBeGreaterThanOrEqual(1.5)
  })

  it('should have silenceTimeoutSeconds configured for auto-end', () => {
    const config = getAssistantConfig()
    
    // Should be configured to end call after 60 seconds of silence
    // Increased to allow time for AI to speak long responses without premature call ending
    expect(config.silenceTimeoutSeconds).toBe(60)
  })

  it('should have idle message hook configured to prevent premature call ending', () => {
    const config = getAssistantConfig()
    
    expect(config.hooks).toBeDefined()
    expect(Array.isArray(config.hooks)).toBe(true)
    expect(config.hooks.length).toBeGreaterThan(0)
    
    // Find the idle check hook
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const idleHook = config.hooks.find((h: any) => h.name === 'idle_check') as any
    
    expect(idleHook).toBeDefined()
    expect(idleHook!.on).toBe('customer.speech.timeout')
    expect(idleHook!.options.timeoutSeconds).toBe(45)
    expect(idleHook!.options.triggerMaxCount).toBe(2)
    expect(idleHook!.options.triggerResetMode).toBe('onUserSpeech')
  })

  it('should have Indonesian idle messages in hook', () => {
    const config = getAssistantConfig()
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const idleHook = config.hooks.find((h: any) => h.name === 'idle_check') as any
    
    expect(idleHook).toBeDefined()
    expect(idleHook!.do).toBeDefined()
    expect(idleHook!.do.length).toBeGreaterThan(0)
    
    const sayAction = idleHook!.do[0]
    expect(sayAction.type).toBe('say')
    expect(sayAction.exact).toBeDefined()
    expect(Array.isArray(sayAction.exact)).toBe(true)
    
    // Should have Indonesian messages
    const messages = sayAction.exact as string[]
    expect(messages.some(m => m.includes('tersambung'))).toBe(true)
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
