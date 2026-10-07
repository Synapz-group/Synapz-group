import pg from 'pg';
import { readFile } from 'node:fs/promises';
import { asset } from './paths.js';
import type { Candidate, Manifest, Published, Reconciliation } from './model.js';
import { BusError } from './validation.js';
export class Store {
  constructor(public pool: pg.Pool) {}
  async migrate() { await this.pool.query(await readFile(asset('migrations/001_evidence_bus.sql'), 'utf8')); }
  async transaction<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
    const c = await this.pool.connect();
    try { await c.query('BEGIN'); await c.query('SELECT pg_advisory_xact_lock(72841001)'); const result = await fn(c); await c.query('COMMIT'); return result; }
    catch(e) { await c.query('ROLLBACK'); throw e; } finally { c.release(); }
  }
  async audit(kind: string, code: string, source: string|null = null, event: string|null = null, actor: string|null = null, c: pg.PoolClient|pg.Pool = this.pool) {
    await c.query('INSERT INTO bus_audit(kind,code,source,event_id,actor) VALUES($1,$2,$3,$4,$5)',[kind,code,source,event,actor]);
  }
  async rate(bucket: string, now: number, limit: number) {
    const r = await this.pool.query('INSERT INTO bus_rate_windows(bucket,window_id,count) VALUES($1,$2,1) ON CONFLICT(bucket,window_id) DO UPDATE SET count=bus_rate_windows.count+1 RETURNING count',[bucket,Math.floor(now/60000)]);
    if (r.rows[0].count > limit) throw new BusError('rate_limited',429);
  }
  async current(source: string, c: pg.PoolClient|pg.Pool = this.pool): Promise<Published|null> {
    const r = await c.query('SELECT p.data FROM bus_current s JOIN bus_publications p ON s.event_id=p.event_id WHERE s.source=$1 AND p.approved AND p.published',[source]);
    return r.rows[0]?.data ?? null;
  }
  async currents(): Promise<Published[]> {
    return (await this.pool.query('SELECT p.data FROM bus_current s JOIN bus_publications p ON s.event_id=p.event_id WHERE p.approved AND p.published ORDER BY s.source')).rows.map(r=>r.data);
  }
  async candidates(): Promise<Candidate[]> { return (await this.pool.query('SELECT data FROM bus_candidates ORDER BY created_at DESC,event_id')).rows.map(r=>r.data); }
  async publications(): Promise<Published[]> { return (await this.pool.query('SELECT data FROM bus_publications WHERE approved AND published ORDER BY approved_at DESC,event_id')).rows.map(r=>r.data); }
  async publish(c: pg.PoolClient, candidate: Candidate, actor: string, note: string, now: string) {
    const m = candidate.normalized.manifest;
    const p: Published = { eventId: m.eventId, source: m.sourceSystem, manifest: m, approved: true, published: true,
      approvedBy: actor, approvedAt: now, reviewerNote: note, previousEvent: candidate.baseEvent };
    await c.query('INSERT INTO bus_publications(event_id,source,approved,published,tier,data) VALUES($1,$2,true,true,$3,$4)',[p.eventId,p.source,m.disclosureClass,p]);
    await c.query('INSERT INTO bus_current(source,event_id) VALUES($1,$2) ON CONFLICT(source) DO UPDATE SET event_id=excluded.event_id',[p.source,p.eventId]);
  }
  async insertEvent(c: pg.PoolClient, m: Manifest, bodyHash: string, identity: string) {
    await c.query('INSERT INTO bus_events(event_id,source,emitted_at,body_hash,signing_identity,manifest) VALUES($1,$2,$3,$4,$5,$6)',[m.eventId,m.sourceSystem,m.emittedAt,bodyHash,identity,m]);
  }
  async statuses(): Promise<{source: string; ignored_until: Date|null; reconciliation: Reconciliation|null}[]> { return (await this.pool.query('SELECT * FROM bus_source_status ORDER BY source')).rows; }
}
