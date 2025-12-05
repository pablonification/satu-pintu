# Product Requirements Document (PRD)
# SatuPintu - AI-Powered Smart City Call Center

## 1. Executive Summary

**Nama Produk:** SatuPintu  
**Tagline:** "Satu Nomor untuk Semua Kebutuhan Kota"  
**Target Hackathon:** Ekraf Tech Summit 2025 - Tech Innovation Challenge  
**Kategori:** Emergency Response and Smart City Solutions  
**Demo Date:** 17 Desember 2025

### Problem Statement
Saat ini warga kota harus menghafal banyak nomor telepon untuk berbagai kebutuhan:
- 112 - Darurat umum
- 110 - Polisi
- 119 - Ambulans
- 113 - Pemadam Kebakaran
- Dan puluhan nomor dinas lainnya...

**Pain Points:**
1. Warga bingung harus menghubungi nomor mana
2. Tidak ada mekanisme tracking status laporan
3. Warga harus menelepon berulang kali untuk update
4. Data laporan tersebar di berbagai instansi
5. Tidak ada analytics untuk pengambilan keputusan

### Solution
SatuPintu adalah **AI-powered centralized call center** yang:
1. Menyediakan satu nomor telepon untuk semua kebutuhan
2. AI agent menerima dan memahami keluhan warga
3. Otomatis mengkategorikan dan meneruskan ke dinas terkait
4. Memberikan ticket ID untuk tracking
5. Warga bisa cek status via web atau SMS
6. Dashboard untuk setiap dinas mengelola laporan

---

## 2. Target Users

### Primary Users

| User Type | Deskripsi | Kebutuhan Utama |
|-----------|-----------|-----------------|
| **Warga/Citizen** | Masyarakat umum yang ingin melaporkan masalah | Mudah melapor, bisa tracking status |
| **Operator Dinas** | Staf dinas yang handle laporan | Menerima, update, dan close ticket |
| **Admin Kota** | Pejabat pemkot yang monitor | Overview analytics dan performa |

### User Personas

**Persona 1: Pak Budi (55 tahun)**
- Warga biasa, tidak tech-savvy
- Ingin melaporkan lampu jalan mati
- Tidak tahu harus telepon kemana
- Butuh konfirmasi bahwa laporannya diproses

**Persona 2: Ibu Sari (32 tahun)**
- Menyaksikan kecelakaan
- Panik, butuh bantuan cepat
- Ingin tahu apakah ambulans sudah dikirim
- Ingin update kondisi korban

**Persona 3: Dedi (28 tahun) - Operator Dinas PUPR**
- Menerima banyak laporan infrastruktur
- Butuh sistem untuk prioritas
- Perlu update status ke warga

---

## 3. Features & Requirements

### MVP Features (Must Have)

#### 3.1 Voice AI Agent
| Feature | Deskripsi | Priority |
|---------|-----------|----------|
| Receive Call | Menerima telepon masuk via Twilio | P0 |
| Speech Recognition | Memahami bahasa Indonesia | P0 |
| Intent Classification | Kategorikan jenis laporan | P0 |
| Information Extraction | Ekstrak lokasi, detail, urgensi | P0 |
| Natural Response | Merespons dengan natural | P0 |
| Ticket Creation | Buat ticket otomatis | P0 |

#### 3.2 Ticket System
| Feature | Deskripsi | Priority |
|---------|-----------|----------|
| Generate Ticket ID | Format: SP-YYYYMMDD-XXXX | P0 |
| Store Ticket Data | Simpan ke database | P0 |
| Assign to Dinas | Auto-assign berdasarkan kategori | P0 |
| SMS Notification | Kirim ticket ID ke pelapor | P0 |
| Status Tracking | Pending → In Progress → Resolved | P0 |

#### 3.3 Citizen Portal
| Feature | Deskripsi | Priority |
|---------|-----------|----------|
| Check Status (Web) | Input ticket ID, lihat status | P0 |
| Check Status (SMS) | Reply SMS dengan ticket ID | P1 |
| View Timeline | Lihat history update | P1 |

#### 3.4 Dinas Dashboard
| Feature | Deskripsi | Priority |
|---------|-----------|----------|
| Login | Simple password auth | P0 |
| View Tickets | List tickets untuk dinas tersebut | P0 |
| Update Status | Update status ticket | P0 |
| Add Notes | Tambah catatan internal | P1 |
| Filter & Search | Filter by status, date, etc | P1 |

