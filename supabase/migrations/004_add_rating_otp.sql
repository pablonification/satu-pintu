-- Migration: Add OTP columns for rating authentication
-- Run this in Supabase SQL Editor after 003_add_photo_rating.sql

-- Add OTP columns for rating authentication
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS rating_otp VARCHAR(6),
ADD COLUMN IF NOT EXISTS rating_otp_expires_at TIMESTAMPTZ;

-- Index for OTP lookup
CREATE INDEX IF NOT EXISTS idx_tickets_rating_otp ON tickets(id, rating_otp) 
WHERE rating_otp IS NOT NULL;
