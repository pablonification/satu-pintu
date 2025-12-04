# SatuPintu

**Satu Pintu untuk Semua Keluhan Kota**

AI-powered centralized call center untuk smart city. Warga cukup menelepon satu nomor, AI memahami keluhan dan meneruskan ke dinas terkait dengan tracking otomatis.

## Tech Stack

- **Framework**: Next.js 16 (App Router + Turbopack)
- **Database**: Supabase PostgreSQL
- **Voice AI**: Vapi.ai (Conversational AI Platform)
- **STT/TTS**: Deepgram + ElevenLabs (via Vapi)
- **Address Validation**: Nominatim (OpenStreetMap) + Gemini fallback
- **SMS**: Twilio SMS (optional)
- **UI**: Tailwind CSS + shadcn/ui
- **Hosting**: Vercel

## Quick Start

### 1. Install dependencies

```bash
cd app
npm install
```

### 2. Setup Supabase (Database) - GRATIS

1. Buka [supabase.com](https://supabase.com) dan buat akun/login
2. Klik **New Project** → pilih region **Singapore** (terdekat ke Indonesia)
3. Tunggu project selesai dibuat (~2 menit)
4. Buka **Project Settings** → **API** dan catat:
   - `Project URL` → untuk `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → untuk `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → untuk `SUPABASE_SERVICE_ROLE_KEY`
5. Buka **SQL Editor** → klik **New Query**
6. Copy-paste seluruh isi file `supabase/migrations/001_initial_schema.sql` → klik **Run**

### 3. Setup Google AI / Gemini - GRATIS

1. Buka [aistudio.google.com](https://aistudio.google.com)
2. Login dengan akun Google
3. Klik **Get API Key** → **Create API key in new project**
4. Copy API key → untuk `GOOGLE_AI_API_KEY`

### 4. Setup Vapi.ai (Voice AI) - $10 FREE CREDIT

1. Buka [vapi.ai](https://vapi.ai) dan buat akun
2. Di dashboard, buka **Assistants** → **Create Assistant**
3. Konfigurasi Assistant:
   - **Name**: SatuPintu Assistant
   - **First Message**: `Selamat datang di SatuPintu, layanan pengaduan terpadu Kota Bandung. Ada yang bisa saya bantu hari ini?`
   - **System Prompt**: (lihat file `src/lib/vapi.ts` untuk contoh lengkap)
   - **Voice**: Pilih ElevenLabs Indonesian voice
   - **Model**: GPT-4 Turbo
4. Tambahkan **Functions**:
   - `validateAddress` - untuk validasi alamat
   - `createTicket` - untuk membuat tiket
5. Set **Server URL** (webhook): `https://your-domain.vercel.app/api/vapi/webhook`
6. Catat **Assistant ID** dan **Public Key** (dari Account Settings)

### 5. Setup Twilio (SMS Notifikasi) - OPTIONAL, $15 FREE TRIAL

1. Buka [twilio.com](https://twilio.com) dan buat akun
2. Verifikasi nomor HP Anda (wajib untuk trial)
3. Di dashboard, catat:
   - `Account SID` → untuk `TWILIO_ACCOUNT_SID`
   - `Auth Token` → untuk `TWILIO_AUTH_TOKEN`
4. Buka **Phone Numbers** → **Buy a Number** → pilih nomor US (gratis di trial)
5. Catat nomor telepon → untuk `TWILIO_PHONE_NUMBER` (format: `+1234567890`)

> **Note**: Twilio hanya digunakan untuk SMS notifikasi. Voice call sekarang menggunakan Vapi.ai

### 6. Setup Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` dengan credentials yang sudah didapat:

```env
# Supabase (dari langkah 2)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google AI (dari langkah 3) - untuk validasi alamat fallback
GOOGLE_AI_API_KEY=AIzaSy...

# Twilio (dari langkah 5) - OPTIONAL, untuk SMS
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890

# App Config (generate random string di terminal dengan: openssl rand -hex 16)
NEXT_PUBLIC_APP_URL=http://localhost:3000
INTERNAL_API_KEY=<hasil_openssl_rand_hex_16>
JWT_SECRET=<hasil_openssl_rand_hex_16>
```

> **Note**: Vapi Public Key dan Assistant ID diinput langsung di halaman `/test-call`

> **Tip**: Generate random string dengan menjalankan `openssl rand -hex 16` di terminal

### 7. Run Database Migration

Jalankan migration kedua untuk field baru (reporter_name, validated_address):

```sql
-- Di Supabase SQL Editor, jalankan:
-- File: supabase/migrations/002_add_reporter_fields.sql
```

### 8. Run Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

## Features

### Untuk Warga
- **Telepon AI**: Lapor keluhan via telepon, AI memahami dan mencatat
- **SMS Tracking**: Kirim `CEK SP-XXXXXXXX-XXXX` untuk cek status
- **Web Tracking**: Lacak status di `/track/[ticketId]`
- **Notifikasi Otomatis**: SMS setiap ada update status

### Untuk Dinas
- **Dashboard**: Lihat dan kelola tiket di `/dashboard`
- **Filter & Search**: Filter by status, urgency, kategori
- **Update Status**: Update status + kirim notifikasi ke warga
- **Statistik**: Lihat statistik tiket realtime

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/vapi/webhook` | POST | Vapi function calls (validateAddress, createTicket) |
| `/api/address/validate` | POST | Validate address using Nominatim + Gemini |
| `/api/voice/incoming` | POST | Twilio voice webhook (legacy) |
| `/api/voice/process` | POST | Process recorded audio (legacy) |
| `/api/sms/incoming` | POST | Twilio SMS webhook |
| `/api/track/[ticketId]` | GET | Public ticket tracking |
| `/api/tickets` | GET | List tickets (auth required) |
| `/api/tickets/[id]` | GET/PATCH | Ticket detail/update |
| `/api/stats` | GET | Dashboard statistics |
| `/api/auth/login` | POST | Dinas login |
| `/api/auth/logout` | POST | Dinas logout |
| `/api/auth/me` | GET | Get current user |

## Demo Login

Untuk testing dashboard, gunakan:
- **ID**: `admin` (atau `pupr`, `polisi`, `dlh`, `dinsos`, `damkar`, `ambulans`)
- **Password**: `demo2025`

## Project Structure

```
app/
├── src/
│   ├── app/
│   │   ├── api/           # API routes
│   │   ├── (public)/      # Public pages (tracking)
│   │   ├── (dashboard)/   # Dashboard pages
│   │   ├── login/         # Login page
│   │   └── page.tsx       # Landing page
│   ├── components/ui/     # shadcn/ui components
│   ├── lib/               # Utilities (supabase, twilio, gemini)
│   └── types/             # TypeScript types
├── supabase/
│   └── migrations/        # SQL migrations
└── scripts/               # Helper scripts
```

## Deployment ke Vercel

### 1. Push ke GitHub

```bash
# Buat repo baru di github.com, lalu:
git remote add origin https://github.com/USERNAME/satupintu.git
git push -u origin main
```

### 2. Deploy ke Vercel

1. Buka [vercel.com](https://vercel.com) dan login dengan GitHub
2. Klik **Add New** → **Project**
3. Pilih repo `satupintu` → klik **Import**
4. Di bagian **Environment Variables**, tambahkan semua variable dari `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GOOGLE_AI_API_KEY`
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_PHONE_NUMBER`
   - `NEXT_PUBLIC_APP_URL` → ganti ke `https://your-app.vercel.app`
   - `INTERNAL_API_KEY`
   - `JWT_SECRET`
5. Klik **Deploy** dan tunggu selesai

### 3. Setup Vapi Webhook (Setelah Deploy)

1. Buka [dashboard.vapi.ai](https://dashboard.vapi.ai)
2. Buka Assistant yang sudah dibuat
3. Di bagian **Server URL**, masukkan: `https://your-app.vercel.app/api/vapi/webhook`
4. Save changes

### 4. Setup Twilio SMS Webhook (Optional)

1. Buka [console.twilio.com](https://console.twilio.com)
2. Buka **Phone Numbers** → **Manage** → **Active Numbers**
3. Klik nomor telepon Anda
4. Di bagian **Messaging Configuration**:
   - A MESSAGE COMES IN: **Webhook**
   - URL: `https://your-app.vercel.app/api/sms/incoming`
   - HTTP: **POST**
5. Klik **Save configuration**

## Testing

### Test Voice AI (Web)
1. Buka `https://your-app.vercel.app/test-call`
2. Masukkan Vapi **Public Key** dan **Assistant ID**
3. Klik **Mulai Panggilan** dan izinkan akses mikrofon
4. AI akan menyapa: "Selamat datang di SatuPintu..."
5. Sampaikan keluhan seperti: "Ada jalan rusak di depan rumah saya di Jalan Cihampelas"
6. AI akan memandu untuk melengkapi data (nama, alamat, konfirmasi)
7. Setelah konfirmasi, tiket akan dibuat dan Anda akan mendapat nomor tiket

### Test Voice AI (Phone - via Vapi)
1. Di Vapi dashboard, beli nomor telepon atau connect ke Twilio
2. Telepon nomor tersebut
3. Flow sama seperti web test

### Test Dashboard
1. Buka `https://your-app.vercel.app/login`
2. Login dengan ID: `admin`, Password: `demo2025`
3. Anda akan melihat dashboard dengan tiket contoh

### Test SMS Tracking
1. Kirim SMS ke nomor Twilio: `CEK SP-XXXXXXXX-XXXX`
2. Anda akan menerima balasan status tiket

### Test Web Tracking
1. Buka `https://your-app.vercel.app/track/SP-XXXXXXXX-XXXX`
2. Lihat status dan timeline tiket

## Troubleshooting

### Error "Invalid API Key" (Gemini)
- Pastikan `GOOGLE_AI_API_KEY` sudah benar dan aktif
- Cek di [aistudio.google.com](https://aistudio.google.com) apakah API key masih valid

### Vapi call tidak berfungsi
- Pastikan Public Key dan Assistant ID sudah benar
- Cek apakah Server URL (webhook) sudah di-set di Vapi dashboard
- Lihat logs di Vapi dashboard untuk debug
- Pastikan browser mengizinkan akses mikrofon

### Error "Database connection failed"
- Pastikan URL Supabase menggunakan format `https://xxxxx.supabase.co`
- Pastikan `service_role` key digunakan (bukan `anon` key) untuk `SUPABASE_SERVICE_ROLE_KEY`

### Alamat tidak tervalidasi
- Nominatim mungkin tidak menemukan alamat - coba dengan alamat yang lebih spesifik
- Fallback ke Gemini akan digunakan otomatis
- Pastikan alamat berada di Kota Bandung

### SMS tidak terkirim
- Pastikan kredensial Twilio sudah benar
- Cek saldo Twilio trial credit
- Lihat logs di Twilio Console → Monitor → Logs

## License

MIT

---

**SatuPintu** - Ekraf Tech Summit 2025 Hackathon
*AI-powered Smart City Call Center untuk Kota Bandung*
