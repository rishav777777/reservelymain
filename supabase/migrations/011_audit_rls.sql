-- Allow owners to read audit logs for their own restaurant.
-- INSERT is done by logAction (service role) which bypasses RLS.

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'audit_logs' AND policyname = 'owner_read_audit'
  ) THEN
    CREATE POLICY "owner_read_audit" ON audit_logs
      FOR SELECT USING (
        restaurant_id IN (
          SELECT restaurant_id FROM profiles
          WHERE id = auth.uid()
            AND role = 'owner'
            AND is_active = true
        )
      );
  END IF;
END $$;
