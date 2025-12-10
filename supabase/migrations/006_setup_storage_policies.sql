-- Migration: Setup Storage Bucket and Policies for ticket-photos
-- This migration creates the storage bucket and RLS policies for photo uploads

-- Note: Bucket creation must be done via Supabase Dashboard or CLI
-- This SQL file documents the policies needed

-- Storage policies for ticket-photos bucket
-- Run these in Supabase Dashboard -> Storage -> ticket-photos -> Policies

-- 1. Allow public read access (so photos can be viewed by anyone with the link)
CREATE POLICY "Public read access for ticket photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'ticket-photos');

-- 2. Allow anon and authenticated insert (for uploading photos)
CREATE POLICY "Allow anon insert for ticket photos"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'ticket-photos');

-- 3. Allow authenticated update (for overwriting photos if needed)
CREATE POLICY "Allow authenticated update for ticket photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'ticket-photos')
WITH CHECK (bucket_id = 'ticket-photos');

-- 4. Allow authenticated delete (for removing photos if needed)
CREATE POLICY "Allow authenticated delete for ticket photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'ticket-photos');

-- Note: The bucket must be created manually via Supabase Dashboard with these settings:
-- - Name: ticket-photos
-- - Public: true (enabled)
-- - File size limit: 5MB (optional)
-- - Allowed MIME types: image/jpeg, image/png, image/webp (optional)
