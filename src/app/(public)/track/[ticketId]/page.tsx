'use client'

import { useEffect, useState, use } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Search,
  Phone,
  ArrowLeft,
  Star,
  ImageIcon,
  Send
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
  resolutionPhotoBefore: string | null
  resolutionPhotoAfter: string | null
  rating: number | null
  feedback: string | null
  ratedAt: string | null
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
  
  // Rating state
  const [selectedRating, setSelectedRating] = useState<number>(0)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [feedbackText, setFeedbackText] = useState('')
  const [submittingRating, setSubmittingRating] = useState(false)
  const [ratingError, setRatingError] = useState<string | null>(null)
  const [ratingSuccess, setRatingSuccess] = useState(false)
  
  // OTP state
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState<string | null>(null)
  const [otpExpiry, setOtpExpiry] = useState<Date | null>(null)

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
  
  async function handleRequestOTP() {
    if (!ticket) return
    
    setOtpLoading(true)
    setOtpError(null)
    
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/request-otp`, {
        method: 'POST',
      })
      const data = await res.json()
      
      if (data.success) {
        setOtpSent(true)
        setOtpExpiry(new Date(data.expiresAt))
      } else {
        setOtpError(data.error || 'Gagal mengirim OTP')
      }
    } catch {
      setOtpError('Terjadi kesalahan saat mengirim OTP')
    } finally {
      setOtpLoading(false)
    }
  }
  
  async function handleSubmitRating() {
    if (!ticket || selectedRating === 0 || !otp) return
    
    setSubmittingRating(true)
    setRatingError(null)
    
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: selectedRating,
          feedback: feedbackText || undefined,
          otp: otp,
        }),
      })
      
      const data = await res.json()
      
      if (data.success) {
        setRatingSuccess(true)
        // Update local ticket data
        setTicket(prev => prev ? {
          ...prev,
          rating: selectedRating,
          feedback: feedbackText,
          ratedAt: new Date().toISOString(),
        } : null)
      } else {
        setRatingError(data.error || 'Gagal mengirim penilaian')
      }
    } catch {
      setRatingError('Terjadi kesalahan saat mengirim penilaian')
    } finally {
      setSubmittingRating(false)
    }
  }
  
  // Star rating component
  function StarRating({ rating, interactive = false }: { rating: number; interactive?: boolean }) {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && setSelectedRating(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
          >
            <Star
              className={`h-8 w-8 ${
                (interactive ? (hoverRating || selectedRating) : rating) >= star
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-white/20'
              }`}
            />
          </button>
        ))}
      </div>
    )
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

            {/* Photo Proof Section - Show if photos exist */}
            {(ticket.resolutionPhotoBefore || ticket.resolutionPhotoAfter) && (
              <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
                <CardHeader className="border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-emerald-400" />
                    <CardTitle className="text-lg text-white">Bukti Penyelesaian</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    {ticket.resolutionPhotoBefore && (
                      <div className="space-y-2">
                        <Label className="text-muted-foreground text-sm">Foto Sebelum</Label>
                        <div className="relative aspect-video rounded-lg overflow-hidden border border-white/10">
                          <img
                            src={ticket.resolutionPhotoBefore}
                            alt="Foto kondisi sebelum"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                    {ticket.resolutionPhotoAfter && (
                      <div className="space-y-2">
                        <Label className="text-muted-foreground text-sm">Foto Sesudah</Label>
                        <div className="relative aspect-video rounded-lg overflow-hidden border border-emerald-500/30">
                          <img
                            src={ticket.resolutionPhotoAfter}
                            alt="Foto kondisi sesudah"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Rating Section - Show for RESOLVED tickets */}
            {ticket.status === 'RESOLVED' && (
              <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
                <CardHeader className="border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-400" />
                    <CardTitle className="text-lg text-white">Penilaian Layanan</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {/* Already rated - show result */}
                  {ticket.rating !== null ? (
                    <div className="text-center space-y-4">
                      <div className="flex justify-center">
                        <StarRating rating={ticket.rating} />
                      </div>
                      <p className="text-white font-medium">
                        Anda memberikan rating {ticket.rating}/5
                      </p>
                      {ticket.feedback && (
                        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                          <p className="text-muted-foreground italic">&quot;{ticket.feedback}&quot;</p>
                        </div>
                      )}
                      {ticket.ratedAt && (
                        <p className="text-xs text-muted-foreground">
                          Dinilai pada {format(new Date(ticket.ratedAt), 'dd MMMM yyyy, HH:mm', { locale: idLocale })}
                        </p>
                      )}
                      <div className="pt-2">
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 border">
                          Terima kasih atas penilaian Anda!
                        </Badge>
                      </div>
                    </div>
                  ) : ratingSuccess ? (
                    // Just submitted rating
                    <div className="text-center space-y-4">
                      <div className="flex justify-center">
                        <CheckCircle2 className="h-16 w-16 text-emerald-400" />
                      </div>
                      <p className="text-white font-medium text-lg">Terima Kasih!</p>
                      <p className="text-muted-foreground">
                        Penilaian Anda telah berhasil dikirim.
                      </p>
                    </div>
                  ) : !otpSent ? (
                    // Step 1: Request OTP
                    <div className="space-y-4">
                      <p className="text-muted-foreground text-center">
                        Untuk memberikan penilaian, kami akan mengirim kode OTP ke nomor telepon Anda yang terdaftar.
                      </p>
                      <Button 
                        onClick={handleRequestOTP} 
                        disabled={otpLoading}
                        className="w-full bg-yellow-500 text-black hover:bg-yellow-400"
                      >
                        {otpLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Mengirim OTP...
                          </>
                        ) : (
                          <>
                            <Phone className="h-4 w-4 mr-2" />
                            Minta Kode OTP
                          </>
                        )}
                      </Button>
                      {otpError && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                          <p className="text-red-400 text-sm flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            {otpError}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Step 2: Enter OTP + Rating
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-white">Kode OTP</Label>
                        <Input
                          type="text"
                          maxLength={6}
                          placeholder="Masukkan 6 digit OTP"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                          className="bg-black/20 border-white/10 text-white placeholder:text-muted-foreground text-center text-lg tracking-widest"
                        />
                        {otpExpiry && (
                          <p className="text-xs text-muted-foreground">
                            Berlaku hingga {format(otpExpiry, 'HH:mm', { locale: idLocale })}
                          </p>
                        )}
                      </div>
                      
                      <Separator className="bg-white/10" />
                      
                      <div className="text-center">
                        <p className="text-muted-foreground mb-4">
                          Bagaimana penilaian Anda terhadap penanganan laporan ini?
                        </p>
                        <div className="flex justify-center mb-2">
                          <StarRating rating={selectedRating} interactive />
                        </div>
                        {selectedRating > 0 && (
                          <p className="text-sm text-white/60">
                            {selectedRating === 1 && 'Sangat Tidak Puas'}
                            {selectedRating === 2 && 'Tidak Puas'}
                            {selectedRating === 3 && 'Cukup'}
                            {selectedRating === 4 && 'Puas'}
                            {selectedRating === 5 && 'Sangat Puas'}
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-white">Feedback (opsional)</Label>
                        <Textarea
                          placeholder="Tuliskan komentar atau saran Anda..."
                          value={feedbackText}
                          onChange={(e) => setFeedbackText(e.target.value)}
                          className="bg-black/20 border-white/10 text-white placeholder:text-muted-foreground"
                          rows={3}
                          maxLength={1000}
                        />
                      </div>
                      
                      {ratingError && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                          <p className="text-red-400 text-sm flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            {ratingError}
                          </p>
                        </div>
                      )}
                      
                      <Button
                        onClick={handleSubmitRating}
                        disabled={selectedRating === 0 || submittingRating || otp.length !== 6}
                        className="w-full bg-yellow-500 text-black hover:bg-yellow-400"
                      >
                        {submittingRating ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Mengirim...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Kirim Penilaian
                          </>
                        )}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        onClick={handleRequestOTP}
                        disabled={otpLoading}
                        className="w-full text-muted-foreground hover:text-white"
                      >
                        {otpLoading ? 'Mengirim...' : 'Kirim ulang kode OTP'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

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