### Post-MVP Features (Nice to Have)

| Feature | Deskripsi | Priority |
|---------|-----------|----------|
| Analytics Dashboard | Statistik laporan per kategori, waktu respons | P2 |
| Call Recording | Rekam percakapan untuk audit | P2 |
| Multi-language | Support Bahasa Sunda | P2 |
| WhatsApp Integration | Terima laporan via WA | P2 |
| Photo Upload | Warga bisa kirim foto | P2 |
| SLA Monitoring | Alert jika response time melebihi SLA | P2 |
| Escalation | Auto-escalate jika tidak ditangani | P2 |

---

## 4. Kategori Laporan

| Kode | Kategori | Dinas Terkait | Contoh Kasus | Urgensi Default |
|------|----------|---------------|--------------|-----------------|
| `DARURAT` | Keadaan Darurat | Polisi/Damkar/Ambulans | Kecelakaan, kebakaran, kejahatan | CRITICAL |
| `INFRA` | Infrastruktur | Dinas PUPR | Jalan rusak, lampu mati, jembatan | MEDIUM |
| `KEBERSIHAN` | Kebersihan | DLH (Dinas Lingkungan Hidup) | Sampah menumpuk, drainase | LOW |
| `SOSIAL` | Sosial | Dinsos | Gelandangan, pengemis, ODGJ | MEDIUM |
| `LAINNYA` | Lain-lain | Admin Umum | Pertanyaan umum, saran | LOW |

### Urgensi Level
- `CRITICAL`: Response dalam 15 menit (darurat)
- `HIGH`: Response dalam 1 jam
- `MEDIUM`: Response dalam 24 jam
- `LOW`: Response dalam 72 jam

---

## 5. Technical Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SATUPINTU ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   CITIZEN LAYER                                                              │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                     │
│   │  Phone Call │    │  Web Portal │    │     SMS     │                     │
│   │  (Twilio)   │    │  (Next.js)  │    │  (Twilio)   │                     │
│   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘                     │
│          │                  │                  │                             │
│   ───────┴──────────────────┴──────────────────┴───────                     │
│                             │                                                │
│   BACKEND LAYER             ▼                                                │
│   ┌─────────────────────────────────────────────────────┐                   │
│   │                    NEXT.JS API                       │                   │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │                   │
│   │  │   /voice    │  │  /tickets   │  │    /sms     │  │                   │
│   │  │  (webhook)  │  │   (CRUD)    │  │  (webhook)  │  │                   │
│   │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  │                   │
│   └─────────┼────────────────┼────────────────┼─────────┘                   │
│             │                │                │                              │
│   AI LAYER  │                │                │                              │
│   ┌─────────▼──────────┐     │                │                              │
│   │  Gemini 2.0 Flash  │     │                │                              │
│   │  ┌──────────────┐  │     │                │                              │
│   │  │ Audio Input  │  │     │                │                              │
│   │  │ Classification│  │     │                │                              │
│   │  │ Extraction   │  │     │                │                              │
│   │  │ Response Gen │  │     │                │                              │
│   │  └──────────────┘  │     │                │                              │
│   └─────────┬──────────┘     │                │                              │
│             │                │                │                              │
│   DATA LAYER│                ▼                │                              │
│   ┌─────────┴────────────────────────────────┴──────────┐                   │
│   │                    SUPABASE                          │                   │
│   │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌────────┐  │                   │
│   │  │ tickets │  │  dinas  │  │  users  │  │  logs  │  │                   │
│   │  └─────────┘  └─────────┘  └─────────┘  └────────┘  │                   │
│   └──────────────────────────────────────────────────────┘                   │
│                                                                              │
│   NOTIFICATION LAYER                                                         │
│   ┌─────────────────────────────────────────────────────┐                   │
│   │                    TWILIO                            │                   │
│   │  ┌─────────────┐            ┌─────────────┐         │                   │
│   │  │  Voice API  │            │   SMS API   │         │                   │
│   │  └─────────────┘            └─────────────┘         │                   │
│   └──────────────────────────────────────────────────────┘                   │
│                                                                              │
│   DASHBOARD LAYER                                                            │
│   ┌─────────────────────────────────────────────────────┐                   │
│   │  ┌───────────────┐  ┌───────────────┐  ┌─────────┐  │                   │
│   │  │ Dinas Portal  │  │ Admin Portal  │  │ Citizen │  │                   │
│   │  │  (per dinas)  │  │  (overview)   │  │ Tracking│  │                   │
│   │  └───────────────┘  └───────────────┘  └─────────┘  │                   │
│   └──────────────────────────────────────────────────────┘                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Tech Stack

