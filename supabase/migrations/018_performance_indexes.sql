-- ═══════════════════════════════════════════════════════
-- 018 PERFORMANCE INDEXES
-- ═══════════════════════════════════════════════════════

-- Reservations: most common query patterns
CREATE INDEX IF NOT EXISTS reservations_restaurant_date_idx
  ON reservations (restaurant_id, reservation_date);

CREATE INDEX IF NOT EXISTS reservations_restaurant_status_idx
  ON reservations (restaurant_id, status);

CREATE INDEX IF NOT EXISTS reservations_reference_code_idx
  ON reservations (reference_code);

CREATE INDEX IF NOT EXISTS reservations_guest_email_idx
  ON reservations (restaurant_id, guest_email);

-- Table holds: expiry cleanup + conflict checks
CREATE INDEX IF NOT EXISTS table_holds_held_until_idx
  ON table_holds (held_until);

CREATE INDEX IF NOT EXISTS table_holds_lookup_idx
  ON table_holds (restaurant_id, table_id, reservation_date, reservation_time);

-- Profiles: role filtering
CREATE INDEX IF NOT EXISTS profiles_restaurant_role_idx
  ON profiles (restaurant_id, role);

-- Opening hours: per-restaurant lookup
CREATE INDEX IF NOT EXISTS opening_hours_restaurant_idx
  ON opening_hours (restaurant_id, day_of_week);

-- Audit log: chronological per-restaurant
CREATE INDEX IF NOT EXISTS audit_logs_restaurant_created_idx
  ON audit_logs (restaurant_id, created_at DESC);
