-- Migration: Add photo proof and rating columns to tickets table
-- Run this in Supabase SQL Editor after 002_add_reporter_fields.sql

-- Add photo proof and rating columns to tickets table
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS resolution_photo_before TEXT,
ADD COLUMN IF NOT EXISTS resolution_photo_after TEXT,
ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5),
ADD COLUMN IF NOT EXISTS feedback TEXT,
ADD COLUMN IF NOT EXISTS rated_at TIMESTAMPTZ;

-- Add index for rated tickets
CREATE INDEX IF NOT EXISTS idx_tickets_rating ON tickets(rating) WHERE rating IS NOT NULL;

-- Add index for resolved tickets with photos
CREATE INDEX IF NOT EXISTS idx_tickets_resolved_photos ON tickets(status) 
WHERE status = 'RESOLVED' AND resolution_photo_after IS NOT NULL;
