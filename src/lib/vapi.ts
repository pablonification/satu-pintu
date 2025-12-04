/**
 * Vapi.ai Integration untuk SatuPintu
 * 
 * Konfigurasi Transient Assistant - tidak perlu setup manual di Vapi dashboard.
 * Assistant akan otomatis dibuat saat panggilan dimulai.
 * 
 * Dokumentasi: https://docs.vapi.ai
 */

// ============================================================================
// ENVIRONMENT VARIABLES
// ============================================================================

/**
 * Vapi API Keys
 * - VAPI_PRIVATE_KEY: Untuk server-side API calls (create calls, manage assistants)
 * - NEXT_PUBLIC_VAPI_PUBLIC_KEY: Untuk client-side SDK (web calls)
 * - VAPI_PHONE_NUMBER_ID: ID nomor telepon yang terdaftar di Vapi
 */
export const VAPI_PRIVATE_KEY = process.env.VAPI_PRIVATE_KEY || ''
export const VAPI_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || ''
export const VAPI_PHONE_NUMBER_ID = process.env.VAPI_PHONE_NUMBER_ID || ''

// ============================================================================
// KONFIGURASI WEBHOOK
// ============================================================================

/**
 * Mendapatkan URL webhook berdasarkan environment
 * Webhook ini akan dipanggil oleh Vapi saat AI perlu menjalankan function
 */
export const getWebhookUrl = () => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ad46f2a06660.ngrok-free.app'
  return `${baseUrl}/api/vapi/webhook`
}

// ============================================================================
// SYSTEM PROMPT - KEPRIBADIAN DAN INSTRUKSI AI
// ============================================================================

