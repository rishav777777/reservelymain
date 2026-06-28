-- GDPR Art. 28: restaurants are data controllers, Reservely is the data processor.
-- A signed Data Processing Agreement is required before the restaurant can access their dashboard.

ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS dpa_signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS dpa_version   TEXT;

CREATE INDEX IF NOT EXISTS idx_restaurants_dpa_signed ON restaurants (dpa_signed_at)
  WHERE dpa_signed_at IS NULL;
