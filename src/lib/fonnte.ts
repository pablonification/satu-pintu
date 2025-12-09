/**
 * Fonnte WhatsApp Gateway Integration
 * 
 * Fonnte adalah WhatsApp gateway lokal Indonesia.
 * Free tier: 100 messages/day
 * Docs: https://fonnte.com/api
 * 
 * Flow:
 * Server → Fonnte API → WhatsApp User
 * (Menggunakan nomor WA yang di-pair ke Fonnte)
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const FONNTE_TOKEN = process.env.FONNTE_API_TOKEN || ''
const FONNTE_API_URL = 'https://api.fonnte.com/send'

// ============================================================================
// TYPES
// ============================================================================

export interface FonnteResponse {
  status: boolean
  id?: string
  detail?: string
  reason?: string
  target?: string
  process?: string
}

export interface SendMessageResult {
  success: boolean
  messageId?: string
  error?: string
}

// ============================================================================
// PHONE NUMBER FORMATTING
// ============================================================================

/**
 * Format phone number for Fonnte API
 * Fonnte requires format: 62xxx (without + prefix)
 * 
 * @param phone - Phone number in any format
 * @returns Phone number in 62xxx format
 * 
 * @example
 * formatPhoneForFonnte('+6281234567890') // '6281234567890'
 * formatPhoneForFonnte('081234567890')   // '6281234567890'
 * formatPhoneForFonnte('6281234567890')  // '6281234567890'
 */
export function formatPhoneForFonnte(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '')
  
  // Handle various Indonesian formats
  if (cleaned.startsWith('0')) {
    // 081234567890 → 6281234567890
    cleaned = '62' + cleaned.slice(1)
  } else if (cleaned.startsWith('62')) {
    // Already correct format
    // 6281234567890 → 6281234567890
  } else if (cleaned.startsWith('8')) {
    // 81234567890 → 6281234567890
    cleaned = '62' + cleaned
  }
  
  return cleaned
}

/**
 * Validate if phone number is a valid Indonesian number
 */
export function isValidIndonesianPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')
  // Indonesian numbers: 62 + 8xx + 8-11 digits = 11-14 total digits
  return /^62[0-9]{9,12}$/.test(cleaned) || /^0[0-9]{9,12}$/.test(cleaned)
}

// ============================================================================
// FONNTE API CLIENT
// ============================================================================

/**
 * Send WhatsApp message via Fonnte API
 * 
 * @param to - Recipient phone number
 * @param message - Message content (supports WhatsApp formatting: *bold*, _italic_, ~strikethrough~)
 * @returns Result with success status and message ID
 */
export async function sendWhatsAppNotification(
  to: string,
  message: string
): Promise<SendMessageResult> {
  // Check if Fonnte is configured
  if (!FONNTE_TOKEN) {
    console.warn('[Fonnte] Token not configured, skipping WhatsApp notification')
    return { success: false, error: 'Fonnte not configured' }
  }

  // Format phone number
  const phone = formatPhoneForFonnte(to)
  
  // Validate phone number
  if (!phone || phone.length < 10) {
    console.error('[Fonnte] Invalid phone number:', to)
    return { success: false, error: 'Invalid phone number' }
  }

  try {
    console.log(`[Fonnte] Sending WhatsApp to: ${phone}`)
    
    // Fonnte API uses form-data, not JSON
    const formData = new FormData()
    formData.append('target', phone)
    formData.append('message', message)
    formData.append('countryCode', '62')
    
    const response = await fetch(FONNTE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': FONNTE_TOKEN,
        // Note: Don't set Content-Type for FormData, browser/node will set it automatically with boundary
      },
      body: formData,
    })

    if (!response.ok) {
      console.error('[Fonnte] HTTP error:', response.status, response.statusText)
      return { success: false, error: `HTTP ${response.status}` }
    }

    const result: FonnteResponse = await response.json()
    
    if (result.status) {
      console.log('[Fonnte] Message sent successfully, ID:', result.id)
      return { success: true, messageId: result.id }
    } else {
      console.error('[Fonnte] API error:', result.reason || result.detail)
      return { success: false, error: result.reason || result.detail || 'Unknown error' }
    }
  } catch (error) {
    console.error('[Fonnte] Exception:', error)
    return { success: false, error: String(error) }
  }
}

/**
 * Check if Fonnte is properly configured
 */
export function isFonnteConfigured(): boolean {
  return !!FONNTE_TOKEN
}

// ============================================================================
// WHATSAPP MESSAGE TEMPLATES
// ============================================================================

/**
 * WhatsApp message templates for SatuPintu
 * Using WhatsApp formatting: *bold*, _italic_, ~strikethrough~
 */
export const WA_TEMPLATES = {
  /**
   * Template for new ticket creation notification
   */
  ticketCreated: (
    ticketId: string, 
    category: string, 
    reporterName: string, 
    trackUrl: string
  ): string =>
`Halo ${reporterName} 👋

Laporan Anda telah diterima oleh *SatuPintu Bandung*.

📋 *No. Tiket:* ${ticketId}
📁 *Kategori:* ${category}
📊 *Status:* Menunggu

Pantau perkembangan laporan Anda di:
🔗 ${trackUrl}

Terima kasih telah melapor! 🙏

_SatuPintu - Layanan Pengaduan Terpadu Kota Bandung_`,

  /**
   * Template for ticket status update notification
   */
  statusUpdate: (
    ticketId: string, 
    status: string, 
    reporterName: string, 
    note: string | null, 
    trackUrl: string
  ): string =>
`Halo ${reporterName} 👋

Ada pembaruan untuk laporan Anda:

📋 *No. Tiket:* ${ticketId}
📊 *Status:* ${status}
${note ? `📝 *Keterangan:* ${note}` : ''}

Lihat detail lengkap di:
🔗 ${trackUrl}

_SatuPintu - Layanan Pengaduan Terpadu Kota Bandung_`,

  /**
   * Template for resolved ticket notification
   */
  ticketResolved: (
    ticketId: string, 
    reporterName: string, 
    trackUrl: string
  ): string =>
`Halo ${reporterName} 👋

🎉 *Laporan Anda telah diselesaikan!*

📋 *No. Tiket:* ${ticketId}
📊 *Status:* ✅ Selesai

Mohon berikan penilaian terhadap penanganan laporan Anda di:
🔗 ${trackUrl}

Terima kasih atas partisipasi Anda dalam membangun Kota Bandung yang lebih baik! 🙏

_SatuPintu - Layanan Pengaduan Terpadu Kota Bandung_`,

  /**
   * Template for emergency ticket notification
   */
  emergencyCreated: (
    ticketId: string,
    emergencyType: string,
    location: string,
    reporterName: string
  ): string =>
`🚨 *LAPORAN DARURAT DITERIMA* 🚨

Halo ${reporterName},

Laporan darurat Anda telah diterima dan sedang ditindaklanjuti.

📋 *No. Tiket:* ${ticketId}
⚠️ *Jenis Darurat:* ${emergencyType}
📍 *Lokasi:* ${location}

Tim darurat sedang dalam perjalanan ke lokasi.

_SatuPintu - Layanan Pengaduan Terpadu Kota Bandung_`,
}
