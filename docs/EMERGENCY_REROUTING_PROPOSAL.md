# Proposal: Hybrid Emergency Rerouting ke 112

> **Status**: Draft - Untuk Diskusi  
> **Tanggal**: 4 Desember 2025  
> **Fitur**: Transfer panggilan darurat (DARURAT) ke layanan 112

---

## Ringkasan

Menambahkan kemampuan **warm transfer** pada SatuPintu sehingga ketika AI mendeteksi **keadaan darurat CRITICAL**, sistem akan:

1. Membuat tiket terlebih dahulu (untuk dokumentasi)
2. Melakukan warm transfer ke **112** (nomor darurat terpadu Bandung)
3. AI memberikan konteks situasi ke operator 112 sebelum menyambungkan pelapor

---

## Latar Belakang

### Masalah Saat Ini
- SatuPintu hanya mencatat laporan dan meneruskan ke dinas terkait
- Untuk keadaan darurat CRITICAL (kebakaran, kecelakaan, kejahatan), proses ini terlalu lambat
- Pelapor harus menutup telepon dan menghubungi 112 secara manual

### Solusi yang Diusulkan
- AI secara otomatis menilai tingkat keparahan situasi
- Jika CRITICAL, AI akan langsung menghubungkan pelapor ke 112
- Tiket tetap dibuat untuk dokumentasi dan tracking

---

## Alur Proses

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        ALUR TRANSFER DARURAT                            │
└─────────────────────────────────────────────────────────────────────────┘

    Pelapor                    SatuPintu AI                    112
       │                            │                           │
       │  "Ada kebakaran di..."     │                           │
       │ ────────────────────────>  │                           │
       │                            │                           │
       │                   [Assess: CRITICAL]                   │
       │                            │                           │
       │                   [Kumpulkan info minimum]             │
       │                     - Lokasi                           │
       │                     - Jenis darurat                    │
       │                     - Kondisi saat ini                 │
       │                            │                           │
       │                   [Buat tiket untuk dokumentasi]       │
       │                            │                           │
       │  "Saya akan hubungkan      │                           │
       │   ke 112..."               │                           │
       │ <────────────────────────  │                           │
       │                            │                           │
       │                            │    [Warm Transfer]        │
       │                            │ ────────────────────────> │
       │                            │                           │
       │                            │  "Laporan darurat dari    │
       │                            │   SatuPintu: kebakaran    │
       │                            │   di Jl. Dago..."         │
       │                            │ ────────────────────────> │
       │                            │                           │
       │                            │    [Transfer berhasil]    │
       │                            │ <──────────────────────── │
       │                            │                           │
       │  [Terhubung langsung]      │    [AI disconnect]        │
       │ <──────────────────────────────────────────────────────│
       │                                                        │
       │  [Percakapan dengan operator 112]                      │
       │ <─────────────────────────────────────────────────────>│
