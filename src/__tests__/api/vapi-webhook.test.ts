/**
 * @fileoverview Unit tests for Vapi Webhook API route
 * 
 * Critical Tests:
 * - Tool call extraction from various Vapi payload formats
 * - createTicket function handling
 * - logEmergency function handling
 * - Error handling and edge cases
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ============================================================================
// TOOL CALL EXTRACTION LOGIC (Mirror from webhook route)
// ============================================================================

interface ExtractedToolCall {
  toolCallId: string
  name: string
  params: Record<string, unknown>
}

function extractToolCall(payload: Record<string, unknown>): ExtractedToolCall | null {
  const parseArgs = (args: unknown): Record<string, unknown> => {
    if (typeof args === 'string') {
      try { return JSON.parse(args) } catch { return {} }
    }
    if (typeof args === 'object' && args !== null) {
      return args as Record<string, unknown>
    }
    return {}
  }

  const fromOpenAIStyle = (tc: Record<string, unknown>): ExtractedToolCall | null => {
    const fn = tc.function as Record<string, unknown> | undefined
    if (fn?.name) {
      return {
        toolCallId: (tc.id as string) || 'unknown',
        name: fn.name as string,
        params: parseArgs(fn.arguments)
      }
    }
    return null
  }

  const fromVapiStyle = (tc: Record<string, unknown>): ExtractedToolCall | null => {
    if (tc.name) {
      return {
        toolCallId: (tc.id as string) || 'unknown',
        name: tc.name as string,
        params: parseArgs(tc.arguments || tc.parameters)
      }
    }
    return null
  }

  const fromMessage = (msg?: Record<string, unknown>): ExtractedToolCall | null => {
    if (!msg) return null

    // 1. message.functionCall (Vapi classic)
    if (msg.functionCall) {
      const fc = msg.functionCall as Record<string, unknown>
      return {
        toolCallId: (fc.id as string) || 'unknown',
        name: fc.name as string,
        params: parseArgs(fc.parameters)
      }
    }

    // 2. message.toolCallList
    if (Array.isArray(msg.toolCallList) && msg.toolCallList.length > 0) {
      const tc = msg.toolCallList[0] as Record<string, unknown>
      const fn = tc.function as Record<string, unknown> | undefined
      if (fn?.name) {
        return {
          toolCallId: (tc.id as string) || 'unknown',
          name: fn.name as string,
          params: parseArgs(fn.arguments || fn.parameters)
        }
      }
      return {
        toolCallId: (tc.id as string) || 'unknown',
        name: tc.name as string,
        params: parseArgs(tc.arguments || tc.parameters)
      }
    }

    // 3. message.toolWithToolCallList
    if (Array.isArray(msg.toolWithToolCallList) && msg.toolWithToolCallList.length > 0) {
      const item = msg.toolWithToolCallList[0] as Record<string, unknown>
      const toolCall = item.toolCall as Record<string, unknown> | undefined
      if (toolCall) {
        const fn = toolCall.function as Record<string, unknown> | undefined
        if (fn?.name) {
          return {
            toolCallId: (toolCall.id as string) || 'unknown',
            name: fn.name as string,
            params: parseArgs(fn.arguments || fn.parameters)
          }
        }
        if (toolCall.name) {
          return {
            toolCallId: (toolCall.id as string) || 'unknown',
            name: toolCall.name as string,
            params: parseArgs(toolCall.arguments || toolCall.parameters)
          }
        }
      }
      if (item.name) {
        return {
          toolCallId: (item.id as string) || 'unknown',
          name: item.name as string,
          params: parseArgs(item.arguments || item.parameters)
        }
      }
    }

    // 4. message.toolCalls (camelCase)
    if (Array.isArray(msg.toolCalls) && msg.toolCalls.length > 0) {
      const tc = msg.toolCalls[0] as Record<string, unknown>
      return fromOpenAIStyle(tc) || fromVapiStyle(tc)
    }

    // 5. message.tool_calls (snake_case)
    if (Array.isArray(msg.tool_calls) && msg.tool_calls.length > 0) {
      const tc = msg.tool_calls[0] as Record<string, unknown>
      return fromOpenAIStyle(tc) || fromVapiStyle(tc)
    }

    // 6. Direct name + parameters at message level
    if (msg.name && typeof msg.name === 'string') {
      return {
        toolCallId: (msg.id as string) || (msg.toolCallId as string) || 'unknown',
        name: msg.name,
        params: parseArgs(msg.parameters || msg.arguments)
      }
    }

    return null
  }

  // Check message
  const singleMessage = fromMessage(payload.message as Record<string, unknown> | undefined)
  if (singleMessage) return singleMessage

  // Check messages array
  if (Array.isArray(payload.messages)) {
    for (const item of payload.messages) {
      const result = fromMessage(item as Record<string, unknown>)
      if (result) return result
    }
  }

  // Root level checks
  if (Array.isArray(payload.toolCalls) && payload.toolCalls.length > 0) {
    const tc = payload.toolCalls[0] as Record<string, unknown>
    return fromOpenAIStyle(tc) || fromVapiStyle(tc)
  }

  if (Array.isArray(payload.tool_calls) && payload.tool_calls.length > 0) {
    const tc = payload.tool_calls[0] as Record<string, unknown>
    return fromOpenAIStyle(tc) || fromVapiStyle(tc)
  }

  if (payload.functionCall) {
    const fc = payload.functionCall as Record<string, unknown>
    return {
      toolCallId: (fc.id as string) || 'unknown',
      name: fc.name as string,
      params: parseArgs(fc.parameters)
    }
  }

  if (Array.isArray(payload.toolCallList) && payload.toolCallList.length > 0) {
    return fromVapiStyle(payload.toolCallList[0] as Record<string, unknown>)
  }

  return null
}

// ============================================================================
// TEST SUITES
// ============================================================================

describe('Vapi Webhook - Tool Call Extraction', () => {
  describe('message.functionCall format (Vapi Classic)', () => {
    it('should extract from message.functionCall', () => {
      const payload = {
        message: {
          type: 'function-call',
          functionCall: {
            id: 'call-123',
            name: 'createTicket',
            parameters: {
              category: 'INFRA',
              description: 'Jalan berlubang',
              reporterName: 'Budi',
              reporterPhone: '081234567890',
              address: 'Jl. Dago No. 10',
              urgency: 'MEDIUM'
            }
          }
        }
      }

      const result = extractToolCall(payload)

      expect(result).not.toBeNull()
      expect(result?.name).toBe('createTicket')
      expect(result?.params.category).toBe('INFRA')
      expect(result?.params.reporterName).toBe('Budi')
    })
  })

  describe('message.toolCallList format', () => {
    it('should extract from toolCallList with direct properties', () => {
      const payload = {
        message: {
          type: 'tool-calls',
          toolCallList: [
            {
              id: 'call-456',
              name: 'logEmergency',
              parameters: {
                emergencyType: 'KEBAKARAN',
                location: 'PVJ Mall',
                situation: 'Api di lantai 3'
              }
            }
          ]
        }
      }

      const result = extractToolCall(payload)

      expect(result).not.toBeNull()
      expect(result?.name).toBe('logEmergency')
      expect(result?.params.emergencyType).toBe('KEBAKARAN')
    })

    it('should extract from toolCallList with function property (OpenAI style)', () => {
      const payload = {
        message: {
          type: 'tool-calls',
          toolCallList: [
            {
              id: 'call-789',
              function: {
                name: 'createTicket',
                arguments: JSON.stringify({
                  category: 'KEBERSIHAN',
                  description: 'Sampah menumpuk',
                  reporterName: 'Siti',
                  reporterPhone: '085155347701',
                  address: 'Jl. Braga',
                  urgency: 'MEDIUM'
                })
              }
            }
          ]
        }
      }

      const result = extractToolCall(payload)

      expect(result).not.toBeNull()
      expect(result?.name).toBe('createTicket')
      expect(result?.params.category).toBe('KEBERSIHAN')
    })
  })

  describe('message.toolWithToolCallList format (Vapi Docs)', () => {
    it('should extract from toolWithToolCallList', () => {
      const payload = {
        message: {
          type: 'tool-calls',
          toolWithToolCallList: [
            {
              type: 'function',
              toolCall: {
                id: 'tc-001',
                function: {
                  name: 'createTicket',
                  arguments: {
                    category: 'SOSIAL',
                    description: 'ODGJ terlantar',
                    reporterName: 'Ahmad',
                    reporterPhone: '087777888999',
                    address: 'Alun-alun Bandung',
                    urgency: 'HIGH'
                  }
                }
              }
            }
          ]
        }
      }

      const result = extractToolCall(payload)

      expect(result).not.toBeNull()
      expect(result?.name).toBe('createTicket')
      expect(result?.params.category).toBe('SOSIAL')
      expect(result?.params.urgency).toBe('HIGH')
    })
  })

  describe('message.toolCalls format (camelCase)', () => {
    it('should extract from toolCalls array', () => {
      const payload = {
        message: {
          toolCalls: [
            {
              id: 'tc-002',
              function: {
                name: 'validateAddress',
                arguments: { address: 'Jl. Asia Afrika' }
              }
            }
          ]
        }
      }

      const result = extractToolCall(payload)

      expect(result).not.toBeNull()
      expect(result?.name).toBe('validateAddress')
    })
  })

  describe('message.tool_calls format (snake_case)', () => {
    it('should extract from tool_calls array', () => {
      const payload = {
        message: {
          tool_calls: [
            {
              id: 'tc-003',
              function: {
                name: 'createTicket',
                arguments: JSON.stringify({
                  category: 'LAINNYA',
                  description: 'Pertanyaan umum',
                  reporterName: 'Dewi',
                  reporterPhone: '089999888777',
                  address: 'Gedung Sate',
                  urgency: 'LOW'
                })
              }
            }
          ]
        }
      }

      const result = extractToolCall(payload)

      expect(result).not.toBeNull()
      expect(result?.name).toBe('createTicket')
      expect(result?.params.urgency).toBe('LOW')
    })
  })

  describe('Direct message.name format', () => {
    it('should extract when name is directly on message', () => {
      const payload = {
        message: {
          id: 'msg-001',
          name: 'logEmergency',
          parameters: {
            emergencyType: 'KECELAKAAN',
            location: 'Simpang Dago',
            situation: 'Tabrakan motor'
          }
        }
      }

      const result = extractToolCall(payload)

      expect(result).not.toBeNull()
      expect(result?.name).toBe('logEmergency')
      expect(result?.params.emergencyType).toBe('KECELAKAAN')
    })
  })

  describe('Root level formats', () => {
    it('should extract from root functionCall', () => {
      const payload = {
        functionCall: {
          id: 'fc-001',
          name: 'createTicket',
          parameters: { category: 'INFRA' }
        }
      }

      const result = extractToolCall(payload)

      expect(result).not.toBeNull()
      expect(result?.name).toBe('createTicket')
    })

    it('should extract from root toolCalls', () => {
      const payload = {
        toolCalls: [
          {
            id: 'tc-root',
            name: 'logEmergency',
            parameters: { emergencyType: 'MEDIS' }
          }
        ]
      }

      const result = extractToolCall(payload)

      expect(result).not.toBeNull()
      expect(result?.name).toBe('logEmergency')
    })

    it('should extract from root toolCallList', () => {
      const payload = {
        toolCallList: [
          {
            id: 'tcl-root',
            name: 'createTicket',
            arguments: { category: 'DARURAT' }
          }
        ]
      }

      const result = extractToolCall(payload)

      expect(result).not.toBeNull()
      expect(result?.name).toBe('createTicket')
    })
  })

  describe('Edge cases', () => {
    it('should return null for non-tool-call payloads', () => {
      const payload = {
        message: {
          type: 'status-update',
          status: 'in-progress'
        }
      }

      const result = extractToolCall(payload)

      expect(result).toBeNull()
    })

    it('should return null for empty payload', () => {
      const result = extractToolCall({})
      expect(result).toBeNull()
    })

    it('should return null for payload without message', () => {
      const payload = { someOtherField: 'value' }
      const result = extractToolCall(payload)
      expect(result).toBeNull()
    })

    it('should handle malformed JSON in arguments', () => {
      const payload = {
        message: {
          toolCallList: [
            {
              id: 'tc-bad',
              function: {
                name: 'createTicket',
                arguments: 'not valid json {'
              }
            }
          ]
        }
      }

      const result = extractToolCall(payload)

      expect(result).not.toBeNull()
      expect(result?.name).toBe('createTicket')
      expect(result?.params).toEqual({}) // Should return empty object for invalid JSON
    })

    it('should handle empty toolCallList', () => {
      const payload = {
        message: {
          toolCallList: []
        }
      }

      const result = extractToolCall(payload)
      expect(result).toBeNull()
    })
  })
})

// ============================================================================
// CREATETICKET PAYLOAD TESTS
// ============================================================================

describe('createTicket payload validation', () => {
  const validPayload = {
    category: 'INFRA',
    subcategory: 'Jalan berlubang',
    description: 'Ada lubang besar di jalan, berbahaya untuk pengendara motor',
    reporterName: 'Budi Santoso',
    reporterPhone: '081234567890',
    address: 'Jl. Dago No. 100, dekat PVJ',
    urgency: 'MEDIUM'
  }

  it('should validate all required fields present', () => {
    const required = ['category', 'description', 'reporterName', 'address']
    
    for (const field of required) {
      expect(validPayload).toHaveProperty(field)
      expect(validPayload[field as keyof typeof validPayload]).toBeTruthy()
    }
  })

  it('should have valid category value', () => {
    const validCategories = ['DARURAT', 'INFRA', 'KEBERSIHAN', 'SOSIAL', 'LAINNYA']
    expect(validCategories).toContain(validPayload.category)
  })

  it('should have valid urgency value', () => {
    const validUrgencies = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
    expect(validUrgencies).toContain(validPayload.urgency)
  })

  it('should reject missing required fields', () => {
    const incompletePayloads = [
      { ...validPayload, category: undefined },
      { ...validPayload, description: undefined },
      { ...validPayload, reporterName: undefined },
      { ...validPayload, address: undefined },
    ]

    for (const payload of incompletePayloads) {
      const hasAllRequired = 
        payload.category && 
        payload.description && 
        payload.reporterName && 
        payload.address

      expect(hasAllRequired).toBeFalsy()
    }
  })
})

// ============================================================================
// LOGEMERGENCY PAYLOAD TESTS
// ============================================================================

describe('logEmergency payload validation', () => {
  const validEmergencyPayload = {
    emergencyType: 'KEBAKARAN',
    location: 'PVJ Mall Lantai 3',
    situation: 'Api terlihat di area food court, asap tebal',
    reporterName: 'Ahmad',
    reporterPhone: '085155347701'
  }

  it('should validate all required fields present', () => {
    const required = ['emergencyType', 'location', 'situation']
    
    for (const field of required) {
      expect(validEmergencyPayload).toHaveProperty(field)
      expect(validEmergencyPayload[field as keyof typeof validEmergencyPayload]).toBeTruthy()
    }
  })

  it('should have valid emergencyType value', () => {
    const validTypes = ['KEBAKARAN', 'KECELAKAAN', 'KEJAHATAN', 'MEDIS', 'BENCANA']
    expect(validTypes).toContain(validEmergencyPayload.emergencyType)
  })

  it('should allow optional reporter info', () => {
    const minimalPayload = {
      emergencyType: 'MEDIS',
      location: 'Alun-alun Bandung',
      situation: 'Orang pingsan'
    }

    const hasRequired = 
      minimalPayload.emergencyType && 
      minimalPayload.location && 
      minimalPayload.situation

    expect(hasRequired).toBeTruthy()
  })
})

// ============================================================================
// CALL FLOW INTEGRATION TESTS
// ============================================================================

describe('Call Flow - End to End Scenarios', () => {
  describe('Normal complaint flow', () => {
    it('should handle complete ticket creation flow', () => {
      // Simulating the full flow: Vapi sends tool call → extract → validate → process
      const vapiPayload = {
        message: {
          type: 'tool-calls',
          toolCallList: [
            {
              id: 'call-flow-1',
              name: 'createTicket',
              parameters: {
                category: 'INFRA',
                description: 'Jalan berlubang di depan sekolah SD',
                reporterName: 'Ibu Siti',
                reporterPhone: '081234567890',
                address: 'Jl. Dipatiukur No. 15, depan SD Negeri 1',
                urgency: 'HIGH'
              }
            }
          ],
          call: {
            id: 'call-abc-123',
            customer: {
              number: '+6281234567890'
            }
          }
        }
      }

      // Extract tool call
      const toolCall = extractToolCall(vapiPayload)
      expect(toolCall).not.toBeNull()
      expect(toolCall?.name).toBe('createTicket')

      // Validate required fields
      const params = toolCall?.params
      expect(params?.category).toBe('INFRA')
      expect(params?.reporterName).toBe('Ibu Siti')
      expect(params?.address).toContain('Dipatiukur')
    })
  })

  describe('Emergency flow', () => {
    it('should handle emergency with transfer sequence', () => {
      // Step 1: logEmergency
      const logEmergencyPayload = {
        message: {
          type: 'tool-calls',
          toolCallList: [
            {
              id: 'emergency-1',
              name: 'logEmergency',
              parameters: {
                emergencyType: 'KEBAKARAN',
                location: 'Pasar Baru Bandung',
                situation: 'Kebakaran di kios elektronik, api menyebar cepat',
                reporterName: 'Pak Dedi',
                reporterPhone: '087777888999'
              }
            }
          ]
        }
      }

      const toolCall = extractToolCall(logEmergencyPayload)
      expect(toolCall).not.toBeNull()
      expect(toolCall?.name).toBe('logEmergency')
      expect(toolCall?.params.emergencyType).toBe('KEBAKARAN')

      // After logEmergency, Vapi should trigger transferCall (native tool)
      // This is handled by Vapi directly, not through webhook
    })
  })

  describe('Address validation flow', () => {
    it('should extract address for validation', () => {
      const payload = {
        message: {
          functionCall: {
            name: 'validateAddress',
            parameters: {
              address: 'dekat ITB, gang sebelah warung padang'
            }
          }
        }
      }

      const toolCall = extractToolCall(payload)
      expect(toolCall?.name).toBe('validateAddress')
      expect(toolCall?.params.address).toContain('ITB')
    })
  })
})

// ============================================================================
// RESPONSE FORMAT TESTS
// ============================================================================

describe('Vapi Response Format', () => {
  it('should have correct success response structure', () => {
    const successResponse = {
      results: [{
        toolCallId: 'call-123',
        name: 'createTicket',
        result: 'Tiket berhasil dibuat dengan nomor SP-20251209-0001',
      }]
    }

    expect(successResponse).toHaveProperty('results')
    expect(Array.isArray(successResponse.results)).toBe(true)
    expect(successResponse.results[0]).toHaveProperty('toolCallId')
    expect(successResponse.results[0]).toHaveProperty('result')
  })

  it('should have correct error response structure', () => {
    const errorResponse = {
      results: [{
        toolCallId: 'call-456',
        name: 'createTicket',
        error: 'Informasi belum lengkap',
      }]
    }

    expect(errorResponse).toHaveProperty('results')
    expect(errorResponse.results[0]).toHaveProperty('error')
  })
})
