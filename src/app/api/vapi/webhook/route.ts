import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, generateTicketId } from '@/lib/supabase'
import { formatTicketIdForSpeech, getAssistantConfig } from '@/lib/vapi'
import { CATEGORY_TO_DINAS, DINAS_NAMES, DinasId, TicketCategory, TicketUrgency, CATEGORY_LABELS } from '@/types/database'
import { validateAddressEnhanced } from '@/lib/address-validation'
import { sendWhatsAppNotification, WA_TEMPLATES } from '@/lib/fonnte'

// ============================================================================
// UNIVERSAL TOOL CALL EXTRACTOR
// Vapi sends tool calls in MANY different formats. This function handles ALL.
// ============================================================================

interface ExtractedToolCall {
  toolCallId: string
  name: string
  params: Record<string, unknown>
}

function extractToolCall(payload: Record<string, unknown>): ExtractedToolCall | null {
  // Helper to safely parse JSON arguments
  const parseArgs = (args: unknown): Record<string, unknown> => {
    if (typeof args === 'string') {
      try { return JSON.parse(args) } catch { return {} }
    }
    if (typeof args === 'object' && args !== null) {
      return args as Record<string, unknown>
    }
    return {}
  }

  // Helper to extract from OpenAI-style tool call object
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

  // Helper to extract from Vapi native style
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

  // Helper to run full extraction logic on a "message" shape
  const fromMessage = (msg?: Record<string, unknown>): ExtractedToolCall | null => {
    if (!msg) return null

    // 1. message.functionCall (Vapi classic)
    if (msg.functionCall) {
      const fc = msg.functionCall as Record<string, unknown>
      console.log('✓ Found: message.functionCall')
      return {
        toolCallId: (fc.id as string) || 'unknown',
        name: fc.name as string,
        params: parseArgs(fc.parameters)
      }
    }

    // 2. message.toolCallList (Vapi array - per docs this is the primary format)
    if (Array.isArray(msg.toolCallList) && msg.toolCallList.length > 0) {
      console.log('✓ Found: message.toolCallList')
      const tc = msg.toolCallList[0] as Record<string, unknown>
      console.log('toolCallList[0]:', JSON.stringify(tc, null, 2))
      
      // Check if it has function property (OpenAI style)
      const fn = tc.function as Record<string, unknown> | undefined
      if (fn?.name) {
        return {
          toolCallId: (tc.id as string) || 'unknown',
          name: fn.name as string,
          params: parseArgs(fn.arguments || fn.parameters)
        }
      }
      
      // Direct name/parameters
      return {
        toolCallId: (tc.id as string) || 'unknown',
        name: tc.name as string,
        params: parseArgs(tc.arguments || tc.parameters)
      }
    }

    // 3. message.toolWithToolCallList (Vapi docs format - contains tool + toolCall nested)
    if (Array.isArray(msg.toolWithToolCallList) && msg.toolWithToolCallList.length > 0) {
      console.log('✓ Found: message.toolWithToolCallList')
      const item = msg.toolWithToolCallList[0] as Record<string, unknown>
      // The toolCall is nested inside each item
      const toolCall = item.toolCall as Record<string, unknown> | undefined
      if (toolCall) {
        // toolCall can have OpenAI format with function.name/function.parameters
        const fn = toolCall.function as Record<string, unknown> | undefined
        if (fn?.name) {
          return {
            toolCallId: (toolCall.id as string) || 'unknown',
            name: fn.name as string,
            params: parseArgs(fn.arguments || fn.parameters)
          }
        }
        // Or direct name/parameters
        if (toolCall.name) {
          return {
            toolCallId: (toolCall.id as string) || 'unknown',
            name: toolCall.name as string,
            params: parseArgs(toolCall.arguments || toolCall.parameters)
          }
        }
      }
      // Fallback: use item.name directly
      if (item.name) {
        return {
          toolCallId: (item.id as string) || 'unknown',
          name: item.name as string,
          params: parseArgs(item.arguments || item.parameters)
        }
      }
    }

    // 4. message.toolCalls (camelCase - OpenAI style)
    if (Array.isArray(msg.toolCalls) && msg.toolCalls.length > 0) {
      console.log('✓ Found: message.toolCalls')
      const tc = msg.toolCalls[0] as Record<string, unknown>
      return fromOpenAIStyle(tc) || fromVapiStyle(tc)
    }

    // 5. message.tool_calls (snake_case - OpenAI style)
    if (Array.isArray(msg.tool_calls) && msg.tool_calls.length > 0) {
      console.log('✓ Found: message.tool_calls')
      const tc = msg.tool_calls[0] as Record<string, unknown>
      return fromOpenAIStyle(tc) || fromVapiStyle(tc)
    }

    // 6. Direct name + parameters at message level
    if (msg.name && typeof msg.name === 'string') {
      console.log('✓ Found: message.name direct')
      return {
        toolCallId: (msg.id as string) || (msg.toolCallId as string) || 'unknown',
        name: msg.name,
        params: parseArgs(msg.parameters || msg.arguments)
      }
    }

    // 7. message.content array (some formats nest it there)
    if (Array.isArray(msg.content)) {
      for (const item of msg.content) {
        const content = item as Record<string, unknown>
        if (content.type === 'tool_call' || content.type === 'function_call') {
          console.log('✓ Found: message.content[].tool_call')
          return fromOpenAIStyle(content) || fromVapiStyle(content)
        }
      }
    }

    return null
  }

  // ---- CHECK ALL POSSIBLE LOCATIONS ----

  // Preferred single message payload
  const singleMessage = fromMessage(payload.message as Record<string, unknown> | undefined)
  if (singleMessage) return singleMessage

  // NEW: payload.messages array (multi-message transcript)
  if (Array.isArray(payload.messages)) {
    for (const item of payload.messages) {
      const result = fromMessage(item as Record<string, unknown>)
      if (result) {
        console.log('✓ Found: payload.messages[] entry')
        return result
      }
    }
  }

  // 5. Root level toolCalls (camelCase)
  if (Array.isArray(payload.toolCalls) && payload.toolCalls.length > 0) {
    console.log('✓ Found: root toolCalls')
    const tc = payload.toolCalls[0] as Record<string, unknown>
    return fromOpenAIStyle(tc) || fromVapiStyle(tc)
  }

  // 6. Root level tool_calls (snake_case)
  if (Array.isArray(payload.tool_calls) && payload.tool_calls.length > 0) {
    console.log('✓ Found: root tool_calls')
    const tc = payload.tool_calls[0] as Record<string, unknown>
    return fromOpenAIStyle(tc) || fromVapiStyle(tc)
  }

  // 7. Root level functionCall
  if (payload.functionCall) {
    console.log('✓ Found: root functionCall')
    const fc = payload.functionCall as Record<string, unknown>
    return {
      toolCallId: (fc.id as string) || 'unknown',
      name: fc.name as string,
      params: parseArgs(fc.parameters)
    }
  }

  // 8. Root level toolCallList (just in case)
  if (Array.isArray(payload.toolCallList) && payload.toolCallList.length > 0) {
    console.log('✓ Found: root toolCallList')
    return fromVapiStyle(payload.toolCallList[0] as Record<string, unknown>)
  }

  // No tool call found
  console.log('✗ No tool call detected in payload')
  return null
}