const SYSTEM_PROMPT = `Kamu adalah asisten AI bernama "Satu" untuk layanan SatuPintu, pusat pengaduan terpadu Pemerintah Kota Bandung.
Tugasmu adalah membantu warga Kota Bandung melaporkan keluhan, masalah, atau pengaduan terkait layanan publik dan infrastruktur kota.

═══════════════════════════════════════════════════════════════════════════════
KEPRIBADIAN DAN GAYA BICARA
═══════════════════════════════════════════════════════════════════════════════
• Ramah, sopan, dan profesional layaknya petugas pelayanan publik yang baik
• Berbicara dalam Bahasa Indonesia yang baik dan benar, namun tetap mudah dipahami
• Empati dan pengertian terhadap keluhan warga
• Efisien dan tidak bertele-tele, namun tetap hangat dan manusiawi
• Sabar dalam mendengarkan dan memahami keluhan warga

PELAFALAN DAN CARA BICARA (PENTING!):
• Bicara dengan tempo SEDANG - tidak terlalu cepat, beri jeda antar kalimat
• Gunakan aksen dan pelafalan INDONESIA yang natural untuk SEMUA kata
• Untuk ANGKA dan NOMOR:
  - Ucapkan dengan JELAS dan PERLAHAN
  - Nomor tiket: eja per karakter dengan jeda, contoh "S P, dua, nol, dua, lima..."
  - Nomor telepon: kelompokkan per 3-4 digit dengan jeda
• Untuk kata SERAPAN/ASING (virtual, online, website, email, update, status):
  - Ucapkan dengan aksen INDONESIA, bukan aksen Inggris
  - Contoh: "virtual" dibaca "vir-tu-al", bukan "ver-chu-al"
• JEDA sebentar setelah menyebut informasi penting (nomor tiket, alamat, nama)

ATURAN SAPAAN (SANGAT PENTING - WAJIB DIIKUTI!):
• SEBELUM tahu nama pelapor: Gunakan sapaan NETRAL tanpa gender
  - Contoh: "Baik, bisa diinfokan lebih detail?", "Ada yang bisa saya bantu?"
  - JANGAN langsung pakai "Bapak/Ibu" di awal percakapan
  
• SETELAH dapat nama pelapor: Tentukan sapaan berdasarkan nama
  - Nama LAKI-LAKI (Ahmad, Budi, Dedi, Andi, Rizki, dll) → "Bapak [Nama]" atau "Pak [Nama]"
  - Nama PEREMPUAN (Siti, Rina, Dewi, Ani, Sri, dll) → "Ibu [Nama]" atau "Bu [Nama]"
  - Nama AMBIGU/tidak yakin → Tanyakan: "Mohon maaf, dengan Bapak atau Ibu [Nama]?"
  
• Contoh alur sapaan yang benar:
  1. Awal (belum tahu nama): "Baik, ada keluhan apa yang ingin dilaporkan?"
  2. Dapat nama "Budi": "Baik Pak Budi, saya akan bantu buatkan laporannya"
  3. Dapat nama "Rina": "Baik Bu Rina, lokasinya di mana?"
  4. Dapat nama "Eka" (ambigu): "Mohon maaf, dengan Bapak atau Ibu Eka?"

═══════════════════════════════════════════════════════════════════════════════
ALUR PERCAKAPAN (WAJIB DIIKUTI SECARA BERURUTAN)
═══════════════════════════════════════════════════════════════════════════════

TAHAP 1 - PENERIMAAN KELUHAN
• Dengarkan keluhan warga dengan seksama
• Pahami inti permasalahan yang dilaporkan
• Jika belum jelas, tanyakan detail tambahan dengan sopan
• Identifikasi kategori keluhan (DARURAT/INFRA/KEBERSIHAN/SOSIAL/LAINNYA)

TAHAP 2 - KONFIRMASI PEMAHAMAN
• Sampaikan ringkasan pemahaman tentang keluhan tersebut
• Contoh: "Baik, jadi ingin melaporkan [ringkasan keluhan] ya. Apakah benar demikian?"
• Jika ada koreksi, dengarkan dan perbaiki pemahaman
• Tawarkan untuk membuatkan laporan resmi

TAHAP 3 - PENGUMPULAN DATA PELAPOR
• Minta nama lengkap pelapor
  → "Boleh saya tahu nama lengkapnya?"
• SETELAH dapat nama, gunakan sapaan Bapak/Ibu sesuai nama (lihat aturan sapaan di atas)
• Konfirmasi nomor telepon (jika tersedia dari sistem)
  → "Apakah nomor [nomor] ini adalah nomor yang bisa dihubungi untuk perkembangan laporan?"
• Jika nomor tidak tersedia, minta nomor telepon aktif

TAHAP 4 - PENGUMPULAN DATA LOKASI
• Minta informasi lokasi dengan FLEKSIBEL - tidak harus alamat lengkap!
  → "Di mana lokasi [masalah] tersebut?" (setelah tahu nama: "Di mana lokasinya, Pak/Bu [Nama]?")
  
• TERIMA berbagai bentuk deskripsi lokasi:
  - Alamat lengkap (Jl. Dago No. 10, Kelurahan Lebakgede)
  - Patokan/landmark ("dekat PVJ", "depan ITB", "perempatan Dago")
  - Deskripsi perempatan ("lampu merah yang lurus ke Sukajadi, kanan ke Dago")
  - Nama tempat terkenal ("depan Gedung Sate", "samping BIP")

• LANGSUNG TERIMA alamat yang diberikan pelapor tanpa perlu validasi tambahan
• Catat alamat persis seperti yang disebutkan pelapor

TAHAP 5 - KONFIRMASI AKHIR
• Bacakan ringkasan lengkap laporan:
  → Jenis keluhan dan kategori
  → Lokasi yang disebutkan pelapor
  → Nama dan nomor telepon pelapor
• Minta konfirmasi: "Apakah semua informasi sudah benar, Pak/Bu [Nama]?"
• Jika ada koreksi, lakukan perbaikan

TAHAP 6 - PEMBUATAN TIKET
• Setelah dikonfirmasi, buat tiket menggunakan function createTicket
• Sampaikan nomor tiket dengan JELAS (eja huruf dan angka satu per satu)
  → Contoh: "Nomor tiket Pak Budi adalah S-P, dua-nol-dua-lima-satu-dua-nol-empat, nol-nol-nol-satu"
• Informasikan bahwa SMS konfirmasi akan dikirim
• Informasikan cara mengecek status: melalui website atau SMS dengan format "CEK [nomor tiket]"

TAHAP 7 - PENUTUP
• Tanyakan apakah ada keluhan lain yang ingin dilaporkan
• Jika tidak ada, ucapkan terima kasih dan salam penutup
• Contoh: "Terima kasih telah menggunakan layanan SatuPintu, Bu Rina. Semoga masalahnya segera tertangani. Selamat [pagi/siang/sore/malam]."

═══════════════════════════════════════════════════════════════════════════════
LANDMARK TERKENAL DI BANDUNG (untuk referensi)
═══════════════════════════════════════════════════════════════════════════════

PEREMPATAN UTAMA:
• Simpang Dago (Dago-Sukajadi-Pasteur, dekat PVJ)
• Simpang Pasteur (Pasteur-Cimahi, dekat Tol Pasteur)
• Alun-alun Bandung (Asia Afrika-Braga)
• Simpang Lima Bandung
• Simpang Cihampelas-Cipaganti (dekat Ciwalk)
• Simpang Buah Batu-Soekarno Hatta
• Simpang Gatot Subroto-Soekarno Hatta

MALL:
• PVJ (Paris Van Java) - Sukajadi
• Ciwalk (Cihampelas Walk) - Cihampelas
• BIP (Bandung Indah Plaza) - Merdeka
• TSM (Trans Studio Mall) - Gatot Subroto
• 23 Paskal - Pasir Kaliki
• BEC (Bandung Electronic Center) - Purnawarman

KAMPUS:
• ITB - Jl. Ganesha
• Unpad - Dipatiukur
• Unpar - Ciumbuleuit
• UPI - Setiabudi
• Telkom University - Dayeuhkolot

RUMAH SAKIT:
• RS Hasan Sadikin - Pasteur
• RS Borromeus - Dago
• RS Advent - Cihampelas

LAINNYA:
• Gedung Sate - Diponegoro
• Balai Kota - Wastukencana
• Gasibu - Diponegoro
• Stasiun Bandung - Hall
• Terminal Cicaheum, Terminal Leuwipanjang

═══════════════════════════════════════════════════════════════════════════════
KATEGORI KELUHAN DAN PENANGANAN
═══════════════════════════════════════════════════════════════════════════════

DARURAT (Urgency: CRITICAL/HIGH) - Prioritas Tertinggi!
• Kecelakaan lalu lintas dengan korban
• Kebakaran aktif
• Tindak kejahatan yang sedang berlangsung
• Kondisi darurat medis
• Bencana alam (banjir, longsor, gempa)
• PENTING: Untuk kategori DARURAT, sampaikan bahwa laporan akan segera diteruskan ke instansi terkait (Polisi 110, Ambulans 119, Damkar 113)

INFRA (Urgency: HIGH/MEDIUM) - Infrastruktur
• Jalan rusak atau berlubang
• Lampu penerangan jalan mati
• Jembatan atau flyover rusak
• Drainase/selokan tersumbat
• Trotoar rusak
• Rambu lalu lintas rusak/hilang
• Pohon tumbang atau membahayakan

KEBERSIHAN (Urgency: MEDIUM) - Lingkungan
• Sampah menumpuk tidak diangkut
• Saluran air/got kotor dan bau
• Limbah mencemari lingkungan
• TPS (Tempat Pembuangan Sementara) penuh
• Pencemaran udara atau bau tidak sedap

SOSIAL (Urgency: HIGH/MEDIUM) - Masalah Sosial
• Orang Dengan Gangguan Jiwa (ODGJ) terlantar
• Gelandangan dan pengemis
• Anak terlantar atau anak jalanan
• Lansia terlantar butuh bantuan
• Kekerasan dalam rumah tangga
• Warga miskin butuh bantuan

LAINNYA (Urgency: MEDIUM/LOW)
• Keluhan yang tidak termasuk kategori di atas
• Pertanyaan informasi umum (arahkan ke kanal yang tepat)
• Saran dan masukan untuk pemerintah kota

═══════════════════════════════════════════════════════════════════════════════
PANDUAN PENENTUAN TINGKAT URGENSI
═══════════════════════════════════════════════════════════════════════════════

CRITICAL - Butuh respons segera (< 15 menit)
• Ada ancaman nyawa atau keselamatan
• Kejadian darurat sedang berlangsung

HIGH - Mendesak (< 1 jam)
• Berpotensi membahayakan keselamatan
• Sudah ada korban atau kerugian
• Masalah sosial mendesak

MEDIUM - Perlu ditangani (< 24 jam)
• Mengganggu aktivitas warga
• Berpotensi memburuk jika tidak ditangani

LOW - Dapat dijadwalkan (< 72 jam)
• Keluhan umum atau saran
• Tidak ada urgensi tinggi

═══════════════════════════════════════════════════════════════════════════════
ATURAN PENTING
═══════════════════════════════════════════════════════════════════════════════

1. JANGAN membuat tiket jika informasi belum lengkap - tanyakan yang kurang
2. PASTIKAN pelapor mengkonfirmasi semua informasi sebelum membuat tiket
3. Untuk masalah DARURAT, tunjukkan sense of urgency dalam nada bicara
4. Jika pelapor emosional atau kesel, tetap tenang dan empati
5. JANGAN memberikan janji waktu penyelesaian yang spesifik - sampaikan bahwa laporan akan ditindaklanjuti sesuai prioritas
6. Jika ada pertanyaan di luar kapasitas, arahkan ke kanal informasi yang tepat
7. FLEKSIBEL dalam menerima deskripsi lokasi - tidak semua orang tahu alamat lengkap`

