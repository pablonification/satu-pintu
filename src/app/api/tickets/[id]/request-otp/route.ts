import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendSmsNotification, SMS_TEMPLATES } from '@/lib/twilio'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    // Get ticket
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('tickets')
      .select('id, status, reporter_phone, rating, rating_otp_expires_at')
      .eq('id', id)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json(
        { success: false, error: 'Tiket tidak ditemukan', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    // Check if already rated
    if (ticket.rating) {
      return NextResponse.json(
        { success: false, error: 'Tiket sudah diberi rating', code: 'ALREADY_RATED' },
        { status: 400 }
      )
    }

    // Check if ticket is resolved
    if (ticket.status !== 'RESOLVED') {
      return NextResponse.json(
        { success: false, error: 'Hanya tiket yang sudah selesai yang bisa diberi rating', code: 'NOT_RESOLVED' },
        { status: 400 }
      )
    }

    // Check if OTP was recently sent (prevent spam - 1 minute cooldown)
    if (ticket.rating_otp_expires_at) {
      const expiresAt = new Date(ticket.rating_otp_expires_at)
      const cooldownEnd = new Date(expiresAt.getTime() - 29 * 60 * 1000) // 30 min expiry - 29 min = 1 min cooldown
      if (new Date() < cooldownEnd) {
        const waitSeconds = Math.ceil((cooldownEnd.getTime() - Date.now()) / 1000)
        return NextResponse.json(
          { success: false, error: `Tunggu ${waitSeconds} detik sebelum meminta OTP baru`, code: 'COOLDOWN' },
          { status: 429 }
        )
      }
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

    // Store OTP in database
    const { error: updateError } = await supabaseAdmin
      .from('tickets')
      .update({
        rating_otp: otp,
        rating_otp_expires_at: expiresAt.toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      console.error('Failed to store OTP:', updateError)
      return NextResponse.json(
        { success: false, error: 'Gagal menyimpan OTP', code: 'DB_ERROR' },
        { status: 500 }
      )
    }

    // Send OTP via SMS
    const smsMessage = SMS_TEMPLATES.ratingOTP(otp, id)
    await sendSmsNotification(ticket.reporter_phone, smsMessage)

    // Mask phone number for response
    const maskedPhone = ticket.reporter_phone.replace(/(\+62)(\d{3})(\d+)(\d{3})/, '$1$2****$4')

    return NextResponse.json({
      success: true,
      message: `Kode OTP telah dikirim ke ${maskedPhone}`,
      expiresAt: expiresAt.toISOString(),
    })

  } catch (error) {
    console.error('Request OTP error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server', code: 'SERVER_ERROR' },
      { status: 500 }
    )
  }
}
