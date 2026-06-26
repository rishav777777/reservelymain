-- Migration 021: Capacity limits and default duration per restaurant
-- Run in Supabase SQL Editor → these columns power max covers per timeslot
-- and the restaurant's default reservation duration setting.

ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS max_covers_per_slot      INT     DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS default_duration_minutes INT     DEFAULT 90;

COMMENT ON COLUMN restaurants.max_covers_per_slot      IS 'Maximum total party_size accepted per time slot (NULL = unlimited)';
COMMENT ON COLUMN restaurants.default_duration_minutes IS 'Default reservation duration in minutes shown to guests (default 90)';
