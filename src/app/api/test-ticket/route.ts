import { NextResponse } from 'next/server'
import { supabaseAdmin, generateTicketId } from '@/lib/supabase'
import { sendWhatsAppNotification, WA_TEMPLATES } from '@/lib/fonnte'
import { CATEGORY_TO_DINAS, CATEGORY_LABELS, TicketCategory } from '@/types/database'

/**
 * Test endpoint to simulate createTicket and verify WhatsApp is sent
 * GET /api/test-ticket
 */
export async function GET() {
  const logs: string[] = []
  const log = (msg: string) => {
    console.log(msg)
    logs.push(msg)
  }

  try {
    log('=== TEST TICKET CREATION ===')
    
    // Simulate ticket data
    const ticketId = generateTicketId()
    const category: TicketCategory = 'INFRA'
    const reporterName = 'Test User'
    const reporterPhone = '+6285155347701'
    const address = 'Jl. Dago No. 1, Bandung'
    const description = 'Test laporan - jalan berlubang'
    const assignedDinas = CATEGORY_TO_DINAS[category] || ['admin']

    log(`Ticket ID: ${ticketId}`)
    log(`Category: ${category}`)
    log(`Reporter: ${reporterName} (${reporterPhone})`)

    // Insert ticket
    const { error: ticketError } = await supabaseAdmin
      .from('tickets')
      .insert({
        id: ticketId,
        category,
        location: address,
        description,
        reporter_phone: reporterPhone,
        reporter_name: reporterName,
        validated_address: address,
        status: 'PENDING',
        urgency: 'MEDIUM',
        assigned_dinas: assignedDinas,
        transcription: description,
      })

    if (ticketError) {
      log(`ERROR creating ticket: ${JSON.stringify(ticketError)}`)
      return NextResponse.json({ success: false, error: ticketError, logs })
    }

    log('Ticket created successfully!')

    // Send WhatsApp
    log('=== SENDING WHATSAPP ===')
    const trackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/track/${ticketId}`
    const waMessage = WA_TEMPLATES.ticketCreated(
      ticketId,
      CATEGORY_LABELS[category],
      reporterName,
      trackUrl
    )
    
    const waTargetPhone = process.env.WA_TEST_NUMBER || reporterPhone
    log(`WA Target: ${waTargetPhone}`)
    log(`WA_TEST_NUMBER env: ${process.env.WA_TEST_NUMBER || '(not set)'}`)
    log(`Message preview: ${waMessage.substring(0, 100)}...`)

    const waResult = await sendWhatsAppNotification(waTargetPhone, waMessage)
    log(`WA Result: ${JSON.stringify(waResult)}`)

    return NextResponse.json({
      success: true,
      ticketId,
      waResult,
      logs,
    })
  } catch (error) {
    log(`EXCEPTION: ${error}`)
    return NextResponse.json({ success: false, error: String(error), logs })
  }
}
