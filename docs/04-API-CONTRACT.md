# API Contract Documentation
# SatuPintu - untuk Tim Development

## Overview

Dokumen ini berisi API contract untuk SatuPintu.
Semua endpoint menggunakan REST API dengan JSON format.

**Base URL:**
- Development: `http://localhost:3000/api`
- Production: `https://satupintu.vercel.app/api`

---

## Authentication

### Dinas Authentication
Simple token-based auth untuk MVP. Token disimpan di cookie/localStorage.

```
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

---

## API Endpoints

### 1. Authentication

#### POST /api/auth/login
Login untuk operator dinas.

**Request:**
```json
{
  "dinasId": "pupr",
  "password": "pupr2025"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "dinas": {
      "id": "pupr",
      "name": "Dinas PUPR",
      "categories": ["INFRA"]
    }
  }
}
```

**Response (401):**
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

---

#### POST /api/auth/logout
Logout operator.

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true
}
```

---

#### GET /api/auth/me
Get current logged in user.

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "dinasId": "pupr",
    "dinasName": "Dinas PUPR",
    "categories": ["INFRA"]
  }
}
```

---

### 2. Tickets

#### GET /api/tickets
Get list of tickets (untuk dashboard dinas).

**Request Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | string | No | Filter by status: PENDING, IN_PROGRESS, RESOLVED, CANCELLED |
| `urgency` | string | No | Filter by urgency: CRITICAL, HIGH, MEDIUM, LOW |
| `category` | string | No | Filter by category: DARURAT, INFRA, KEBERSIHAN, SOSIAL, LAINNYA |
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Items per page (default: 10, max: 50) |
| `search` | string | No | Search by ticket ID or location |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "tickets": [
      {
        "id": "SP-20251203-0001",
        "category": "DARURAT",
        "subcategory": "Kecelakaan",
        "location": "Jl. Dago, depan ITB",
        "description": "Ada kecelakaan motor dengan korban luka",
        "reporterPhone": "081234567890",
        "status": "IN_PROGRESS",
        "urgency": "CRITICAL",
        "assignedDinas": ["ambulans", "polisi"],
        "createdAt": "2025-12-03T10:15:00Z",
        "updatedAt": "2025-12-03T10:35:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 45,
      "totalPages": 5
    }
  }
}
```

---

#### GET /api/tickets/:id
Get single ticket detail.

**Request Headers (optional for public tracking):**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "SP-20251203-0001",
    "category": "DARURAT",
    "subcategory": "Kecelakaan",
    "location": "Jl. Dago, depan ITB",
    "description": "Ada kecelakaan motor dengan korban luka",
    "reporterPhone": "081234567890",
    "status": "IN_PROGRESS",
    "urgency": "CRITICAL",
    "assignedDinas": ["ambulans", "polisi"],
    "createdAt": "2025-12-03T10:15:00Z",
    "updatedAt": "2025-12-03T10:35:00Z",
    "timeline": [
      {
        "id": "tl-001",
        "action": "CREATED",
        "message": "Laporan diterima via telepon",
        "createdAt": "2025-12-03T10:15:00Z",
        "createdBy": "system"
      },
      {
        "id": "tl-002",
        "action": "ASSIGNED",
        "message": "Diteruskan ke Ambulans (119) dan Polisi (110)",
        "createdAt": "2025-12-03T10:16:00Z",
        "createdBy": "system"
      },
      {
        "id": "tl-003",
        "action": "UPDATE",
        "message": "Ambulans dikirim ke lokasi",
        "createdAt": "2025-12-03T10:17:00Z",
        "createdBy": "ambulans"
      },
      {
        "id": "tl-004",
        "action": "UPDATE",
        "message": "Polisi tiba di lokasi",
        "createdAt": "2025-12-03T10:18:00Z",
        "createdBy": "polisi"
      },
      {
        "id": "tl-005",
        "action": "UPDATE",
        "message": "Korban dalam perjalanan ke RS Hasan Sadikin",
        "createdAt": "2025-12-03T10:35:00Z",
        "createdBy": "ambulans"
      }
    ]
  }
}
```

**Response (404):**
```json
{
  "success": false,
  "error": "Ticket not found"
}
```

---

#### POST /api/tickets
Create new ticket (dipanggil oleh voice AI system).

**Request Headers:**
```
X-API-Key: <internal-api-key>
```

**Request:**
```json
{
  "category": "DARURAT",
  "subcategory": "Kecelakaan",
  "location": "Jl. Dago, depan ITB",
  "description": "Ada kecelakaan motor dengan korban luka",
  "reporterPhone": "081234567890",
  "urgency": "CRITICAL",
  "callSid": "CA1234567890abcdef",
  "transcription": "Full transcription of the call..."
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "SP-20251203-0001",
    "category": "DARURAT",
    "subcategory": "Kecelakaan",
    "location": "Jl. Dago, depan ITB",
    "description": "Ada kecelakaan motor dengan korban luka",
    "reporterPhone": "081234567890",
    "status": "PENDING",
    "urgency": "CRITICAL",
    "assignedDinas": ["ambulans", "polisi"],
    "createdAt": "2025-12-03T10:15:00Z"
  }
}
```

---

#### PATCH /api/tickets/:id
Update ticket status (untuk operator dinas).

**Request Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "status": "IN_PROGRESS",
  "note": "Tim sudah diturunkan ke lokasi",
  "sendSms": true
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "SP-20251203-0001",
    "status": "IN_PROGRESS",
    "updatedAt": "2025-12-03T10:45:00Z",
    "timeline": [
      {
        "id": "tl-006",
        "action": "STATUS_CHANGE",
        "message": "Status diubah ke DALAM PROSES. Tim sudah diturunkan ke lokasi",
        "createdAt": "2025-12-03T10:45:00Z",
        "createdBy": "pupr"
      }
    ],
    "smsSent": true
  }
}
```