// ============================================================================
// RESPONSE HELPERS
// ============================================================================

function vapiResponse(toolCallId: string, name: string, result: string) {
  console.log('→ Response for', name, '(', toolCallId, '):', result.substring(0, 100) + '...')
  return NextResponse.json({
    results: [{
      toolCallId,
      name,
      result,
    }]
  })
}

function vapiError(toolCallId: string, name: string, error: string) {
  console.log('→ Error for', name, '(', toolCallId, '):', error)
  return NextResponse.json({
    results: [{
      toolCallId,
      name,
      error,
    }]
  })
}

// ============================================================================
// WEBHOOK HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    
    console.log('=== VAPI WEBHOOK ===')
    console.log('Event type:', payload.message?.type)
    console.log(JSON.stringify(payload, null, 2))

    // =========================================================================
    // HANDLE ASSISTANT-REQUEST EVENT (untuk transient assistant)
    // Ini adalah event pertama yang dikirim Vapi saat ada panggilan masuk
    // =========================================================================
    const messageType = payload.message?.type
    
    if (messageType === 'assistant-request') {
      console.log('=== ASSISTANT REQUEST - Returning transient assistant config ===')
      const assistantConfig = getAssistantConfig()
      return NextResponse.json({
        assistant: assistantConfig
      })
    }

    // =========================================================================
    // HANDLE STATUS-UPDATE EVENTS
    // =========================================================================
    if (messageType === 'status-update') {
      console.log('Status update:', payload.message?.status)
      return NextResponse.json({ result: 'OK' })
    }

    // =========================================================================
    // HANDLE END-OF-CALL-REPORT
    // =========================================================================
    if (messageType === 'end-of-call-report') {
      console.log('Call ended:', payload.message?.endedReason)
      console.log('Summary:', payload.message?.summary)
      return NextResponse.json({ result: 'OK' })
    }

    // =========================================================================
    // HANDLE TOOL CALLS
    // =========================================================================
    
    // Extract tool call using universal extractor
    const toolCall = extractToolCall(payload)
    
    if (!toolCall) {
      // Not a tool call, just acknowledge
      return NextResponse.json({ result: 'OK' })
    }

    const { toolCallId, name, params } = toolCall
    console.log(`Processing: ${name}(${JSON.stringify(params)}) [${toolCallId}]`)

    // Get customer phone from various locations
    let customerPhone = ''
    const msg = payload.message as Record<string, unknown> | undefined
    if (msg?.call) {
      const call = msg.call as Record<string, unknown>
      const customer = call.customer as Record<string, unknown> | undefined
      customerPhone = (customer?.number as string) || ''
    }

    // Handle functions
    switch (name) {
      case 'validateAddress': {
        const address = params.address as string
        
        if (!address) {
          return vapiResponse(toolCallId, name, 'Maaf, saya tidak mendengar alamatnya. Bisa diulangi?')
        }

        return vapiResponse(toolCallId, name, `Alamat berhasil divalidasi: ${address}, Kota Bandung, Jawa Barat`)
      }

      case 'createTicket': {
        const {
          category,
          subcategory,
          description,
          reporterName,
          reporterPhone,
          address,
          urgency,
        } = params as {
          category: TicketCategory
          subcategory?: string
          description: string
          reporterName: string
          reporterPhone?: string
          address: string
          urgency?: TicketUrgency
        }

        if (!category || !description || !reporterName || !address) {
          return vapiResponse(toolCallId, name, 'Maaf, ada informasi yang belum lengkap. Pastikan kategori, deskripsi, nama pelapor, dan alamat sudah diisi.')
        }

        const phone = reporterPhone || customerPhone || '081200000000'
        const formattedPhone = phone.replace(/\D/g, '')
        const finalPhone = formattedPhone.startsWith('0') 
          ? '+62' + formattedPhone.slice(1) 
          : formattedPhone.startsWith('62') 
            ? '+' + formattedPhone 
            : '+62' + formattedPhone

        const ticketId = generateTicketId()
        const assignedDinas = CATEGORY_TO_DINAS[category] || ['admin']
        const finalUrgency = urgency || (category === 'DARURAT' ? 'CRITICAL' : 'MEDIUM')

        // Validate address before ticket insert
        const validation = await validateAddressEnhanced(address)
        let validatedAddress = address
        let addressLat: number | null = null
        let addressLng: number | null = null

        if (validation.isValid && validation.isInCoverage) {
          validatedAddress = validation.formattedAddress || address
          addressLat = validation.lat || null
          addressLng = validation.lng || null
        }

        const { error: ticketError } = await supabaseAdmin
          .from('tickets')
          .insert({
            id: ticketId,
            category,
            subcategory: subcategory || null,
            location: address,
            description,
            reporter_phone: finalPhone,
            reporter_name: reporterName,
            validated_address: validatedAddress,
            address_lat: addressLat,
            address_lng: addressLng,
            status: 'PENDING',
            urgency: finalUrgency,
            assigned_dinas: assignedDinas,
            transcription: description,
          })

        if (ticketError) {
          console.error('Failed to create ticket:', ticketError)
          return vapiError(toolCallId, name, 'Maaf, terjadi kesalahan saat membuat laporan. Silakan coba lagi atau hubungi 112 untuk keadaan darurat.')
        }

        await supabaseAdmin.from('ticket_timeline').insert([
          {
            ticket_id: ticketId,
            action: 'CREATED',
            message: `Laporan diterima via telepon dari ${reporterName}`,
            created_by: 'system',
          },
          {
            ticket_id: ticketId,
            action: 'ASSIGNED',
            message: `Diteruskan ke ${assignedDinas.map((d: DinasId) => DINAS_NAMES[d]).join(', ')}`,
            created_by: 'system',
          },
        ])

        // Send WhatsApp notification (wrapped in try-catch so it doesn't break ticket creation)
        try {
          const trackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/track/${ticketId}`
          const waMessage = WA_TEMPLATES.ticketCreated(
            ticketId,
            CATEGORY_LABELS[category],
            reporterName,
            trackUrl
          )
          // TODO: For production, change back to finalPhone
          // For testing, send to fixed number
          const waTargetPhone = process.env.WA_TEST_NUMBER || finalPhone
          await sendWhatsAppNotification(waTargetPhone, waMessage)
          console.log('WhatsApp notification sent to:', waTargetPhone, '(reporter:', finalPhone, ')')
        } catch (waError) {
          console.error('Failed to send WhatsApp notification:', waError)
          // Continue without WhatsApp - don't fail the ticket creation
        }

        const ticketIdSpoken = formatTicketIdForSpeech(ticketId)
        const dinasNames = assignedDinas.map((d: DinasId) => DINAS_NAMES[d]).join(' dan ')

        const urgencyMessage = finalUrgency === 'CRITICAL' 
          ? `Ini adalah laporan darurat dan akan segera ditindaklanjuti. ${dinasNames} sedang dikirim ke lokasi.`
          : `Laporan akan diteruskan ke ${dinasNames} untuk ditindaklanjuti.`

        const responseMessage = `Terima kasih ${reporterName}. Laporan Anda telah berhasil dicatat dengan nomor tiket ${ticketIdSpoken}. ${urgencyMessage} Anda akan menerima WhatsApp konfirmasi dengan link untuk melacak status laporan. Terima kasih telah menggunakan SatuPintu.`

        console.log('SUCCESS: Ticket created:', ticketId)
        return vapiResponse(toolCallId, name, responseMessage)
      }

      case 'logEmergency': {
        const { emergencyType, location, situation, reporterName, reporterPhone } = params as {
          emergencyType: 'KEBAKARAN' | 'KECELAKAAN' | 'KEJAHATAN' | 'MEDIS' | 'BENCANA'
          location: string
          situation: string
          reporterName?: string
          reporterPhone?: string
        }

        // Validate required fields
        if (!emergencyType || !location || !situation) {
          return vapiResponse(toolCallId, name, 'Maaf, saya perlu informasi lokasi dan kondisi darurat. Bisa diinfokan lokasinya dimana?')
        }

        // Map emergency type to category
        const emergencyToCategory: Record<string, TicketCategory> = {
          'KEBAKARAN': 'DARURAT',
          'KECELAKAAN': 'DARURAT',
          'KEJAHATAN': 'DARURAT',
          'MEDIS': 'DARURAT',
          'BENCANA': 'DARURAT',
        }

        // Generate ticket ID for emergency
        const ticketId = generateTicketId()
        const category = emergencyToCategory[emergencyType] || 'DARURAT'
        const assignedDinas = CATEGORY_TO_DINAS[category] || ['admin']

        // Create emergency ticket with CRITICAL urgency
        const { error: ticketError } = await supabaseAdmin
          .from('tickets')
          .insert({
            id: ticketId,
            category: category,
            subcategory: emergencyType,
            location: location,
            description: `[DARURAT - ${emergencyType}] ${situation}`,
            reporter_phone: reporterPhone || customerPhone || '+62000000000',
            reporter_name: reporterName || 'Pelapor Darurat',
            validated_address: location,
            status: 'PENDING',
            urgency: 'CRITICAL' as TicketUrgency,
            assigned_dinas: assignedDinas,
            transcription: `Jenis: ${emergencyType}, Lokasi: ${location}, Situasi: ${situation}`,
          })

        if (ticketError) {
          console.error('Failed to create emergency ticket:', ticketError)
          return vapiResponse(toolCallId, name, 'Laporan darurat gagal dicatat, tapi saya akan tetap menyambungkan Anda ke layanan darurat.')
        }

        // Add timeline entries
        await supabaseAdmin.from('ticket_timeline').insert([
          {
            ticket_id: ticketId,
            action: 'CREATED',
            message: `Laporan darurat ${emergencyType} diterima via telepon`,
            created_by: 'system',
          },
          {
            ticket_id: ticketId,
            action: 'ESCALATED', 
            message: `TRANSFER KE LAYANAN DARURAT 112 - ${emergencyType} di ${location}`,
            created_by: 'system',
          },
        ])

        // Log the emergency
        console.log('=== EMERGENCY LOGGED ===')
        console.log('Ticket ID:', ticketId)
        console.log('Emergency Type:', emergencyType)
        console.log('Location:', location)
        console.log('Situation:', situation)
        console.log('========================')

        // Return success message - Vapi will handle the actual transfer via native transferCall tool
        return vapiResponse(
          toolCallId, 
          name, 
          `Laporan darurat telah dicatat dengan nomor ${ticketId}. Saya akan segera menyambungkan Anda ke layanan darurat 112.`
        )
      }

      default:
        console.log('Unknown function:', name)
        return vapiError(toolCallId, name, `Unknown function: ${name}`)
    }
  } catch (error) {
    console.error('Vapi webhook error:', error)
    return NextResponse.json({
      results: [
        {
          toolCallId: 'unknown',
          error: 'Maaf, terjadi kesalahan sistem. Silakan coba lagi.'
        }
      ]
    })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'SatuPintu Vapi Webhook' })
}
