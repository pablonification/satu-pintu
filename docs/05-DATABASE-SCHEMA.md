# Database Schema Documentation
# SatuPintu - untuk Tim Development

## Overview

Database menggunakan **Supabase PostgreSQL** dengan Row Level Security (RLS).
Dokumen ini berisi schema lengkap untuk implementasi.

---

## Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────────┐       ┌────────────────┐
│   dinas     │       │     tickets     │       │ticket_timeline │
├─────────────┤       ├─────────────────┤       ├────────────────┤
│ id (PK)     │──────<│ assigned_dinas[]│       │ id (PK)        │
│ name        │       │ id (PK)         │──────<│ ticket_id (FK) │
│ password    │       │ category        │       │ action         │
│ categories[]│       │ subcategory     │       │ message        │
│ phone       │       │ location        │       │ created_by     │
│ active      │       │ description     │       │ created_at     │
└─────────────┘       │ reporter_phone  │       └────────────────┘
                      │ status          │
                      │ urgency         │
                      │ call_sid        │
                      │ transcription   │
                      │ created_at      │
                      │ updated_at      │
                      └─────────────────┘
```

---

## Tables

### 1. `dinas`

Stores information about government agencies/departments.

```sql
CREATE TABLE dinas (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  categories TEXT[] NOT NULL DEFAULT '{}',
  phone VARCHAR(20),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_dinas_active ON dinas(is_active);
CREATE INDEX idx_dinas_categories ON dinas USING GIN(categories);

-- Example data
INSERT INTO dinas (id, name, password_hash, categories, phone) VALUES
('polisi', 'Kepolisian Resort Bandung', '$hash', ARRAY['DARURAT'], '110'),
('ambulans', 'Unit Ambulans / Dinas Kesehatan', '$hash', ARRAY['DARURAT'], '119'),
('damkar', 'Dinas Pemadam Kebakaran', '$hash', ARRAY['DARURAT'], '113'),
('pupr', 'Dinas PUPR', '$hash', ARRAY['INFRA'], NULL),
('dlh', 'Dinas Lingkungan Hidup', '$hash', ARRAY['KEBERSIHAN'], NULL),
('dinsos', 'Dinas Sosial', '$hash', ARRAY['SOSIAL'], NULL),
('admin', 'Admin SatuPintu', '$hash', ARRAY['DARURAT','INFRA','KEBERSIHAN','SOSIAL','LAINNYA'], NULL);
```

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | VARCHAR(50) | NO | - | Unique identifier (e.g., 'pupr', 'polisi') |
| name | VARCHAR(255) | NO | - | Display name |
| password_hash | VARCHAR(255) | NO | - | Bcrypt hashed password |
| categories | TEXT[] | NO | '{}' | Array of categories this dinas handles |
| phone | VARCHAR(20) | YES | NULL | Emergency phone number if applicable |
| is_active | BOOLEAN | NO | true | Whether dinas is active |
| created_at | TIMESTAMPTZ | NO | NOW() | Record creation timestamp |
| updated_at | TIMESTAMPTZ | NO | NOW() | Last update timestamp |

---

### 2. `tickets`

Main table for storing citizen reports/complaints.

```sql
CREATE TABLE tickets (
  id VARCHAR(20) PRIMARY KEY,
  category VARCHAR(20) NOT NULL,
  subcategory VARCHAR(100),
  location TEXT NOT NULL,
  description TEXT NOT NULL,
  reporter_phone VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  urgency VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
  assigned_dinas TEXT[] NOT NULL DEFAULT '{}',
  call_sid VARCHAR(100),
  transcription TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT chk_category CHECK (category IN ('DARURAT', 'INFRA', 'KEBERSIHAN', 'SOSIAL', 'LAINNYA')),
  CONSTRAINT chk_status CHECK (status IN ('PENDING', 'IN_PROGRESS', 'ESCALATED', 'RESOLVED', 'CANCELLED')),
  CONSTRAINT chk_urgency CHECK (urgency IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW'))
);

-- Indexes
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_category ON tickets(category);
CREATE INDEX idx_tickets_urgency ON tickets(urgency);
CREATE INDEX idx_tickets_assigned_dinas ON tickets USING GIN(assigned_dinas);
CREATE INDEX idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX idx_tickets_reporter_phone ON tickets(reporter_phone);

-- Full text search index for location and description
CREATE INDEX idx_tickets_search ON tickets USING GIN(
  to_tsvector('indonesian', location || ' ' || description)
);
```

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | VARCHAR(20) | NO | - | Ticket ID format: SP-YYYYMMDD-XXXX |
| category | VARCHAR(20) | NO | - | DARURAT, INFRA, KEBERSIHAN, SOSIAL, LAINNYA |
| subcategory | VARCHAR(100) | YES | NULL | Specific type (e.g., Kecelakaan, Jalan Rusak) |
| location | TEXT | NO | - | Location description |
| description | TEXT | NO | - | Full description of the report |
| reporter_phone | VARCHAR(20) | NO | - | Reporter's phone number |
| status | VARCHAR(20) | NO | 'PENDING' | Current ticket status |
| urgency | VARCHAR(20) | NO | 'MEDIUM' | Urgency level |
| assigned_dinas | TEXT[] | NO | '{}' | Array of dinas IDs handling this ticket |
| call_sid | VARCHAR(100) | YES | NULL | Twilio Call SID (for voice reports) |
| transcription | TEXT | YES | NULL | Full transcription of the voice call |
| created_at | TIMESTAMPTZ | NO | NOW() | When ticket was created |
| updated_at | TIMESTAMPTZ | NO | NOW() | Last update timestamp |

---

### 3. `ticket_timeline`

Stores timeline/history of ticket updates.

```sql
CREATE TABLE ticket_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id VARCHAR(20) NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  created_by VARCHAR(50) NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT chk_action CHECK (action IN (
    'CREATED', 'ASSIGNED', 'STATUS_CHANGE', 'UPDATE', 
    'ESCALATED', 'RESOLVED', 'CANCELLED', 'NOTE'
  ))
);

-- Indexes
CREATE INDEX idx_timeline_ticket_id ON ticket_timeline(ticket_id);
CREATE INDEX idx_timeline_created_at ON ticket_timeline(created_at DESC);
CREATE INDEX idx_timeline_action ON ticket_timeline(action);
CREATE INDEX idx_timeline_public ON ticket_timeline(is_public);
```

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Unique identifier |
| ticket_id | VARCHAR(20) | NO | - | Reference to tickets table |
| action | VARCHAR(50) | NO | - | Type of timeline entry |
| message | TEXT | NO | - | Human readable message |
| created_by | VARCHAR(50) | NO | - | Who created this entry (dinas ID or 'system') |
| is_public | BOOLEAN | NO | true | Show in public tracking? |
| metadata | JSONB | YES | NULL | Additional data (e.g., old/new status) |
| created_at | TIMESTAMPTZ | NO | NOW() | Entry timestamp |

**Action Types:**
- `CREATED` - Ticket was created
- `ASSIGNED` - Ticket assigned to dinas
- `STATUS_CHANGE` - Status changed
- `UPDATE` - General update/progress
- `ESCALATED` - Ticket escalated
- `RESOLVED` - Ticket resolved
- `CANCELLED` - Ticket cancelled
- `NOTE` - Internal note (usually is_public=false)

---

### 4. `sms_logs`

Logs all SMS sent for audit and debugging.

```sql
CREATE TABLE sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id VARCHAR(20) REFERENCES tickets(id) ON DELETE SET NULL,
  phone_to VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  direction VARCHAR(10) NOT NULL DEFAULT 'OUTBOUND',
  twilio_sid VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'QUEUED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT chk_direction CHECK (direction IN ('INBOUND', 'OUTBOUND')),
  CONSTRAINT chk_sms_status CHECK (status IN ('QUEUED', 'SENT', 'DELIVERED', 'FAILED'))
);