```

---

## Kriteria Transfer ke 112

### HARUS Transfer (Situasi CRITICAL)

| Jenis | Contoh Situasi | Indikator Kata Kunci |
|-------|----------------|---------------------|
| Kebakaran | Api aktif, asap tebal | "ada api", "terbakar", "asap", "kebakaran" |
| Kecelakaan | Ada korban terluka/pingsan | "kecelakaan", "tertabrak", "korban", "berdarah" |
| Kejahatan | Sedang berlangsung | "perampok", "dirampok", "diancam", "tolong" |
| Medis | Tidak sadarkan diri, serangan jantung | "pingsan", "tidak sadar", "sesak napas", "kejang" |
| Bencana | Banjir masuk rumah, longsor | "banjir", "longsor", "gempa", "terjebak" |

### TIDAK Perlu Transfer (Buat Tiket Saja)

| Situasi | Alasan |
|---------|--------|
| Kejadian sudah selesai | Tidak memerlukan respons segera |
| Potensi bahaya (belum terjadi) | Cukup dilaporkan untuk ditindaklanjuti |
| Laporan infrastruktur | Bukan keadaan darurat |
| Masalah sosial non-urgent | Ditangani oleh dinas sosial |

---

## Spesifikasi Teknis

### 1. Tool Vapi: `transferCall`

```typescript
{
  type: 'transferCall',
  destinations: [
    {
      type: 'number',
      number: '+62112', // Format perlu diverifikasi
      transferPlan: {
        mode: 'warm-transfer-experimental',
        message: 'Laporan darurat dari SatuPintu Bandung. ' +
                 'Jenis: {{emergencyType}}. ' +
                 'Lokasi: {{location}}. ' +
                 'Situasi: {{emergencySummary}}',
      }
    }
  ],
  function: {
    name: 'transferEmergency',
    description: 'Transfer panggilan darurat ke 112',
    parameters: {
      type: 'object',
      properties: {
        emergencySummary: { type: 'string' },
        location: { type: 'string' },
        emergencyType: { 
          type: 'string',
          enum: ['KEBAKARAN', 'KECELAKAAN', 'KEJAHATAN', 'MEDIS', 'BENCANA', 'LAINNYA']
        }
      },
      required: ['emergencySummary', 'location', 'emergencyType']
    }
  },
  messages: [
    { 
      type: 'request-start', 
      content: 'Baik, saya akan menghubungkan Anda langsung ke layanan darurat 112. Mohon tunggu sebentar...' 
    },
    { 
      type: 'request-complete', 
      content: 'Anda telah terhubung dengan operator 112.' 
    },
    { 
      type: 'request-failed', 
      content: 'Maaf, tidak dapat terhubung ke 112 saat ini. Mohon hubungi langsung 112 dari ponsel Anda. Laporan Anda sudah tercatat di sistem kami.' 
    }
  ]
}
```

### 2. Update System Prompt

Tambahkan instruksi untuk AI kapan harus trigger transfer dan kapan cukup buat tiket saja.

### 3. Webhook Handler

Handle event:
- `transfer-destination-request` - untuk routing dinamis (jika diperlukan)
- `status-update` dengan status `transfer-started`, `transfer-completed`, `transfer-failed`
- Update status tiket berdasarkan hasil transfer

---

## Persyaratan

### Wajib Ada Sebelum Implementasi

| Item | Status | Keterangan |
|------|--------|------------|
| Twilio Phone Number | ❓ Pending | Warm transfer HANYA bisa dengan nomor Twilio |
| Format nomor 112 | ❓ Perlu verifikasi | `112` atau `+62112`? |
| Verifikasi 112 menerima transfer | ❓ Perlu tes | Apakah 112 bisa menerima incoming dari Twilio? |

### Opsional

| Item | Keterangan |
|------|------------|
| Hold music | Audio custom saat menunggu transfer |
| Fallback numbers | Nomor alternatif jika 112 tidak tersedia |

---

## Pertanyaan Terbuka

### 1. Format Nomor 112
- Bagaimana format yang benar untuk dial 112 dari Twilio Indonesia?
- Apakah perlu prefix khusus?

### 2. Kompatibilitas 112
- Apakah layanan 112 Bandung menerima incoming call dari nomor Twilio?
- Apakah ada registrasi yang diperlukan?

### 3. Fallback Scenario
Jika 112 tidak menjawab setelah beberapa kali retry:
- **Opsi A**: Akhiri panggilan, minta pelapor hubungi 112 langsung
- **Opsi B**: Tetap di line, berikan nomor alternatif (110 Polisi, 113 Damkar, 119 Ambulans)
- **Opsi C**: Transfer ke operator manusia SatuPintu (jika ada)

### 4. Testing Strategy
- Bagaimana cara test fitur ini sebelum live?
- Apakah bisa test dengan nomor lain dulu?

### 5. Legal/Compliance
- Apakah ada regulasi tentang transfer otomatis ke layanan darurat?
- Perlu koordinasi dengan Pemkot Bandung?

---

## Estimasi Effort

| Task | Waktu |
|------|-------|
| Implementasi kode | 2-3 jam |
| Testing dengan nomor dummy | 1 jam |
| Setup Twilio number | 30 menit |
| Testing dengan 112 (jika diizinkan) | 1 jam |
| **Total** | **4-5.5 jam** |

---

## Risiko

| Risiko | Dampak | Mitigasi |
|--------|--------|----------|
| 112 tidak menerima transfer | Fitur tidak berfungsi | Test terlebih dahulu, siapkan fallback |
| False positive (transfer untuk kasus non-critical) | Membebani 112 | Perbaiki prompt AI, tambah konfirmasi |
| Transfer gagal | Pelapor tidak tertolong | Berikan instruksi jelas untuk hubungi 112 langsung |
| Latency tinggi | Delay dalam situasi darurat | Optimalkan proses, skip step yang tidak perlu |

---

## Alternatif Solusi

### Alternatif 1: Tanpa Transfer (Current State + Enhancement)
- AI hanya membuat tiket dengan prioritas CRITICAL
- Kirim notifikasi real-time ke dashboard operator
- Operator manusia yang menghubungi 112

**Pro**: Lebih aman, tidak ada risiko teknis  
**Con**: Lebih lambat, membutuhkan operator 24/7

### Alternatif 2: Blind Transfer (Lebih Simple)
- Transfer langsung tanpa warm transfer
- AI tidak memberikan konteks ke 112

**Pro**: Lebih simple, lebih cepat  
**Con**: Operator 112 tidak punya konteks

### Alternatif 3: Three-Way Call
- AI tetap di line bersama pelapor dan 112
- Bisa memberikan konteks real-time

**Pro**: Pengalaman terbaik  
**Con**: Vapi tidak support fitur ini saat ini

---

## Rekomendasi

**Implementasi bertahap:**

1. **Phase 1 (Sekarang)**: 
   - Enhance tiket DARURAT dengan notifikasi real-time
   - Tambah instruksi di AI untuk mengarahkan ke 112 jika urgent

2. **Phase 2 (Setelah Hackathon)**:
   - Setup Twilio number
   - Implementasi warm transfer
   - Testing dengan koordinasi 112 Bandung

---

## Referensi

- [Vapi Transfer Call Documentation](https://docs.vapi.ai/tools/call-transfer)
- [Twilio Indonesia Emergency Numbers](https://www.twilio.com/docs/voice/emergency-dialing)
- Nomor Darurat Indonesia: 112 (Terpadu), 110 (Polisi), 113 (Damkar), 119 (Ambulans)

---

## Catatan Meeting/Diskusi

_Tambahkan catatan diskusi di sini..._

---

**Dibuat oleh**: AI Assistant  
**Review oleh**: _Pending_  
**Approved oleh**: _Pending_
