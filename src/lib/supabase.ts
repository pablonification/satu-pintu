import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Lazy initialization to avoid build-time errors
let _supabase: SupabaseClient | null = null
let _supabaseAdmin: SupabaseClient | null = null

// Client for browser (uses anon key with RLS)
export const supabase = (() => {
  if (!_supabase && supabaseUrl && supabaseAnonKey) {
    _supabase = createClient(supabaseUrl, supabaseAnonKey)
  }
  return _supabase!
})()

// Server client with service role (bypasses RLS) - use only in API routes
export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables')
    }
    _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
  }
  return _supabaseAdmin
}

// Alias for backward compatibility
export const supabaseAdmin = {
  from: (table: string) => getSupabaseAdmin().from(table),
}

// Helper to generate ticket ID
export function generateTicketId(): string {
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 9000) + 1000
  return `SP-${dateStr}-${random}`
}
