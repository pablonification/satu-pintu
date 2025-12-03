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
  
  try {
    // Build base query
    let baseQuery = supabaseAdmin.from('tickets').select('status, urgency, created_at')
    
    // Filter by dinas if not admin
    if (auth.dinas_id !== 'admin') {
      baseQuery = baseQuery.contains('assigned_dinas', [auth.dinas_id])
    }
    
    const { data: tickets, error } = await baseQuery
    
    if (error) throw error
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const stats = {
      total: tickets?.length || 0,
      pending: tickets?.filter(t => t.status === 'PENDING').length || 0,
      inProgress: tickets?.filter(t => t.status === 'IN_PROGRESS').length || 0,
      resolved: tickets?.filter(t => t.status === 'RESOLVED').length || 0,
      cancelled: tickets?.filter(t => t.status === 'CANCELLED').length || 0,
      byUrgency: {
        critical: tickets?.filter(t => t.urgency === 'CRITICAL').length || 0,
        high: tickets?.filter(t => t.urgency === 'HIGH').length || 0,
        medium: tickets?.filter(t => t.urgency === 'MEDIUM').length || 0,
        low: tickets?.filter(t => t.urgency === 'LOW').length || 0,
      },
      today: {
        total: tickets?.filter(t => new Date(t.created_at) >= today).length || 0,
        pending: tickets?.filter(t => t.status === 'PENDING' && new Date(t.created_at) >= today).length || 0,
        inProgress: tickets?.filter(t => t.status === 'IN_PROGRESS' && new Date(t.created_at) >= today).length || 0,
        resolved: tickets?.filter(t => t.status === 'RESOLVED' && new Date(t.created_at) >= today).length || 0,
      },
    }
    
    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
