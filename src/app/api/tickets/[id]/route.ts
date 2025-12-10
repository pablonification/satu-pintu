import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendWhatsAppNotification, WA_TEMPLATES } from '@/lib/fonnte'
import { STATUS_LABELS, TicketStatus } from '@/types/database'
import { invalidateTicketCaches } from '@/lib/cache'
import jwt from 'jsonwebtoken'

// Validate that URL is from Supabase Storage
function isValidPhotoUrl(url: string | null | undefined): boolean {
  if (!url) return true // null/undefined is valid (no photo)
  try {
    const parsed = new URL(url)
    // Accept Supabase storage URLs
    return parsed.hostname.endsWith('.supabase.co') || 
           parsed.hostname.endsWith('.supabase.in')
  } catch {
    return false
  }
}

const JWT_SECRET = process.env.JWT_SECRET!

interface JWTPayload {
  dinas_id: string
  dinas_name: string
  categories: string[]
}

function verifyAuth(request: NextRequest): JWTPayload | null {
  const token = request.cookies.get('auth_token')?.value || 
                request.headers.get('Authorization')?.replace('Bearer ', '')
  
  if (!token) return null
  
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = verifyAuth(request)
  const { id } = await params
  
  try {
    const { data: ticket, error } = await supabaseAdmin
      .from('tickets')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error || !ticket) {
      return NextResponse.json(
        { success: false, error: 'Ticket not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }
    
    // Check access if authenticated
    if (auth && auth.dinas_id !== 'admin' && !ticket.assigned_dinas.includes(auth.dinas_id)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }
    
    // Get timeline
    const { data: timeline } = await supabaseAdmin
      .from('ticket_timeline')
      .select('*')
      .eq('ticket_id', id)
      .order('created_at', { ascending: false })
    
    return NextResponse.json({
      success: true,
      data: {
        ...ticket,
        timeline: timeline || [],
      },
    })
  } catch (error) {
    console.error('Get ticket error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = verifyAuth(request)
  
  if (!auth) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }
  
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
        { success: false, error: 'Ticket not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }
    
    // Check access
    if (auth.dinas_id !== 'admin' && !ticket.assigned_dinas.includes(auth.dinas_id)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    const { status, note, sendSms, resolution_photo_before, resolution_photo_after } = body
    
    // Validate photo URLs are from Supabase
    if (resolution_photo_before && !isValidPhotoUrl(resolution_photo_before)) {
      return NextResponse.json(
        { success: false, error: 'URL foto sebelum tidak valid', code: 'INVALID_PHOTO_URL' },
        { status: 400 }
      )
    }

    if (resolution_photo_after && !isValidPhotoUrl(resolution_photo_after)) {
      return NextResponse.json(
        { success: false, error: 'URL foto sesudah tidak valid', code: 'INVALID_PHOTO_URL' },
        { status: 400 }
      )
    }
    
    // Validate: when status changes to RESOLVED, require resolution_photo_after
    if (status === 'RESOLVED' && !resolution_photo_after && !ticket.resolution_photo_after) {
      return NextResponse.json(
        { success: false, error: 'Foto bukti penyelesaian (sesudah) wajib diisi untuk menyelesaikan laporan', code: 'PHOTO_REQUIRED' },
        { status: 400 }
      )
    }
    
    // Update ticket
    const updateData: Record<string, unknown> = {}
    if (status) {
      updateData.status = status
      // Set resolved_at timestamp when status changes to RESOLVED
      if (status === 'RESOLVED' && ticket.status !== 'RESOLVED') {
        updateData.resolved_at = new Date().toISOString()
      }
      // Clear resolved_at if status changes away from RESOLVED
      if (status !== 'RESOLVED' && ticket.status === 'RESOLVED') {
        updateData.resolved_at = null
      }
    }
    if (resolution_photo_before) updateData.resolution_photo_before = resolution_photo_before
    if (resolution_photo_after) updateData.resolution_photo_after = resolution_photo_after
    
    const { data: updatedTicket, error: updateError } = await supabaseAdmin
      .from('tickets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (updateError) throw updateError
    
    // Create timeline entry
    const timelineMessage = note 
      ? `Status diubah ke ${STATUS_LABELS[status as TicketStatus]}. ${note}`
      : `Status diubah ke ${STATUS_LABELS[status as TicketStatus]}`
    
    await supabaseAdmin.from('ticket_timeline').insert({
      ticket_id: id,
      action: 'STATUS_CHANGE',
      message: timelineMessage,
      created_by: auth.dinas_id,
      metadata: { old_status: ticket.status, new_status: status },
    })
    
    // Auto-send WhatsApp when ticket is RESOLVED (with rating link)
    let resolvedMessageSent = false
    if (status === 'RESOLVED' && ticket.status !== 'RESOLVED' && ticket.reporter_phone) {
      const trackUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/track/${id}`
      const reporterName = ticket.reporter_name || 'Bapak/Ibu'
      
      // Send resolved notification with rating link
      const resolvedMessage = WA_TEMPLATES.ticketResolved(id, reporterName, trackUrl)
      const resolvedResult = await sendWhatsAppNotification(ticket.reporter_phone, resolvedMessage)
      resolvedMessageSent = resolvedResult.success
      
      if (resolvedResult.success) {
        // Log the resolved notification
        await supabaseAdmin.from('sms_logs').insert({
          ticket_id: id,
          phone_to: ticket.reporter_phone,
          message: resolvedMessage,
          direction: 'OUTBOUND',
          twilio_sid: resolvedResult.messageId || null,
          status: 'SENT',
        })
      }
    }
    
    // Send WhatsApp notification if requested (for other status updates)
    let messageSent = false
    if (sendSms && ticket.reporter_phone) {
      // Generate track URL
      const trackUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/track/${id}`
      
      // Get reporter name (fallback to generic greeting)
      const reporterName = ticket.reporter_name || 'Bapak/Ibu'
      
      // Send WhatsApp notification
      const waMessage = WA_TEMPLATES.statusUpdate(
        id,
        STATUS_LABELS[status as TicketStatus],
        reporterName,
        note || null,
        trackUrl
      )
      
      const waResult = await sendWhatsAppNotification(ticket.reporter_phone, waMessage)
      messageSent = waResult.success
      
      // Log to sms_logs table (keep using this table for compatibility)
      if (waResult.success) {
        await supabaseAdmin.from('sms_logs').insert({
          ticket_id: id,
          phone_to: ticket.reporter_phone,
          message: waMessage,
          direction: 'OUTBOUND',
          twilio_sid: waResult.messageId || null,
          status: 'SENT',
        })
      } else {
        console.error('Failed to send WhatsApp notification:', waResult.error)
      }
    }
    
    // Invalidate caches after update
    invalidateTicketCaches(id)
    
    return NextResponse.json({
      success: true,
      data: {
        ...updatedTicket,
        messageSent,
        resolvedMessageSent,
      },
    })
  } catch (error) {
    console.error('Update ticket error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