-- Indexes
CREATE INDEX idx_sms_ticket_id ON sms_logs(ticket_id);
CREATE INDEX idx_sms_phone ON sms_logs(phone_to);
CREATE INDEX idx_sms_created_at ON sms_logs(created_at DESC);
```

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Unique identifier |
| ticket_id | VARCHAR(20) | YES | NULL | Related ticket (if any) |
| phone_to | VARCHAR(20) | NO | - | Recipient phone number |
| message | TEXT | NO | - | SMS content |
| direction | VARCHAR(10) | NO | 'OUTBOUND' | INBOUND or OUTBOUND |
| twilio_sid | VARCHAR(100) | YES | NULL | Twilio Message SID |
| status | VARCHAR(20) | NO | 'QUEUED' | Delivery status |
| created_at | TIMESTAMPTZ | NO | NOW() | When SMS was created |

---

### 5. `call_logs`

Logs all voice calls for audit and debugging.

```sql
CREATE TABLE call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id VARCHAR(20) REFERENCES tickets(id) ON DELETE SET NULL,
  call_sid VARCHAR(100) NOT NULL UNIQUE,
  phone_from VARCHAR(20) NOT NULL,
  recording_url TEXT,
  duration_seconds INTEGER,
  status VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  
  CONSTRAINT chk_call_status CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'FAILED', 'NO_ANSWER'))
);

