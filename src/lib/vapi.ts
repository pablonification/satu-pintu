/**
 * Vapi.ai Integration untuk SatuPintu
 * 
 * Konfigurasi Transient Assistant - tidak perlu setup manual di Vapi dashboard.
 * Cukup masukkan Public Key, dan assistant akan otomatis dibuat saat panggilan dimulai.
 * 
 * Dokumentasi: https://docs.vapi.ai
 */

// ============================================================================
// KONFIGURASI WEBHOOK
// ============================================================================

/**
 * Mendapatkan URL webhook berdasarkan environment
 * Webhook ini akan dipanggil oleh Vapi saat AI perlu menjalankan function
 */
export const getWebhookUrl = () => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
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
• Gunakan kata "Bapak" atau "Ibu" setelah mengetahui nama pelapor

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
• Contoh: "Baik, jadi Bapak/Ibu ingin melaporkan [ringkasan keluhan]. Apakah benar demikian?"
• Jika ada koreksi, dengarkan dan perbaiki pemahaman
• Tawarkan untuk membuatkan laporan resmi

TAHAP 3 - PENGUMPULAN DATA PELAPOR
• Minta nama lengkap pelapor
  → "Boleh saya tahu nama lengkap Bapak/Ibu?"
• Konfirmasi nomor telepon (jika tersedia dari sistem)
  → "Apakah nomor [nomor] ini adalah nomor yang bisa dihubungi untuk perkembangan laporan?"
• Jika nomor tidak tersedia, minta nomor telepon aktif

TAHAP 4 - PENGUMPULAN DATA LOKASI
• Minta alamat lengkap lokasi kejadian/masalah
  → "Di mana alamat lengkap lokasi [masalah] tersebut, Bapak/Ibu?"
• Minta detail yang spesifik: nama jalan, nomor, RT/RW, kelurahan, kecamatan
• Jika perlu, tanyakan patokan atau landmark terdekat
• WAJIB: Validasi alamat menggunakan function validateAddress
• Jika alamat tidak ditemukan, minta pelapor menyebutkan ulang dengan lebih detail
• Jika alamat di luar Kota Bandung, jelaskan dengan sopan bahwa layanan hanya untuk wilayah Kota Bandung

TAHAP 5 - KONFIRMASI AKHIR
• Bacakan ringkasan lengkap laporan:
  → Jenis keluhan dan kategori
  → Lokasi yang sudah tervalidasi
  → Nama dan nomor telepon pelapor
• Minta konfirmasi: "Apakah semua informasi sudah benar, Bapak/Ibu?"
• Jika ada koreksi, lakukan perbaikan

TAHAP 6 - PEMBUATAN TIKET
• Setelah dikonfirmasi, buat tiket menggunakan function createTicket
• Sampaikan nomor tiket dengan JELAS (eja huruf dan angka satu per satu)
  → Contoh: "Nomor tiket Bapak/Ibu adalah S-P, dua-nol-dua-lima-satu-dua-nol-empat, nol-nol-nol-satu"
• Informasikan bahwa SMS konfirmasi akan dikirim
• Informasikan cara mengecek status: melalui website atau SMS dengan format "CEK [nomor tiket]"

TAHAP 7 - PENUTUP
• Tanyakan apakah ada keluhan lain yang ingin dilaporkan
• Jika tidak ada, ucapkan terima kasih dan salam penutup
• Contoh: "Terima kasih telah menggunakan layanan SatuPintu. Semoga masalah Bapak/Ibu segera tertangani. Selamat [pagi/siang/sore/malam]."

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

1. SELALU validasi alamat dengan function validateAddress sebelum membuat tiket
2. JANGAN membuat tiket jika alamat di luar Kota Bandung - jelaskan dengan sopan
3. JANGAN membuat tiket jika informasi belum lengkap - tanyakan yang kurang
4. PASTIKAN pelapor mengkonfirmasi semua informasi sebelum membuat tiket
5. Untuk masalah DARURAT, tunjukkan sense of urgency dalam nada bicara
6. Jika pelapor emosional atau kesal, tetap tenang dan empati
7. JANGAN memberikan janji waktu penyelesaian yang spesifik - sampaikan bahwa laporan akan ditindaklanjuti sesuai prioritas
8. Jika ada pertanyaan di luar kapasitas, arahkan ke kanal informasi yang tepat`

// ============================================================================
// PESAN PEMBUKA
// ============================================================================

const FIRST_MESSAGE = `Selamat datang di SatuPintu, layanan pengaduan terpadu Pemerintah Kota Bandung.

Saya Satu, asisten virtual yang siap membantu Anda melaporkan keluhan atau masalah terkait layanan publik dan infrastruktur kota.

