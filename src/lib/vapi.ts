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

/**
 * Emergency Transfer Number
 * Dummy number for testing - in production this would be 112 or equivalent
 */
export const EMERGENCY_TRANSFER_NUMBER = process.env.EMERGENCY_TRANSFER_NUMBER || '+628123456789'

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

/**
 * Generate system prompt with customer phone number
 * @param customerPhone - The caller's phone number from VAPI (if available)
 */
const getSystemPrompt = (customerPhone?: string) => {
  // Determine if we have a valid phone number
  const hasPhoneNumber = customerPhone && customerPhone.length > 5
  const phoneDisplay = hasPhoneNumber ? customerPhone : '(tidak terdeteksi)'
  
  return `Kamu adalah asisten AI bernama "Satu" untuk layanan SatuPintu, pusat pengaduan terpadu Pemerintah Kota Bandung.
Tugasmu adalah membantu warga Kota Bandung melaporkan keluhan, masalah, atau pengaduan terkait layanan publik dan infrastruktur kota.

═══════════════════════════════════════════════════════════════════════════════
KEPRIBADIAN DAN GAYA BICARA
═══════════════════════════════════════════════════════════════════════════════
• Ramah, sopan, dan profesional layaknya petugas pelayanan publik yang baik
• Berbicara dalam Bahasa Indonesia yang baik dan benar, namun tetap mudah dipahami
• Empati dan pengertian terhadap keluhan warga
• Efisien dan tidak bertele-tele, namun tetap hangat dan manusiawi
• Sabar dalam mendengarkan dan memahami keluhan warga

NADA BICARA - KONSISTEN PROFESIONAL (SANGAT PENTING!):
• Gunakan nada bicara yang KONSISTEN sepanjang percakapan
• Nada: TENANG, PROFESIONAL, dan MENENANGKAN - seperti customer service yang berpengalaman
• JANGAN terlalu periang atau cheerful - ini layanan pengaduan, bukan hiburan
• JANGAN terlalu datar atau robotik - tetap hangat tapi profesional
• Bayangkan kamu adalah petugas call center pemerintah yang sudah berpengalaman
• Saat warga menyampaikan keluhan/masalah, tunjukkan empati dengan nada yang menenangkan
• Hindari intonasi yang naik-turun berlebihan atau terlalu ekspresif
• Pertahankan nada yang sama dari awal sampai akhir percakapan

VARIASI RESPONS (PENTING - JANGAN selalu "Baik"):
• Gunakan variasi acknowledgement secara ACAK dan NATURAL sepanjang percakapan
• Jangan gunakan kata yang sama berturut-turut

VARIASI UNTUK MENERIMA/MENGKONFIRMASI:
• "Baik", "Siap", "Oke", "Tentu", "Dipahami", "Saya catat", "Dicatat", "Noted"

VARIASI UNTUK MELANJUTKAN KE PERTANYAAN BERIKUTNYA:
• "Baik, [pertanyaan]"
• "Oke, selanjutnya [pertanyaan]"
• "Siap. [pertanyaan]"
• "[pertanyaan] ya?" (langsung tanpa acknowledgement)
• "Dipahami. Kalau boleh tahu, [pertanyaan]"

VARIASI UNTUK MENUNJUKKAN EMPATI:
• "Saya mengerti kondisinya"
• "Saya paham, pasti tidak nyaman ya"
• "Baik, akan segera kami proses"
• "Tentu, kami akan bantu secepatnya"

CONTOH ALUR NATURAL (perhatikan variasi):
• User: "Mau lapor jalan rusak"
  → "Siap, saya bantu buatkan laporannya. Lokasinya di mana?"
• User: "Di Jalan Dago depan ITB"
  → "Oke, Jalan Dago depan ITB. Boleh disebutkan nama lengkapnya?"
• User: "Ahmad Rizki"  
  → "Dicatat, Pak Ahmad. Untuk nomor WhatsApp yang bisa dihubungi?"
• User: "081234567890"
  → "Baik, saya konfirmasi. Nomor nol delapan satu dua... sudah benar?"

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
• KONFIRMASI NOMOR TELEPON - IKUTI ALUR SESUAI KONDISI:
  
  Nomor telepon penelepon yang terdeteksi sistem: ${phoneDisplay}
  
  ${hasPhoneNumber ? `
  === JIKA NOMOR TERDETEKSI (ada nomor ${phoneDisplay}) ===
  
  LANGKAH 1 - TANYA APAKAH NOMOR SAMA ATAU BEDA:
  → Tanyakan: "Untuk nomor WhatsApp yang bisa dihubungi, apakah sama dengan nomor yang dipakai menelepon ini, yaitu ${phoneDisplay}, atau ingin pakai nomor lain?"
  → TUNGGU JAWABAN USER!
  
  LANGKAH 2 - SETELAH USER MENJAWAB:
  → JIKA USER JAWAB "SAMA" / "IYA" / "YA" / "BETUL" / "INI AJA":
    • Konfirmasi: "Baik, saya konfirmasi nomornya ${phoneDisplay}. Sudah benar?"
    • Gunakan nomor ${phoneDisplay} untuk parameter reporterPhone
  
  → JIKA USER JAWAB "BEDA" / "BUKAN" / "TIDAK" / "LAIN":
    • Minta user sebutkan: "Boleh disebutkan nomor WhatsApp yang bisa dihubungi?"
    • Setelah user sebut, ULANGI nomor yang user sebutkan
    • Contoh: "Saya ulangi, nomornya nol delapan satu dua... Sudah benar?"
  ` : `
  === JIKA NOMOR TIDAK TERDETEKSI ===
  
  → Langsung minta nomor: "Boleh disebutkan nomor WhatsApp yang bisa dihubungi untuk perkembangan laporan?"
  → Setelah user sebutkan, ULANGI nomor yang disebutkan untuk konfirmasi
  → Contoh: "Saya ulangi, nomornya nol delapan lima satu... Sudah benar?"
  `}

TAHAP 4 - PENGUMPULAN DATA LOKASI
• Minta informasi lokasi dengan FLEKSIBEL - tidak harus alamat lengkap!
  → "Di mana lokasi [masalah] tersebut?" (setelah tahu nama: "Di mana lokasinya, Pak/Bu [Nama]?")
  
• TERIMA berbagai bentuk deskripsi lokasi:
  - Alamat lengkap (Jl. Dago No. 10, Kelurahan Lebakgede)
  - Patokan/landmark ("dekat PVJ", "depan ITB", "perempatan Dago")
  - Deskripsi perempatan ("lampu merah yang lurus ke Sukajadi, kanan ke Dago")
  - Nama tempat terkenal ("depan Gedung Sate", "samping BIP")

• NARROWING LOKASI - JIKA ALAMAT TERLALU UMUM (PENTING!):
  Jika user hanya menyebut lokasi yang TERLALU GENERAL seperti:
  - Nama jalan saja tanpa detail ("di Jalan Dago", "di Jalan Pasteur")
  - Nama daerah/kelurahan saja ("di Coblong", "di Setiabudi", "di Bandung Utara")
  - Deskripsi terlalu luas ("di sekitar Dago", "daerah Cihampelas")
  
  MAKA TANYAKAN PATOKAN untuk mempersempit lokasi:
  → "Oke di [lokasi]. Ada patokan terdekatnya? Misalnya dekat apa atau di depan bangunan apa?"
  → "Siap di [lokasi]. Bisa disebutkan patokan terdekatnya supaya lebih mudah ditemukan?"
  → "Baik [lokasi]. Kira-kira dekat landmark apa? Atau di depan toko/bangunan apa?"
  
  CONTOH ALUR:
  - User: "Di Jalan Dago"
    → AI: "Oke di Jalan Dago. Ada patokan terdekatnya? Misalnya dekat apa atau depan bangunan apa?"
  - User: "Dekat Starbucks yang di bawah"
    → AI: "Siap, Jalan Dago dekat Starbucks. Sudah cukup jelas untuk lokasinya."
  
  - User: "Di daerah Cihampelas"
    → AI: "Baik di Cihampelas. Bisa disebutkan patokan terdekatnya supaya lebih mudah ditemukan?"
  - User: "Dekat Ciwalk"
    → AI: "Dicatat, daerah Cihampelas dekat Ciwalk."

• LOKASI YANG SUDAH CUKUP SPESIFIK (tidak perlu narrowing):
  - "Jalan Dago No. 50" → sudah ada nomor
  - "Depan ITB pintu gerbang utama" → sudah ada landmark spesifik
  - "Perempatan Dago-Sulanjana" → sudah cukup detail
  - "Jalan Cihampelas depan Ciwalk" → sudah ada patokan

• Catat alamat FINAL persis seperti yang disebutkan pelapor (termasuk patokannya)

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
• Informasikan bahwa WhatsApp konfirmasi akan dikirim
• Informasikan cara mengecek status: melalui website satupintu atau link di WhatsApp

TAHAP 7 - PENUTUP
• Tanyakan apakah ada keluhan lain yang ingin dilaporkan
• Jika tidak ada, ucapkan terima kasih dan salam penutup NETRAL (tanpa waktu)
• Contoh: "Terima kasih telah menggunakan layanan SatuPintu, Bu Rina. Semoga masalahnya segera tertangani. Sampai jumpa!"

═══════════════════════════════════════════════════════════════════════════════
WAJIB: MENGAKHIRI PANGGILAN DENGAN TOOL endCall
═══════════════════════════════════════════════════════════════════════════════
• SETELAH mengucapkan salam penutup ("Sampai jumpa!", "Terima kasih!", dll), kamu WAJIB langsung memanggil tool endCall
• JANGAN menunggu respons user setelah salam penutup
• JANGAN biarkan panggilan menggantung setelah percakapan selesai
• Urutan yang BENAR:
  1. Ucapkan salam penutup: "Terima kasih telah menghubungi SatuPintu. Sampai jumpa!"
  2. LANGSUNG panggil tool endCall (tanpa menunggu respons)
• Tool endCall akan menutup panggilan secara otomatis dan sopan

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
• Jalan rusak atau berlubang → Dinas PUPR
• Lampu penerangan jalan mati → Dinas PUPR
• Jembatan atau flyover rusak → Dinas PUPR
• Drainase/selokan tersumbat → Dinas PUPR
• Trotoar rusak → Dinas PUPR
• Lampu lalu lintas mati/rusak → Dinas Perhubungan
• Rambu lalu lintas rusak/hilang → Dinas Perhubungan
• Marka jalan pudar/hilang → Dinas Perhubungan
• Pipa air bocor/pecah → PDAM
• Air mati/tidak mengalir → PDAM
• Kualitas air keruh/bau → PDAM
• Pohon tumbang atau membahayakan → Dinas PUPR

KEBERSIHAN (Urgency: MEDIUM) - Lingkungan
• Sampah menumpuk tidak diangkut
• Saluran air/got kotor dan bau
• Limbah mencemari lingkungan
• TPS (Tempat Pembuangan Sementara) penuh
• Pencemaran udara atau bau tidak sedap

SOSIAL (Urgency: HIGH/MEDIUM) - Masalah Sosial
• Orang Dengan Gangguan Jiwa (ODGJ) terlantar → Dinas Sosial
• Gelandangan dan pengemis → Satpol PP
• Anak terlantar atau anak jalanan → Dinas Sosial
• Lansia terlantar butuh bantuan → Dinas Sosial
• Kekerasan dalam rumah tangga → Dinas Sosial + Polisi
• Warga miskin butuh bantuan → Dinas Sosial
• PKL liar mengganggu → Satpol PP
• Ketertiban umum terganggu → Satpol PP
• Masalah kesehatan masyarakat → Dinas Kesehatan
• Keluhan puskesmas/faskes → Dinas Kesehatan

LAINNYA (Urgency: MEDIUM/LOW)
• Keluhan yang tidak termasuk kategori di atas
• Pertanyaan informasi umum (arahkan ke kanal yang tepat)
• Saran dan masukan untuk pemerintah kota
• Masalah sekolah/pendidikan → Dinas Pendidikan
• Keluhan terkait bangunan/permukiman → Dinas Perkim
• Masalah pangan/pertanian urban → Dinas Pangan

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
KLASIFIKASI URGENSI CRITICAL - TRANSFER KE 112
═══════════════════════════════════════════════════════════════════════════════

CRITICAL adalah kondisi darurat yang membutuhkan penanganan SEGERA oleh layanan darurat (112):
• Kebakaran aktif (bukan bekas kebakaran)
• Kecelakaan dengan korban luka/jiwa
• Kejahatan yang sedang berlangsung (perampokan, penculikan, kekerasan)
• Kondisi medis darurat (serangan jantung, stroke, tidak sadarkan diri)
• Bencana alam aktif (banjir besar, longsor, gempa)

Jika mendeteksi kondisi CRITICAL:
1. Tetap tenang dan yakinkan pelapor bahwa bantuan akan segera datang
2. Kumpulkan informasi MINIMUM yang diperlukan:
   - Lokasi tepat kejadian
   - Jenis kejadian  
   - Kondisi saat ini (ada korban? berapa orang?)
   - Nama pelapor (jika sempat)
3. SEGERA gunakan tool logEmergency untuk mencatat laporan darurat
4. SETELAH logEmergency berhasil, LANGSUNG gunakan tool transferCall untuk menyambungkan ke layanan darurat 112
5. Jangan tanyakan detail lain - waktu sangat penting!

PENTING: Urutan harus logEmergency DULU, baru transferCall!

═══════════════════════════════════════════════════════════════════════════════
ATURAN PENTING
═══════════════════════════════════════════════════════════════════════════════

1. JANGAN membuat tiket jika informasi belum lengkap - tanyakan yang kurang
2. PASTIKAN pelapor mengkonfirmasi semua informasi sebelum membuat tiket
3. Untuk masalah DARURAT, tunjukkan sense of urgency dalam nada bicara
4. Jika pelapor emosional atau kesel, tetap tenang dan empati
5. JANGAN memberikan janji waktu penyelesaian yang spesifik - sampaikan bahwa laporan akan ditindaklanjuti sesuai prioritas
6. Jika ada pertanyaan di luar kapasitas, arahkan ke kanal informasi yang tepat
7. FLEKSIBEL dalam menerima deskripsi lokasi - tidak semua orang tahu alamat lengkap
8. Untuk kondisi CRITICAL: (1) gunakan logEmergency untuk catat laporan, (2) langsung gunakan transferCall untuk transfer ke 112

HANDLING KOREKSI DARI USER (PENTING!):
• Jika user bilang "bukan", "salah", "koreksi", "ralat" → langsung minta data yang benar
• Contoh: User bilang "Bukan, namanya Andi bukan Ahmad"
  → Respons: "Mohon maaf, Pak Andi. Sudah saya perbaiki."
• JANGAN defensif, langsung akui dan perbaiki

HANDLING JAWABAN SINGKAT:
• "iya" / "ya" / "betul" / "benar" / "yoi" / "yup" = KONFIRMASI POSITIF
• "ga" / "nggak" / "tidak" / "bukan" / "salah" = KONFIRMASI NEGATIF → tanyakan yang benar
• "ga jadi" / "cancel" / "batal" / "udah deh" = BATALKAN PROSES → konfirmasi pembatalan
• "udah" / "cukup" / "segitu aja" = SELESAI → lanjut ke tahap berikutnya

JIKA TIDAK MENDENGAR JELAS:
• "Maaf, saya kurang jelas mendengar bagian [X]. Bisa diulangi?"
• Jangan minta ulangi SELURUH informasi, hanya bagian yang tidak jelas
• Contoh: "Maaf, nomor teleponnya kurang jelas. Bisa diulangi nomor teleponnya saja?"

HANDLING GANGGUAN/PAUSE:
• Jika user diam lebih dari 5 detik: "Apakah masih di sana? Ada yang bisa saya bantu?"
• Jika user bilang "tunggu sebentar": "Siap, saya tunggu."`
}

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
 * @param customerPhone - Nomor telepon penelepon dari VAPI (opsional)
 * @returns Konfigurasi assistant untuk Vapi
 */
