import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

// Extend jsPDF types for autotable
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: { finalY: number }
  }
}

export interface ExportTicket {
  id: string
  created_at: string
  category: string
  subcategory?: string
  location: string
  description: string
  status: string
  urgency: string
  reporter_name: string
  reporter_phone: string
  resolved_at?: string
  assigned_dinas: string[]
}

// Mask phone number for privacy
function maskPhone(phone: string): string {
  if (!phone || phone.length < 8) return '***'
  return phone.slice(0, 4) + '****' + phone.slice(-3)
}

// Format date in Indonesian
function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  return format(new Date(dateStr), 'dd MMM yyyy HH:mm', { locale: idLocale })
}

// Calculate resolution time in hours
function calcResolutionTime(created: string, resolved?: string): string {
  if (!resolved) return '-'
  const hours = (new Date(resolved).getTime() - new Date(created).getTime()) / (1000 * 60 * 60)
  if (hours < 1) return `${Math.round(hours * 60)} menit`
  if (hours < 24) return `${Math.round(hours)} jam`
  return `${Math.round(hours / 24)} hari`
}

// Transform ticket data for export
function transformTickets(tickets: ExportTicket[]) {
  return tickets.map(t => ({
    'ID Tiket': t.id,
    'Tanggal': formatDate(t.created_at),
    'Kategori': t.category,
    'Sub-Kategori': t.subcategory || '-',
    'Lokasi': t.location,
    'Deskripsi': t.description.slice(0, 100) + (t.description.length > 100 ? '...' : ''),
    'Status': t.status,
    'Urgensi': t.urgency,
    'Pelapor': t.reporter_name,
    'Telepon': maskPhone(t.reporter_phone),
    'Dinas': t.assigned_dinas?.join(', ') || '-',
    'Waktu Selesai': t.resolved_at ? formatDate(t.resolved_at) : '-',
    'Durasi Penyelesaian': calcResolutionTime(t.created_at, t.resolved_at),
  }))
}

// Generate CSV
export function generateCSV(tickets: ExportTicket[]): string {
  const data = transformTickets(tickets)
  if (data.length === 0) return ''
  
  const headers = Object.keys(data[0])
  const rows = data.map(row => 
    headers.map(h => {
      const val = row[h as keyof typeof row] || ''
      // Escape quotes and wrap in quotes if contains comma
      const escaped = String(val).replace(/"/g, '""')
      return escaped.includes(',') || escaped.includes('\n') ? `"${escaped}"` : escaped
    }).join(',')
  )
  
  return [headers.join(','), ...rows].join('\n')
}

// Generate Excel
export function generateExcel(tickets: ExportTicket[]): Uint8Array {
  const data = transformTickets(tickets)
  const ws = XLSX.utils.json_to_sheet(data)
  
  // Set column widths
  ws['!cols'] = [
    { wch: 20 }, // ID
    { wch: 18 }, // Tanggal
    { wch: 15 }, // Kategori
    { wch: 15 }, // Sub-Kategori
    { wch: 30 }, // Lokasi
    { wch: 40 }, // Deskripsi
    { wch: 12 }, // Status
    { wch: 10 }, // Urgensi
    { wch: 20 }, // Pelapor
    { wch: 15 }, // Telepon
    { wch: 25 }, // Dinas
    { wch: 18 }, // Waktu Selesai
    { wch: 18 }, // Durasi
  ]
  
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Laporan Tiket')
  
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as Uint8Array
}

// Generate PDF
export function generatePDF(tickets: ExportTicket[], filters?: { from?: string; to?: string }): ArrayBuffer {
  const doc = new jsPDF({ orientation: 'landscape' })
  
  // Header
  doc.setFontSize(18)
  doc.text('Laporan Tiket SatuPintu', 14, 15)
  
  doc.setFontSize(10)
  doc.setTextColor(100)
  const dateRange = filters?.from && filters?.to 
    ? `Periode: ${formatDate(filters.from)} - ${formatDate(filters.to)}`
    : `Diekspor pada: ${format(new Date(), 'dd MMMM yyyy HH:mm', { locale: idLocale })}`
  doc.text(dateRange, 14, 22)
  doc.text(`Total: ${tickets.length} tiket`, 14, 28)
  
  // Table
  const data = transformTickets(tickets)
  const headers = ['ID Tiket', 'Tanggal', 'Kategori', 'Lokasi', 'Status', 'Urgensi', 'Pelapor', 'Durasi']
  const rows = data.map(row => [
    row['ID Tiket'],
    row['Tanggal'],
    row['Kategori'],
    row['Lokasi'].slice(0, 30),
    row['Status'],
    row['Urgensi'],
    row['Pelapor'],
    row['Durasi Penyelesaian'],
  ])
  
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 35,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [59, 130, 246] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  })
  
  // Footer - use internal.pages array to get page count
  const pageCount = (doc.internal as { pages: unknown[] }).pages.length - 1
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(
      `Halaman ${i} dari ${pageCount} - SatuPintu Bandung`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    )
  }
  
  return doc.output('arraybuffer')
}