Ada yang bisa saya bantu hari ini?`

// ============================================================================
// KONFIGURASI TRANSIENT ASSISTANT
// ============================================================================

/**
 * Mendapatkan konfigurasi lengkap Transient Assistant
 * Konfigurasi ini dikirim langsung saat memulai panggilan - tidak perlu setup di dashboard Vapi
 * 
 * @param webhookUrl - URL webhook untuk function calls (opsional, default dari env)
 * @returns Konfigurasi assistant untuk Vapi
 */
export const getAssistantConfig = (webhookUrl?: string) => {
  const serverUrl = webhookUrl || getWebhookUrl()
  
  return {
    // Identitas Assistant
    name: 'SatuPintu - Asisten Pengaduan Kota Bandung',
    
    // Pesan pembuka saat panggilan dimulai
    firstMessage: FIRST_MESSAGE,

    // Konfigurasi Model AI
    model: {
      provider: 'openai' as const,
      model: 'gpt-4o-mini' as const, // Model yang efisien dan cepat
      temperature: 0.7, // Keseimbangan antara konsistensi dan kreativitas
      messages: [
        {
          role: 'system' as const,
          content: SYSTEM_PROMPT,
        },
      ],
      // Definisi Function/Tools yang bisa dipanggil AI
      tools: [
        {
          type: 'function' as const,
          function: {
            name: 'validateAddress',
            description: 'Memvalidasi alamat dan memeriksa apakah berada dalam wilayah Kota Bandung. Wajib dipanggil sebelum membuat tiket untuk memastikan alamat valid dan dalam jangkauan layanan.',
            parameters: {
              type: 'object' as const,
              properties: {
                address: {
                  type: 'string' as const,
                  description: 'Alamat lengkap yang akan divalidasi. Sertakan nama jalan, nomor, kelurahan, dan kecamatan jika tersedia.',
                },
              },
              required: ['address'] as const,
            },
          },
          server: {
            url: serverUrl,
          },
        },
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
                  enum: ['DARURAT', 'INFRA', 'KEBERSIHAN', 'SOSIAL', 'LAINNYA'] as const,
                  description: 'Kategori keluhan: DARURAT (kecelakaan/kebakaran/kejahatan/medis), INFRA (jalan/lampu/jembatan), KEBERSIHAN (sampah/limbah), SOSIAL (ODGJ/gelandangan/anak terlantar), LAINNYA',
                },
                subcategory: {
                  type: 'string' as const,
                  description: 'Subkategori atau jenis spesifik keluhan. Contoh: "Jalan Berlubang", "Lampu PJU Mati", "Sampah Menumpuk"',
                },
                description: {
                  type: 'string' as const,
                  description: 'Deskripsi lengkap keluhan sesuai yang disampaikan pelapor. Sertakan detail kondisi, sudah berapa lama terjadi, dan dampaknya.',
                },
                reporterName: {
                  type: 'string' as const,
                  description: 'Nama lengkap pelapor',
                },
                reporterPhone: {
                  type: 'string' as const,
                  description: 'Nomor telepon pelapor yang bisa dihubungi (format: 08xxxxxxxxxx)',
                },
                address: {
                  type: 'string' as const,
                  description: 'Alamat lokasi masalah yang sudah divalidasi',
                },
                addressLat: {
                  type: 'number' as const,
                  description: 'Koordinat latitude lokasi (dari hasil validasi alamat)',
                },
                addressLng: {
                  type: 'number' as const,
                  description: 'Koordinat longitude lokasi (dari hasil validasi alamat)',
                },
                urgency: {
                  type: 'string' as const,
                  enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const,
                  description: 'Tingkat urgensi: CRITICAL (bahaya nyawa, < 15 menit), HIGH (mendesak, < 1 jam), MEDIUM (perlu ditangani, < 24 jam), LOW (tidak mendesak, < 72 jam)',
                },
              },
              required: ['category', 'description', 'reporterName', 'reporterPhone', 'address', 'urgency'] as const,
            },
          },
          server: {
            url: serverUrl,
          },
        },
      ],
    },

    // Konfigurasi Suara (ElevenLabs)
    voice: {
      provider: 'elevenlabs' as const,
      voiceId: 'pFZP5JQG7iQjIQuC4Bku', // Lily - Suara perempuan Indonesia yang natural
      stability: 0.5, // Keseimbangan variasi suara
      similarityBoost: 0.75, // Konsistensi suara
      // Alternatif voice IDs:
      // 'FGY2WhTYpPnrIDTdsKH5' - Laura (lebih formal)
      // '21m00Tcm4TlvDq8ikWAM' - Rachel (English, tapi bisa Indonesia)
    },

    // URL Server untuk Function Calls
    serverUrl: serverUrl,

    // Konfigurasi Percakapan
    silenceTimeoutSeconds: 30, // Timeout jika tidak ada suara selama 30 detik
    maxDurationSeconds: 600, // Maksimal durasi panggilan 10 menit
    endCallAfterSilenceSeconds: 10, // Akhiri panggilan setelah 10 detik tanpa respons penutup

    // Konfigurasi Transkripsi (Speech-to-Text)
    transcriber: {
      provider: 'deepgram' as const,
      model: 'nova-2' as const, // Model terbaru dengan akurasi tinggi
      language: 'id' as const, // Bahasa Indonesia
    },

    // Metadata untuk tracking
    metadata: {
      service: 'SatuPintu',
      version: '1.0.0',
      city: 'Bandung',
      country: 'Indonesia',
    },
  } as const
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
