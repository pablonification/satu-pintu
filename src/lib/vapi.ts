// Vapi.ai integration helper
// Documentation: https://docs.vapi.ai

export const VAPI_CONFIG = {
  // This will be set in Vapi dashboard, not in code
  // But we define the assistant configuration here for reference
  
  assistantConfig: {
    name: 'SatuPintu Assistant',
    
    // First message when call starts
    firstMessage: `Selamat datang di SatuPintu, layanan pengaduan terpadu Kota Bandung. 
Saya adalah asisten AI yang siap membantu Anda melaporkan keluhan atau masalah di kota. 
Ada yang bisa saya bantu hari ini?`,

    // System prompt for the AI
    systemPrompt: `Kamu adalah asisten AI untuk SatuPintu, layanan pengaduan terpadu Kota Bandung.
Tugasmu adalah membantu warga melaporkan keluhan atau masalah di kota.

PERSONALITY:
- Ramah, sabar, dan profesional
- Berbicara dalam Bahasa Indonesia yang sopan
- Empati terhadap masalah warga
- Efisien - tidak bertele-tele tapi tetap ramah

CONVERSATION FLOW:
1. Sapa dan tanya apa masalahnya
2. Dengarkan keluhan dan pahami jenis masalahnya
3. Konfirmasi pemahaman dan tawarkan untuk membuat laporan
4. Jika user setuju, kumpulkan informasi:
   - Validasi nomor telepon (sudah ada dari caller ID)
   - Minta nama lengkap pelapor
   - Minta alamat/lokasi masalah secara detail
5. Validasi alamat menggunakan function validateAddress
6. Konfirmasi semua informasi
7. Buat tiket menggunakan function createTicket
8. Sampaikan nomor tiket dan info tracking

KATEGORI MASALAH:
- DARURAT: kecelakaan, kebakaran, kejahatan, darurat medis (prioritas tinggi!)
- INFRA: jalan rusak, lampu mati, jembatan rusak, drainase
- KEBERSIHAN: sampah menumpuk, got kotor, limbah
- SOSIAL: ODGJ, gelandangan, anak terlantar
- LAINNYA: keluhan lain

PENTING:
- Untuk masalah DARURAT, ekspresikan urgensi dan pastikan bantuan segera dikirim
- Selalu validasi alamat sebelum membuat tiket
- Jika alamat di luar Kota Bandung, jelaskan dengan sopan bahwa di luar jangkauan
- Jika user tidak jelas, minta klarifikasi dengan sopan
- Setelah tiket dibuat, sampaikan nomor tiket dengan jelas (eja per karakter jika perlu)`,

    // Voice configuration (ElevenLabs)
    voice: {
      provider: 'elevenlabs',
      voiceId: 'pFZP5JQG7iQjIQuC4Bku', // Lily - Indonesian female voice
      // Alternative: 'FGY2WhTYpPnrIDTdsKH5' - Laura
    },

    // Model configuration
    model: {
      provider: 'openai',
      model: 'gpt-4-turbo',
      temperature: 0.7,
    },

    // Functions that the AI can call
    functions: [
      {
        name: 'validateAddress',
        description: 'Validate an address and check if it is within Kota Bandung coverage area',
        parameters: {
          type: 'object',
          properties: {
            address: {
              type: 'string',
              description: 'The address to validate',
            },
          },
          required: ['address'],
        },
      },
      {
        name: 'createTicket',
        description: 'Create a new complaint ticket after all information is collected and confirmed',
        parameters: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              enum: ['DARURAT', 'INFRA', 'KEBERSIHAN', 'SOSIAL', 'LAINNYA'],
              description: 'The category of the complaint',
            },
            subcategory: {
              type: 'string',
              description: 'More specific type of the complaint',
            },
            description: {
              type: 'string',
              description: 'Detailed description of the complaint',
            },
            reporterName: {
              type: 'string',
              description: 'Full name of the reporter',
            },
            reporterPhone: {
              type: 'string',
              description: 'Phone number of the reporter',
            },
            address: {
              type: 'string',
              description: 'The validated address of the issue',
            },
            addressLat: {
              type: 'number',
              description: 'Latitude of the address (if available)',
            },
            addressLng: {
              type: 'number',
              description: 'Longitude of the address (if available)',
            },
            urgency: {
              type: 'string',
              enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
              description: 'Urgency level of the complaint',
            },
          },
          required: ['category', 'description', 'reporterName', 'reporterPhone', 'address'],
        },
      },
    ],
  },
}

// Types for Vapi webhook payloads
export interface VapiWebhookPayload {
  message: {
    type: 'function-call' | 'status-update' | 'transcript' | 'hang' | 'speech-update'
    functionCall?: {
      name: string
      parameters: Record<string, unknown>
    }
    status?: string
    transcript?: string
    call?: {
      id: string
      phoneNumber?: {
        number: string
      }
      customer?: {
        number: string
      }
    }
  }
}

export interface VapiFunctionResponse {
  result: string | Record<string, unknown>
}

// Helper to format phone number for display
export function formatPhoneForSpeech(phone: string): string {
  // Format: 0851-5534-7701 -> "nol delapan lima satu, lima lima tiga empat, tujuh tujuh nol satu"
  const digits: Record<string, string> = {
    '0': 'nol',
    '1': 'satu',
    '2': 'dua',
    '3': 'tiga',
    '4': 'empat',
    '5': 'lima',
    '6': 'enam',
    '7': 'tujuh',
    '8': 'delapan',
    '9': 'sembilan',
  }

  const cleaned = phone.replace(/\D/g, '')
  
  // Group into 4-4-4 for readability
  const groups: string[] = []
  for (let i = 0; i < cleaned.length; i += 4) {
    const group = cleaned.slice(i, i + 4)
    const spoken = group.split('').map(d => digits[d] || d).join(' ')
    groups.push(spoken)
  }

  return groups.join(', ')
}

// Helper to format ticket ID for speech
export function formatTicketIdForSpeech(ticketId: string): string {
  // SP-20251204-0001 -> "S P, dua nol dua lima satu dua nol empat, nol nol nol satu"
  const parts = ticketId.split('-')
  
  const digits: Record<string, string> = {
    '0': 'nol',
    '1': 'satu',
    '2': 'dua',
    '3': 'tiga',
    '4': 'empat',
    '5': 'lima',
    '6': 'enam',
    '7': 'tujuh',
    '8': 'delapan',
    '9': 'sembilan',
  }

  const spokenParts = parts.map(part => {
    if (part === 'SP') return 'S P'
    return part.split('').map(c => digits[c] || c).join(' ')
  })

  return spokenParts.join(', ')
}
