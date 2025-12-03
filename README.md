# SatuPintu

**Satu Pintu untuk Semua Keluhan Kota**

AI-powered centralized call center untuk smart city. Warga cukup menelepon satu nomor, AI memahami keluhan dan meneruskan ke dinas terkait dengan tracking otomatis.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase PostgreSQL
- **Voice AI**: Gemini 2.0 Flash (native audio input)
- **Voice Transport**: Twilio Voice
- **SMS**: Twilio SMS
- **UI**: Tailwind CSS + shadcn/ui
- **Hosting**: Vercel

## Quick Start

### 1. Install dependencies

```bash
cd app
npm install
```

### 2. Setup environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` dengan credentials Anda:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key

# Twilio
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Google AI (Gemini)
GOOGLE_AI_API_KEY=your_google_ai_api_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
INTERNAL_API_KEY=generate_a_random_string_here
JWT_SECRET=generate_a_random_32_char_string
```

### 3. Setup Supabase Database

1. Buat project baru di [supabase.com](https://supabase.com)
2. Buka SQL Editor
3. Jalankan script di `supabase/migrations/001_initial_schema.sql`
4. Generate password hash yang benar:

```bash
npx ts-node scripts/generate-password-hash.ts
```

5. Update password di database dengan hash yang dihasilkan

### 4. Setup Twilio

1. Buat akun di [twilio.com](https://twilio.com) (ada $15 trial credit)
2. Beli nomor telepon Indonesia atau US
3. Set webhook untuk Voice:
   - URL: `https://your-domain.vercel.app/api/voice/incoming`
   - Method: POST
4. Set webhook untuk SMS:
   - URL: `https://your-domain.vercel.app/api/sms/incoming`
   - Method: POST

### 5. Run development server

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
| `/api/voice/incoming` | POST | Twilio voice webhook |
| `/api/voice/process` | POST | Process recorded audio |
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

## Deployment

### Vercel (Recommended)

1. Push ke GitHub
2. Import project di Vercel
3. Set environment variables
4. Deploy

### Twilio Webhook Setup

Setelah deploy, update webhook URLs di Twilio:
- Voice: `https://your-domain.vercel.app/api/voice/incoming`
- SMS: `https://your-domain.vercel.app/api/sms/incoming`

## License

MIT

---

**SatuPintu** - Ekraf Tech Summit 2025 Hackathon
