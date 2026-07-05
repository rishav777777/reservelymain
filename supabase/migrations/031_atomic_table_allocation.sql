-- Migration 031: Atomic table allocation for reservation confirmation
-- Run this in Supabase SQL Editor before deploying the confirmation RPC change.
--
-- The function acquires row-level locks on existing confirmed reservations for the
-- same restaurant and date before running the allocation query, preventing two
-- concurrent confirmations from double-booking the same table.

CREATE OR REPLACE FUNCTION confirm_reservation_atomic(
  p_reservation_id  UUID,
  p_restaurant_id   UUID,
  p_date            DATE,
  p_time            TEXT,    -- HH:MM
  p_duration        INT,     -- minutes
  p_party_size      INT,
  p_category        TEXT
)
RETURNS TABLE (success BOOLEAN, allocated_table_id UUID, message TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_start INT;
  v_end   INT;
  v_table UUID;
BEGIN
  -- Convert HH:MM to minutes since midnight for overlap arithmetic
  v_start := (EXTRACT(HOUR   FROM p_time::TIME)::INT * 60)
            + EXTRACT(MINUTE FROM p_time::TIME)::INT;
  v_end   := v_start + p_duration;

  -- Lock all confirmed/arrived reservations for this restaurant on this date.
  -- Any concurrent transaction trying to confirm another reservation here will
  -- wait until we commit, preventing a data race on table allocation.
  PERFORM r.id
    FROM reservations r
    WHERE r.restaurant_id = p_restaurant_id
      AND r.reservation_date = p_date
      AND r.status IN ('confirmed', 'arrived')
      AND r.id != p_reservation_id
    FOR UPDATE;

  -- Find the smallest available table that fits the party (best-fit allocation).
  -- A table is "occupied" if another confirmed reservation overlaps the time window.
  SELECT rt.id INTO v_table
    FROM restaurant_tables rt
    WHERE rt.restaurant_id = p_restaurant_id
      AND rt.is_active = TRUE
      AND rt.capacity  >= p_party_size
      AND rt.id NOT IN (
        SELECT COALESCE(r2.table_id, '00000000-0000-0000-0000-000000000000')
        FROM reservations r2
        WHERE r2.restaurant_id   = p_restaurant_id
          AND r2.reservation_date = p_date
          AND r2.status          IN ('confirmed', 'arrived')
          AND r2.table_id        IS NOT NULL
          AND r2.id              != p_reservation_id
          -- overlap: newStart < existingEnd AND newEnd > existingStart
          AND v_start < (
                (EXTRACT(HOUR   FROM r2.reservation_time::TIME)::INT * 60)
              + EXTRACT(MINUTE FROM r2.reservation_time::TIME)::INT
              + COALESCE(r2.duration_minutes, 120)
              )
          AND v_end > (
                (EXTRACT(HOUR   FROM r2.reservation_time::TIME)::INT * 60)
              + EXTRACT(MINUTE FROM r2.reservation_time::TIME)::INT
              )
      )
    ORDER BY rt.capacity ASC
    LIMIT 1;

  -- Try category preference first if no result yet
  IF v_table IS NULL AND p_category IS NOT NULL THEN
    SELECT rt.id INTO v_table
      FROM restaurant_tables rt
      WHERE rt.restaurant_id = p_restaurant_id
        AND rt.is_active     = TRUE
        AND rt.capacity      >= p_party_size
        AND rt.category      = p_category
        AND rt.id NOT IN (
          SELECT COALESCE(r2.table_id, '00000000-0000-0000-0000-000000000000')
          FROM reservations r2
          WHERE r2.restaurant_id   = p_restaurant_id
            AND r2.reservation_date = p_date
            AND r2.status          IN ('confirmed', 'arrived')
            AND r2.table_id        IS NOT NULL
            AND r2.id              != p_reservation_id
            AND v_start < (
                  (EXTRACT(HOUR   FROM r2.reservation_time::TIME)::INT * 60)
                + EXTRACT(MINUTE FROM r2.reservation_time::TIME)::INT
                + COALESCE(r2.duration_minutes, 120)
                )
            AND v_end > (
                  (EXTRACT(HOUR   FROM r2.reservation_time::TIME)::INT * 60)
                + EXTRACT(MINUTE FROM r2.reservation_time::TIME)::INT
                )
        )
      ORDER BY rt.capacity ASC
      LIMIT 1;
  END IF;

  -- Update the reservation atomically within this transaction
  UPDATE reservations
    SET status   = 'confirmed',
        table_id = v_table
    WHERE id = p_reservation_id;

  RETURN QUERY SELECT TRUE, v_table, 'confirmed'::TEXT;
END;
$$;
