# Task List untuk Farrel (Second Dev)

**Project**: SatuPintu - AI-Powered Citizen Complaint Call Center  
**Deadline Submission**: 11 Desember 2025  
**Demo Day**: 16-17 Desember 2025

---

## Overview

SatuPintu sudah ~85% selesai. Voice AI, ticket system, dashboard, dan tracking page sudah jalan. Yang tersisa adalah:

1. SMS Notification setelah ticket dibuat (via Twilio)
2. Address validation integration (via Google Maps API)
3. Deploy ke Vercel
4. Testing E2E

---

## Current Codebase Status

```
/Users/macbook/Documents/coding/hackathon-ekraf/
├── app/                    # Next.js app (main codebase)
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   ├── vapi/webhook/    # Vapi voice AI webhook
│   │   │   │   ├── tickets/         # Ticket CRUD API
│   │   │   │   ├── track/           # Public tracking API
│   │   │   │   └── ...
│   │   │   ├── (dashboard)/         # Operator dashboard
│   │   │   ├── (public)/track/      # Citizen tracking page
│   │   │   ├── test-call/           # Voice AI test page
│   │   │   └── login/               # Operator login
│   │   ├── lib/
│   │   │   ├── vapi.ts              # Vapi configuration
│   │   │   ├── twilio.ts            # Twilio SMS (READY, not called)
│   │   │   ├── address-validation.ts # Address validation (READY, not used)
│   │   │   └── supabase.ts          # Database client
│   │   └── types/
│   └── .env                         # Environment variables
└── docs/                            # Documentation
```

---

## Task 1: Setup Twilio Account & Credentials

**Priority**: 🔴 HIGH  
**Effort**: 15 menit  

### Steps:

