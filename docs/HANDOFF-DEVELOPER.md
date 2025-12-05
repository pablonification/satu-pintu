# SatuPintu - Developer Handoff Document

**Project**: SatuPintu - AI-Powered Citizen Complaint Call Center  
**Hackathon**: Ekraf Tech Summit 2025  
**Deadline Submission**: 11 Desember 2025  
**Demo Day**: 16-17 Desember 2025  
**Live URL**: https://satupintu-ekraf.vercel.app/

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Current Implementation Status](#current-implementation-status)
3. [Environment Setup](#environment-setup)
4. [Configuration Checklist](#configuration-checklist)
5. [Remaining Tasks by Track](#remaining-tasks-by-track)
6. [Code Reference Guide](#code-reference-guide)
7. [Testing Guide](#testing-guide)
8. [Deployment Guide](#deployment-guide)
9. [Troubleshooting](#troubleshooting)

---

## Project Overview

SatuPintu adalah sistem call center terpadu berbasis AI untuk pengaduan warga Kota Bandung. Warga cukup menelepon satu nomor, AI memahami keluhan dan meneruskan ke dinas terkait dengan tracking otomatis.

### Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 16 (App Router + Turbopack) |
| Database | Supabase PostgreSQL |
| Voice AI | Vapi.ai (Conversational AI Platform) |
| STT/TTS | Deepgram + ElevenLabs (via Vapi) |
| SMS | Twilio |
| Address Validation | Google Maps API + Nominatim (OSM) fallback |
| UI | Tailwind CSS + shadcn/ui |
| Hosting | Vercel |

### Core Features

| Feature | Status | Notes |
|---------|--------|-------|
| Voice AI Call | ✅ Working | Via Vapi.ai |
| Ticket Creation | ✅ Working | Auto-generated SP-YYYYMMDD-XXXX |
| Dashboard | ✅ Working | Filter, search, update status |
| Tracking Page | ✅ Working | Public, SMS tracking |
| GIS Map | ✅ Working | Leaflet markers + heatmap |
| Photo Upload | ✅ Working | Before/after with validation |
| Rating System | ✅ Working | With OTP verification |
| SMS Notification | ✅ Implemented | Perlu Twilio config |
| Address Validation | ✅ Code Ready | **SUDAH DIPANGGIL** |
| Emergency Routing | ✅ Implemented | logEmergency + transferCall |

---

## Current Implementation Status

### What's Done ✅

1. **Voice AI (Vapi.ai)**
   - Transient assistant dengan system prompt lengkap
   - Tools: `createTicket`, `logEmergency`, `transferCall`
   - Webhook handler di `/api/vapi/webhook`

2. **Ticket System**
   - Auto-generate ticket ID (SP-YYYYMMDD-XXXX)
   - Category routing ke dinas terkait
   - Urgency classification (CRITICAL, HIGH, MEDIUM, LOW)
   - Timeline tracking

3. **Dashboard**
   - Stats cards (pending, in_progress, resolved, critical)
   - Table view + Map view (tabs)
   - Filter by status, urgency, search
   - CRITICAL alert banner with sound
   - Photo upload UI (before/after)
   - Export functionality

4. **Tracking Page**
   - Public access via ticket ID
   - Timeline visualization
   - Photo comparison (before/after)
   - Rating form with OTP verification

5. **GIS Map**
   - Leaflet dengan markers
   - Color-coded by urgency
   - Popup dengan ticket details
   - Heatmap layer

6. **SMS Integration**
   - Twilio client configured
   - Templates ready (ticketCreated, statusUpdate, trackingResponse)
   - **SUDAH DIPANGGIL** setelah ticket dibuat

7. **Address Validation**
   - Landmark database (600+ lokasi Bandung)
   - Google Maps Geocoding API
   - Nominatim (OSM) fallback
   - **SUDAH DIPANGGIL** sebelum insert ticket

### What's Missing ❌

1. **SMS Twilio Setup**
   - Nomor Twilio belum dibeli/dikonfigurasi
   - Perlu verifikasi nomor untuk trial

2. **EMERGENCY_TRANSFER_NUMBER**
   - Perlu diisi dengan nomor PIC darurat yang valid

3. **Real Emergency Testing**
   - Transfer ke 112 belum bisa di-test (simulasi saja)

---

## Environment Setup

### 1. Clone & Install

```bash
cd /Users/macbook/Documents/coding/hackathon-ekraf/app
npm install
```

### 2. Environment Variables

Copy `.env.example` ke `.env.local` dan isi:

```env
# ==========================================
# SUPABASE (SUDAH ADA - jangan diubah)
# ==========================================
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ==========================================
# VAPI (SUDAH ADA - jangan diubah)
# ==========================================
VAPI_PRIVATE_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NEXT_PUBLIC_VAPI_PUBLIC_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# ==========================================
# AUTH (SUDAH ADA - jangan diubah)
# ==========================================
JWT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ==========================================
# TWILIO - PERLU DIKONFIGURASI
# ==========================================
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890

# ==========================================
# APP CONFIG - PERLU DIKONFIGURASI
# ==========================================
NEXT_PUBLIC_APP_URL=https://satupintu-ekraf.vercel.app
EMERGENCY_TRANSFER_NUMBER=+628123456789

# ==========================================
# GOOGLE MAPS (OPTIONAL - ada fallback)
# ==========================================
GOOGLE_MAPS_API_KEY=AIzaSy...
```

### 3. Run Development Server

```bash
npm run dev
```

Buka http://localhost:3000

### 4. Demo Login

| ID | Password | Role |
|----|----------|------|
| admin | demo2025 | All tickets |
| pupr | demo2025 | Infrastruktur |
| dlh | demo2025 | Kebersihan |
| dinsos | demo2025 | Sosial |

---

## Configuration Checklist

### A. Twilio Setup (15 menit)

1. ⬜ Daftar di [twilio.com/try-twilio](https://www.twilio.com/try-twilio) (gratis $15)
2. ⬜ Ambil credentials dari Console:
   - Account SID
   - Auth Token
3. ⬜ Buy/Get nomor telepon (US number gratis di trial)
4. ⬜ **PENTING**: Verify nomor HP untuk testing
   - Twilio Console → Phone Numbers → Verified Caller IDs
   - Tambahkan nomor yang akan dipakai demo
   - Trial HANYA bisa kirim SMS ke nomor yang di-verify!
5. ⬜ Update `.env.local`:
   ```env
   TWILIO_ACCOUNT_SID=ACxxxxx
   TWILIO_AUTH_TOKEN=xxxxx
   TWILIO_PHONE_NUMBER=+1xxxxx
   ```

### B. Supabase Storage Bucket (10 menit)

Bucket untuk foto tiket sudah dibuat, tapi perlu dicek:

1. ⬜ Buka Supabase Dashboard → Storage
2. ⬜ Pastikan bucket `ticket-photos` ada
3. ⬜ Pastikan bucket public (untuk display di tracking page)
4. ⬜ Cek policies sudah ada:

```sql
-- Policy: Anyone can view ticket photos
CREATE POLICY "Public can view ticket photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'ticket-photos');

-- Policy: Authenticated users can upload
CREATE POLICY "Authenticated users can upload photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'ticket-photos');
```

### C. Database Schema (5 menit)

Kolom-kolom yang dibutuhkan sudah ada di migrations. Jika ada error, run manual:

```sql
-- Cek kolom yang perlu ada di tabel tickets
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tickets';

-- Jika ada yang kurang, tambahkan:
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS validated_address TEXT,
ADD COLUMN IF NOT EXISTS address_lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS address_lng DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS resolution_photo_before TEXT,
ADD COLUMN IF NOT EXISTS resolution_photo_after TEXT,
ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5),
ADD COLUMN IF NOT EXISTS feedback TEXT,
ADD COLUMN IF NOT EXISTS rated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rating_otp TEXT,
ADD COLUMN IF NOT EXISTS rating_otp_expires_at TIMESTAMPTZ;
```

### D. Vercel Environment Variables (5 menit)

1. ⬜ Buka Vercel Dashboard → Project → Settings → Environment Variables
2. ⬜ Tambahkan/update:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_PHONE_NUMBER`
   - `EMERGENCY_TRANSFER_NUMBER`
3. ⬜ Redeploy untuk apply changes

---

## Remaining Tasks by Track

### TRACK A: SMS Notification (DONE ✅)

**Status**: Sudah diimplementasi di webhook

**File**: `app/src/app/api/vapi/webhook/route.ts` (line 376-385)

```typescript
// Send SMS notification (wrapped in try-catch so it doesn't break ticket creation)
try {
  const trackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/track/${ticketId}`
  const smsMessage = SMS_TEMPLATES.ticketCreated(ticketId, category, trackUrl)
  await sendSmsNotification(finalPhone, smsMessage)
  console.log('SMS notification sent to:', finalPhone)
} catch (smsError) {
  console.error('Failed to send SMS notification:', smsError)
  // Continue without SMS - don't fail the ticket creation
}
```

**Yang perlu dilakukan**:
- ⬜ Setup Twilio account & credentials (lihat Section A)
- ⬜ Test SMS terkirim

---

### TRACK B: Photo Upload + Rating (DONE ✅)

**Status**: Fully implemented

**Files**:
- Dashboard upload: `app/src/app/(dashboard)/dashboard/page.tsx` (line 1002-1121)
- Tracking display: `app/src/app/(public)/track/[ticketId]/page.tsx` (line 492-546)
- Rating API: `app/src/app/api/tickets/[id]/rate/route.ts`
- OTP API: `app/src/app/api/tickets/[id]/request-otp/route.ts`

**Flow**:
1. PENDING → IN_PROGRESS: Wajib upload **Foto Sebelum**
2. IN_PROGRESS → RESOLVED: Wajib upload **Foto Sesudah**
3. Tracking page: Tampilkan foto + rating form (dengan OTP)

**Yang perlu dilakukan**:
- ⬜ Pastikan Supabase Storage bucket sudah setup (lihat Section B)
- ⬜ Test photo upload flow

---

### TRACK C: GIS Map/Heatmap (DONE ✅)

**Status**: Fully implemented

**Files**:
- Component: `app/src/components/HeatmapView.tsx`
- API: `app/src/app/api/tickets/map/route.ts`
- Dashboard integration: Tab "Peta" di dashboard

**Features**:
- Markers dengan warna berdasarkan urgency
- Popup dengan ticket details
- Filter by status, urgency
- Heatmap layer untuk density

**Yang perlu dilakukan**:
- ⬜ Test map dengan data yang ada koordinat

---

### TRACK D: Emergency Routing (DONE ✅)

**Status**: Implemented, perlu real testing

**Files**:
- System prompt: `app/src/lib/vapi.ts` (line 247-281)
- logEmergency tool: `app/src/lib/vapi.ts` (line 370-403)
- transferCall tool: `app/src/lib/vapi.ts` (line 404-414)
- Webhook handler: `app/src/app/api/vapi/webhook/route.ts` (line 400-481)
- Dashboard alert: `app/src/app/(dashboard)/dashboard/page.tsx` (line 576-624)

**Flow**:
1. User bilang "Ada kebakaran!"
2. AI detect CRITICAL → panggil `logEmergency`
3. Ticket dibuat dengan urgency=CRITICAL
4. AI panggil `transferCall` ke EMERGENCY_TRANSFER_NUMBER
5. Dashboard tampilkan alert + sound

**Yang perlu dilakukan**:
- ⬜ Set `EMERGENCY_TRANSFER_NUMBER` di env
- ⬜ Test flow (untuk demo, transfer ke nomor PIC internal)

---

## Code Reference Guide

### Key Files

| Purpose | File | Notes |
|---------|------|-------|
| Vapi Config | `src/lib/vapi.ts` | System prompt, tools |
| Webhook Handler | `src/app/api/vapi/webhook/route.ts` | createTicket, logEmergency |
| SMS | `src/lib/twilio.ts` | sendSmsNotification, templates |
| Address Validation | `src/lib/address-validation.ts` | validateAddressEnhanced |
| Dashboard | `src/app/(dashboard)/dashboard/page.tsx` | Photo upload, alerts |
| Tracking | `src/app/(public)/track/[ticketId]/page.tsx` | Rating, photos |
| Map Component | `src/components/HeatmapView.tsx` | Leaflet map |
| Types | `src/types/database.ts` | Status, Category, Urgency |

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/vapi/webhook` | POST | Vapi function calls |
| `/api/tickets` | GET | List tickets (auth) |
| `/api/tickets/[id]` | GET/PATCH | Ticket detail/update |
| `/api/tickets/map` | GET | Tickets with coordinates |
| `/api/tickets/[id]/rate` | POST | Submit rating |
| `/api/tickets/[id]/request-otp` | POST | Request OTP for rating |
| `/api/track/[ticketId]` | GET | Public tracking |
| `/api/stats` | GET | Dashboard statistics |
| `/api/auth/login` | POST | Login |
| `/api/auth/logout` | POST | Logout |
| `/api/auth/me` | GET | Current user |

### SMS Templates (lib/twilio.ts)

```typescript
SMS_TEMPLATES.ticketCreated(ticketId, category, trackUrl)
// "[SatuPintu] Laporan Anda diterima.
//  No. Tiket: SP-20251204-0001
//  Kategori: INFRASTRUKTUR
//  Cek status: https://satupintu.vercel.app/track/SP-20251204-0001"

SMS_TEMPLATES.statusUpdate(ticketId, status, note?)
// "[SatuPintu] Update SP-20251204-0001
//  Status: DALAM PROSES
//  Keterangan: Sedang ditangani petugas"

SMS_TEMPLATES.ratingOTP(otp, ticketId)
// "[SatuPintu] Kode OTP untuk rating tiket SP-xxx: 123456. Berlaku 30 menit."
```

---

## Testing Guide

### Manual Test Cases

#### A. Voice Call Flow

1. Buka `/test-call`
2. Klik "Mulai Panggilan"
3. Laporkan: "Saya mau melaporkan jalan rusak di Jalan Dago nomor 50"
4. Sebutkan nama dan nomor HP
5. **Expected**:
   - ✓ Ticket dibuat di database
   - ✓ Voice AI menyebutkan nomor ticket
   - ✓ SMS terkirim ke nomor HP (jika Twilio configured)

#### B. Emergency Flow

1. Buka `/test-call`
2. Bilang: "Ada kebakaran di dekat PVJ!"
3. **Expected**:
   - ✓ AI detect CRITICAL
   - ✓ Ticket dibuat dengan urgency=CRITICAL
   - ✓ Transfer attempted (ke EMERGENCY_TRANSFER_NUMBER)
   - ✓ Dashboard alert muncul

#### C. Photo Upload Flow

1. Login dashboard
2. Pilih ticket PENDING
3. Ubah status ke IN_PROGRESS
4. **Expected**: Modal minta foto SEBELUM (wajib)
5. Upload foto, simpan
6. Ubah status ke RESOLVED
7. **Expected**: Modal minta foto SESUDAH (wajib)
8. Upload foto, simpan

#### D. Rating Flow

1. Buka `/track/[ticketId]` untuk ticket RESOLVED
2. Klik "Minta Kode OTP"
3. **Expected**: SMS dengan OTP terkirim
4. Masukkan OTP, pilih rating, submit
5. **Expected**: Rating tersimpan

#### E. Map View

1. Login dashboard
2. Klik tab "Peta"
3. **Expected**:
   - ✓ Peta Bandung muncul
   - ✓ Markers sesuai lokasi tiket
   - ✓ Warna sesuai urgency
   - ✓ Popup dengan details

### Automated Test (curl)

```bash
# Test webhook - createTicket
curl -X POST http://localhost:3000/api/vapi/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "type": "tool-calls",
      "toolCallList": [{
        "id": "test-001",
        "name": "createTicket",
        "parameters": {
          "category": "INFRA",
          "description": "Jalan berlubang besar",
          "reporterName": "Budi Test",
          "reporterPhone": "08123456789",
          "address": "Jl. Dago No. 50, dekat ITB",
          "urgency": "HIGH"
        }
      }]
    }
  }'

# Test webhook - logEmergency
curl -X POST http://localhost:3000/api/vapi/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "type": "tool-calls",
      "toolCallList": [{
        "id": "test-002",
        "name": "logEmergency",
        "parameters": {
          "emergencyType": "KEBAKARAN",
          "location": "Dekat PVJ Sukajadi",
          "situation": "Api besar dari gedung"
        }
      }]
    }
  }'

# Test map API
curl "http://localhost:3000/api/tickets/map?status=PENDING"

# Test stats
curl "http://localhost:3000/api/stats"
```

---

## Deployment Guide

### Pre-Deploy Checklist

```bash
cd app

# 1. Check TypeScript errors
npm run lint

# 2. Build locally
npm run build

# 3. Test locally
npm run start
```

### Deploy to Vercel

```bash
# Option 1: Via CLI
vercel --prod

# Option 2: Via Git push (auto-deploy)
git add .
git commit -m "Deploy: [description]"
git push origin main
```

### Post-Deploy Checklist

1. ⬜ Vercel build success
2. ⬜ Check environment variables di Vercel
3. ⬜ Test production URL
4. ⬜ Test voice call dengan webhook production
5. ⬜ Test SMS (jika Twilio configured)

---

## Troubleshooting

### "Twilio not configured, skipping SMS"

**Cause**: Environment variables Twilio tidak set  
**Solution**: Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`

### "SMS failed: Unverified number"

**Cause**: Twilio trial hanya bisa kirim ke nomor verified  
**Solution**: Verify nomor di Twilio Console → Phone Numbers → Verified Caller IDs

### "Address validation failed, using original"

**Cause**: Google Maps API tidak aktif/quota habis  
**Solution**: Tidak masalah, fallback ke Nominatim atau alamat asli tetap disimpan

### "Tidak ada data lokasi" di Map

**Cause**: Ticket tidak punya koordinat lat/lng  
**Solution**: Address validation sudah dipanggil, koordinat akan terisi untuk ticket baru

### "Photo upload failed"

**Cause**: Supabase Storage bucket belum setup  
**Solution**: 
1. Buat bucket `ticket-photos` di Supabase Storage
2. Set bucket ke public
3. Tambahkan policies untuk read/write

### Vapi webhook tidak dipanggil

**Cause**: serverMessages tidak dikonfigurasi  
**Solution**: Sudah fixed di `lib/vapi.ts` dengan:
```typescript
serverMessages: ['tool-calls', 'status-update', 'end-of-call-report']
```

### Dashboard tidak load tickets

**Cause**: Auth cookie expired  
**Solution**: Login ulang di `/login`

---

## Quick Commands

```bash
# Development
cd app
npm run dev

# Build
npm run build

# Lint
npm run lint

# Deploy
vercel --prod

# Database migration (via Supabase SQL Editor)
# Copy content dari supabase/migrations/*.sql
```

---

## Contacts & Resources

- **Supabase Dashboard**: [supabase.com/dashboard](https://supabase.com/dashboard)
- **Vapi Dashboard**: [vapi.ai/dashboard](https://vapi.ai/dashboard)
- **Twilio Console**: [console.twilio.com](https://console.twilio.com)
- **Vercel Dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)

---

## Summary: Yang Harus Dilakukan

### Priority 1: Configuration (30 menit)

1. ⬜ Setup Twilio account & verify nomor demo
2. ⬜ Set environment variables di local & Vercel
3. ⬜ Test SMS terkirim

### Priority 2: Testing (30 menit)

1. ⬜ Test voice call flow end-to-end
2. ⬜ Test photo upload flow
3. ⬜ Test emergency flow
4. ⬜ Test map view

### Priority 3: Demo Preparation (30 menit)

1. ⬜ Buat beberapa sample tickets untuk demo
2. ⬜ Siapkan skenario demo:
   - Normal complaint
   - Emergency complaint
   - Status update dengan foto
   - Rating submission

---

**Good luck! 🚀**

---

*Last updated: December 5, 2025*
