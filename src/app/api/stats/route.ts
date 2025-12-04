import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cache, CACHE_TTL, getCacheKey } from '@/lib/cache'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

interface JWTPayload {
  dinas_id: string
  dinas_name: string
  categories: string[]
}

interface Stats {
  total: number
  pending: number
  inProgress: number
  resolved: number
  cancelled: number
  byUrgency: {
    critical: number
    high: number
    medium: number
    low: number
  }
  today: {
    total: number
    pending: number
    inProgress: number
    resolved: number
  }
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
  
  // Check cache first
  const cacheKey = getCacheKey('stats', { dinas: auth.dinas_id })
  const cached = cache.get<Stats>(cacheKey)
  
  if (cached) {
    return NextResponse.json({
      success: true,
      data: cached,
      cached: true,
    })
  }
  
  try {
    // Use optimized aggregate query instead of fetching all rows
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayISO = today.toISOString()
    
    // Build query with aggregation using RPC or manual counts
    // For now, use optimized select with only needed columns
    let query = supabaseAdmin
      .from('tickets')
      .select('status, urgency, created_at')
    
    // Filter by dinas if not admin
    if (auth.dinas_id !== 'admin') {
      query = query.contains('assigned_dinas', [auth.dinas_id])
    }
    
    const { data: tickets, error } = await query
    
    if (error) throw error
    
    // Pre-calculate stats in a single pass
    const stats: Stats = {
      total: 0,
      pending: 0,
      inProgress: 0,
      resolved: 0,
      cancelled: 0,
      byUrgency: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      },
      today: {
        total: 0,
        pending: 0,
        inProgress: 0,
        resolved: 0,
      },
    }
    
    // Single pass through tickets
    tickets?.forEach(t => {
      stats.total++
      
      // Status counts
      switch (t.status) {
        case 'PENDING': stats.pending++; break
        case 'IN_PROGRESS': stats.inProgress++; break
        case 'RESOLVED': stats.resolved++; break
        case 'CANCELLED': stats.cancelled++; break
      }
      
      // Urgency counts
      switch (t.urgency) {
        case 'CRITICAL': stats.byUrgency.critical++; break
        case 'HIGH': stats.byUrgency.high++; break
        case 'MEDIUM': stats.byUrgency.medium++; break
        case 'LOW': stats.byUrgency.low++; break
      }
      
      // Today's tickets
      if (t.created_at >= todayISO) {
        stats.today.total++
        switch (t.status) {
          case 'PENDING': stats.today.pending++; break
          case 'IN_PROGRESS': stats.today.inProgress++; break
          case 'RESOLVED': stats.today.resolved++; break
        }
      }
    })
    
    // Cache the result
    cache.set(cacheKey, stats, CACHE_TTL.STATS)
    
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
