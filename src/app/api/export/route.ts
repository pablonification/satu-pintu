import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateCSV, generateExcel, generatePDF, ExportTicket } from '@/lib/export-utils'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const format = searchParams.get('format') || 'csv'
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const status = searchParams.get('status')
  const category = searchParams.get('category')
  const urgency = searchParams.get('urgency')
  
  try {
    // Build query
    let query = supabaseAdmin
      .from('tickets')
      .select('id, created_at, category, subcategory, location, description, status, urgency, reporter_name, reporter_phone, resolved_at, assigned_dinas')
      .order('created_at', { ascending: false })
    
    // Apply filters
    if (from) query = query.gte('created_at', from)
    if (to) query = query.lte('created_at', to)
    if (status && status !== 'all') query = query.eq('status', status)
    if (category && category !== 'all') query = query.eq('category', category)
    if (urgency && urgency !== 'all') query = query.eq('urgency', urgency)
    
    const { data: tickets, error } = await query
    
    if (error) throw error
    
    const ticketData = (tickets || []) as ExportTicket[]
    const timestamp = new Date().toISOString().split('T')[0]
    
    // Generate and return file based on format
    switch (format) {
      case 'xlsx': {
        const content = generateExcel(ticketData)
        return new NextResponse(Buffer.from(content), {
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="laporan-tiket-${timestamp}.xlsx"`,
          },
        })
      }
      case 'pdf': {
        const content = generatePDF(ticketData, { from: from || undefined, to: to || undefined })
        return new NextResponse(content, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="laporan-tiket-${timestamp}.pdf"`,
          },
        })
      }
      case 'csv':
      default: {
        const content = generateCSV(ticketData)
        return new NextResponse(content, {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="laporan-tiket-${timestamp}.csv"`,
          },
        })
      }
    }
    
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to export data' },
      { status: 500 }
    )
  }
}
