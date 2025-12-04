import { NextRequest, NextResponse } from 'next/server'
import { processAudioWithGemini, analyzeComplaint, AnalyzedComplaint } from '@/lib/gemini'
import { supabaseAdmin, generateTicketId } from '@/lib/supabase'
import { CATEGORY_LABELS, DINAS_NAMES, DinasId } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { audioBase64, mimeType, phoneNumber, createTicket, textInput } = body

    let analysis: AnalyzedComplaint

    // Support both audio and text input for testing
    if (textInput) {
      // Text mode - for testing without microphone
      analysis = await analyzeComplaint(textInput)
    } else if (audioBase64) {
      // Audio mode - process with Gemini
      analysis = await processAudioWithGemini(audioBase64, mimeType || 'audio/webm')
    } else {
      return NextResponse.json(
        { success: false, error: 'No audio or text input provided' },
        { status: 400 }
      )
    }

    const result: {
      success: boolean
      analysis: AnalyzedComplaint
      ticket?: {
        id: string
        trackUrl: string
      }
    } = {
      success: true,
      analysis,
    }

    // Optionally create ticket
    if (createTicket) {
      const ticketId = generateTicketId()
      const formattedPhone = phoneNumber?.startsWith('+62') 
        ? phoneNumber 
        : `+62${phoneNumber?.replace(/^0/, '')}`

      const { error: ticketError } = await supabaseAdmin
        .from('tickets')
        .insert({
          id: ticketId,
          category: analysis.category,
          subcategory: analysis.subcategory,
          location: analysis.location,
          description: analysis.description,
          reporter_phone: formattedPhone || '+6285155347701',
          status: 'PENDING',
          urgency: analysis.urgency,
          assigned_dinas: analysis.assignedDinas,
          transcription: analysis.description,
        })

      if (ticketError) {
        console.error('Failed to create ticket:', ticketError)
        return NextResponse.json(
          { success: false, error: 'Failed to create ticket', details: ticketError },
          { status: 500 }
        )
      }

      // Create timeline entries
      await supabaseAdmin.from('ticket_timeline').insert([
        {
          ticket_id: ticketId,
          action: 'CREATED',
          message: 'Laporan diterima via test call (web)',
          created_by: 'system',
        },
        {
          ticket_id: ticketId,
          action: 'ASSIGNED',
          message: `Diteruskan ke ${analysis.assignedDinas.map((d: DinasId) => DINAS_NAMES[d]).join(', ')}`,
          created_by: 'system',
        },
      ])

      result.ticket = {
        id: ticketId,
        trackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/track/${ticketId}`,
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Test voice error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process request', details: String(error) },
      { status: 500 }
    )
  }
}