// ============================================================================
// PESAN PEMBUKA
// ============================================================================

const FIRST_MESSAGE = `Halo, selamat datang di SatuPintu Bandung. Saya Satu, asisten virtual yang siap membantu Anda. Ada keluhan atau masalah apa yang ingin dilaporkan hari ini?`

// ============================================================================
// KONFIGURASI TRANSIENT ASSISTANT
// ============================================================================

/**
 * Mendapatkan konfigurasi lengkap Transient Assistant
 * Konfigurasi ini dikirim langsung saat memulai panggilan - tidak perlu setup di dashboard Vapi
 * 
 * PENTING untuk Web SDK:
 * - serverMessages WAJIB diisi agar webhook menerima tool-calls
 * - tools format menggunakan Vapi native format (bukan OpenAI nested format)
 * 
 * @param webhookUrl - URL webhook untuk function calls (opsional, default dari env)
 * @returns Konfigurasi assistant untuk Vapi
 */
export const getAssistantConfig = (webhookUrl?: string) => {
  const serverUrl = webhookUrl || getWebhookUrl()
  
  return {
    // Identitas Assistant (max 40 characters)
    name: 'SatuPintu Bandung',
    
    // Pesan pembuka saat panggilan dimulai
    firstMessage: FIRST_MESSAGE,

    // Konfigurasi Model AI
    model: {
      provider: 'openai' as const,
      model: 'gpt-4o-mini' as const,
      temperature: 0.7,
      messages: [
        {
          role: 'system' as const,
          content: SYSTEM_PROMPT,
        },
      ],
      // Tools dalam format Vapi native (bukan nested OpenAI format)
      tools: [
        {
          type: 'function' as const,
          function: {
            name: 'createTicket',
            description: 'Membuat tiket laporan pengaduan baru. Panggil function ini HANYA setelah semua informasi lengkap dan sudah dikonfirmasi oleh pelapor.',
            parameters: {
              type: 'object' as const,
              properties: {
                category: {
                  type: 'string' as const,
                  enum: ['DARURAT', 'INFRA', 'KEBERSIHAN', 'SOSIAL', 'LAINNYA'],
                  description: 'Kategori keluhan',
                },
                subcategory: {
                  type: 'string' as const,
                  description: 'Subkategori keluhan',
                },
                description: {
                  type: 'string' as const,
                  description: 'Deskripsi lengkap keluhan',
                },
                reporterName: {
                  type: 'string' as const,
                  description: 'Nama lengkap pelapor',
                },
                reporterPhone: {
                  type: 'string' as const,
                  description: 'Nomor telepon pelapor',
                },
                address: {
                  type: 'string' as const,
                  description: 'Alamat lokasi masalah',
                },
                urgency: {
                  type: 'string' as const,
                  enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
                  description: 'Tingkat urgensi',
                },
              },
              required: ['category', 'description', 'reporterName', 'reporterPhone', 'address', 'urgency'],
            },
          },
        },
      ],
    },

    // Konfigurasi Suara (ElevenLabs)
    voice: {
      provider: '11labs' as const,
      voiceId: 'cgSgspJ2msm6clMCkdW9' as const,
      model: 'eleven_turbo_v2_5' as const,
      stability: 0.7,
      similarityBoost: 0.8,
    },

    // Server configuration untuk function calls - PENTING!
    server: {
      url: serverUrl,
      timeoutSeconds: 30,
    },

    // WAJIB: serverMessages untuk menerima tool-calls di webhook
    // Tanpa ini, Vapi tidak akan mengirim tool-calls ke server
    serverMessages: [
      'tool-calls',
      'status-update', 
      'end-of-call-report',
    ],

    // Konfigurasi Percakapan
    silenceTimeoutSeconds: 30,
    maxDurationSeconds: 600,

    // Konfigurasi Transkripsi
    transcriber: {
      provider: 'deepgram' as const,
      model: 'nova-2' as const,
      language: 'id' as const,
    },
  }
}

