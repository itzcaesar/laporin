-- ── Manual Migration: PostGIS and pgvector Setup ──
-- This migration adds PostGIS geometry columns and pgvector indexes
-- that Prisma doesn't natively support.
--
-- Run this AFTER the initial Prisma migration:
-- 1. Run: npx prisma migrate dev --name init
-- 2. Then run this file manually: psql laporin < prisma/migrations/manual/add_postgis.sql

-- Add PostGIS geometry column to reports
ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS location_point geometry(Point, 4326);

-- Create spatial index for location-based queries
CREATE INDEX IF NOT EXISTS reports_location_point_idx
  ON reports USING GIST (location_point);

-- Create index for pgvector similarity search (duplicate detection)
CREATE INDEX IF NOT EXISTS reports_embedding_vector_idx
  ON reports USING ivfflat (embedding_vector vector_cosine_ops)
  WITH (lists = 100);

-- Helper function: auto-update location_point from lat/lng
-- This trigger ensures location_point is always in sync with locationLat/locationLng
CREATE OR REPLACE FUNCTION sync_report_location()
RETURNS TRIGGER AS $$
BEGIN
  NEW.location_point = ST_SetSRID(
    ST_MakePoint(NEW.location_lng::float8, NEW.location_lat::float8),
    4326
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically sync location_point
CREATE TRIGGER sync_report_location_trigger
  BEFORE INSERT OR UPDATE OF location_lat, location_lng ON reports
  FOR EACH ROW EXECUTE FUNCTION sync_report_location();

-- Verify extensions are enabled
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
    RAISE EXCEPTION 'PostGIS extension is not enabled. Run: CREATE EXTENSION postgis;';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
    RAISE EXCEPTION 'pgvector extension is not enabled. Run: CREATE EXTENSION vector;';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
    RAISE EXCEPTION 'uuid-ossp extension is not enabled. Run: CREATE EXTENSION "uuid-ossp";';
  END IF;
END $$;
