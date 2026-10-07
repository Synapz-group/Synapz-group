import pg from 'pg';
import { readFile } from 'node:fs/promises';

const adminUrl = process.env.MIGRATION_DATABASE_URL;
const runtimePassword = process.env.EVIDENCE_RUNTIME_PASSWORD;

if (!adminUrl || !runtimePassword || runtimePassword.length < 24) {
  throw new Error('missing_railway_bootstrap_configuration');
}

const role = 'evidence_runtime';
const client = new pg.Client({ connectionString: adminUrl, connectionTimeoutMillis: 5000, statement_timeout: 30000 });

function ident(value) {
  return '"' + String(value).replaceAll('"', '""') + '"';
}

function literal(value) {
  return "'" + String(value).replaceAll("'", "''") + "'";
}

await client.connect();
try {
  const exists = await client.query('SELECT 1 FROM pg_roles WHERE rolname=$1', [role]);
  if (!exists.rowCount) {
    await client.query(`CREATE ROLE ${ident(role)} LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT`);
  }
  await client.query(`ALTER ROLE ${ident(role)} PASSWORD ${literal(runtimePassword)}`);
  await client.query(`ALTER ROLE ${ident(role)} SET search_path = public`);

  const migration = await readFile(new URL('../migrations/001_evidence_bus.sql', import.meta.url), 'utf8');
  await client.query(migration);

  const db = (await client.query('SELECT current_database() AS name')).rows[0].name;
  await client.query(`GRANT CONNECT ON DATABASE ${ident(db)} TO ${ident(role)}`);
  await client.query(`GRANT USAGE ON SCHEMA public TO ${ident(role)}`);
  await client.query(`REVOKE CREATE ON SCHEMA public FROM ${ident(role)}`);

  await client.query(`
    GRANT SELECT ON TABLE
      bus_events,
      bus_nonces,
      bus_candidates,
      bus_publications,
      bus_current,
      bus_audit,
      bus_source_status,
      bus_rate_windows
    TO ${ident(role)}
  `);

  await client.query(`
    GRANT INSERT ON TABLE
      bus_events,
      bus_nonces,
      bus_candidates,
      bus_publications,
      bus_current,
      bus_audit,
      bus_source_status,
      bus_rate_windows
    TO ${ident(role)}
  `);

  await client.query(`
    GRANT UPDATE ON TABLE
      bus_candidates,
      bus_current,
      bus_source_status,
      bus_rate_windows
    TO ${ident(role)}
  `);

  await client.query(`GRANT USAGE, SELECT ON SEQUENCE bus_audit_sequence_seq TO ${ident(role)}`);

  process.stdout.write(JSON.stringify({
    status: 'prepared',
    role,
    migration: '001_evidence_bus.sql'
  }) + '\n');
} finally {
  await client.end();
}