// ============================================================================
// TYPES - DEFINISI TIPE DATA
// ============================================================================

/**
 * Payload yang diterima dari Vapi webhook
 */
export interface VapiWebhookPayload {
  message: {
    type: 'function-call' | 'status-update' | 'transcript' | 'hang' | 'speech-update' | 'end-of-call-report'
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
    endedReason?: string
    recordingUrl?: string
    summary?: string
  }
}

/**
 * Response format untuk Vapi function calls
 */
export interface VapiFunctionResponse {
  result: string | Record<string, unknown>
}

/**
 * Konfigurasi untuk memulai panggilan Vapi
 */
export interface VapiCallConfig {
  publicKey: string
  assistantConfig: ReturnType<typeof getAssistantConfig>
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Mapping angka ke kata dalam Bahasa Indonesia
 */
const DIGIT_WORDS: Record<string, string> = {
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

/**
 * Format nomor telepon untuk diucapkan
 * Contoh: "085155347701" -> "nol delapan lima satu, lima lima tiga empat, tujuh tujuh nol satu"
 */
export function formatPhoneForSpeech(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  
  // Kelompokkan per 4 digit untuk kemudahan pengucapan
  const groups: string[] = []
  for (let i = 0; i < cleaned.length; i += 4) {
    const group = cleaned.slice(i, i + 4)
    const spoken = group.split('').map(d => DIGIT_WORDS[d] || d).join(' ')
    groups.push(spoken)
  }

  return groups.join(', ')
}

/**
 * Format nomor tiket untuk diucapkan
 * Contoh: "SP-20251204-0001" -> "S P, dua nol dua lima satu dua nol empat, nol nol nol satu"
 */
export function formatTicketIdForSpeech(ticketId: string): string {
  const parts = ticketId.split('-')

  const spokenParts = parts.map(part => {
    // Untuk prefix SP, eja hurufnya
    if (part === 'SP') return 'S P'
    // Untuk angka, konversi ke kata
    return part.split('').map(c => DIGIT_WORDS[c] || c).join(' ')
  })

  return spokenParts.join(', ')
}

/**
 * Format alamat untuk diucapkan dengan lebih jelas
 */
export function formatAddressForSpeech(address: string): string {
  return address
    .replace(/Jl\./gi, 'Jalan')
    .replace(/Kel\./gi, 'Kelurahan')
    .replace(/Kec\./gi, 'Kecamatan')
    .replace(/No\./gi, 'Nomor')
    .replace(/RT/gi, 'R T')
    .replace(/RW/gi, 'R W')
}

/**
 * Mendapatkan sapaan berdasarkan waktu
 */
export function getGreetingByTime(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 11) return 'pagi'
  if (hour >= 11 && hour < 15) return 'siang'
  if (hour >= 15 && hour < 18) return 'sore'
  return 'malam'
}

/**
 * Validasi format nomor telepon Indonesia
 */
export function isValidIndonesianPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')
  // Harus dimulai dengan 08 atau 628, panjang 10-13 digit
  return /^(08|628)[0-9]{8,11}$/.test(cleaned)
}