---

### 3. Public Tracking

#### GET /api/track/:ticketId
Public endpoint untuk warga cek status (no auth required).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "SP-20251203-0001",
    "category": "DARURAT",
    "subcategory": "Kecelakaan",
    "location": "Jl. Dago, depan ITB",
    "status": "IN_PROGRESS",
    "statusText": "Dalam Proses",
    "urgency": "CRITICAL",
    "assignedTo": ["Ambulans (119)", "Polisi (110)"],
    "createdAt": "2025-12-03T10:15:00Z",
    "updatedAt": "2025-12-03T10:35:00Z",
    "timeline": [
      {
        "time": "2025-12-03T10:35:00Z",
        "message": "Korban dalam perjalanan ke RS Hasan Sadikin"
      },
      {
        "time": "2025-12-03T10:18:00Z",
        "message": "Polisi tiba di lokasi"
      },
      {
        "time": "2025-12-03T10:17:00Z",
        "message": "Ambulans dikirim ke lokasi"
      },
      {
        "time": "2025-12-03T10:16:00Z",
        "message": "Laporan diteruskan ke unit terkait"
      },
      {
        "time": "2025-12-03T10:15:00Z",
        "message": "Laporan diterima"
      }
    ]
  }
}
```

**Note:** Endpoint ini mengembalikan versi "sanitized" dari ticket - tidak termasuk data sensitif seperti nomor HP pelapor lengkap, catatan internal, dll.

---

### 4. Voice Webhook (Twilio)

#### POST /api/voice/incoming
Twilio webhook untuk incoming call.

**Request (from Twilio):**
```
Form data dengan CallSid, From, To, etc.
```

**Response (TwiML):**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Google.id-ID-Standard-A">
    Selamat datang di SatuPintu, layanan pengaduan terpadu Kota Bandung.
    Silakan sampaikan keluhan Anda setelah bunyi beep.
  </Say>
  <Record maxLength="120" 
          action="/api/voice/process" 
          transcribe="false"
          playBeep="true" />
</Response>
```

---

#### POST /api/voice/process
Process recorded audio dengan Gemini.

**Request (from Twilio):**
```
Form data dengan RecordingUrl, CallSid, From, etc.
```

**Response (TwiML):**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Google.id-ID-Standard-A">
    Baik, saya catat ada kecelakaan di Jalan Dago depan ITB dengan korban luka.
    Laporan Anda sudah dicatat dengan nomor tiket S P 2 0 2 5 1 2 0 3 0 0 0 1.
    Ambulans dan polisi sedang dikirim ke lokasi.
    Anda akan menerima SMS konfirmasi. Terima kasih.
  </Say>
  <Hangup />