-- Indexes
CREATE INDEX idx_call_ticket_id ON call_logs(ticket_id);
CREATE INDEX idx_call_sid ON call_logs(call_sid);
CREATE INDEX idx_call_phone ON call_logs(phone_from);
CREATE INDEX idx_call_created_at ON call_logs(created_at DESC);
```

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Unique identifier |
| ticket_id | VARCHAR(20) | YES | NULL | Related ticket (if created) |
| call_sid | VARCHAR(100) | NO | - | Twilio Call SID |
| phone_from | VARCHAR(20) | NO | - | Caller phone number |
| recording_url | TEXT | YES | NULL | URL to call recording |
| duration_seconds | INTEGER | YES | NULL | Call duration |
| status | VARCHAR(20) | NO | 'IN_PROGRESS' | Call status |
| created_at | TIMESTAMPTZ | NO | NOW() | When call started |
| ended_at | TIMESTAMPTZ | YES | NULL | When call ended |

---

## Functions & Triggers

### Auto-update `updated_at`

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_dinas_updated_at
  BEFORE UPDATE ON dinas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

### Generate Ticket ID

```sql
CREATE OR REPLACE FUNCTION generate_ticket_id()
RETURNS VARCHAR(20) AS $$
DECLARE
  today_date VARCHAR(8);
  sequence_num INTEGER;
  new_id VARCHAR(20);