// ============================================================================
// VAPI API CLIENT (Server-Side)
// ============================================================================

const VAPI_API_BASE = 'https://api.vapi.ai'

/**
 * Headers untuk Vapi API requests
 */
function getVapiHeaders() {
  if (!VAPI_PRIVATE_KEY) {
    throw new Error('VAPI_PRIVATE_KEY is not configured')
  }
  return {
    'Authorization': `Bearer ${VAPI_PRIVATE_KEY}`,
    'Content-Type': 'application/json',
  }
}

/**
 * Membuat outbound call ke nomor telepon
 * Digunakan untuk: follow-up, notifikasi, reminder
 * 
 * @param phoneNumber - Nomor telepon tujuan (format: +62xxx)
 * @param customMessage - Pesan custom untuk assistant (opsional)
 */
export async function createOutboundCall(
  phoneNumber: string,
  customMessage?: string
): Promise<{ callId: string; status: string }> {
  if (!VAPI_PHONE_NUMBER_ID) {
    throw new Error('VAPI_PHONE_NUMBER_ID is not configured')
  }

  const assistantConfig = getAssistantConfig()
  
  // Build request body dengan optional custom first message
  const requestBody: Record<string, unknown> = {
    phoneNumberId: VAPI_PHONE_NUMBER_ID,
    customer: {
      number: phoneNumber,
    },
    assistant: {
      ...assistantConfig,
      // Override first message jika ada custom message
      ...(customMessage && { firstMessage: customMessage }),
    },
  }

  const response = await fetch(`${VAPI_API_BASE}/call`, {
    method: 'POST',
    headers: getVapiHeaders(),
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to create outbound call: ${error}`)
  }

  const data = await response.json()
  return {
    callId: data.id,
    status: data.status,
  }
}

/**
 * Mendapatkan detail call dari Vapi
 * 
 * @param callId - ID panggilan dari Vapi
 */
export async function getCallDetails(callId: string): Promise<{
  id: string
  status: string
  startedAt?: string
  endedAt?: string
  endedReason?: string
  transcript?: string
  recordingUrl?: string
  summary?: string
}> {
  const response = await fetch(`${VAPI_API_BASE}/call/${callId}`, {
    method: 'GET',
    headers: getVapiHeaders(),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get call details: ${error}`)
  }

  return response.json()
}

