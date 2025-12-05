-- Performance Optimization Indexes
-- Run this in Supabase SQL Editor

-- ============================================
-- ADD MISSING COLUMNS
-- ============================================

-- Add resolved_at column for tracking resolution time
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

-- ============================================
-- COMPOSITE INDEXES FOR COMMON QUERY PATTERNS
-- ============================================

-- Dashboard query: filter by status + urgency + sort by created_at
CREATE INDEX IF NOT EXISTS idx_tickets_status_urgency_created 
ON tickets(status, urgency, created_at DESC);

-- Map/analytics query: filter by status + category
CREATE INDEX IF NOT EXISTS idx_tickets_status_category 
ON tickets(status, category);

-- Date range queries (export, analytics)
CREATE INDEX IF NOT EXISTS idx_tickets_created_at_status 
ON tickets(created_at DESC, status);

-- Reporter lookup (for track page)
CREATE INDEX IF NOT EXISTS idx_tickets_reporter_phone 
ON tickets(reporter_phone);

-- Resolution time calculations
CREATE INDEX IF NOT EXISTS idx_tickets_resolved_at 
ON tickets(resolved_at DESC) WHERE resolved_at IS NOT NULL;

-- ============================================
-- PARTIAL INDEXES FOR SPECIFIC QUERIES
-- ============================================

-- Critical tickets (dashboard alert) - only PENDING critical
CREATE INDEX IF NOT EXISTS idx_tickets_critical_pending 
ON tickets(created_at DESC) 
WHERE urgency = 'CRITICAL' AND status = 'PENDING';

-- Active tickets (not resolved/cancelled)
CREATE INDEX IF NOT EXISTS idx_tickets_active 
ON tickets(created_at DESC) 
WHERE status IN ('PENDING', 'IN_PROGRESS', 'ESCALATED');

-- ============================================
-- FULL TEXT SEARCH INDEX
-- ============================================

-- Add tsvector column for full text search
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create GIN index for full text search
CREATE INDEX IF NOT EXISTS idx_tickets_search ON tickets USING GIN(search_vector);

-- Create function to update search vector
CREATE OR REPLACE FUNCTION tickets_search_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('indonesian', coalesce(NEW.id, '')), 'A') ||
    setweight(to_tsvector('indonesian', coalesce(NEW.location, '')), 'B') ||
    setweight(to_tsvector('indonesian', coalesce(NEW.description, '')), 'C') ||
    setweight(to_tsvector('indonesian', coalesce(NEW.subcategory, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update search vector
DROP TRIGGER IF EXISTS trigger_tickets_search ON tickets;
CREATE TRIGGER trigger_tickets_search
  BEFORE INSERT OR UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION tickets_search_update();

-- Update existing records
UPDATE tickets SET search_vector = 
  setweight(to_tsvector('indonesian', coalesce(id, '')), 'A') ||
  setweight(to_tsvector('indonesian', coalesce(location, '')), 'B') ||
  setweight(to_tsvector('indonesian', coalesce(description, '')), 'C') ||
  setweight(to_tsvector('indonesian', coalesce(subcategory, '')), 'D');

-- ============================================
-- TIMELINE TABLE INDEXES
-- ============================================

-- Composite index for timeline queries
CREATE INDEX IF NOT EXISTS idx_timeline_ticket_created 
ON ticket_timeline(ticket_id, created_at DESC);

-- Public timeline entries (for tracking page)
CREATE INDEX IF NOT EXISTS idx_timeline_public 
ON ticket_timeline(ticket_id, created_at DESC) 
WHERE is_public = true;

-- ============================================
-- SMS/CALL LOGS INDEXES  
-- ============================================

-- SMS logs by ticket
CREATE INDEX IF NOT EXISTS idx_sms_logs_ticket 
ON sms_logs(ticket_id, created_at DESC);

-- Call logs by ticket
CREATE INDEX IF NOT EXISTS idx_call_logs_ticket 
ON call_logs(ticket_id, created_at DESC);

-- ============================================
-- MATERIALIZED VIEW FOR STATS (OPTIONAL)
-- ============================================

-- Create materialized view for dashboard stats
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_ticket_stats AS
SELECT 
  COUNT(*) FILTER (WHERE status = 'PENDING') as pending_count,
  COUNT(*) FILTER (WHERE status = 'IN_PROGRESS') as in_progress_count,
  COUNT(*) FILTER (WHERE status = 'RESOLVED') as resolved_count,
  COUNT(*) FILTER (WHERE status = 'CANCELLED') as cancelled_count,
  COUNT(*) FILTER (WHERE urgency = 'CRITICAL') as critical_count,
  COUNT(*) FILTER (WHERE urgency = 'HIGH') as high_count,
  COUNT(*) FILTER (WHERE urgency = 'MEDIUM') as medium_count,
  COUNT(*) FILTER (WHERE urgency = 'LOW') as low_count,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as today_total,
  COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE AND status = 'PENDING') as today_pending,
  COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE AND status = 'RESOLVED') as today_resolved,
  NOW() as refreshed_at
FROM tickets;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_ticket_stats ON mv_ticket_stats(refreshed_at);

-- Function to refresh stats (call periodically or after updates)
CREATE OR REPLACE FUNCTION refresh_ticket_stats() RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_ticket_stats;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ANALYZE TABLES
-- ============================================

-- Update table statistics for query planner
ANALYZE tickets;
ANALYZE ticket_timeline;
ANALYZE sms_logs;
ANALYZE call_logs;
