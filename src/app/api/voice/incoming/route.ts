import { NextRequest, NextResponse } from 'next/server'
import { generateTwiML } from '@/lib/twilio'

// Twilio webhook for incoming calls
export async function POST(request: NextRequest) {
  try {
    // Parse form data from Twilio
    const formData = await request.formData()
    const callSid = formData.get('CallSid') as string
    const from = formData.get('From') as string
    
    console.log(`Incoming call: ${callSid} from ${from}`)
    
    // Generate TwiML response
    const twiml = generateTwiML({
      say: 'Selamat datang di Satu Pintu, layanan pengaduan terpadu Kota Bandung. Silakan sampaikan keluhan Anda setelah bunyi beep. Tekan tombol pagar jika sudah selesai.',
      record: {
        maxLength: 120,
        action: `${process.env.NEXT_PUBLIC_APP_URL}/api/voice/process`,
      },
    })
    
    return new NextResponse(twiml, {
      headers: {
        'Content-Type': 'text/xml',
      },
    })
  } catch (error) {
    console.error('Voice incoming error:', error)
    
    const errorTwiml = generateTwiML({
      say: 'Maaf, terjadi kesalahan sistem. Silakan coba lagi nanti.',
      hangup: true,
    })
    
    return new NextResponse(errorTwiml, {
      headers: {
        'Content-Type': 'text/xml',
      },
    })
  }
}
