-- Migration 023: Soft-delete for restaurants
-- Deleted restaurants are hidden from normal operation but data is retained
-- for 90 days. The purge cron at /api/cron/purge-deleted performs the hard delete.

ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS deleted_at     TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_reason TEXT        DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS purge_after    TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN restaurants.deleted_at     IS 'Set when admin soft-deletes; NULL means active';
COMMENT ON COLUMN restaurants.deleted_reason IS 'Admin note explaining the deletion';
COMMENT ON COLUMN restaurants.purge_after    IS 'Hard-delete fires after this date (deleted_at + 90 days)';

CREATE INDEX IF NOT EXISTS idx_restaurants_purge_after
  ON restaurants(purge_after)
  WHERE purge_after IS NOT NULL AND deleted_at IS NOT NULL;
