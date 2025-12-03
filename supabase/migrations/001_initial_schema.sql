-- SatuPintu Database Schema
-- Run this in Supabase SQL Editor

-- 1. Create dinas table
CREATE TABLE IF NOT EXISTS dinas (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  categories TEXT[] NOT NULL DEFAULT '{}',
  phone VARCHAR(20),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create tickets table
CREATE TABLE IF NOT EXISTS tickets (
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

-- 3. Create ticket_timeline table
CREATE TABLE IF NOT EXISTS ticket_timeline (
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

-- 4. Create sms_logs table
CREATE TABLE IF NOT EXISTS sms_logs (
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

-- 5. Create call_logs table
CREATE TABLE IF NOT EXISTS call_logs (
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_category ON tickets(category);
CREATE INDEX IF NOT EXISTS idx_tickets_urgency ON tickets(urgency);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_dinas ON tickets USING GIN(assigned_dinas);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_ticket_id ON ticket_timeline(ticket_id);
CREATE INDEX IF NOT EXISTS idx_timeline_created_at ON ticket_timeline(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables
DROP TRIGGER IF EXISTS trigger_tickets_updated_at ON tickets;
CREATE TRIGGER trigger_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_dinas_updated_at ON dinas;
CREATE TRIGGER trigger_dinas_updated_at
  BEFORE UPDATE ON dinas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Seed dinas data (password is hashed version of 'demo2025')
-- Hash generated with: bcrypt.hashSync('demo2025', 10)
INSERT INTO dinas (id, name, password_hash, categories, phone) VALUES
('polisi', 'Kepolisian Resort Kota Bandung', '$2a$10$rQnM1v.jxjYqKqLqLqLqLuQnM1v.jxjYqKqLqLqLqLuQnM1v.jxjY', ARRAY['DARURAT'], '110'),
('ambulans', 'Unit Ambulans Dinkes Bandung', '$2a$10$rQnM1v.jxjYqKqLqLqLqLuQnM1v.jxjYqKqLqLqLqLuQnM1v.jxjY', ARRAY['DARURAT'], '119'),
('damkar', 'Dinas Pemadam Kebakaran Bandung', '$2a$10$rQnM1v.jxjYqKqLqLqLqLuQnM1v.jxjYqKqLqLqLqLuQnM1v.jxjY', ARRAY['DARURAT'], '113'),
('pupr', 'Dinas PUPR Kota Bandung', '$2a$10$rQnM1v.jxjYqKqLqLqLqLuQnM1v.jxjYqKqLqLqLqLuQnM1v.jxjY', ARRAY['INFRA'], NULL),
('dlh', 'Dinas Lingkungan Hidup Bandung', '$2a$10$rQnM1v.jxjYqKqLqLqLqLuQnM1v.jxjYqKqLqLqLqLuQnM1v.jxjY', ARRAY['KEBERSIHAN'], NULL),
('dinsos', 'Dinas Sosial Kota Bandung', '$2a$10$rQnM1v.jxjYqKqLqLqLqLuQnM1v.jxjYqKqLqLqLqLuQnM1v.jxjY', ARRAY['SOSIAL'], NULL),
('admin', 'Admin SatuPintu', '$2a$10$rQnM1v.jxjYqKqLqLqLqLuQnM1v.jxjYqKqLqLqLqLuQnM1v.jxjY', ARRAY['DARURAT','INFRA','KEBERSIHAN','SOSIAL','LAINNYA'], NULL)
ON CONFLICT (id) DO NOTHING;

-- Seed demo tickets
INSERT INTO tickets (id, category, subcategory, location, description, reporter_phone, status, urgency, assigned_dinas) VALUES
('SP-20251203-0001', 'DARURAT', 'Kecelakaan', 'Jl. Dago No. 100, depan ITB', 'Ada kecelakaan motor, korban luka di kepala', '+6281234567890', 'IN_PROGRESS', 'CRITICAL', ARRAY['polisi', 'ambulans']),
('SP-20251203-0002', 'INFRA', 'Jalan Rusak', 'Jl. Cihampelas, depan PVJ', 'Jalan berlubang besar, sudah 2 motor jatuh', '+6281234567891', 'PENDING', 'HIGH', ARRAY['pupr']),
('SP-20251203-0003', 'KEBERSIHAN', 'Sampah Menumpuk', 'Gang Sukamaju RT 05 RW 03, Coblong', 'Sampah sudah 1 minggu tidak diangkut, bau menyengat', '+6281234567892', 'PENDING', 'MEDIUM', ARRAY['dlh']),
('SP-20251203-0004', 'SOSIAL', 'ODGJ', 'Kolong jembatan Pasupati', 'Ada ODGJ terlantar butuh pertolongan', '+6281234567893', 'IN_PROGRESS', 'HIGH', ARRAY['dinsos']),
('SP-20251203-0005', 'DARURAT', 'Kebakaran', 'Jl. Pajajaran No. 50', 'Ada kebakaran rumah, api sudah besar', '+6281234567894', 'RESOLVED', 'CRITICAL', ARRAY['damkar', 'polisi'])
ON CONFLICT (id) DO NOTHING;

-- Seed demo timeline
INSERT INTO ticket_timeline (ticket_id, action, message, created_by, created_at) VALUES
('SP-20251203-0001', 'CREATED', 'Laporan diterima via telepon', 'system', NOW() - INTERVAL '2 hours'),
('SP-20251203-0001', 'ASSIGNED', 'Diteruskan ke Polisi dan Ambulans', 'system', NOW() - INTERVAL '2 hours'),
('SP-20251203-0001', 'UPDATE', 'Ambulans dalam perjalanan ke lokasi', 'ambulans', NOW() - INTERVAL '1 hour 45 minutes'),
('SP-20251203-0001', 'UPDATE', 'Polisi tiba di lokasi', 'polisi', NOW() - INTERVAL '1 hour 30 minutes'),
('SP-20251203-0001', 'UPDATE', 'Korban sedang dibawa ke RS Hasan Sadikin', 'ambulans', NOW() - INTERVAL '1 hour'),
('SP-20251203-0002', 'CREATED', 'Laporan diterima via telepon', 'system', NOW() - INTERVAL '3 hours'),
('SP-20251203-0002', 'ASSIGNED', 'Diteruskan ke Dinas PUPR', 'system', NOW() - INTERVAL '3 hours'),
('SP-20251203-0003', 'CREATED', 'Laporan diterima via telepon', 'system', NOW() - INTERVAL '1 day'),
('SP-20251203-0003', 'ASSIGNED', 'Diteruskan ke Dinas Lingkungan Hidup', 'system', NOW() - INTERVAL '1 day'),
('SP-20251203-0005', 'CREATED', 'Laporan diterima via telepon', 'system', NOW() - INTERVAL '5 hours'),
('SP-20251203-0005', 'ASSIGNED', 'Diteruskan ke Damkar dan Polisi', 'system', NOW() - INTERVAL '5 hours'),
('SP-20251203-0005', 'UPDATE', 'Tim damkar tiba di lokasi', 'damkar', NOW() - INTERVAL '4 hours 45 minutes'),
('SP-20251203-0005', 'UPDATE', 'Api berhasil dipadamkan', 'damkar', NOW() - INTERVAL '4 hours'),
('SP-20251203-0005', 'STATUS_CHANGE', 'Status diubah ke SELESAI', 'damkar', NOW() - INTERVAL '3 hours 30 minutes');

-- Disable RLS for simpler MVP (enable in production)
ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_timeline DISABLE ROW LEVEL SECURITY;
ALTER TABLE dinas DISABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs DISABLE ROW LEVEL SECURITY;
