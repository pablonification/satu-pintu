'use client'

import { useEffect, useState, use } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Search,
  Phone
} from 'lucide-react'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

interface TicketData {
  id: string
  category: string
  subcategory: string | null
  location: string
  status: string
  statusText: string
  categoryText: string
  urgency: string
  assignedTo: string[]
  createdAt: string
  updatedAt: string
  timeline: Array<{
    time: string
    message: string
  }>
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  ESCALATED: 'bg-orange-100 text-orange-800',
  RESOLVED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
}

const URGENCY_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-800',
  HIGH: 'bg-orange-100 text-orange-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  LOW: 'bg-green-100 text-green-800',
}

export default function TrackPage({ params }: { params: Promise<{ ticketId: string }> }) {
  const resolvedParams = use(params)
  const [ticket, setTicket] = useState<TicketData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchId, setSearchId] = useState('')

  useEffect(() => {
    fetchTicket(resolvedParams.ticketId)
  }, [resolvedParams.ticketId])

  async function fetchTicket(id: string) {
    setLoading(true)
    setError(null)
    
    try {
      const res = await fetch(`/api/track/${id}`)
      const data = await res.json()
      
      if (data.success) {
        setTicket(data.data)
      } else {
        setError(data.error || 'Tiket tidak ditemukan')
      }
    } catch {
      setError('Gagal memuat data tiket')
    } finally {
      setLoading(false)
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchId.trim()) {
      window.location.href = `/track/${searchId.trim()}`
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <Phone className="h-8 w-8" />
            <h1 className="text-2xl font-bold">SatuPintu</h1>
          </div>
          <p className="text-blue-100">Lacak Status Laporan Anda</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Search Box */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                placeholder="Masukkan nomor tiket (SP-XXXXXXXX-XXXX)"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="flex-1"
              />
              <Button type="submit">
                <Search className="h-4 w-4 mr-2" />
                Cari
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-700 font-medium">{error}</p>
              <p className="text-red-600 text-sm mt-2">
                Pastikan nomor tiket yang Anda masukkan benar.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Ticket Details */}
        {ticket && !loading && (
          <>
            {/* Status Card */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{ticket.id}</CardTitle>
                  <Badge className={STATUS_COLORS[ticket.status]}>
                    {ticket.statusText}
                  </Badge>
                </div>
                <CardDescription>
                  {ticket.categoryText} {ticket.subcategory && `- ${ticket.subcategory}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Lokasi</p>
                      <p className="font-medium">{ticket.location}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Dilaporkan</p>
                      <p className="font-medium">
                        {format(new Date(ticket.createdAt), 'dd MMMM yyyy, HH:mm', { locale: idLocale })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Prioritas:</span>
                    <Badge className={URGENCY_COLORS[ticket.urgency]}>
                      {ticket.urgency}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-2">Ditangani oleh:</p>
                    <div className="flex flex-wrap gap-2">
                      {ticket.assignedTo.map((dinas, i) => (
                        <Badge key={i} variant="outline">{dinas}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Riwayat Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ticket.timeline.map((item, index) => (
                    <div key={index}>
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {index === 0 ? (
                            <CheckCircle2 className="h-5 w-5 text-blue-600" />
                          ) : (
                            <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-500">
                            {format(new Date(item.time), 'dd MMM yyyy, HH:mm', { locale: idLocale })}
                          </p>
                          <p className="font-medium">{item.message}</p>
                        </div>
                      </div>
                      {index < ticket.timeline.length - 1 && (
                        <Separator className="my-4 ml-2.5" orientation="vertical" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Help Text */}
            <p className="text-center text-sm text-gray-500 mt-6">
              Butuh bantuan? Kirim SMS <strong>CEK {ticket.id}</strong> ke nomor SatuPintu
              <br />
              atau hubungi 112 untuk keadaan darurat.
            </p>
          </>
        )}
      </main>
    </div>
  )
}
