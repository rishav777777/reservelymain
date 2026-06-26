-- Migration 025: Drop over-permissive public-read RLS policies
--
-- These three policies allowed any user (authenticated or not) to SELECT all
-- rows from restaurant_tables, opening_hours, and floor_zones — leaking every
-- restaurant's configuration data across tenants.
--
-- All public-facing booking-portal routes (/api/book/[slug], /api/layout,
-- /book/[slug]/page.tsx, /quick/[slug]/page.tsx) already use the service-role
-- admin client with an explicit restaurant_id filter, so these RLS policies
-- are no longer needed for public access.

DROP POLICY IF EXISTS "public_read_tables" ON restaurant_tables;
DROP POLICY IF EXISTS "public_read_hours"  ON opening_hours;
DROP POLICY IF EXISTS "public_read_zones"  ON floor_zones;
