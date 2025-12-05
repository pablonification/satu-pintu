import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { STATUS_LABELS, CATEGORY_LABELS, DINAS_NAMES, TicketStatus, TicketCategory, DinasId } from '@/types/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const { ticketId } = await params
    
    // Get ticket
    const { data: ticket, error } = await supabaseAdmin
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .single()
    
    if (error || !ticket) {
      return NextResponse.json(
        { success: false, error: 'Ticket not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }
    
    // Get public timeline entries
    const { data: timeline } = await supabaseAdmin
      .from('ticket_timeline')
      .select('*')
      .eq('ticket_id', ticketId)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
    
    // Sanitize response - remove sensitive data
    const sanitizedTicket = {
      id: ticket.id,
      category: ticket.category,
      subcategory: ticket.subcategory,
      location: ticket.location,
      status: ticket.status,
      statusText: STATUS_LABELS[ticket.status as TicketStatus],
      categoryText: CATEGORY_LABELS[ticket.category as TicketCategory],
      urgency: ticket.urgency,
      assignedTo: (ticket.assigned_dinas as DinasId[]).map(d => DINAS_NAMES[d]),
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,
      // Photo proof fields
      resolutionPhotoBefore: ticket.resolution_photo_before,
      resolutionPhotoAfter: ticket.resolution_photo_after,
      // Rating fields
      rating: ticket.rating,
      feedback: ticket.feedback,
      ratedAt: ticket.rated_at,
      timeline: (timeline || []).map(t => ({
        time: t.created_at,
        message: t.message,
        action: t.action,
      })),
    }
    
    return NextResponse.json({
      success: true,
      data: sanitizedTicket,
    })
  } catch (error) {
    console.error('Track API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
