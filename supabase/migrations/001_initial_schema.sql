-- ═══════════════════════════════════════════════════════
-- 001 INITIAL SCHEMA — Core tables existing at v2.x
-- Apply in Supabase SQL Editor if starting fresh.
-- If tables already exist, skip to 003+.
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS restaurants (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text UNIQUE,
  subdomain   text,
  email       text,
  phone       text,
  address     text,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE SET NULL,
  full_name     text,
  email         text,
  role          text NOT NULL DEFAULT 'staff'
                  CHECK (role IN ('owner', 'manager', 'staff')),
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS restaurant_tables (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name          text NOT NULL,
  capacity      integer NOT NULL CHECK (capacity > 0),
  category      text NOT NULL DEFAULT 'INDOOR',
  is_active     boolean NOT NULL DEFAULT true,
  image_url     text,
  image_urls    text[] NOT NULL DEFAULT '{}',
  x             integer,
  y             integer,
  w             integer DEFAULT 58,
  h             integer DEFAULT 44,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reservations (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id    uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  table_id         uuid REFERENCES restaurant_tables(id) ON DELETE SET NULL,
  reference_code   text NOT NULL UNIQUE,
  guest_name       text NOT NULL,
  guest_email      text NOT NULL,
  guest_phone      text,
  party_size       integer NOT NULL CHECK (party_size > 0),
  reservation_date date NOT NULL,
  reservation_time time NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 90,
  status           text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','arrived','completed','rejected','cancelled','no_show')),
  category         text,
  is_walk_in       boolean NOT NULL DEFAULT false,
  special_requests text,
  menu_preference  text,
  notes            text,
  guest_consented  boolean NOT NULL DEFAULT false,
  consented_at     timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS table_holds (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id         uuid NOT NULL REFERENCES restaurant_tables(id) ON DELETE CASCADE,
  restaurant_id    uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  reservation_date date NOT NULL,
  reservation_time time NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 90,
  session_id       text NOT NULL,
  held_until       timestamptz NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  sender_type    text NOT NULL CHECK (sender_type IN ('guest','restaurant')),
  sender_name    text,
  content        text NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notices (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  content       text NOT NULL,
  created_by    uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid,
  actor_id      uuid,
  actor_name    text,
  action        text NOT NULL,
  target_type   text,
  target_id     text,
  metadata      jsonb NOT NULL DEFAULT '{}',
  ip_address    text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS demo_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_name text NOT NULL,
  contact_name    text NOT NULL,
  email           text NOT NULL,
  phone           text,
  city            text NOT NULL,
  venue_type      text,
  seat_count      integer,
  current_system  text,
  message         text,
  status          text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','declined')),
  restaurant_id   uuid REFERENCES restaurants(id) ON DELETE SET NULL,
  approved_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);
