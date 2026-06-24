-- ═══════════════════════════════════════════════════════
-- 002 RLS POLICIES
-- ═══════════════════════════════════════════════════════

-- Append-only audit log
DROP RULE IF EXISTS no_update_audit ON audit_logs;
CREATE RULE no_update_audit AS ON UPDATE TO audit_logs DO INSTEAD NOTHING;
DROP RULE IF EXISTS no_delete_audit ON audit_logs;
CREATE RULE no_delete_audit AS ON DELETE TO audit_logs DO INSTEAD NOTHING;

-- Enable RLS
ALTER TABLE restaurants       ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_holds       ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices           ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_requests     ENABLE ROW LEVEL SECURITY;

-- Tenant isolation helper policy (applied to all tables with restaurant_id)
CREATE POLICY "tenant_isolation" ON reservations
  FOR ALL USING (
    restaurant_id IN (
      SELECT restaurant_id FROM profiles
      WHERE id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "tenant_isolation" ON restaurant_tables
  FOR ALL USING (
    restaurant_id IN (
      SELECT restaurant_id FROM profiles
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Public guest read (for booking portal)
CREATE POLICY "public_read_tables" ON restaurant_tables
  FOR SELECT USING (is_active = true);

-- Guests can insert reservations (rate-limited at API level)
CREATE POLICY "guest_insert" ON reservations
  FOR INSERT WITH CHECK (true);

-- Platform admin can read all demo requests
CREATE POLICY "platform_admin_requests" ON demo_requests
  FOR ALL USING (true);
