import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFile, spawn } from 'node:child_process';
import { once } from 'node:events';
import { promisify } from 'node:util';
import { writeFile, mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import pg from 'pg';
import { harness, refresh, systems, owner, reviewer } from './helpers.js';
import { Store } from '../src/store.js';
import { EvidenceBus } from '../src/service.js';
import { submit, createManifest, prepare } from '../src/emitter.js';
import { asset } from '../src/paths.js';
import type { SourceObservation } from '../src/model.js';
const run=promisify(execFile);

test('E2E mandatory PRIME proof: emit → signed ingest → safe refresh → owner promotion → reviewer/Copilot → stale → retained state',async()=>{
  const h=await harness();try{
    const manifest=createManifest(h.next());manifest.emittedAt=h.next().emittedAt;
    const response=await submit(manifest,`${h.url}/v1/ingest`,h.secret);
    assert.equal(response.status,'needs_review');
    assert.deepEqual(await(await h.api('/v1/reviewer/current',h.reviewerToken)).json(),[]);
    assert.equal((await h.send(manifest)).status,409);
    let candidate=(await h.store.candidates())[0]!;assert.equal(candidate.normalized.version,'1');assert.deepEqual(candidate.normalized.manifest.limitations,manifest.limitations);
    assert.equal((await h.api('/v1/owner/review',h.ownerToken,{eventId:manifest.eventId,action:'approve',note:'Synthetic qualified demonstration.'})).status,200);
    const updated=refresh(manifest,h.next().emittedAt);updated.tests!.passed=25;
    assert.equal((await submit(updated,`${h.url}/v1/ingest`,h.secret)).status,'auto_refreshed');
    const promoted=refresh(updated,h.next().emittedAt);promoted.maturity='DEPLOYED';promoted.environment='production';
    assert.equal((await submit(promoted,`${h.url}/v1/ingest`,h.secret)).status,'needs_review');
    assert.equal((await(await h.api('/v1/reviewer/current',h.reviewerToken)).json())[0].eventId,updated.eventId);
    assert.equal((await h.api('/v1/owner/review',h.ownerToken,{eventId:promoted.eventId,action:'approve',note:'Synthetic deployment approval; no real production claim.'})).status,200);
    const high=await h.publish('rig','restricted');
    const projection=await(await h.api('/v1/reviewer/current',h.reviewerToken)).json();assert.equal(projection.length,1);assert.equal(projection[0].eventId,promoted.eventId);
    const context=await(await h.api('/v1/copilot/context?system=prime',h.reviewerToken)).json();assert.equal(context.current[0].eventId,promoted.eventId);assert(!JSON.stringify(context).includes(high.eventId));
    const obs: SourceObservation={source:'prime',latestEventId:randomUUID(),observedAt:new Date(h.now()).toISOString(),schemaVersion:'1.0',evidencePresent:true,conflicting:false};
    const reconciled=await(await h.api('/v1/owner/reconcile',h.ownerToken,{observations:[obs]})).json();assert.equal(reconciled.find((r:{source:string})=>r.source==='prime').status,'stale');
    const bad=refresh(promoted,h.next().emittedAt);assert.equal((await h.send(bad,{'x-evidence-signature':'0'.repeat(64)})).status,401);assert.equal((await h.store.current('prime'))!.eventId,promoted.eventId);
    candidate=(await h.store.candidates()).find(c=>c.id===promoted.eventId)!;assert.equal(candidate.status,'approved');
    const event=(await h.store.pool.query('SELECT * FROM bus_events WHERE event_id=$1',[promoted.eventId])).rows[0];assert.equal(event.signing_identity,'prime:prime-v1');assert.equal(event.manifest.commitSha,promoted.commitSha);assert.equal(event.body_hash.length,64);
  }finally{await h.close();}
});
for(const system of systems)test(`E2E ${system}: first publication held then approved; evidence, changes, history and domain protected`,async()=>{
  const h=await harness();try{
    const m=await h.publish(system);
    for(const path of ['/v1/reviewer/current','/v1/reviewer/evidence','/v1/reviewer/snapshot','/v1/reviewer/changes','/v1/reviewer/maturity-history']){
      const response=await h.api(`${path}?system=${system}`,h.reviewerToken);assert.equal(response.status,200);const data=await response.json();assert.equal(data[0].eventId,m.eventId);assert.equal(data[0].maturity,m.maturity);assert.deepEqual(data[0].limitations,m.limitations);assert(!JSON.stringify(data).includes(m.sourceRepoSafeKey));assert(!JSON.stringify(data).includes('signature'));
      assert.deepEqual(await(await h.api(`${path}?system=${system}`,h.publicToken)).json(),[]);
    }
    assert.equal((await(await h.api(`/v1/reviewer/snapshot?domain=${system}`,h.reviewerToken)).json())[0].system,system);
  }finally{await h.close();}
});
test('E2E Python CLI submits exact signed UTF-8 bytes and verifies response',async()=>{
  const h=await harness();const dir=await mkdtemp(join(tmpdir(),'bus-python-'));try{
    const m=h.next('multichain');const file=join(dir,'manifest.json');await writeFile(file,JSON.stringify(m));
    const python=process.env.EVIDENCE_TEST_PYTHON ?? (process.platform==='win32'?asset('.venv/Scripts/python.exe'):asset('.venv/bin/python'));
    const sourceSecret=h.sources.find(s=>s.system==='multichain')!.secret;
    const {stdout}=await run(python,[asset('python/emitter.py'),file,'--send'],{env:{...process.env,EVIDENCE_INGEST_URL:`${h.url}/v1/ingest`,EVIDENCE_SIGNING_KEY:sourceSecret}});
    assert.equal(JSON.parse(stdout).status,'needs_review');assert.equal((await h.store.candidates())[0]!.id,m.eventId);
    const replay=await run(python,[asset('python/emitter.py'),file,'--send'],{env:{...process.env,EVIDENCE_INGEST_URL:`${h.url}/v1/ingest`,EVIDENCE_SIGNING_KEY:sourceSecret}}).then(()=>false,()=>true);assert(replay);
    const {stdout:schema}=await run(python,[asset('python/emitter.py'),'--schema']);assert.equal(JSON.parse(schema).title,'SYNAPZ Evidence Manifest v1');
  }finally{await h.close();await rm(dir,{recursive:true});}
});
test('E2E persistent restart retains publication, replay state, audit and reconciliation',async()=>{
  const h=await harness();try{
    const m=await h.publish();const r=prepare(h.next('rig'),h.sources.find(s=>s.system==='rig')!.secret);await fetch(`${h.url}/v1/ingest`,{method:'POST',...r});
    await h.bus.reconcile(owner,[{source:'prime',latestEventId:m.eventId,observedAt:m.emittedAt,schemaVersion:'1.0',evidencePresent:true,conflicting:false}]);
    const schema=(await h.store.pool.query('SELECT current_schema() AS name')).rows[0].name;
    const pool=new pg.Pool({connectionString:process.env.EVIDENCE_TEST_DATABASE_URL,options:`-c search_path=${schema}`});
    try{const store=new Store(pool);const bus=new EvidenceBus(store,h.sources);assert.equal((await bus.projection(reviewer))[0]!.eventId,m.eventId);assert.equal((await store.statuses()).find(s=>s.source==='prime')!.reconciliation!.status,'in_sync');await assert.rejects(()=>bus.ingest(r.body,{source:r.headers['x-evidence-source']!,keyId:r.headers['x-evidence-key']!,timestamp:r.headers['x-evidence-timestamp']!,nonce:r.headers['x-evidence-nonce']!,signature:r.headers['x-evidence-signature']!}),/replay_rejected/);assert((await store.pool.query('SELECT 1 FROM bus_audit')).rowCount!>=4);}finally{await pool.end();}
  }finally{await h.close();}
});
test('E2E owner rejects, archives and keeps existing without publishing candidates',async()=>{
  const h=await harness();try{const old=await h.publish();for(const action of ['reject','archive','keep']){const m=refresh(old,h.next().emittedAt);m.summary=`New synthetic ${action} claim`;delete m.supersedes;await h.send(m);assert.equal((await h.api('/v1/owner/review',h.ownerToken,{eventId:m.eventId,action,note:''})).status,200);assert.equal((await h.store.current('prime'))!.eventId,old.eventId);assert.equal((await h.api('/v1/owner/review',h.ownerToken,{eventId:m.eventId,action:'approve',note:''})).status,409);}}finally{await h.close();}
});
test('E2E stale owner approval cannot overwrite newer evidence',async()=>{
  const h=await harness();try{const old=await h.publish();const promotion=refresh(old,h.next().emittedAt);promotion.maturity='DEPLOYED';await h.send(promotion);const fresh=refresh(old,h.next().emittedAt);delete fresh.supersedes;await h.send(fresh);assert.equal((await h.api('/v1/owner/review',h.ownerToken,{eventId:promotion.eventId,action:'approve',note:''})).status,409);assert.equal((await h.store.current('prime'))!.eventId,fresh.eventId);}finally{await h.close();}
});
test('E2E reconciliation detects all six statuses without deleting proof',async()=>{
  const h=await harness();try{
    const published=await h.publish();const base: SourceObservation={source:'prime',latestEventId:published.eventId,observedAt:published.emittedAt,schemaVersion:'1.0',evidencePresent:true,conflicting:false};
    const status=async(o:SourceObservation[]) => (await h.bus.reconcile(owner,o)).find(s=>s.source==='prime')!.status;
    assert.equal(await status([base]),'in_sync');assert.equal(await status([]),'source_missing');assert.equal(await status([{...base,schemaVersion:'2.0'}]),'error');assert.equal(await status([{...base,conflicting:true}]),'conflict');assert.equal(await status([{...base,evidencePresent:false}]),'stale');
    const pending=refresh(published,h.next().emittedAt);pending.maturity='DEPLOYED';await h.send(pending);assert.equal(await status([{...base,latestEventId:pending.eventId}]),'owner_review_required');
    const conflict=refresh(pending,pending.emittedAt);assert.equal((await(await h.send(conflict)).json()).status,'conflict');assert.equal(await status([{...base,latestEventId:conflict.eventId}]),'conflict');
    assert.equal((await h.store.current('prime'))!.eventId,published.eventId);
  }finally{await h.close();}
});
test('E2E freshness expiry and temporary ignore preserve stale signal and approved proof',async()=>{
  const h=await harness();try{const m=await h.publish();h.tick(3601000);await h.bus.ignore(owner,'prime',new Date(h.now()+86400000).toISOString());const r=await h.bus.reconcile(owner,[{source:'prime',latestEventId:m.eventId,observedAt:m.emittedAt,schemaVersion:'1.0',evidencePresent:true,conflicting:false}]);assert.equal(r[0]!.status,'stale');assert(r[0]!.reasons.includes('temporarily_ignored_alert_only'));assert.equal((await h.bus.projection(reviewer))[0]!.freshness,'stale');assert.equal((await h.store.current('prime'))!.eventId,m.eventId);}finally{await h.close();}
});
test('E2E append-only events/publications/audit enforced by Postgres',async()=>{
  const h=await harness();try{await h.publish();for(const table of ['bus_events','bus_publications','bus_audit'])await assert.rejects(()=>h.store.pool.query(`DELETE FROM ${table}`),/append_only/);assert.equal((await h.store.currents()).length,1);}finally{await h.close();}
});
test('E2E application publish failure rolls back ingest and leaves prior approval visible',async()=>{
  const h=await harness();try{const old=await h.publish();const m=refresh(old,h.next().emittedAt);const original=h.store.publish.bind(h.store);h.store.publish=async()=>{throw new Error('synthetic_persistence_failure');};assert.equal((await h.send(m)).status,500);assert.equal((await h.store.current('prime'))!.eventId,old.eventId);assert.equal((await h.store.candidates()).length,1);h.store.publish=original;assert.equal((await h.send(m)).status,202);}finally{await h.close();}
});
test('E2E production build serves owner console with restrictive CSP and no secret assets',async()=>{
  const h=await harness();try{for(const path of ['/owner','/owner.js','/owner.css']){const r=await fetch(`${h.url}${path}`);assert.equal(r.status,200);assert(r.headers.get('content-security-policy')!.includes("script-src 'self'"));const body=await r.text();assert(!body.includes(h.secret));assert(!body.includes(h.ownerToken));}assert.equal((await h.api('/v1/reviewer/current','invalid')).status,401);const schema=JSON.parse(await readFile(asset('schema/manifest-v1.json'),'utf8'));assert.equal(schema.additionalProperties,false);}finally{await h.close();}
});
test('E2E projection excludes unpublished records and rejects inconsistent approval flags',async()=>{
  const h=await harness();try{
    const m=await h.publish('prime','public');const original=(await h.store.current('prime'))!;
    const n=refresh(m,h.next().emittedAt);const unpublished={...original,eventId:n.eventId,manifest:n,published:false};
    await h.store.transaction(async c=>{
      await h.store.insertEvent(c,n,'3'.repeat(64),'synthetic:identity');
      await c.query('INSERT INTO bus_publications(event_id,source,approved,published,tier,data) VALUES($1,$2,true,false,$3,$4)',[n.eventId,n.sourceSystem,n.disclosureClass,unpublished]);
      await c.query('UPDATE bus_current SET event_id=$1 WHERE source=$2',[n.eventId,n.sourceSystem]);
    });
    for(const endpoint of ['/v1/reviewer/current','/v1/reviewer/evidence','/v1/reviewer/snapshot'])assert.deepEqual(await(await h.api(endpoint,h.publicToken)).json(),[]);
    const history=await(await h.api('/v1/reviewer/changes',h.publicToken)).json();assert.equal(history.length,1);assert.equal(history[0].eventId,m.eventId);
    const ctx=await(await h.api('/v1/copilot/context',h.publicToken)).json();assert.deepEqual(ctx.current,[]);assert(!JSON.stringify(ctx).includes(n.eventId));
    assert.equal(h.bus.visible(reviewer,{...original,approved:false} as unknown as typeof original),false);
    assert.equal(h.bus.visible(reviewer,unpublished),false);
  }finally{await h.close();}
});
test('E2E compiled production entry starts after idempotent migrations and enforces configured auth',async()=>{
  const h=await harness();let child:ReturnType<typeof spawn>|undefined;
  try{
    const m=await h.publish();await h.store.migrate();await h.store.migrate();
    const schema=(await h.store.pool.query('SELECT current_schema() AS name')).rows[0].name;
    const database=new URL(process.env.EVIDENCE_TEST_DATABASE_URL!);database.searchParams.set('options',`-c search_path=${schema}`);
    child=spawn(process.execPath,[asset('dist/src/main.js')],{env:{...process.env,DATABASE_URL:database.toString(),EVIDENCE_SOURCES_JSON:JSON.stringify(h.sources),EVIDENCE_AUTH_JSON:JSON.stringify([{token:h.reviewerToken,principal:reviewer}]),PORT:'0',HOST:'127.0.0.1'},stdio:['ignore','pipe','pipe']});
    const production=child;
    const port=await new Promise<number>((resolve,reject)=>{
      const timer=setTimeout(()=>reject(new Error('production_startup_timeout')),10000);
      production.once('error',e=>{clearTimeout(timer);reject(e);});production.once('exit',()=>{clearTimeout(timer);reject(new Error('production_startup_failed'));});
      production.stdout!.once('data',(chunk:Buffer)=>{clearTimeout(timer);try{const event=JSON.parse(chunk.toString()) as {port:number};resolve(event.port);}catch{reject(new Error('startup_event_invalid'));}});
    });
    const url=`http://127.0.0.1:${port}`;
    assert.equal((await fetch(`${url}/health`)).status,200);
    assert.equal((await fetch(`${url}/v1/reviewer/current`)).status,401);
    const records=await(await fetch(`${url}/v1/reviewer/current`,{headers:{authorization:`Bearer ${h.reviewerToken}`}})).json();assert.equal(records[0].eventId,m.eventId);
    const exited=once(production,'exit');production.kill();await exited;child=undefined;
  }finally{if(child && child.exitCode===null){const exited=once(child,'exit');child.kill();await exited;}await h.close();}
});
