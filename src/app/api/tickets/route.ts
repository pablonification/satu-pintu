import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cache, CACHE_TTL, getCacheKey, invalidateTicketCaches } from '@/lib/cache'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

interface JWTPayload {
  dinas_id: string
  dinas_name: string
  categories: string[]
}

interface TicketListResponse {
  tickets: unknown[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
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
  
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const urgency = searchParams.get('urgency')
  const category = searchParams.get('category')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)
  const search = searchParams.get('search')
  
  // Check cache (skip if search is provided - too many variations)
  const cacheKey = !search 
    ? getCacheKey('tickets', { 
        dinas: auth.dinas_id, 
        status: status || undefined, 
        urgency: urgency || undefined, 
        category: category || undefined,
        page: page.toString(),
        limit: limit.toString()
      })
    : null
  
  if (cacheKey) {
    const cached = cache.get<TicketListResponse>(cacheKey)
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        cached: true,
      })
    }
  }
  
  try {
    // Select only needed columns for list view (performance optimization)
    let query = supabaseAdmin
      .from('tickets')
      .select('id, category, subcategory, location, description, reporter_phone, reporter_name, status, urgency, assigned_dinas, resolution_photo_before, resolution_photo_after, created_at, updated_at', { count: 'exact' })
    
    // Filter by assigned dinas (unless admin)
    if (auth.dinas_id !== 'admin') {
      query = query.contains('assigned_dinas', [auth.dinas_id])
    }
    
    // Apply filters
    if (status) query = query.eq('status', status)
    if (urgency) query = query.eq('urgency', urgency)
    if (category) query = query.eq('category', category)
    if (search) {
      // Use optimized search with index
      query = query.or(`id.ilike.%${search}%,location.ilike.%${search}%`)
    }
    
    // Pagination with optimized sorting (uses index)
    const offset = (page - 1) * limit
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    const { data: tickets, error, count } = await query
    
    if (error) throw error
    
    const response: TicketListResponse = {
      tickets: tickets || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    }
    
    // Cache the result (only if no search)
    if (cacheKey) {
      cache.set(cacheKey, response, CACHE_TTL.TICKETS_LIST)
    }
    
    return NextResponse.json({
      success: true,
      data: response,
    })
  } catch (error) {
    console.error('Get tickets error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // Internal API for creating tickets (from voice webhook)
  const apiKey = request.headers.get('X-API-Key')
  
  if (apiKey !== process.env.INTERNAL_API_KEY) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }
  
  try {
    const body = await request.json()
    
    const { data: ticket, error } = await supabaseAdmin
      .from('tickets')
      .insert(body)
      .select()
      .single()
    
    if (error) throw error
    
    // Invalidate caches after creating ticket
    invalidateTicketCaches()
    
    return NextResponse.json({
      success: true,
      data: ticket,
    }, { status: 201 })
  } catch (error) {
    console.error('Create ticket error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
