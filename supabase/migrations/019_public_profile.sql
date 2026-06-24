-- ═══════════════════════════════════════════════════════
-- 019 PUBLIC PROFILE FIELDS
-- Adds cuisine_type, city, and cover_image_url to restaurants
-- so they can appear in the public restaurant directory.
-- ═══════════════════════════════════════════════════════

ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS cuisine_type    text,
  ADD COLUMN IF NOT EXISTS city            text,
  ADD COLUMN IF NOT EXISTS cover_image_url text;

-- Allow anonymous reads for public directory (booking_enabled restaurants only)
DROP POLICY IF EXISTS "public_read_restaurants" ON restaurants;
CREATE POLICY "public_read_restaurants" ON restaurants
  FOR SELECT USING (booking_enabled = true AND setup_completed = true);
