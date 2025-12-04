'use client'

import { useState, useRef, useEffect } from 'react'
import { Download, FileSpreadsheet, FileText, File } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ExportButtonProps {
  filters?: {
    from?: string
    to?: string
    status?: string
    category?: string
    urgency?: string
  }
}

export function ExportButton({ filters }: ExportButtonProps) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  async function handleExport(format: 'csv' | 'xlsx' | 'pdf') {
    setLoading(true)
    setOpen(false)
    
    try {
      const params = new URLSearchParams()
      params.set('format', format)
      if (filters?.from) params.set('from', filters.from)
      if (filters?.to) params.set('to', filters.to)
      if (filters?.status) params.set('status', filters.status)
      if (filters?.category) params.set('category', filters.category)
      if (filters?.urgency) params.set('urgency', filters.urgency)
      
      const response = await fetch(`/api/export?${params}`)
      
      if (!response.ok) throw new Error('Export failed')
      
      // Get filename from header or generate
      const contentDisposition = response.headers.get('Content-Disposition')
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/)
      const filename = filenameMatch?.[1] || `export.${format}`
      
      // Download file
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('Export error:', error)
      alert('Gagal mengekspor data')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="border-white/10 hover:bg-white/5"
      >
        <Download className="h-4 w-4 mr-2" />
        {loading ? 'Mengekspor...' : 'Ekspor Data'}
      </Button>
      
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-background border border-white/10 rounded-lg shadow-lg z-50">
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center w-full px-4 py-2 text-sm hover:bg-white/5 rounded-t-lg"
          >
            <FileText className="h-4 w-4 mr-2" />
            Export CSV
          </button>
          <button
            onClick={() => handleExport('xlsx')}
            className="flex items-center w-full px-4 py-2 text-sm hover:bg-white/5"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export Excel
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="flex items-center w-full px-4 py-2 text-sm hover:bg-white/5 rounded-b-lg"
          >
            <File className="h-4 w-4 mr-2" />
            Export PDF
          </button>
        </div>
      )}
    </div>
  )
}
