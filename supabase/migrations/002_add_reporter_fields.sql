-- Migration: Add reporter name and validated address fields
-- Run this in Supabase SQL Editor after 001_initial_schema.sql

-- Add new columns to tickets table
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS reporter_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS validated_address TEXT,
ADD COLUMN IF NOT EXISTS address_lat DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS address_lng DECIMAL(11, 8);

-- Add index for location-based queries (optional, for future features)
CREATE INDEX IF NOT EXISTS idx_tickets_location ON tickets(address_lat, address_lng);

-- Update existing demo tickets with sample names
UPDATE tickets SET reporter_name = 'Budi Santoso' WHERE id = 'SP-20251203-0001';
UPDATE tickets SET reporter_name = 'Siti Rahayu' WHERE id = 'SP-20251203-0002';
UPDATE tickets SET reporter_name = 'Ahmad Hidayat' WHERE id = 'SP-20251203-0003';
UPDATE tickets SET reporter_name = 'Dewi Lestari' WHERE id = 'SP-20251203-0004';
UPDATE tickets SET reporter_name = 'Rina Wijaya' WHERE id = 'SP-20251203-0005';

-- Fix password hash for all dinas (password: demo2025)
UPDATE dinas 
SET password_hash = '$2b$10$MZ7JjsTpRf66T0nN1.BX9uP9Mj9hubQ34je3DKg/.Z4OdsPZUzgEG';
