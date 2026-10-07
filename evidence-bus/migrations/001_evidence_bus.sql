BEGIN;
SELECT pg_advisory_xact_lock(72841002);
CREATE TABLE IF NOT EXISTS bus_events (
  event_id uuid PRIMARY KEY, source text NOT NULL, emitted_at timestamptz NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(), body_hash text NOT NULL,
  signing_identity text NOT NULL, manifest jsonb NOT NULL
);
CREATE INDEX IF NOT EXISTS bus_events_source_time ON bus_events(source, emitted_at DESC);
CREATE TABLE IF NOT EXISTS bus_nonces (
  source text NOT NULL, nonce text NOT NULL, received_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(source, nonce)
);
CREATE TABLE IF NOT EXISTS bus_candidates (
  event_id uuid PRIMARY KEY REFERENCES bus_events(event_id), source text NOT NULL,
  status text NOT NULL CHECK(status IN ('needs_review','auto_refreshed','approved','rejected','archived','conflict')),
  base_event uuid, created_at timestamptz NOT NULL DEFAULT now(), data jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS bus_publications (
  event_id uuid PRIMARY KEY REFERENCES bus_events(event_id), source text NOT NULL,
  approved boolean NOT NULL CHECK(approved), published boolean NOT NULL, tier text NOT NULL CHECK(tier IN ('public','partner','restricted')),
  approved_at timestamptz NOT NULL DEFAULT now(), data jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS bus_current (
  source text PRIMARY KEY, event_id uuid NOT NULL REFERENCES bus_publications(event_id)
);
CREATE TABLE IF NOT EXISTS bus_audit (
  sequence bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, at timestamptz NOT NULL DEFAULT now(),
  kind text NOT NULL, source text, event_id uuid, actor text, code text NOT NULL
);
CREATE TABLE IF NOT EXISTS bus_source_status (
  source text PRIMARY KEY, ignored_until timestamptz, reconciliation jsonb
);
CREATE TABLE IF NOT EXISTS bus_rate_windows (
  bucket text NOT NULL, window_id bigint NOT NULL, count integer NOT NULL, PRIMARY KEY(bucket,window_id)
);
-- Application-level append-only events, publications and audit; enforce against accidental updates/deletes.
CREATE OR REPLACE FUNCTION bus_append_only() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'append_only'; END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'bus_events_immutable' AND tgrelid = 'bus_events'::regclass) THEN
    CREATE TRIGGER bus_events_immutable BEFORE UPDATE OR DELETE ON bus_events FOR EACH ROW EXECUTE FUNCTION bus_append_only();
    CREATE TRIGGER bus_publications_immutable BEFORE UPDATE OR DELETE ON bus_publications FOR EACH ROW EXECUTE FUNCTION bus_append_only();
    CREATE TRIGGER bus_audit_immutable BEFORE UPDATE OR DELETE ON bus_audit FOR EACH ROW EXECUTE FUNCTION bus_append_only();
  END IF;
END $$;
COMMIT;
