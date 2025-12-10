// Database types for SatuPintu
// Auto-generated compatible with Supabase

export type TicketStatus = 'PENDING' | 'IN_PROGRESS' | 'ESCALATED' | 'RESOLVED' | 'CANCELLED'
export type TicketCategory = 'DARURAT' | 'INFRA' | 'KEBERSIHAN' | 'SOSIAL' | 'LAINNYA'
export type TicketUrgency = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
export type TimelineAction = 'CREATED' | 'ASSIGNED' | 'STATUS_CHANGE' | 'UPDATE' | 'ESCALATED' | 'RESOLVED' | 'CANCELLED' | 'NOTE'
export type DinasId = 
  | 'polisi' | 'ambulans' | 'damkar'  // DARURAT
  | 'pupr' | 'dlh' | 'dinsos'          // INFRA, KEBERSIHAN, SOSIAL
  | 'dishub'                           // Perhubungan (lampu lalu lintas, rambu)
  | 'dinkes'                           // Kesehatan (puskesmas, outbreak)
  | 'disperkimtan'                     // Perumahan & Permukiman
  | 'satpolpp'                         // Satpol PP (ketertiban)
  | 'disdik'                           // Pendidikan
  | 'pdam'                             // PDAM Tirtawening (air)
  | 'dispangtan'                       // Pangan & Pertanian
  | 'admin'

export interface Dinas {
  id: DinasId
  name: string
  password_hash: string
  categories: TicketCategory[]
  phone: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Ticket {
  id: string
  category: TicketCategory
  subcategory: string | null
  location: string
  description: string
  reporter_phone: string
  reporter_name: string | null
  validated_address: string | null
  address_lat: number | null
  address_lng: number | null
  status: TicketStatus
  urgency: TicketUrgency
  assigned_dinas: DinasId[]
  call_sid: string | null
  transcription: string | null
  resolution_photo_before: string | null
  resolution_photo_after: string | null
  rating: number | null
  feedback: string | null
  rated_at: string | null
  created_at: string
  updated_at: string
}

export interface TicketTimeline {
  id: string
  ticket_id: string
  action: TimelineAction
  message: string
  created_by: string
  is_public: boolean
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface SmsLog {
  id: string
  ticket_id: string | null
  phone_to: string
  message: string
  direction: 'INBOUND' | 'OUTBOUND'
  twilio_sid: string | null
  status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED'
  created_at: string
}

export interface CallLog {
  id: string
  ticket_id: string | null
  call_sid: string
  phone_from: string
  recording_url: string | null
  duration_seconds: number | null
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'NO_ANSWER'
  created_at: string
  ended_at: string | null
}

// View types
export interface TicketWithStats extends Ticket {
  timeline_count: number
  last_activity: string | null
}

export interface DashboardStats {
  total: number
  pending: number
  in_progress: number
  resolved: number
  cancelled: number
  critical: number
  high: number
  medium: number
  low: number
  today_total: number
  today_pending: number
  today_resolved: number
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  code?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Category to Dinas mapping
export const CATEGORY_TO_DINAS: Record<TicketCategory, DinasId[]> = {
  DARURAT: ['polisi', 'ambulans', 'damkar'],
  INFRA: ['pupr'],
  KEBERSIHAN: ['dlh'],
  SOSIAL: ['dinsos'],
  LAINNYA: ['admin'],
}

// Dinas display names
export const DINAS_NAMES: Record<DinasId, string> = {
  polisi: 'Polisi (110)',
  ambulans: 'Ambulans (119)',
  damkar: 'Damkar (113)',
  pupr: 'Dinas PUPR',
  dlh: 'Dinas Lingkungan Hidup',
  dinsos: 'Dinas Sosial',
  dishub: 'Dinas Perhubungan',
  dinkes: 'Dinas Kesehatan',
  disperkimtan: 'Dinas Perkim & Pertanahan',
  satpolpp: 'Satpol PP',
  disdik: 'Dinas Pendidikan',
  pdam: 'PDAM Tirtawening',
  dispangtan: 'Dinas Pangan & Pertanian',
  admin: 'Admin SatuPintu',
}

// Status display names
export const STATUS_LABELS: Record<TicketStatus, string> = {
  PENDING: 'Menunggu',
  IN_PROGRESS: 'Dalam Proses',
  ESCALATED: 'Dieskalasi',
  RESOLVED: 'Selesai',
  CANCELLED: 'Dibatalkan',
}

// Urgency display names
export const URGENCY_LABELS: Record<TicketUrgency, string> = {
  CRITICAL: 'Kritis',
  HIGH: 'Tinggi',
  MEDIUM: 'Sedang',
  LOW: 'Rendah',
}

// Category display names
export const CATEGORY_LABELS: Record<TicketCategory, string> = {
  DARURAT: 'Darurat',
  INFRA: 'Infrastruktur',
  KEBERSIHAN: 'Kebersihan',
  SOSIAL: 'Sosial',
  LAINNYA: 'Lainnya',
}
