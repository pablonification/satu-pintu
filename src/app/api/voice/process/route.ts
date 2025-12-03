import { NextRequest, NextResponse } from 'next/server'
import { generateTwiML, sendSmsNotification, SMS_TEMPLATES, formatPhoneNumber } from '@/lib/twilio'
import { processAudioWithGemini, analyzeComplaint } from '@/lib/gemini'
import { supabaseAdmin, generateTicketId } from '@/lib/supabase'
import { CATEGORY_LABELS, DINAS_NAMES, DinasId } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const callSid = formData.get('CallSid') as string
    const from = formData.get('From') as string
    const recordingUrl = formData.get('RecordingUrl') as string
    
    console.log(`Processing recording for call ${callSid} from ${from}`)
    console.log(`Recording URL: ${recordingUrl}`)
    
    let analysis
    
    if (recordingUrl) {
      // Fetch the audio recording from Twilio
      const audioResponse = await fetch(`${recordingUrl}.mp3`, {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
          ).toString('base64')}`,
        },
      })
      
      if (audioResponse.ok) {
        const audioBuffer = await audioResponse.arrayBuffer()
        const audioBase64 = Buffer.from(audioBuffer).toString('base64')
        
        // Process audio with Gemini 2.0 Flash
        analysis = await processAudioWithGemini(audioBase64, 'audio/mpeg')
      } else {
        // Fallback: use transcription if available
        const transcription = formData.get('TranscriptionText') as string
        if (transcription) {
          analysis = await analyzeComplaint(transcription)
        } else {
          throw new Error('No audio or transcription available')
        }
      }
    } else {
      throw new Error('No recording URL provided')
    }
    
    // Generate ticket ID
    const ticketId = generateTicketId()
    
    // Create ticket in database
    const { error: ticketError } = await supabaseAdmin
      .from('tickets')
      .insert({
        id: ticketId,
        category: analysis.category,
        subcategory: analysis.subcategory,
        location: analysis.location,
        description: analysis.description,
        reporter_phone: formatPhoneNumber(from),
        status: 'PENDING',
        urgency: analysis.urgency,
        assigned_dinas: analysis.assignedDinas,
        call_sid: callSid,
        transcription: analysis.description,
      })
    
    if (ticketError) {
      console.error('Failed to create ticket:', ticketError)
    }
    
    // Create initial timeline entries
    await supabaseAdmin.from('ticket_timeline').insert([
      {
        ticket_id: ticketId,
        action: 'CREATED',
        message: 'Laporan diterima via telepon',
        created_by: 'system',
      },
      {
        ticket_id: ticketId,
        action: 'ASSIGNED',
        message: `Diteruskan ke ${analysis.assignedDinas.map((d: DinasId) => DINAS_NAMES[d]).join(', ')}`,
        created_by: 'system',
      },
    ])
    
    // Log the call
    await supabaseAdmin.from('call_logs').insert({
      ticket_id: ticketId,
      call_sid: callSid,
      phone_from: formatPhoneNumber(from),
      recording_url: recordingUrl,
      status: 'COMPLETED',
    })
    
    // Send SMS confirmation
    const trackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/track/${ticketId}`
    const smsMessage = SMS_TEMPLATES.ticketCreated(
      ticketId,
      CATEGORY_LABELS[analysis.category],
      trackUrl
    )
    
    const smsSid = await sendSmsNotification(from, smsMessage)
    
    if (smsSid) {
      await supabaseAdmin.from('sms_logs').insert({
        ticket_id: ticketId,
        phone_to: formatPhoneNumber(from),
        message: smsMessage,
        direction: 'OUTBOUND',
        twilio_sid: smsSid,
        status: 'SENT',
      })
    }
    
    // Generate TwiML response with confirmation
    const ticketIdSpoken = ticketId.split('').join(' ').replace(/-/g, ', ')
    const dinasNames = analysis.assignedDinas.map((d: DinasId) => DINAS_NAMES[d]).join(' dan ')
    
    const confirmationMessage = `
      Baik, ${analysis.summary}
      Laporan Anda sudah dicatat dengan nomor tiket ${ticketIdSpoken}.
      ${analysis.urgency === 'CRITICAL' ? `Ini adalah laporan darurat. ${dinasNames} sedang dikirim ke lokasi.` : `Laporan akan diteruskan ke ${dinasNames}.`}
      Anda akan menerima S M S konfirmasi dengan link untuk melacak status laporan.
      Terima kasih telah menggunakan Satu Pintu.
    `.trim().replace(/\s+/g, ' ')
    
    const twiml = generateTwiML({
      say: confirmationMessage,
      hangup: true,
    })
    
    return new NextResponse(twiml, {
      headers: {
        'Content-Type': 'text/xml',
      },
    })
  } catch (error) {
    console.error('Voice process error:', error)
    
    const errorTwiml = generateTwiML({
      say: 'Maaf, kami kesulitan memproses keluhan Anda. Silakan coba lagi atau hubungi 112 untuk keadaan darurat.',
      hangup: true,
    })
    
    return new NextResponse(errorTwiml, {
      headers: {
        'Content-Type': 'text/xml',
      },
    })
  }
}
