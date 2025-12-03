'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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
  RefreshCw
} from 'lucide-react'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { STATUS_LABELS, URGENCY_LABELS, CATEGORY_LABELS, TicketStatus, TicketUrgency, TicketCategory } from '@/types/database'

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

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user) {
      fetchStats()
      fetchTickets()
    }
  }, [user, statusFilter, urgencyFilter])

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

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  async function handleUpdateTicket() {
    if (!selectedTicket || !newStatus) return
    
    setUpdating(true)
    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          note: updateNote,
          sendSms,
        }),
      })
      
      const data = await res.json()
      
      if (data.success) {
        setUpdateDialogOpen(false)
        setSelectedTicket(null)
        setNewStatus('')
        setUpdateNote('')
        fetchTickets()
        fetchStats()
      }
    } catch (error) {
      console.error('Failed to update ticket:', error)
    } finally {
      setUpdating(false)
    }
  }

  function openUpdateDialog(ticket: Ticket) {
    setSelectedTicket(ticket)
    setNewStatus(ticket.status)
    setUpdateNote('')
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Phone className="h-6 w-6 text-blue-600" />
            <div>
              <h1 className="font-bold text-lg">SatuPintu</h1>
              <p className="text-sm text-gray-500">{user?.dinasName}</p>
            </div>
          </div>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Menunggu</p>
                    <p className="text-2xl font-bold">{stats.pending}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <RefreshCw className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Diproses</p>
                    <p className="text-2xl font-bold">{stats.inProgress}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Selesai</p>
                    <p className="text-2xl font-bold">{stats.resolved}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Kritis</p>
                    <p className="text-2xl font-bold">{stats.byUrgency.critical}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Cari tiket atau lokasi..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchTickets()}
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40">
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
                <SelectTrigger className="w-full md:w-40">
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
              <Button onClick={fetchTickets} variant="outline">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tickets Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Laporan</CardTitle>
            <CardDescription>
              Klik pada baris untuk mengupdate status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {ticketsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <XCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Tidak ada laporan ditemukan</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Lokasi</TableHead>
                    <TableHead>Prioritas</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Waktu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket) => (
                    <TableRow 
                      key={ticket.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => openUpdateDialog(ticket)}
                    >
                      <TableCell className="font-mono text-sm">{ticket.id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{CATEGORY_LABELS[ticket.category as TicketCategory]}</p>
                          {ticket.subcategory && (
                            <p className="text-sm text-gray-500">{ticket.subcategory}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{ticket.location}</TableCell>
                      <TableCell>
                        <Badge className={URGENCY_COLORS[ticket.urgency]}>
                          {URGENCY_LABELS[ticket.urgency as TicketUrgency]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[ticket.status]}>
                          {STATUS_LABELS[ticket.status as TicketStatus]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {format(new Date(ticket.created_at), 'dd/MM HH:mm', { locale: idLocale })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Update Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Laporan</DialogTitle>
            <DialogDescription>
              {selectedTicket?.id} - {selectedTicket?.location}
            </DialogDescription>
          </DialogHeader>
          
          {selectedTicket && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <p className="font-medium mb-1">Deskripsi:</p>
                <p className="text-gray-600">{selectedTicket.description}</p>
              </div>
              
              <div className="space-y-2">
                <Label>Status Baru</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
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
              
              <div className="space-y-2">
                <Label>Catatan (opsional)</Label>
                <Textarea
                  placeholder="Tambahkan catatan update..."
                  value={updateNote}
                  onChange={(e) => setUpdateNote(e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sendSms"
                  checked={sendSms}
                  onChange={(e) => setSendSms(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="sendSms" className="cursor-pointer">
                  Kirim SMS notifikasi ke pelapor
                </Label>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleUpdateTicket} disabled={updating}>
              {updating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