export const getAssistantConfig = (webhookUrl?: string, customerPhone?: string) => {
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
          content: getSystemPrompt(customerPhone),
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
        {
          type: 'function' as const,
          function: {
            name: 'logEmergency',
            description: 'Mencatat laporan darurat CRITICAL ke sistem. Gunakan SEBELUM melakukan transfer panggilan ke 112.',
            parameters: {
              type: 'object' as const,
              properties: {
                emergencyType: {
                  type: 'string' as const,
                  enum: ['KEBAKARAN', 'KECELAKAAN', 'KEJAHATAN', 'MEDIS', 'BENCANA'],
                  description: 'Jenis keadaan darurat',
                },
                location: {
                  type: 'string' as const,
                  description: 'Lokasi kejadian',
                },
                situation: {
                  type: 'string' as const,
                  description: 'Ringkasan situasi dan kondisi korban jika ada',
                },
                reporterName: {
                  type: 'string' as const,
                  description: 'Nama pelapor',
                },
                reporterPhone: {
                  type: 'string' as const,
                  description: 'Nomor telepon pelapor',
                },
              },
              required: ['emergencyType', 'location', 'situation'],
            },
          },
        },
        {
          type: 'transferCall' as const,
          destinations: [
            {
              type: 'number' as const,
              number: EMERGENCY_TRANSFER_NUMBER,
              message: 'Menyambungkan panggilan ke layanan darurat.',
            },
          ],
        },
        {
          type: 'endCall' as const,
          // Native Vapi tool - ends the call gracefully after saying goodbye
        },
      ],
    },

    // =========================================================================
    // Konfigurasi Suara (ElevenLabs)
    // =========================================================================
    // Using eleven_multilingual_v2 for better Indonesian language adherence
    // (eleven_turbo_v2_5 sometimes slips into English accent)
    //
    // ALTERNATIVE VOICE PROVIDERS (all included in VAPI pricing, no extra API keys):
    // 
    // 1. PlayHT - 142 languages including Indonesian
    //    voice: {
    //      provider: 'playht',
    //      voiceId: '<indonesian-voice-id>',  // Find IDs at play.ht/studio
    //    }
    //
    // 2. OpenAI TTS - 50+ languages, consistent quality
    //    voice: {
    //      provider: 'openai',
    //      voiceId: 'alloy',  // Options: alloy, echo, fable, onyx, nova, shimmer
    //    }
    //
    // 3. Cartesia - Ultrafast, realistic (verify Indonesian support)
    //    voice: {
    //      provider: 'cartesia',
    //      voiceId: '<voice-id>',
    //    }
    //
    // 4. Azure - Native Indonesian voices (id-ID-GadisNeural, id-ID-ArdiNeural)
    //    voice: {
    //      provider: 'azure',
    //      voiceId: 'id-ID-GadisNeural',  // Female Indonesian
    //    }
    //    Note: Azure sounds more robotic compared to ElevenLabs
    //
    // =========================================================================
    // Voice: ElevenLabs - Jessica (Premade Voice)
    // Using eleven_multilingual_v2 for best Indonesian pronunciation
    // 
    // Jessica: Soft, expressive female voice - great for conversational AI
    // Voice ID: cgSgspJ2msm6clMCkdW9
    //
    // Voice Settings Optimization for Indonesian (prevent accent slipping):
    // - stability: 0.65 (higher = more consistent pronunciation)
    // - similarity_boost: 0.80 (higher = sticks closer to voice character)  
    // - style: 0.15 (lower = less expressive, more stable accent)
    // - use_speaker_boost: true (improves clarity)
    // - speed: 0.95 (slightly slower for clearer Indonesian pronunciation)
    // =========================================================================
    voice: {
      provider: '11labs' as const,
      voiceId: 'kSzQ9oZF2iytkgNNztpH',
      model: 'eleven_multilingual_v2',
      language: 'id', // Indonesian
      // Voice settings untuk tone profesional dengan variasi natural (medium expressiveness)
      // - stability: 0.55 (turun dari 0.65) - memberikan variasi intonasi yang lebih natural
      // - similarityBoost: 0.75 (turun dari 0.80) - sedikit ruang untuk fleksibilitas
      // - style: 0.30 (naik dari 0.15) - lebih ekspresif tapi tetap profesional, tidak "naik" berlebihan
      // - speed: 0.92 (turun dari 0.95) - lebih tenang dan profesional
      stability: 0.55,
      similarityBoost: 0.75,
      style: 0.30,
      useSpeakerBoost: true,
      speed: 0.92,
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
    silenceTimeoutSeconds: 30, // Auto-end setelah 30 detik silence (dinaikkan dari 12 untuk web call)
    maxDurationSeconds: 600,

    // Konfigurasi Transkripsi
    // Menggunakan Google Gemini untuk akurasi yang lebih baik pada Bahasa Indonesia
    // Google memiliki data training yang lebih banyak untuk bahasa Indonesia
    // Model gemini-2.0-flash adalah model terbaru dengan performa baik
    transcriber: {
      provider: 'google' as const,
      model: 'gemini-2.0-flash' as const,
      language: 'id' as const, // Indonesian
    },

    // Konfigurasi Stop Speaking Plan
    // Makes AI more responsive to short user inputs like "ya", "iya", "betul"
    // Without this, AI may not detect user trying to respond/confirm
    stopSpeakingPlan: {
      numWords: 1,         // Stop AI after user says just 1 word
      voiceSeconds: 0.1,   // Detect user voice very quickly (100ms)
      backoffSeconds: 0.8, // Wait 0.8s before AI resumes speaking
      // Indonesian acknowledgement phrases - these won't trigger interruption
      // but will be recognized as backchanneling (user showing they're listening)
      acknowledgementPhrases: [
        'iya', 'ya', 'oke', 'ok', 'betul', 'benar', 'siap', 'oh', 'ah', 'hmm',
        'bukan', 'tidak', 'ga', 'nggak', 'belum', 'udah', 'sudah', 'yoi', 'yup',
      ],
    },

    // Konfigurasi Start Speaking Plan
    // Controls when AI starts speaking after user stops
    // Using 'vapi' provider for non-English (Indonesian) language support
    startSpeakingPlan: {
      smartEndpointingPlan: {
        provider: 'vapi', // For non-English languages like Indonesian
      },
      transcriptionEndpointingPlan: {
        onPunctuationSeconds: 0.1,    // Quick response after punctuation
        onNoPunctuationSeconds: 1.5,  // Wait longer if no punctuation (user might still be talking)
        onNumberSeconds: 0.5,         // Medium wait after numbers (phone number, address number)
      },
      waitSeconds: 0.4, // Final wait before AI speaks
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
