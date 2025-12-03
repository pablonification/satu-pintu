import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { formatPhoneNumber, SMS_TEMPLATES } from '@/lib/twilio'
import { STATUS_LABELS, CATEGORY_LABELS, TicketStatus, TicketCategory } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const body = (formData.get('Body') as string || '').trim().toUpperCase()
    const from = formData.get('From') as string
    
    console.log(`Incoming SMS from ${from}: ${body}`)
    
    // Log incoming SMS
    await supabaseAdmin.from('sms_logs').insert({
      phone_to: formatPhoneNumber(from),
      message: body,
      direction: 'INBOUND',
      status: 'DELIVERED',
    })
    
    let responseMessage = 'Maaf, perintah tidak dikenali. Kirim CEK [NO_TIKET] untuk cek status laporan. Contoh: CEK SP-20251203-0001'
    
    // Parse command: CEK SP-XXXXXXXX-XXXX
    const cekMatch = body.match(/CEK\s+(SP-\d{8}-\d{4})/i)
    
    if (cekMatch) {
      const ticketId = cekMatch[1]
      
      // Get ticket with latest timeline entry
      const { data: ticket, error } = await supabaseAdmin
        .from('tickets')
        .select('*')
        .eq('id', ticketId)
        .single()
      
      if (error || !ticket) {
        responseMessage = `Tiket ${ticketId} tidak ditemukan. Pastikan nomor tiket benar.`
      } else {
        // Verify this is the reporter
        const reporterPhone = formatPhoneNumber(from)
        if (ticket.reporter_phone !== reporterPhone) {
          responseMessage = `Maaf, Anda tidak memiliki akses ke tiket ini.`
        } else {
          // Get latest timeline entry
          const { data: timeline } = await supabaseAdmin
            .from('ticket_timeline')
            .select('*')
            .eq('ticket_id', ticketId)
            .eq('is_public', true)
            .order('created_at', { ascending: false })
            .limit(1)
          
          const lastUpdate = timeline?.[0]?.message || 'Belum ada update'
          
          responseMessage = SMS_TEMPLATES.trackingResponse(
            ticketId,
            STATUS_LABELS[ticket.status as TicketStatus],
            CATEGORY_LABELS[ticket.category as TicketCategory],
            lastUpdate
          )
        }
      }
    }
    
    // Generate TwiML response
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(responseMessage)}</Message>
</Response>`
    
    return new NextResponse(twiml, {
      headers: {
        'Content-Type': 'text/xml',
      },
    })
  } catch (error) {
    console.error('SMS incoming error:', error)
    
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Maaf, terjadi kesalahan sistem. Silakan coba lagi nanti.</Message>
</Response>`
    
    return new NextResponse(errorTwiml, {
      headers: {
        'Content-Type': 'text/xml',
      },
    })
  }
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
