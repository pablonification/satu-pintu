'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Loader2, 
  LogOut, 
  Search, 
  Phone,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Map,
  List,
  AlertCircle,
  Volume2,
  Upload,
  ImageIcon,
  X
} from 'lucide-react'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { STATUS_LABELS, URGENCY_LABELS, CATEGORY_LABELS, TicketStatus, TicketUrgency, TicketCategory } from '@/types/database'
import type { MapTicket } from '@/components/HeatmapView'

// Initialize Supabase client for storage
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

// Dynamically import HeatmapView with SSR disabled
const HeatmapView = dynamic(
  () => import('@/components/HeatmapView'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[500px] bg-card border border-white/5 rounded-lg">
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
      </div>
    )
  }
)

interface User {
  dinasId: string
  dinasName: string
  categories: string[]
}

interface Ticket {
  id: string
  category: string
  subcategory: string | null
  location: string
  description: string
  reporter_phone: string
  status: string
  urgency: string
  assigned_dinas: string[]
  created_at: string
  updated_at: string
}

interface Stats {
  total: number
  pending: number
  inProgress: number
  resolved: number
  byUrgency: {
    critical: number
    high: number
    medium: number
    low: number
  }
  today: {
    total: number
    pending: number
    resolved: number
  }
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

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [ticketsLoading, setTicketsLoading] = useState(false)
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Update dialog
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false)
  const [newStatus, setNewStatus] = useState<string>('')
  const [updateNote, setUpdateNote] = useState('')
  const [sendSms, setSendSms] = useState(true)
  const [updating, setUpdating] = useState(false)
  
  // Photo upload state
  const [photoBefore, setPhotoBefore] = useState<File | null>(null)
  const [photoAfter, setPhotoAfter] = useState<File | null>(null)
  const [photoBeforePreview, setPhotoBeforePreview] = useState<string | null>(null)
  const [photoAfterPreview, setPhotoAfterPreview] = useState<string | null>(null)
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const photoBeforeInputRef = useRef<HTMLInputElement>(null)
  const photoAfterInputRef = useRef<HTMLInputElement>(null)
  
  // Map view state
  const [activeView, setActiveView] = useState<string>('table')
  const [mapTickets, setMapTickets] = useState<MapTicket[]>([])
  const [mapLoading, setMapLoading] = useState(false)
  
  // Critical alert state
  const [criticalCount, setCriticalCount] = useState(0)
  const [alertDismissed, setAlertDismissed] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const audioContextRef = useRef<AudioContext | null>(null)
  const lastCriticalCountRef = useRef(0)

  // Play alert sound for critical tickets
  const playAlertSound = useCallback(() => {
    if (!soundEnabled) return
    
    try {
      // Create AudioContext if not exists
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      }
      
      const ctx = audioContextRef.current
      if (ctx.state === 'suspended') {
        ctx.resume()
      }
      
      // Create a beep sound
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)
      
      oscillator.frequency.value = 880 // A5 note
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
      
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.5)
      
      // Play second beep
      setTimeout(() => {
        const osc2 = ctx.createOscillator()
        const gain2 = ctx.createGain()
        osc2.connect(gain2)
        gain2.connect(ctx.destination)
        osc2.frequency.value = 880
        osc2.type = 'sine'
        gain2.gain.setValueAtTime(0.3, ctx.currentTime)
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
        osc2.start(ctx.currentTime)
        osc2.stop(ctx.currentTime + 0.5)
      }, 200)
    } catch (error) {
      console.error('Failed to play alert sound:', error)
    }
  }, [soundEnabled])

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user) {
      fetchStats()
      fetchTickets()
    }
  }, [user, statusFilter, urgencyFilter])

  // Fetch map tickets when switching to map view
  useEffect(() => {
    if (user && activeView === 'map') {
      fetchMapTickets()
    }
  }, [user, activeView, statusFilter, urgencyFilter])

  // Track critical tickets and play alert sound
  useEffect(() => {
    if (stats) {
      const newCriticalCount = stats.byUrgency.critical
      setCriticalCount(newCriticalCount)
      
      // Play sound if there are new critical tickets
      if (newCriticalCount > lastCriticalCountRef.current && newCriticalCount > 0) {
        playAlertSound()
        setAlertDismissed(false) // Reset dismissed state when new critical tickets arrive
      }
      
      lastCriticalCountRef.current = newCriticalCount
    }
  }, [stats, playAlertSound])

  async function checkAuth() {
    try {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      
      if (data.success) {
        setUser(data.data)
      } else {
        router.push('/login')
      }
    } catch {
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  async function fetchStats() {
    try {
      const res = await fetch('/api/stats')
      const data = await res.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  async function fetchTickets() {
    setTicketsLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (urgencyFilter !== 'all') params.set('urgency', urgencyFilter)
      if (searchQuery) params.set('search', searchQuery)
      
      const res = await fetch(`/api/tickets?${params}`)
      const data = await res.json()
      
      if (data.success) {
        setTickets(data.data.tickets)
      }
    } catch (error) {
      console.error('Failed to fetch tickets:', error)
    } finally {
      setTicketsLoading(false)
    }
  }

  async function fetchMapTickets() {
    setMapLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (urgencyFilter !== 'all') params.set('category', urgencyFilter)
      
      const res = await fetch(`/api/tickets/map?${params}`)
      const data = await res.json()
      
      if (data.success) {
        setMapTickets(data.data.tickets)
      }
    } catch (error) {
      console.error('Failed to fetch map tickets:', error)
    } finally {
      setMapLoading(false)
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  // Handle photo file selection
  function handlePhotoBeforeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setPhotoError('Ukuran file maksimal 5MB')
        return
      }
      setPhotoBefore(file)
      setPhotoBeforePreview(URL.createObjectURL(file))
      setPhotoError(null)
    }
  }

  function handlePhotoAfterChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setPhotoError('Ukuran file maksimal 5MB')
        return
      }
      setPhotoAfter(file)
      setPhotoAfterPreview(URL.createObjectURL(file))
      setPhotoError(null)
    }
  }

  function clearPhotoBefore() {
    setPhotoBefore(null)
    setPhotoBeforePreview(null)
    if (photoBeforeInputRef.current) {
      photoBeforeInputRef.current.value = ''
    }
  }

  function clearPhotoAfter() {
    setPhotoAfter(null)
    setPhotoAfterPreview(null)
    if (photoAfterInputRef.current) {
      photoAfterInputRef.current.value = ''
    }
  }

  // Upload photo to Supabase Storage
  async function uploadPhoto(file: File, ticketId: string, type: 'before' | 'after'): Promise<string | null> {
    const timestamp = Date.now()
    const fileExt = file.name.split('.').pop()
    const fileName = `${ticketId}/${type}-${timestamp}.${fileExt}`
    
    const { data, error } = await supabase.storage
      .from('ticket-photos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (error) {
      console.error('Upload error:', error)
      return null
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('ticket-photos')
      .getPublicUrl(fileName)
    
    return urlData.publicUrl
  }

  async function handleUpdateTicket() {
    if (!selectedTicket || !newStatus) return
    
    // Validate: if status is RESOLVED, require photo after
    if (newStatus === 'RESOLVED' && !photoAfter) {
      setPhotoError('Foto sesudah (bukti penyelesaian) wajib diisi untuk menyelesaikan laporan')
      return
    }
    
    setUpdating(true)
    setUploadingPhotos(true)
    setPhotoError(null)
    
    try {
      let photoBeforeUrl: string | null = null
      let photoAfterUrl: string | null = null
      
      // Upload photos if provided
      if (photoBefore) {
        photoBeforeUrl = await uploadPhoto(photoBefore, selectedTicket.id, 'before')
        if (!photoBeforeUrl) {
          setPhotoError('Gagal mengupload foto sebelum')
          setUpdating(false)
          setUploadingPhotos(false)
          return
        }
      }
      
      if (photoAfter) {
        photoAfterUrl = await uploadPhoto(photoAfter, selectedTicket.id, 'after')
        if (!photoAfterUrl) {
          setPhotoError('Gagal mengupload foto sesudah')
          setUpdating(false)
          setUploadingPhotos(false)
          return
        }
      }
      
      setUploadingPhotos(false)
      
      const res = await fetch(`/api/tickets/${selectedTicket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          note: updateNote,
          sendSms,
          resolution_photo_before: photoBeforeUrl,
          resolution_photo_after: photoAfterUrl,
        }),
      })
      
      const data = await res.json()
      
      if (data.success) {
        setUpdateDialogOpen(false)
        setSelectedTicket(null)
        setNewStatus('')
        setUpdateNote('')
        // Reset photo state
        clearPhotoBefore()
        clearPhotoAfter()
        fetchTickets()
        fetchStats()
      } else {
        setPhotoError(data.error || 'Gagal mengupdate tiket')
      }
    } catch (error) {
      console.error('Failed to update ticket:', error)
      setPhotoError('Terjadi kesalahan saat mengupdate tiket')
    } finally {
      setUpdating(false)
      setUploadingPhotos(false)
    }
  }

  function openUpdateDialog(ticket: Ticket) {
    setSelectedTicket(ticket)
    setNewStatus(ticket.status)
    setUpdateNote('')
    // Reset photo state
    setPhotoBefore(null)
    setPhotoAfter(null)
    setPhotoBeforePreview(null)
    setPhotoAfterPreview(null)
    setPhotoError(null)
    setUpdateDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="bg-background/60 backdrop-blur-xl border-b border-white/5 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 border border-white/10">
              <Phone className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-white">SatuPintu</h1>
              <p className="text-xs text-muted-foreground">{user?.dinasName}</p>
            </div>
          </div>
          <Button variant="ghost" onClick={handleLogout} className="text-muted-foreground hover:text-white">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Critical Alert Banner */}
        {criticalCount > 0 && !alertDismissed && (
          <div className="mb-6 animate-pulse">
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/30 rounded-full">
                  <AlertCircle className="h-6 w-6 text-red-400" />
                </div>
                <div>
                  <p className="font-bold text-red-400 text-lg">
                    ⚠️ PERHATIAN: Ada {criticalCount} tiket DARURAT yang memerlukan penanganan segera!
                  </p>
                  <p className="text-red-300/80 text-sm">
                    Tiket dengan prioritas CRITICAL memerlukan respons dalam 15 menit
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`text-red-400 hover:text-red-300 hover:bg-red-500/20 ${!soundEnabled ? 'opacity-50' : ''}`}
                  title={soundEnabled ? 'Matikan suara notifikasi' : 'Nyalakan suara notifikasi'}
                >
                  <Volume2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setUrgencyFilter('CRITICAL')
                    fetchTickets()
                  }}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                >
                  Lihat Tiket
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAlertDismissed(true)}
                  className="text-red-400/60 hover:text-red-300 hover:bg-red-500/20"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-card border-white/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <Clock className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Menunggu</p>
                    <p className="text-2xl font-bold text-white">{stats.pending}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card border-white/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <RefreshCw className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                     <p className="text-xs text-muted-foreground uppercase tracking-wider">Diproses</p>
                    <p className="text-2xl font-bold text-white">{stats.inProgress}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card border-white/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                     <p className="text-xs text-muted-foreground uppercase tracking-wider">Selesai</p>
                    <p className="text-2xl font-bold text-white">{stats.resolved}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card border-white/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                     <p className="text-xs text-muted-foreground uppercase tracking-wider">Kritis</p>
                    <p className="text-2xl font-bold text-white">{stats.byUrgency.critical}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                placeholder="Cari tiket atau lokasi..."
                className="pl-10 bg-card border-white/10 text-white placeholder:text-muted-foreground focus-visible:ring-white/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchTickets()}
                />
            </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-40 bg-card border-white/10 text-white">
                <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="PENDING">Menunggu</SelectItem>
                <SelectItem value="IN_PROGRESS">Dalam Proses</SelectItem>
                <SelectItem value="RESOLVED">Selesai</SelectItem>
                <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
            </SelectContent>
            </Select>
            <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
            <SelectTrigger className="w-full md:w-40 bg-card border-white/10 text-white">
                <SelectValue placeholder="Prioritas" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Semua Prioritas</SelectItem>
                <SelectItem value="CRITICAL">Kritis</SelectItem>
                <SelectItem value="HIGH">Tinggi</SelectItem>
                <SelectItem value="MEDIUM">Sedang</SelectItem>
                <SelectItem value="LOW">Rendah</SelectItem>
            </SelectContent>
            </Select>
            <Button onClick={() => { fetchTickets(); if (activeView === 'map') fetchMapTickets(); }} variant="outline" className="bg-card border-white/10 hover:bg-white/5 text-white">
            <RefreshCw className="h-4 w-4" />
            </Button>
        </div>

        {/* View Tabs */}
        <Tabs value={activeView} onValueChange={setActiveView} className="mb-6">
          <TabsList className="bg-card border border-white/10">
            <TabsTrigger value="table" className="data-[state=active]:bg-white/10">
              <List className="h-4 w-4 mr-2" />
              Tabel
            </TabsTrigger>
            <TabsTrigger value="map" className="data-[state=active]:bg-white/10">
              <Map className="h-4 w-4 mr-2" />
              Peta
            </TabsTrigger>
          </TabsList>

          <TabsContent value="table">
            {/* Tickets Table */}
            <Card className="bg-card border-white/5 overflow-hidden">
              <CardHeader className="border-b border-white/5">
                <CardTitle className="text-white">Daftar Laporan</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Klik pada baris untuk mengupdate status
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {ticketsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-white/50" />
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <XCircle className="h-12 w-12 mx-auto mb-3 text-white/20" />
                    <p>Tidak ada laporan ditemukan</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-white/5">
                      <TableRow className="hover:bg-transparent border-white/5">
                        <TableHead className="text-muted-foreground">ID</TableHead>
                        <TableHead className="text-muted-foreground">Kategori</TableHead>
                        <TableHead className="text-muted-foreground">Lokasi</TableHead>
                        <TableHead className="text-muted-foreground">Prioritas</TableHead>
                        <TableHead className="text-muted-foreground">Status</TableHead>
                        <TableHead className="text-muted-foreground">Waktu</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tickets.map((ticket) => (
                        <TableRow 
                          key={ticket.id}
                          className="cursor-pointer hover:bg-white/5 border-white/5 transition-colors"
                          onClick={() => openUpdateDialog(ticket)}
                        >
                          <TableCell className="font-mono text-sm text-white/70">{ticket.id}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-white">{CATEGORY_LABELS[ticket.category as TicketCategory]}</p>
                              {ticket.subcategory && (
                                <p className="text-xs text-muted-foreground">{ticket.subcategory}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs truncate text-white/80">{ticket.location}</TableCell>
                          <TableCell>
                            <Badge className={`border ${
                                ticket.urgency === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                ticket.urgency === 'HIGH' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                ticket.urgency === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              }`}>
                              {URGENCY_LABELS[ticket.urgency as TicketUrgency]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={`border ${
                                ticket.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                ticket.status === 'IN_PROGRESS' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                ticket.status === 'ESCALATED' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                ticket.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                'bg-gray-500/10 text-gray-400 border-gray-500/20'
                              }`}>
                              {STATUS_LABELS[ticket.status as TicketStatus]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(ticket.created_at), 'dd/MM HH:mm', { locale: idLocale })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="map">
            {/* Map View */}
            <Card className="bg-card border-white/5 overflow-hidden">
              <CardHeader className="border-b border-white/5">
                <CardTitle className="text-white">Peta Laporan</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Lokasi laporan di Kota Bandung - klik marker untuk detail
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                {mapLoading ? (
                  <div className="flex items-center justify-center h-[500px]">
                    <Loader2 className="h-8 w-8 animate-spin text-white/50" />
                  </div>
                ) : (
                  <HeatmapView tickets={mapTickets} height="500px" />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Update Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent className="bg-card border-white/10 sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Update Laporan</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {selectedTicket?.id} - {selectedTicket?.location}
            </DialogDescription>
          </DialogHeader>
          
          {selectedTicket && (
            <div className="space-y-4">
              <div className="p-3 bg-white/5 rounded-lg text-sm border border-white/5">
                <p className="font-medium mb-1 text-white">Deskripsi:</p>
                <p className="text-muted-foreground">{selectedTicket.description}</p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-white">Status Baru</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="bg-black/20 border-white/10 text-white">
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Menunggu</SelectItem>
                    <SelectItem value="IN_PROGRESS">Dalam Proses</SelectItem>
                    <SelectItem value="RESOLVED">Selesai</SelectItem>
                    <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Photo Upload Section - Show when status is RESOLVED */}
              {newStatus === 'RESOLVED' && (
                <div className="space-y-4 p-4 bg-emerald-500/5 rounded-lg border border-emerald-500/20">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-emerald-400" />
                    <Label className="text-emerald-400 font-medium">Bukti Penyelesaian</Label>
                  </div>
                  
                  {/* Photo Before (Optional) */}
                  <div className="space-y-2">
                    <Label className="text-white text-sm">Foto Sebelum (opsional)</Label>
                    <div className="flex items-center gap-3">
                      <input
                        ref={photoBeforeInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoBeforeChange}
                        className="hidden"
                        id="photo-before"
                      />
                      {photoBeforePreview ? (
                        <div className="relative">
                          <img 
                            src={photoBeforePreview} 
                            alt="Preview sebelum" 
                            className="h-24 w-24 object-cover rounded-lg border border-white/10"
                          />
                          <button
                            onClick={clearPhotoBefore}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <label
                          htmlFor="photo-before"
                          className="flex flex-col items-center justify-center h-24 w-24 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-white/40 transition-colors"
                        >
                          <Upload className="h-6 w-6 text-white/40" />
                          <span className="text-xs text-white/40 mt-1">Upload</span>
                        </label>
                      )}
                    </div>
                  </div>
                  
                  {/* Photo After (Required) */}
                  <div className="space-y-2">
                    <Label className="text-white text-sm">
                      Foto Sesudah <span className="text-red-400">*</span>
                    </Label>
                    <div className="flex items-center gap-3">
                      <input
                        ref={photoAfterInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoAfterChange}
                        className="hidden"
                        id="photo-after"
                      />
                      {photoAfterPreview ? (
                        <div className="relative">
                          <img 
                            src={photoAfterPreview} 
                            alt="Preview sesudah" 
                            className="h-24 w-24 object-cover rounded-lg border border-white/10"
                          />
                          <button
                            onClick={clearPhotoAfter}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <label
                          htmlFor="photo-after"
                          className="flex flex-col items-center justify-center h-24 w-24 border-2 border-dashed border-emerald-500/40 rounded-lg cursor-pointer hover:border-emerald-500/60 transition-colors bg-emerald-500/5"
                        >
                          <Upload className="h-6 w-6 text-emerald-400/60" />
                          <span className="text-xs text-emerald-400/60 mt-1">Wajib</span>
                        </label>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Foto bukti penyelesaian wajib diupload untuk menyelesaikan laporan
                    </p>
                  </div>
                </div>
              )}
              
              {/* Photo Error Message */}
              {photoError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {photoError}
                  </p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label className="text-white">Catatan (opsional)</Label>
                <Textarea
                  placeholder="Tambahkan catatan update..."
                  value={updateNote}
                  onChange={(e) => setUpdateNote(e.target.value)}
                  className="bg-black/20 border-white/10 text-white placeholder:text-muted-foreground"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sendSms"
                  checked={sendSms}
                  onChange={(e) => setSendSms(e.target.checked)}
                  className="rounded border-white/10 bg-black/20 text-primary focus:ring-primary"
                />
                <Label htmlFor="sendSms" className="cursor-pointer text-muted-foreground">
                  Kirim SMS notifikasi ke pelapor
                </Label>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateDialogOpen(false)} className="border-white/10 bg-transparent text-white hover:bg-white/5">
              Batal
            </Button>
            <Button 
              onClick={handleUpdateTicket} 
              disabled={updating || (newStatus === 'RESOLVED' && !photoAfter)} 
              className="bg-white text-black hover:bg-white/90"
            >
              {updating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {uploadingPhotos ? 'Mengupload foto...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
