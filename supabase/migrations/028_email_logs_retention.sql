-- GDPR compliance: storage limitation and right-to-erasure for email_logs

-- Purge logs older than 90 days (called by Vercel Cron or pg_cron)
CREATE OR REPLACE FUNCTION purge_old_email_logs()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE cnt INT;
BEGIN
  DELETE FROM email_logs WHERE created_at < now() - INTERVAL '90 days';
  GET DIAGNOSTICS cnt = ROW_COUNT;
  RETURN cnt;
END;
$$;

-- Anonymize a specific email on GDPR Article 17 erasure requests
-- Usage: SELECT anonymize_email_in_logs('user@example.com');
CREATE OR REPLACE FUNCTION anonymize_email_in_logs(target_email TEXT)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE cnt INT;
BEGIN
  UPDATE email_logs
  SET to_email = 'anonymized@deleted.local'
  WHERE to_email = target_email;
  GET DIAGNOSTICS cnt = ROW_COUNT;
  RETURN cnt;
END;
$$;

-- Optional: enable pg_cron extension via Supabase Dashboard → Database → Extensions,
-- then uncomment the line below to schedule daily purge at 03:00 UTC:
-- SELECT cron.schedule('purge-email-logs-90d', '0 3 * * *', 'SELECT purge_old_email_logs()');
-- The Vercel Cron route /api/cron/purge-email-logs runs instead if pg_cron is not enabled.
