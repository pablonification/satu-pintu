import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import jwt from 'jsonwebtoken'

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

export async function GET(request: NextRequest) {
  const auth = verifyAuth(request)
  
  if (!auth) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }
  
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const status = searchParams.get('status')
  const urgency = searchParams.get('urgency')
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  
  try {
    let query = supabaseAdmin
      .from('tickets')
      .select('id, address_lat, address_lng, category, status, urgency, location, description, created_at')
      // Only return tickets that have coordinates
      .not('address_lat', 'is', null)
      .not('address_lng', 'is', null)
    
    // Filter by assigned dinas (unless admin)
    if (auth.dinas_id !== 'admin') {
      query = query.contains('assigned_dinas', [auth.dinas_id])
    }
    
    // Apply filters
    if (category) query = query.eq('category', category)
    if (status) query = query.eq('status', status)
    if (urgency) query = query.eq('urgency', urgency)
    if (from) query = query.gte('created_at', from)
    if (to) query = query.lte('created_at', to)
    
    // Order by most recent
    query = query.order('created_at', { ascending: false })
    
    const { data: tickets, error } = await query
    
    if (error) throw error
    
    // Transform to map format
    const mapTickets = (tickets || []).map(ticket => ({
      id: ticket.id,
      lat: ticket.address_lat,
      lng: ticket.address_lng,
      category: ticket.category,
      status: ticket.status,
      urgency: ticket.urgency,
      location: ticket.location,
      description: ticket.description,
      created_at: ticket.created_at,
    }))
    
    return NextResponse.json({
      success: true,
      data: {
        tickets: mapTickets,
      },
    })
  } catch (error) {
    console.error('Get map tickets error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
