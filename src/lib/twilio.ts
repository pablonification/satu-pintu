import twilio from 'twilio'

// Lazy initialization to avoid build errors when env vars not set
let _client: ReturnType<typeof twilio> | null = null

function getTwilioClient() {
  if (!_client) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    
    if (!accountSid || !authToken) {
      console.warn('Twilio credentials not configured')
      return null
    }
    
    _client = twilio(accountSid, authToken)
  }
  return _client
}

export const twilioPhone = process.env.TWILIO_PHONE_NUMBER || ''

export { getTwilioClient as twilioClient }

// Send SMS notification to citizen
export async function sendSmsNotification(
  to: string,
  message: string
): Promise<string | null> {
  try {
    const client = getTwilioClient()
    if (!client) {
      console.warn('Twilio not configured, skipping SMS')
      return null
    }
    
    const msg = await client.messages.create({
      body: message,
      from: twilioPhone,
      to: formatPhoneNumber(to),
    })
    return msg.sid
  } catch (error) {
    console.error('Failed to send SMS:', error)
    return null
  }
}

// Format Indonesian phone number to E.164
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digits
  let cleaned = phone.replace(/\D/g, '')
  
  // Handle Indonesian numbers
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1)
  } else if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned
  }
  
  return '+' + cleaned
}

// Generate TwiML response
export function generateTwiML(options: {
  say?: string
  record?: {
    maxLength: number
    action: string
  }
  hangup?: boolean
}): string {
  let twiml = '<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n'
  
  if (options.say) {
    twiml += `  <Say voice="Google.id-ID-Wavenet-A" language="id-ID">${escapeXml(options.say)}</Say>\n`
  }
  
  if (options.record) {
    twiml += `  <Record maxLength="${options.record.maxLength}" action="${options.record.action}" playBeep="true" />\n`
  }
  
  if (options.hangup) {
    twiml += '  <Hangup />\n'
  }
  
  twiml += '</Response>'
  return twiml
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// SMS Templates
export const SMS_TEMPLATES = {
  ticketCreated: (ticketId: string, category: string, trackUrl: string) =>
    `[SatuPintu] Laporan Anda diterima.\n\nNo. Tiket: ${ticketId}\nKategori: ${category}\n\nCek status: ${trackUrl}\n\nAtau balas SMS: CEK ${ticketId}`,
  
  statusUpdate: (ticketId: string, status: string, note?: string) =>
    `[SatuPintu] Update ${ticketId}\n\nStatus: ${status}${note ? `\nKeterangan: ${note}` : ''}\n\nCek detail: satupintu.id/track/${ticketId}`,
  
  trackingResponse: (ticketId: string, status: string, category: string, lastUpdate: string) =>
    `[SatuPintu] Status ${ticketId}\n\nKategori: ${category}\nStatus: ${status}\n\nUpdate terakhir:\n${lastUpdate}\n\nDetail: satupintu.id/track/${ticketId}`,
}
