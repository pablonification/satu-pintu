'use client'

import { useEffect, useState, use } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Search,
  Phone,
  ArrowLeft
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
  PENDING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 border',
  IN_PROGRESS: 'bg-blue-500/10 text-blue-400 border-blue-500/20 border',
  ESCALATED: 'bg-orange-500/10 text-orange-400 border-orange-500/20 border',
  RESOLVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 border',
  CANCELLED: 'bg-gray-500/10 text-gray-400 border-gray-500/20 border',
}

const URGENCY_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-500/10 text-red-400 border-red-500/20 border',
  HIGH: 'bg-orange-500/10 text-orange-400 border-orange-500/20 border',
  MEDIUM: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 border',
  LOW: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 border',
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
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
       {/* Background Elements */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-background">
        <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* Header */}
      <header className="border-b border-white/5 bg-background/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 border border-white/10">
                <Phone className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-lg font-bold text-white">SatuPintu</h1>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali ke Beranda
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-2">Lacak Laporan</h2>
            <p className="text-muted-foreground">Masukkan ID tiket Anda untuk melihat status terkini.</p>
        </div>

        {/* Search Box */}
        <Card className="mb-8 border-white/10 bg-white/5 backdrop-blur-sm">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex gap-3">
              <Input
                placeholder="Masukkan nomor tiket (SP-XXXXXXXX-XXXX)"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="flex-1 bg-black/20 border-white/10 text-white placeholder:text-muted-foreground focus-visible:ring-white/20"
              />
              <Button type="submit" className="bg-white text-black hover:bg-white/90">
                <Search className="h-4 w-4 mr-2" />
                Cari
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-white/50 mb-4" />
            <p className="text-muted-foreground animate-pulse">Mengambil data tiket...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-destructive font-medium text-lg">{error}</p>
              <p className="text-destructive/80 text-sm mt-2">
                Pastikan nomor tiket yang Anda masukkan benar.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Ticket Details */}
        {ticket && !loading && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Status Card */}
            <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
              <CardHeader className="border-b border-white/5 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                      <CardTitle className="text-xl text-white mb-1">{ticket.id}</CardTitle>
                      <CardDescription className="text-muted-foreground">
                        {ticket.categoryText} {ticket.subcategory && <span className="text-white/40">• {ticket.subcategory}</span>}
                      </CardDescription>
                  </div>
                  <Badge className={`px-3 py-1 text-sm font-medium ${STATUS_COLORS[ticket.status]}`}>
                    {ticket.statusText}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-md bg-white/5 border border-white/5">
                        <MapPin className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Lokasi</p>
                      <p className="font-medium text-white">{ticket.location}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-md bg-white/5 border border-white/5">
                        <Clock className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Dilaporkan</p>
                      <p className="font-medium text-white">
                        {format(new Date(ticket.createdAt), 'dd MMMM yyyy, HH:mm', { locale: idLocale })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                     <div className="p-2 rounded-md bg-white/5 border border-white/5">
                        <AlertCircle className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Prioritas</p>
                        <Badge className={`mt-0.5 ${URGENCY_COLORS[ticket.urgency]}`}>
                        {ticket.urgency}
                        </Badge>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                     <div className="p-2 rounded-md bg-white/5 border border-white/5">
                        <CheckCircle2 className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Ditangani oleh</p>
                      <div className="flex flex-wrap gap-2">
                        {ticket.assignedTo.map((dinas, i) => (
                          <Badge key={i} variant="outline" className="border-white/10 text-white/80 bg-white/5 hover:bg-white/10 transition-colors">
                            {dinas}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline Card */}
            <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
              <CardHeader className="border-b border-white/5">
                <CardTitle className="text-lg text-white">Riwayat Status</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="relative pl-4">
                    {/* Vertical Line */}
                   <div className="absolute top-2 left-[11px] bottom-2 w-px bg-white/10" />

                  {ticket.timeline.map((item, index) => (
                    <div key={index} className="relative pl-8 pb-8 last:pb-0 group">
                      {/* Dot */}
                      <div className={`absolute left-0 top-1 h-6 w-6 rounded-full border-2 flex items-center justify-center bg-background z-10 ${index === 0 ? 'border-emerald-500 text-emerald-500' : 'border-white/20 text-white/20'}`}>
                        <div className={`h-2 w-2 rounded-full ${index === 0 ? 'bg-emerald-500' : 'bg-white/20'}`} />
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-medium text-white">
                            {item.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(item.time), 'dd MMM yyyy, HH:mm', { locale: idLocale })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Help Text */}
            <div className="text-center mt-8 p-6 rounded-2xl bg-white/5 border border-white/5">
                 <p className="text-sm text-muted-foreground">
                    Butuh bantuan? Kirim SMS <strong>CEK {ticket.id}</strong> ke nomor SatuPintu
                    <br />
                    atau hubungi <span className="text-white font-medium">112</span> untuk keadaan darurat.
                </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}