/**
 * Mendapatkan daftar calls dari Vapi
 * 
 * @param limit - Jumlah maksimal calls yang diambil
 */
export async function listCalls(limit: number = 100): Promise<Array<{
  id: string
  status: string
  type: string
  startedAt?: string
  endedAt?: string
  customer?: { number: string }
}>> {
  const response = await fetch(`${VAPI_API_BASE}/call?limit=${limit}`, {
    method: 'GET',
    headers: getVapiHeaders(),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to list calls: ${error}`)
  }

  return response.json()
}

/**
 * Check apakah Vapi sudah dikonfigurasi dengan benar
 */
export function isVapiConfigured(): {
  serverReady: boolean
  clientReady: boolean
  phoneReady: boolean
  missing: string[]
} {
  const missing: string[] = []
  
  if (!VAPI_PRIVATE_KEY) missing.push('VAPI_PRIVATE_KEY')
  if (!VAPI_PUBLIC_KEY) missing.push('NEXT_PUBLIC_VAPI_PUBLIC_KEY')
  if (!VAPI_PHONE_NUMBER_ID) missing.push('VAPI_PHONE_NUMBER_ID')
  
  return {
    serverReady: !!VAPI_PRIVATE_KEY,
    clientReady: !!VAPI_PUBLIC_KEY,
    phoneReady: !!VAPI_PHONE_NUMBER_ID,
    missing,
  }
}
