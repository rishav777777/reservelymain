-- ═══════════════════════════════════════════════════════
-- 020 DEMO REQUEST STATUS EXPANSION
-- Adds 'contacted' status and admin_notes column
-- ═══════════════════════════════════════════════════════

ALTER TABLE demo_requests
  DROP CONSTRAINT IF EXISTS demo_requests_status_check;

-- Normalize any legacy status values before adding the new constraint
UPDATE demo_requests SET status = 'declined' WHERE status = 'closed';
UPDATE demo_requests SET status = 'pending'  WHERE status NOT IN ('pending', 'contacted', 'approved', 'declined');

ALTER TABLE demo_requests
  ADD CONSTRAINT demo_requests_status_check
    CHECK (status IN ('pending', 'contacted', 'approved', 'declined'));

ALTER TABLE demo_requests
  ADD COLUMN IF NOT EXISTS admin_notes  text,
  ADD COLUMN IF NOT EXISTS follow_up_at timestamptz,
  ADD COLUMN IF NOT EXISTS declined_at  timestamptz,
  ADD COLUMN IF NOT EXISTS approved_at  timestamptz,
  ADD COLUMN IF NOT EXISTS restaurant_id uuid REFERENCES restaurants(id) ON DELETE SET NULL;
