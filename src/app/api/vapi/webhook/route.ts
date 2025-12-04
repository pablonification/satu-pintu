import { NextRequest, NextResponse } from 'next/server'
import { validateAddress, validatePhoneNumber } from '@/lib/nominatim'
import { supabaseAdmin, generateTicketId } from '@/lib/supabase'
import { formatTicketIdForSpeech } from '@/lib/vapi'
import { CATEGORY_TO_DINAS, DINAS_NAMES, DinasId, TicketCategory, TicketUrgency } from '@/types/database'
import { sendSmsNotification, SMS_TEMPLATES } from '@/lib/twilio'

interface VapiWebhookPayload {
  message: {
    type: string
    functionCall?: {
      name: string
      parameters: Record<string, unknown>
    }
    call?: {
      id: string
      customer?: {
        number: string
      }
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload: VapiWebhookPayload = await request.json()
    
    console.log('Vapi webhook received:', JSON.stringify(payload, null, 2))

    // Only handle function calls
    if (payload.message.type !== 'function-call' || !payload.message.functionCall) {
      return NextResponse.json({ result: 'OK' })
    }

    const { name, parameters } = payload.message.functionCall
    const customerPhone = payload.message.call?.customer?.number || ''

    switch (name) {
      case 'validateAddress': {
        const address = parameters.address as string
        
        if (!address) {
          return NextResponse.json({
            result: 'Maaf, saya tidak mendengar alamatnya. Bisa diulangi?'
          })
        }

        const validation = await validateAddress(address)

        if (!validation.isValid) {
          return NextResponse.json({
            result: `Maaf, alamat "${address}" tidak dapat ditemukan. Bisa Anda sebutkan lebih detail? Misalnya nama jalan, nomor, dan kelurahan.`
          })
        }

        if (!validation.isInCoverage) {
          return NextResponse.json({
            result: `Maaf, alamat ${validation.formattedAddress} berada di luar jangkauan layanan kami yang saat ini hanya mencakup Kota Bandung. Untuk wilayah tersebut, silakan hubungi dinas terkait di daerah setempat.`
          })
        }

        return NextResponse.json({
          result: {
            success: true,
            message: `Alamat berhasil divalidasi: ${validation.formattedAddress}`,
            formattedAddress: validation.formattedAddress,
            lat: validation.lat,
            lng: validation.lng,
            confidence: validation.confidence,
          }
        })
      }

      case 'createTicket': {
        const {
          category,
          subcategory,
          description,
          reporterName,
          reporterPhone,
          address,
          addressLat,
          addressLng,
          urgency,
        } = parameters as {
          category: TicketCategory
          subcategory?: string
          description: string
          reporterName: string
          reporterPhone?: string
          address: string
          addressLat?: number
          addressLng?: number
          urgency?: TicketUrgency
        }

        // Validate required fields
        if (!category || !description || !reporterName || !address) {
          return NextResponse.json({
            result: 'Maaf, ada informasi yang belum lengkap. Pastikan kategori, deskripsi, nama pelapor, dan alamat sudah diisi.'
          })
        }

        // Use customer phone from call if not provided
        const phone = reporterPhone || customerPhone
        const phoneValidation = validatePhoneNumber(phone)
        
        if (!phoneValidation.isValid) {
          return NextResponse.json({
            result: 'Maaf, nomor telepon tidak valid. Bisa Anda sebutkan nomor telepon yang benar?'
          })
        }

        // Generate ticket ID
        const ticketId = generateTicketId()

        // Determine assigned dinas based on category
        const assignedDinas = CATEGORY_TO_DINAS[category] || ['admin']

        // Determine urgency if not provided
        const finalUrgency = urgency || (category === 'DARURAT' ? 'CRITICAL' : 'MEDIUM')

        // Create ticket in database
        const { error: ticketError } = await supabaseAdmin
          .from('tickets')
          .insert({
            id: ticketId,
            category,
            subcategory: subcategory || null,
            location: address,
            description,
            reporter_phone: phoneValidation.formatted,
            reporter_name: reporterName,
            validated_address: address,
            address_lat: addressLat || null,
            address_lng: addressLng || null,
            status: 'PENDING',
            urgency: finalUrgency,
            assigned_dinas: assignedDinas,
            transcription: description,
          })

        if (ticketError) {
          console.error('Failed to create ticket:', ticketError)
          return NextResponse.json({
            result: 'Maaf, terjadi kesalahan saat membuat laporan. Silakan coba lagi atau hubungi 112 untuk keadaan darurat.'
          })
        }

        // Create timeline entries
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

        // Send SMS notification (if Twilio is configured)
        const trackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/track/${ticketId}`
        const categoryLabel = {
          DARURAT: 'Darurat',
          INFRA: 'Infrastruktur',
          KEBERSIHAN: 'Kebersihan',
          SOSIAL: 'Sosial',
          LAINNYA: 'Lainnya',
        }[category]

        const smsMessage = SMS_TEMPLATES.ticketCreated(ticketId, categoryLabel, trackUrl)
        await sendSmsNotification(phoneValidation.formatted, smsMessage)

        // Format ticket ID for speech
        const ticketIdSpoken = formatTicketIdForSpeech(ticketId)
        const dinasNames = assignedDinas.map((d: DinasId) => DINAS_NAMES[d]).join(' dan ')

        const urgencyMessage = finalUrgency === 'CRITICAL' 
          ? `Ini adalah laporan darurat dan akan segera ditindaklanjuti. ${dinasNames} sedang dikirim ke lokasi.`
          : `Laporan akan diteruskan ke ${dinasNames} untuk ditindaklanjuti.`

        return NextResponse.json({
          result: {
            success: true,
            message: `Terima kasih ${reporterName}. Laporan Anda telah berhasil dicatat dengan nomor tiket ${ticketIdSpoken}. ${urgencyMessage} Anda akan menerima SMS konfirmasi dengan link untuk melacak status laporan. Terima kasih telah menggunakan SatuPintu.`,
            ticketId,
            trackUrl,
          }
        })
      }

      default:
        return NextResponse.json({
          result: `Unknown function: ${name}`
        })
    }
  } catch (error) {
    console.error('Vapi webhook error:', error)
    return NextResponse.json({
      result: 'Maaf, terjadi kesalahan sistem. Silakan coba lagi.'
    })
  }
}

// Vapi sends GET for health check
export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'SatuPintu Vapi Webhook' })
}
