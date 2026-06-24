-- 014_superadmin.sql
-- Super-admin flag, platform-wide CMS tables (testimonials, faqs, settings)

-- ── 1. Superadmin flag on profiles ────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_superadmin boolean NOT NULL DEFAULT false;

-- ── 2. Platform settings (key-value store) ────────────────────────────────
CREATE TABLE IF NOT EXISTS platform_settings (
  key        text        PRIMARY KEY,
  value      jsonb       NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid        REFERENCES auth.users(id)
);

-- ── 3. Testimonials ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS testimonials (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name     text        NOT NULL,
  author_role     text,
  restaurant_name text,
  location        text,
  content         text        NOT NULL,
  rating          int         NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  is_published    boolean     NOT NULL DEFAULT false,
  sort_order      int         NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ── 4. FAQs ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS faqs (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  question     text        NOT NULL,
  answer       text        NOT NULL,
  category     text        NOT NULL DEFAULT 'general',
  sort_order   int         NOT NULL DEFAULT 0,
  is_published boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ── 5. RLS ────────────────────────────────────────────────────────────────
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials      ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs              ENABLE ROW LEVEL SECURITY;

-- platform_settings: superadmin full access only
DROP POLICY IF EXISTS "superadmin_all" ON platform_settings;
CREATE POLICY "superadmin_all" ON platform_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_superadmin = true)
);

-- testimonials: public can read published; superadmin has full access
DROP POLICY IF EXISTS "public_read"    ON testimonials;
DROP POLICY IF EXISTS "superadmin_all" ON testimonials;
CREATE POLICY "public_read"    ON testimonials FOR SELECT USING (is_published = true);
CREATE POLICY "superadmin_all" ON testimonials FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_superadmin = true)
);

-- faqs: same pattern
DROP POLICY IF EXISTS "public_read"    ON faqs;
DROP POLICY IF EXISTS "superadmin_all" ON faqs;
CREATE POLICY "public_read"    ON faqs FOR SELECT USING (is_published = true);
CREATE POLICY "superadmin_all" ON faqs FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_superadmin = true)
);

-- ── 6. Default platform settings ─────────────────────────────────────────
INSERT INTO platform_settings (key, value) VALUES
  ('maintenance_mode', 'false'),
  ('trial_days',       '30'),
  ('contact_email',    '"support@reservely.app"'),
  ('platform_name',    '"Reservely"')
ON CONFLICT (key) DO NOTHING;

-- ── 7. Seed testimonials ─────────────────────────────────────────────────
INSERT INTO testimonials (author_name, author_role, restaurant_name, location, content, rating, is_published, sort_order) VALUES
  ('Maria Hofbauer', 'Inhaberin', 'Zum Goldenen Hirsch', 'München',
   'Seit wir Reservely nutzen, hat sich unsere Buchungsquote verdoppelt. Kein Papier, keine verlorenen Telefonate mehr.',
   5, true, 1),
  ('Thomas Gruber', 'Restaurantleiter', 'Gasthof Gruber', 'Wien',
   'Das Setup war in unter einer Stunde abgeschlossen. Die Gäste lieben das Online-Buchungssystem — wir auch.',
   5, true, 2),
  ('Lena Bachmann', 'Geschäftsführerin', 'Biergarten am See', 'Salzburg',
   'Endlich ein System, das für kleine Restaurants gemacht ist. Keine Enterprise-Preise, keine Verträge.',
   5, true, 3);

-- ── 8. Seed FAQs ─────────────────────────────────────────────────────────
INSERT INTO faqs (question, answer, category, sort_order, is_published) VALUES
  ('How long does setup take?',
   'Under 30 minutes. You add opening hours, configure your tables, and get a booking link. No developer or technical knowledge needed.',
   'general', 1, true),
  ('Do my guests need to create an account?',
   'No. Guests book directly via your link — name, email, consent, done. GDPR-compliant without friction.',
   'general', 2, true),
  ('What happens after the beta period?',
   'You choose your plan (from €29/month) and enter payment details before any charge. No surprise fees, no lock-in.',
   'pricing', 3, true),
  ('Is Reservely GDPR-compliant?',
   'Yes. Guest data is processed only for the reservation, stored on EU servers, and can be deleted after the visit. It is never shared with third parties.',
   'gdpr', 4, true),
  ('Can I embed it in my existing website?',
   'Yes. Your booking link (/book/your-restaurant) can be embedded as a button, link, or iFrame on any website.',
   'technical', 5, true),
  ('Is there a mobile app?',
   'The dashboard works fully in the browser on any device including smartphones. A native app is planned for Phase 3.',
   'technical', 6, true),
  ('Can I switch plans or cancel?',
   'Yes, at any time. No minimum term, no cancellation fee. You keep access until the end of the billing period.',
   'pricing', 7, true),
  ('What payment methods are supported?',
   'Credit card and SEPA debit via Stripe. Billing is monthly. Invoices are provided automatically for your accounting.',
   'pricing', 8, true);
