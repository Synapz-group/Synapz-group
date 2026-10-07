import pg from 'pg';
import { randomBytes, randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { asset } from '../src/paths.js';
import type { AddressInfo } from 'node:net';
import { Store } from '../src/store.js';
import { EvidenceBus } from '../src/service.js';
import { bearerAuth, createApp } from '../src/server.js';
import type { Manifest, Principal, Source } from '../src/model.js';
import { prepare } from '../src/emitter.js';
import { fixture } from '../scripts/fixtures.js';

export const systems=['prime','platform','multichain','trade-x','rig','kyro'];
export const owner: Principal={id:'owner-demo',role:'owner',tier:'restricted'};
export const reviewer: Principal={id:'reviewer-demo',role:'reviewer',tier:'partner'};
export const publicReviewer: Principal={id:'public-demo',role:'reviewer',tier:'public'};
export async function harness(production=false) {
  const StoreClass=production ? (await import(pathToFileURL(asset('dist/src/store.js')).href) as typeof import('../src/store.js')).Store : Store;
  const BusClass=production ? (await import(pathToFileURL(asset('dist/src/service.js')).href) as typeof import('../src/service.js')).EvidenceBus : EvidenceBus;
  const serverModule=production ? await import(pathToFileURL(asset('dist/src/server.js')).href) as typeof import('../src/server.js') : {createApp,bearerAuth};
  const connectionString=process.env.EVIDENCE_TEST_DATABASE_URL;
  if(!connectionString) throw new Error('EVIDENCE_TEST_DATABASE_URL_required_real_Postgres_tests_never_skip');
  const schema=`bus_test_${randomBytes(8).toString('hex')}`;
  const admin=new pg.Pool({connectionString});
  await admin.query(`CREATE SCHEMA ${schema}`);
  const pool=new pg.Pool({connectionString,options:`-c search_path=${schema}`,max:10});
  const store=new StoreClass(pool);
  try {await store.migrate();}catch(e){await pool.end();await admin.query(`DROP SCHEMA ${schema} CASCADE`);await admin.end();throw e;}
  const secret=randomBytes(32).toString('hex');
  const sources: Source[]=systems.map(system=>({system,repoKey:`${system}-demo`,keyId:`${system}-v1`,secret:system==='prime'?secret:randomBytes(32).toString('hex'),staleAfterSeconds:3600,maximumTier:'restricted'}));
  let now=Date.now();
  const bus=new BusClass(store,sources,undefined,()=>now);
  const ownerToken=randomBytes(32).toString('hex'),reviewerToken=randomBytes(32).toString('hex'),publicToken=randomBytes(32).toString('hex');
  const server=serverModule.createApp(bus,serverModule.bearerAuth([{token:ownerToken,principal:owner},{token:reviewerToken,principal:reviewer},{token:publicToken,principal:publicReviewer}]));
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url=`http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const next=(system='prime')=>{now+=10;return fixture(system,new Date(now).toISOString());};
  async function send(m: Manifest, overrides: Record<string,string>={}, raw?: string) {
    const request=prepare(m,sources.find(s=>s.system===m.sourceSystem)?.secret ?? secret);
    return fetch(`${url}/v1/ingest`,{method:'POST',body:raw ?? request.body,headers:{...request.headers,...overrides}});
  }
  async function api(path: string, token=ownerToken, data?: unknown) {
    return fetch(`${url}${path}`,{method:data?'POST':'GET',headers:{authorization:`Bearer ${token}`,...(data?{'content-type':'application/json'}:{})},...(data?{body:JSON.stringify(data)}:{})});
  }
  async function publish(system='prime',tier: Manifest['disclosureClass']='partner') {
    const m=next(system);m.disclosureClass=tier;
    const r=await send(m);if(r.status!==202)throw new Error(`fixture_ingest_failed_${r.status}`);
    const a=await api('/v1/owner/review',ownerToken,{eventId:m.eventId,action:'approve',note:'Synthetic owner-approved evidence.'});
    if(a.status!==200)throw new Error(`fixture_approval_failed_${a.status}`);
    return m;
  }
  return {store,bus,secret,sources,server,url,ownerToken,reviewerToken,publicToken,next,send,api,publish,
    tick(ms: number){now+=ms;}, now:()=>now,
    async close(){server.closeAllConnections();await new Promise<void>((resolve,reject)=>server.close(e=>e?reject(e):resolve()));await pool.end();if(!/^bus_test_[a-f0-9]{16}$/.test(schema))throw new Error('unsafe_test_schema');await admin.query(`DROP SCHEMA ${schema} CASCADE`);await admin.end();}
  };
}
export function refresh(m: Manifest, when=new Date().toISOString()): Manifest {return {...structuredClone(m),eventId:randomUUID(),emittedAt:when,commitSha:'2'.repeat(40),supersedes:m.eventId};}