BEGIN
  today_date := TO_CHAR(NOW(), 'YYYYMMDD');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(id FROM 13 FOR 4) AS INTEGER)
  ), 0) + 1
  INTO sequence_num
  FROM tickets
  WHERE id LIKE 'SP-' || today_date || '-%';
  
  new_id := 'SP-' || today_date || '-' || LPAD(sequence_num::TEXT, 4, '0');
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;
```

### Auto-create Timeline on Ticket Creation

```sql
CREATE OR REPLACE FUNCTION create_initial_timeline()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO ticket_timeline (ticket_id, action, message, created_by)
  VALUES (NEW.id, 'CREATED', 'Laporan diterima via telepon', 'system');
  
  IF array_length(NEW.assigned_dinas, 1) > 0 THEN
    INSERT INTO ticket_timeline (ticket_id, action, message, created_by)
    VALUES (
      NEW.id, 
      'ASSIGNED', 
      'Diteruskan ke ' || array_to_string(NEW.assigned_dinas, ', '),
      'system'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ticket_created
  AFTER INSERT ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION create_initial_timeline();
```

### Auto-create Timeline on Status Change

```sql
CREATE OR REPLACE FUNCTION track_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO ticket_timeline (
      ticket_id, 
      action, 
      message, 
      created_by,
      metadata
    )
    VALUES (
      NEW.id,
      'STATUS_CHANGE',
      'Status diubah dari ' || OLD.status || ' ke ' || NEW.status,
      'system',
      jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ticket_status_change
  AFTER UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION track_status_change();
```

---

## Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE dinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;

-- Tickets: Dinas can only see tickets assigned to them
CREATE POLICY "Dinas can view assigned tickets" ON tickets
  FOR SELECT
  USING (
    auth.jwt() ->> 'dinas_id' = ANY(assigned_dinas)
    OR auth.jwt() ->> 'dinas_id' = 'admin'
  );

CREATE POLICY "System can insert tickets" ON tickets
  FOR INSERT
  WITH CHECK (true); -- Controlled by API key

CREATE POLICY "Dinas can update assigned tickets" ON tickets
  FOR UPDATE
  USING (
    auth.jwt() ->> 'dinas_id' = ANY(assigned_dinas)
    OR auth.jwt() ->> 'dinas_id' = 'admin'
  );

-- Timeline: Dinas can view timeline for their tickets
CREATE POLICY "Dinas can view ticket timeline" ON ticket_timeline
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tickets 
      WHERE tickets.id = ticket_timeline.ticket_id
      AND (
        auth.jwt() ->> 'dinas_id' = ANY(tickets.assigned_dinas)
        OR auth.jwt() ->> 'dinas_id' = 'admin'
      )
    )
  );

-- Public policy for tracking (bypass RLS via service key)
-- Implemented in API layer
```

---

## Seed Data

```sql
-- Dinas seed (passwords akan di-hash di aplikasi)
INSERT INTO dinas (id, name, password_hash, categories, phone) VALUES
('polisi', 'Kepolisian Resort Kota Bandung', 'TO_BE_HASHED', ARRAY['DARURAT'], '110'),
('ambulans', 'Unit Ambulans Dinkes Bandung', 'TO_BE_HASHED', ARRAY['DARURAT'], '119'),
('damkar', 'Dinas Pemadam Kebakaran Bandung', 'TO_BE_HASHED', ARRAY['DARURAT'], '113'),
('pupr', 'Dinas PUPR Kota Bandung', 'TO_BE_HASHED', ARRAY['INFRA'], NULL),
('dlh', 'Dinas Lingkungan Hidup Bandung', 'TO_BE_HASHED', ARRAY['KEBERSIHAN'], NULL),
('dinsos', 'Dinas Sosial Kota Bandung', 'TO_BE_HASHED', ARRAY['SOSIAL'], NULL),
('admin', 'Admin SatuPintu', 'TO_BE_HASHED', ARRAY['DARURAT','INFRA','KEBERSIHAN','SOSIAL','LAINNYA'], NULL)
ON CONFLICT (id) DO NOTHING;

-- Demo tickets for testing
INSERT INTO tickets (id, category, subcategory, location, description, reporter_phone, status, urgency, assigned_dinas) VALUES
('SP-20251203-0001', 'DARURAT', 'Kecelakaan', 'Jl. Dago No. 100, depan ITB', 'Ada kecelakaan motor, korban luka di kepala', '081234567890', 'IN_PROGRESS', 'CRITICAL', ARRAY['polisi', 'ambulans']),
('SP-20251203-0002', 'INFRA', 'Jalan Rusak', 'Jl. Cihampelas, depan PVJ', 'Jalan berlubang besar, sudah 2 motor jatuh', '081234567891', 'PENDING', 'HIGH', ARRAY['pupr']),
('SP-20251203-0003', 'KEBERSIHAN', 'Sampah Menumpuk', 'Gang Sukamaju RT 05 RW 03, Coblong', 'Sampah sudah 1 minggu tidak diangkut, bau menyengat', '081234567892', 'PENDING', 'MEDIUM', ARRAY['dlh']),
('SP-20251203-0004', 'SOSIAL', 'ODGJ', 'Kolong jembatan Pasupati', 'Ada ODGJ terlantar butuh pertolongan', '081234567893', 'IN_PROGRESS', 'HIGH', ARRAY['dinsos']),
('SP-20251203-0005', 'DARURAT', 'Kebakaran', 'Jl. Pajajaran No. 50', 'Ada kebakaran rumah, api sudah besar', '081234567894', 'RESOLVED', 'CRITICAL', ARRAY['damkar', 'polisi'])
ON CONFLICT (id) DO NOTHING;

-- Demo timeline entries
INSERT INTO ticket_timeline (ticket_id, action, message, created_by, created_at) VALUES
('SP-20251203-0001', 'CREATED', 'Laporan diterima via telepon', 'system', NOW() - INTERVAL '2 hours'),
('SP-20251203-0001', 'ASSIGNED', 'Diteruskan ke Polisi dan Ambulans', 'system', NOW() - INTERVAL '2 hours'),
('SP-20251203-0001', 'UPDATE', 'Ambulans dalam perjalanan ke lokasi', 'ambulans', NOW() - INTERVAL '1 hour 45 minutes'),
('SP-20251203-0001', 'UPDATE', 'Polisi tiba di lokasi', 'polisi', NOW() - INTERVAL '1 hour 30 minutes'),
('SP-20251203-0001', 'UPDATE', 'Korban sedang dibawa ke RS Hasan Sadikin', 'ambulans', NOW() - INTERVAL '1 hour');
```

---

## Database Views

### `v_tickets_with_stats`

Aggregated view for dashboard.

```sql
CREATE VIEW v_tickets_with_stats AS
SELECT 
  t.*,
  (SELECT COUNT(*) FROM ticket_timeline WHERE ticket_id = t.id) as timeline_count,
  (SELECT MAX(created_at) FROM ticket_timeline WHERE ticket_id = t.id) as last_activity
FROM tickets t;
```

### `v_dashboard_stats`

Stats for dashboard.

```sql
CREATE VIEW v_dashboard_stats AS
SELECT
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'PENDING') as pending,
  COUNT(*) FILTER (WHERE status = 'IN_PROGRESS') as in_progress,
  COUNT(*) FILTER (WHERE status = 'RESOLVED') as resolved,
  COUNT(*) FILTER (WHERE status = 'CANCELLED') as cancelled,
  COUNT(*) FILTER (WHERE urgency = 'CRITICAL') as critical,
  COUNT(*) FILTER (WHERE urgency = 'HIGH') as high,
  COUNT(*) FILTER (WHERE urgency = 'MEDIUM') as medium,
  COUNT(*) FILTER (WHERE urgency = 'LOW') as low,
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today_total,
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE AND status = 'PENDING') as today_pending,
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE AND status = 'RESOLVED') as today_resolved
FROM tickets;
```

---

## Supabase Configuration

### Environment Variables

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### TypeScript Types (auto-generated)

```typescript
// types/database.ts
export interface Database {
  public: {
    Tables: {
      dinas: {
        Row: {
          id: string
          name: string
          password_hash: string
          categories: string[]
          phone: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['dinas']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['dinas']['Insert']>
      }
      tickets: {
        Row: {
          id: string
          category: 'DARURAT' | 'INFRA' | 'KEBERSIHAN' | 'SOSIAL' | 'LAINNYA'
          subcategory: string | null
          location: string
          description: string
          reporter_phone: string
          status: 'PENDING' | 'IN_PROGRESS' | 'ESCALATED' | 'RESOLVED' | 'CANCELLED'
          urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
          assigned_dinas: string[]
          call_sid: string | null
          transcription: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['tickets']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['tickets']['Insert']>
      }
      ticket_timeline: {
        Row: {
          id: string
          ticket_id: string
          action: 'CREATED' | 'ASSIGNED' | 'STATUS_CHANGE' | 'UPDATE' | 'ESCALATED' | 'RESOLVED' | 'CANCELLED' | 'NOTE'
          message: string
          created_by: string
          is_public: boolean
          metadata: Record<string, any> | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['ticket_timeline']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['ticket_timeline']['Insert']>
      }
      sms_logs: {
        Row: {
          id: string
          ticket_id: string | null
          phone_to: string
          message: string
          direction: 'INBOUND' | 'OUTBOUND'
          twilio_sid: string | null
          status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['sms_logs']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['sms_logs']['Insert']>
      }
      call_logs: {
        Row: {
          id: string
          ticket_id: string | null
          call_sid: string
          phone_from: string
          recording_url: string | null
          duration_seconds: number | null
          status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'NO_ANSWER'
          created_at: string
          ended_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['call_logs']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['call_logs']['Insert']>
      }
    }
    Views: {
      v_tickets_with_stats: {
        Row: Database['public']['Tables']['tickets']['Row'] & {
          timeline_count: number
          last_activity: string | null
        }
      }
      v_dashboard_stats: {
        Row: {
          total: number
          pending: number
          in_progress: number
          resolved: number
          cancelled: number
          critical: number
          high: number
          medium: number
          low: number
          today_total: number
          today_pending: number
          today_resolved: number
        }
      }
    }
  }
}
```

---

## Migration Files

Untuk Supabase, buat migration files:

```
supabase/migrations/
├── 20251203000001_create_dinas_table.sql
├── 20251203000002_create_tickets_table.sql
├── 20251203000003_create_timeline_table.sql
├── 20251203000004_create_logs_tables.sql
├── 20251203000005_create_functions.sql
├── 20251203000006_create_triggers.sql
├── 20251203000007_create_views.sql
├── 20251203000008_create_rls_policies.sql
└── 20251203000009_seed_data.sql
```

---

*Document Version: 1.0*  
*Last Updated: 3 December 2025*  
*For: Development Team*