1. Daftar di [twilio.com/try-twilio](https://www.twilio.com/try-twilio) (gratis, dapat $15 credit)

2. Setelah login, ambil credentials dari Console Dashboard:
   - **Account SID**: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **Auth Token**: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **Phone Number**: Dapat nomor trial gratis (biasanya +1 US number)

3. **PENTING** - Verify nomor HP untuk testing:
   - Twilio Console → Phone Numbers → Verified Caller IDs
   - Tambahkan nomor HP yang akan dipakai saat demo
   - Twilio trial hanya bisa kirim SMS ke nomor yang sudah di-verify!

4. Update `.env` di folder `app/`:
   ```env
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_PHONE_NUMBER=+1234567890
   ```

5. Test apakah bisa kirim SMS:
   ```bash
   # Jalankan app lalu test endpoint (atau buat test script)
   curl -X POST http://localhost:3000/api/test-sms \
     -H "Content-Type: application/json" \
     -d '{"to": "+628123456789", "message": "Test from SatuPintu"}'
   ```

### Notes:
- Trial account ada watermark: "Sent from a Twilio trial account"
- Credit $15 cukup untuk ~30 SMS ke Indonesia (~$0.50/SMS dengan trial rate)

---

## Task 2: Implement SMS Notification di Webhook

**Priority**: 🔴 HIGH  
**Effort**: 10 menit  
**File**: `app/src/app/api/vapi/webhook/route.ts`

### Problem:
Code sudah import `sendSmsNotification` dan `SMS_TEMPLATES` tapi **tidak pernah dipanggil** setelah ticket dibuat!

```typescript
// Line 6 - Import sudah ada:
import { sendSmsNotification, SMS_TEMPLATES } from '@/lib/twilio'

// Tapi di dalam case 'createTicket' (line ~290-375), tidak ada panggilan SMS!
```

### Solution:

Tambahkan code berikut di `case 'createTicket'` setelah timeline berhasil disimpan (sekitar line 362, setelah `await supabaseAdmin.from('ticket_timeline').insert(...)`):

```typescript
// === SEND SMS NOTIFICATION ===
const trackUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://satupintu.vercel.app'}/track/${ticketId}`
const smsMessage = SMS_TEMPLATES.ticketCreated(ticketId, category, trackUrl)

try {
  const smsSid = await sendSmsNotification(finalPhone, smsMessage)
  if (smsSid) {
    console.log('✓ SMS sent successfully:', smsSid)
  } else {
    console.log('⚠ SMS skipped (Twilio not configured)')
  }
} catch (smsError) {
  console.error('✗ SMS failed:', smsError)
  // Don't fail the whole request if SMS fails
}
```

### Test:
1. Jalankan app: `npm run dev`
2. Buka `/test-call` page
3. Lakukan test call, buat laporan
4. Cek apakah SMS terkirim ke nomor yang di-verify

---

## Task 3: Implement Address Validation (Optional)

**Priority**: 🟡 MEDIUM  
**Effort**: 15 menit  
**File**: `app/src/app/api/vapi/webhook/route.ts`

### Problem:
`validateAddressEnhanced` sudah di-import tapi tidak dipakai. Alamat langsung disimpan tanpa validasi/geocoding.

### Current Code (line ~335):
```typescript
validated_address: address,  // Langsung pakai input
address_lat: null,           // Tidak ada koordinat
address_lng: null,
```

### Solution:

Di dalam `case 'createTicket'`, sebelum insert ke database, tambahkan:

```typescript
// === VALIDATE ADDRESS ===
let validatedAddress = address
let addressLat: number | null = null
let addressLng: number | null = null

try {
  const validation = await validateAddressEnhanced(address)
  if (validation.isValid && validation.isInCoverage) {
    validatedAddress = validation.formattedAddress || address
    addressLat = validation.lat
    addressLng = validation.lng
    console.log('✓ Address validated:', validatedAddress)
  } else {
    console.log('⚠ Address validation warning:', validation.message)
    // Still proceed with original address
  }
} catch (validationError) {
  console.error('✗ Address validation failed:', validationError)
  // Continue with original address
}
```

Lalu update insert statement:
```typescript
validated_address: validatedAddress,
address_lat: addressLat,
address_lng: addressLng,
```

### Notes:
- Address validation pakai Google Maps API (jika ada key) atau fallback ke Nominatim (OSM)
- Landmark database Bandung sudah ada di `address-validation.ts` (bisa cari cara lain yg lebih ok)
- Kalau tidak ada `GOOGLE_MAPS_API_KEY`, akan otomatis pakai Nominatim (gratis)

---

## Task 4: Deploy ke Vercel

**Priority**: 🔴 HIGH  
**Effort**: 15 menit  

### Steps:

1. Install Vercel CLI (jika belum):
   ```bash
   npm i -g vercel
   ```

2. Login:
   ```bash
   vercel login
   ```

3. Deploy dari folder `app/`:
   ```bash
   cd app
   vercel
   ```

4. Set environment variables di Vercel Dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `VAPI_PRIVATE_KEY`
   - `NEXT_PUBLIC_VAPI_PUBLIC_KEY`
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_PHONE_NUMBER`
   - `JWT_SECRET`
   - `NEXT_PUBLIC_APP_URL` (set ke URL Vercel setelah deploy)

5. Update Vapi webhook URL:
   - Buka `src/lib/vapi.ts`
   - Ganti `serverUrl` dari ngrok ke Vercel URL
   - Atau set via environment variable

6. Redeploy:
   ```bash
   vercel --prod
   ```

### Notes:
- Free tier Vercel cukup untuk demo
- Serverless functions ada timeout 10 detik (cukup untuk use case ini)

---

## Task 5: Update Vapi Webhook URL untuk Production

**Priority**: 🔴 HIGH  
**Effort**: 5 menit  
**File**: `app/src/lib/vapi.ts`

### Problem:
Saat ini webhook URL mungkin masih pakai ngrok (temporary URL).

### Solution:

Update `server.url` di `getAssistantConfig()`:

```typescript
// Ganti dari:
server: {
  url: 'https://xxxxx.ngrok-free.app/api/vapi/webhook',
  timeoutSeconds: 30,
},

// Ke:
server: {
  url: process.env.NEXT_PUBLIC_APP_URL 
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/vapi/webhook`
    : 'http://localhost:3000/api/vapi/webhook',
  timeoutSeconds: 30,
},
```

Lalu pastikan `NEXT_PUBLIC_APP_URL` di-set di Vercel.

---

## Task 6: Testing E2E

**Priority**: 🔴 HIGH  
**Effort**: 30 menit  

### Test Scenarios:

#### A. Voice Call Flow
1. Buka `/test-call`
2. Klik "Mulai Panggilan"
3. Laporkan: "Saya mau melaporkan jalan rusak di Jalan Dago nomor 50"
4. Sebutkan nama dan nomor HP
5. **Expected**:
   - Ticket dibuat di database ✓
   - Voice AI menyebutkan nomor ticket ✓
   - SMS terkirim ke nomor HP (yang sudah di-verify) ✓

#### B. Tracking Page
1. Buka `/track/[ticketId]` (pakai ticket ID dari test sebelumnya)
2. **Expected**:
   - Status ticket muncul ✓
   - Timeline muncul ✓
   - Info dinas yang ditugaskan muncul ✓

#### C. Operator Dashboard
1. Login di `/login` (credentials di Supabase)
2. **Expected**:
   - List tickets muncul ✓
   - Bisa filter by status ✓
   - Bisa update status ticket ✓
   - SMS terkirim ke pelapor saat status diupdate (jika toggle aktif) ✓

#### D. SMS Notification
1. Pastikan nomor HP sudah di-verify di Twilio
2. Buat ticket via voice call
3. **Expected**:
   - SMS diterima dengan format:
     ```
     [SatuPintu] Laporan Anda diterima.
     
     No. Tiket: SP-20251204-XXXX
     Kategori: INFRASTRUKTUR
     
     Cek status: https://satupintu.vercel.app/track/SP-20251204-XXXX
     ```

---

## Environment Variables Reference

File: `app/.env`

```env
# Supabase (SUDAH ADA)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Vapi (SUDAH ADA)
VAPI_PRIVATE_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NEXT_PUBLIC_VAPI_PUBLIC_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Auth (SUDAH ADA)
JWT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Twilio (PERLU DIISI)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890

# App URL (PERLU DIISI setelah deploy)
NEXT_PUBLIC_APP_URL=https://satupintu.vercel.app

# Google Maps (OPTIONAL - ada fallback ke Nominatim)
GOOGLE_MAPS_API_KEY=AIzaSy...
```

---

## Files yang Perlu Dimodifikasi

| File | Perubahan |
|------|-----------|
| `app/.env` | Tambah Twilio credentials + APP_URL |
| `app/src/app/api/vapi/webhook/route.ts` | Tambah SMS notification (~15 baris) |
| `app/src/lib/vapi.ts` | Update webhook URL ke production |

---

## Quick Commands

```bash
# Masuk ke folder app
cd app

# Install dependencies (jika belum)
npm install

# Run development server
npm run dev

# Build untuk production
npm run build

# Deploy ke Vercel
vercel --prod

# Check TypeScript errors
npm run lint
```

---

## Contact

Kalau ada pertanyaan atau stuck:
- Cek VAPI_INTEGRATION_NOTES.md untuk detail tentang Vapi
- Cek docs/ folder untuk PRD, API contract, dll
- Tanya ke tim

---

**Good luck Farrel!** 🚀
