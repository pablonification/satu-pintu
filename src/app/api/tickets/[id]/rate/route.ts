import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/tickets/[id]/rate
// Body: { rating: number (1-5), feedback?: string }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  try {
    // Get existing ticket
    const { data: ticket, error: fetchError } = await supabaseAdmin
      .from('tickets')
      .select('*')
      .eq('id', id)
      .single()
    
    if (fetchError || !ticket) {
      return NextResponse.json(
        { success: false, error: 'Tiket tidak ditemukan', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }
    
    // Validate: ticket must be RESOLVED
    if (ticket.status !== 'RESOLVED') {
      return NextResponse.json(
        { success: false, error: 'Hanya tiket yang sudah selesai yang dapat dinilai', code: 'NOT_RESOLVED' },
        { status: 400 }
      )
    }
    
    // Validate: ticket must not already be rated
    if (ticket.rating !== null) {
      return NextResponse.json(
        { success: false, error: 'Tiket ini sudah pernah dinilai', code: 'ALREADY_RATED' },
        { status: 400 }
      )
    }
    
    const body = await request.json()
    const { rating, feedback } = body
    
    // Validate rating
    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: 'Rating harus berupa angka 1-5', code: 'INVALID_RATING' },
        { status: 400 }
      )
    }
    
    // Update ticket with rating
    const { data: updatedTicket, error: updateError } = await supabaseAdmin
      .from('tickets')
      .update({
        rating: rating,
        feedback: feedback || null,
        rated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    
    if (updateError) {
      console.error('Update rating error:', updateError)
      throw updateError
    }
    
    // Create timeline entry for rating
    await supabaseAdmin.from('ticket_timeline').insert({
      ticket_id: id,
      action: 'NOTE',
      message: `Pelapor memberikan rating ${rating}/5${feedback ? `: "${feedback}"` : ''}`,
      created_by: 'reporter',
      is_public: true,
      metadata: { rating, feedback },
    })
    
    return NextResponse.json({
      success: true,
      data: {
        rating: updatedTicket.rating,
        feedback: updatedTicket.feedback,
        rated_at: updatedTicket.rated_at,
      },
    })
  } catch (error) {
    console.error('Rate ticket error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan internal', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