| Layer | Technology | Alasan |
|-------|------------|--------|
| **Framework** | Next.js 14 (App Router) | Fullstack, fast, modern |
| **Database** | Supabase (PostgreSQL) | Free tier, realtime, auth |
| **Voice** | Twilio Voice | Industry standard |
| **AI/LLM** | Gemini 2.0 Flash | Native audio, fast, cost-effective |
| **TTS** | Google Cloud TTS | Natural Indonesian voice |
| **SMS** | Twilio SMS | Reliable, included in trial |
| **Hosting** | Vercel | Zero config, free tier |
| **UI** | Tailwind + shadcn/ui | Rapid development |

---

## 7. Success Metrics

### Demo Metrics (untuk Hackathon)
- [ ] Bisa menerima telepon dan memahami intent
- [ ] Bisa membuat ticket dan kirim SMS
- [ ] Warga bisa cek status via web
- [ ] Dinas bisa update status ticket
- [ ] Demo berjalan lancar tanpa error

### Production Metrics (future)
| Metric | Target | Deskripsi |
|--------|--------|-----------|
| Call Success Rate | >95% | Panggilan berhasil diproses |
| Intent Accuracy | >90% | Klasifikasi kategori benar |
| First Response Time | <30 detik | Waktu AI merespons |
| Citizen Satisfaction | >4/5 | Rating dari warga |
| Ticket Resolution Time | Sesuai SLA | Per kategori urgensi |

---

## 8. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Twilio trial limit | Demo terbatas | Prepare backup recording |
| Gemini latency tinggi | UX buruk | Implement timeout + fallback |
| Speech recognition error | Salah kategori | Konfirmasi ulang ke user |
| Database down | Service mati | Supabase SLA cukup baik |
| Demo hari H gagal | Kalah hackathon | Test berulang, prepare backup |

---

## 9. Timeline

| Day | Date | Deliverable |
|-----|------|-------------|
| 1 | 3 Dec | PRD, User Flow, Wireframes, DB Schema |
| 2 | 4 Dec | Project setup, DB setup, Basic UI |
| 3 | 5 Dec | Voice AI integration |
| 4 | 6 Dec | Ticket system + SMS |
| 5 | 7 Dec | Citizen portal |
| 6 | 8 Dec | Dinas dashboard |
| 7 | 9 Dec | Integration testing |
| 8 | 10 Dec | Bug fixes + Polish |
| 9 | 11 Dec | Final submission |
| - | 16-17 Dec | Demo day! |

---

## 10. Team Responsibilities

| Role | Responsibilities |
|------|------------------|
| **Product/Tech Lead** | PRD, Architecture, MVP development |
| **UI/UX Designer** | User flow, Wireframes, Visual design |
| **Frontend Dev** | Dashboard UI, Citizen portal |
| **Backend Dev** | API, Database, Integrations |
| **Presenter** | Pitch deck, Demo script |

---

## Appendix

### A. Competitor Analysis

| Product | Deskripsi | Kelebihan | Kekurangan |
|---------|-----------|-----------|------------|
| **EffiGov (US)** | AI voice for local gov | Production-ready, 24/7 | Belum ada di Indonesia |
| **Jakarta 112** | Call center DKI | Sudah established | Tidak ada tracking untuk warga |
| **Bandung 112** | Call center Bandung | Lokal | Tidak ada tracking, harus telepon ulang |
| **Lapor!** | Web-based reporting | Nationwide | Tidak ada voice, response lambat |

### B. Glossary

- **Ticket**: Satu unit laporan dari warga
- **Dinas**: Instansi pemerintah yang menangani laporan
- **SLA**: Service Level Agreement - target waktu penanganan
- **Intent**: Maksud/tujuan dari laporan warga
- **Urgensi**: Tingkat kegentingan laporan

---

*Document Version: 1.0*  
*Last Updated: 3 December 2025*  
*Author: SatuPintu Team*
