import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const days = parseInt(searchParams.get('days') || '30')
  
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    // Get all tickets within date range
    const { data: tickets, error } = await supabaseAdmin
      .from('tickets')
      .select('id, category, urgency, status, created_at, resolved_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })
    
    if (error) throw error
    
    // Process data for charts
    const ticketsByDay: Record<string, number> = {}
    const ticketsByCategory: Record<string, number> = {}
    const ticketsByUrgency: Record<string, number> = {}
    const ticketsByStatus: Record<string, number> = {}
    let totalResolutionTime = 0
    let resolvedCount = 0
    const resolutionTimeByCategory: Record<string, { total: number; count: number }> = {}
    
    tickets?.forEach(ticket => {
      // By day
      const day = new Date(ticket.created_at).toISOString().split('T')[0]
      ticketsByDay[day] = (ticketsByDay[day] || 0) + 1
      
      // By category
      ticketsByCategory[ticket.category] = (ticketsByCategory[ticket.category] || 0) + 1
      
      // By urgency
      ticketsByUrgency[ticket.urgency] = (ticketsByUrgency[ticket.urgency] || 0) + 1
      
      // By status
      ticketsByStatus[ticket.status] = (ticketsByStatus[ticket.status] || 0) + 1
      
      // Resolution time
      if (ticket.resolved_at && ticket.created_at) {
        const resolutionTime = new Date(ticket.resolved_at).getTime() - new Date(ticket.created_at).getTime()
        totalResolutionTime += resolutionTime
        resolvedCount++
        
        // By category
        if (!resolutionTimeByCategory[ticket.category]) {
          resolutionTimeByCategory[ticket.category] = { total: 0, count: 0 }
        }
        resolutionTimeByCategory[ticket.category].total += resolutionTime
        resolutionTimeByCategory[ticket.category].count++
      }
    })
    
    // Convert to arrays for charts
    const dailyData = Object.entries(ticketsByDay).map(([date, count]) => ({
      date,
      count,
    })).sort((a, b) => a.date.localeCompare(b.date))
    
    const categoryData = Object.entries(ticketsByCategory).map(([name, value]) => ({
      name,
      value,
    }))
    
    const urgencyData = Object.entries(ticketsByUrgency).map(([name, value]) => ({
      name,
      value,
    }))
    
    const statusData = Object.entries(ticketsByStatus).map(([name, value]) => ({
      name,
      value,
    }))
    
    const resolutionData = Object.entries(resolutionTimeByCategory).map(([category, data]) => ({
      category,
      avgHours: Math.round((data.total / data.count) / (1000 * 60 * 60) * 10) / 10, // In hours, 1 decimal
    }))
    
    const avgResolutionTime = resolvedCount > 0 
      ? Math.round((totalResolutionTime / resolvedCount) / (1000 * 60 * 60) * 10) / 10 
      : 0
    
    return NextResponse.json({
      success: true,
      data: {
        summary: {
          total: tickets?.length || 0,
          resolved: ticketsByStatus['RESOLVED'] || 0,
          pending: ticketsByStatus['PENDING'] || 0,
          inProgress: ticketsByStatus['IN_PROGRESS'] || 0,
          avgResolutionTimeHours: avgResolutionTime,
        },
        dailyData,
        categoryData,
        urgencyData,
        statusData,
        resolutionData,
      }
    })
    
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