</Response>
```

---

### 5. SMS Webhook (Twilio)

#### POST /api/sms/incoming
Twilio webhook untuk incoming SMS (untuk cek status via SMS).

**Request (from Twilio):**
```
Form data dengan Body, From, To, etc.
Body example: "CEK SP-20251203-0001"
```

**Response (TwiML):**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>
    Status SP-20251203-0001: DALAM PROSES
    
    Kategori: Darurat - Kecelakaan
    Lokasi: Jl. Dago, depan ITB
    
    Update terakhir (10:35):
    Korban dalam perjalanan ke RS Hasan Sadikin
    
    Detail: satupintu.id/track/SP-20251203-0001
  </Message>
</Response>
```

---

### 6. Dashboard Stats

#### GET /api/stats
Get statistics untuk dashboard dinas.

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "total": 45,
    "pending": 12,
    "inProgress": 8,
    "resolved": 25,
    "byUrgency": {
      "critical": 2,
      "high": 10,
      "medium": 18,
      "low": 15
    },
    "today": {
      "total": 5,
      "pending": 2,
      "inProgress": 2,
      "resolved": 1
    }
  }
}
```

---

## Data Types

### Ticket Status
```typescript
type TicketStatus = 
  | "PENDING"      // Baru, belum ditangani
  | "IN_PROGRESS"  // Sedang ditangani
  | "ESCALATED"    // Dieskalasi
  | "RESOLVED"     // Selesai
  | "CANCELLED";   // Dibatalkan
```

### Ticket Category
```typescript
type TicketCategory = 
  | "DARURAT"      // Keadaan darurat
  | "INFRA"        // Infrastruktur
  | "KEBERSIHAN"   // Kebersihan lingkungan
  | "SOSIAL"       // Masalah sosial
  | "LAINNYA";     // Lain-lain
```

### Ticket Urgency
```typescript
type TicketUrgency = 
  | "CRITICAL"  // Response 15 menit
  | "HIGH"      // Response 1 jam
  | "MEDIUM"    // Response 24 jam
  | "LOW";      // Response 72 jam
```

### Dinas
```typescript
type Dinas = 
  | "pupr"      // Dinas PUPR
  | "dlh"       // Dinas Lingkungan Hidup
  | "dinsos"    // Dinas Sosial
  | "polisi"    // Polisi (110)
  | "ambulans"  // Ambulans (119)
  | "damkar"    // Damkar (113)
  | "admin";    // Admin Umum
```

### Category to Dinas Mapping
```typescript
const categoryToDinas: Record<TicketCategory, Dinas[]> = {
  "DARURAT": ["polisi", "ambulans", "damkar"],
  "INFRA": ["pupr"],
  "KEBERSIHAN": ["dlh"],
  "SOSIAL": ["dinsos"],
  "LAINNYA": ["admin"]
};
```

---

## Error Responses

Semua error mengikuti format:

```json
{
  "success": false,
  "error": "Error message here",
  "code": "ERROR_CODE"
}
```

### Error Codes
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Token tidak valid atau tidak ada |
| `FORBIDDEN` | 403 | Tidak punya akses ke resource |
| `NOT_FOUND` | 404 | Resource tidak ditemukan |
| `VALIDATION_ERROR` | 400 | Request body tidak valid |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Rate Limiting

| Endpoint | Limit |
|----------|-------|
| `/api/track/*` | 60 requests per minute per IP |
| `/api/tickets/*` | 100 requests per minute per token |
| `/api/voice/*` | No limit (controlled by Twilio) |
| `/api/sms/*` | No limit (controlled by Twilio) |

---

## Webhooks Configuration (Twilio)

### Voice Webhook
```
URL: https://satupintu.vercel.app/api/voice/incoming
Method: POST
```

### SMS Webhook
```
URL: https://satupintu.vercel.app/api/sms/incoming
Method: POST
```

---

*Document Version: 1.0*  
*Last Updated: 3 December 2025*  
*For: Development Team*
