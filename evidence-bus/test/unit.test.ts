import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { fixture } from '../scripts/fixtures.js';
import { validateManifest } from '../src/validation.js';
import { decide, normalize } from '../src/policy.js';
import { HmacVerifier, sign, digest } from '../src/signing.js';
import { createManifest, submit, prepare, writeManifest } from '../src/emitter.js';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Manifest, Published, Source } from '../src/model.js';
import { maturities } from '../src/model.js';
import { strictJson } from '../src/json.js';
import { refresh, systems } from './helpers.js';
function published(m: Manifest): Published {return {eventId:m.eventId,source:m.sourceSystem,manifest:m,approved:true,published:true,approvedBy:'owner-demo',approvedAt:m.emittedAt,reviewerNote:'',previousEvent:null};}
for(const system of systems)test(`schema and normalization preserve ${system} boundaries`,()=>{
  const m=fixture(system);validateManifest(m);const n=normalize(m);assert.deepEqual(n.manifest,m);assert.deepEqual(n.manifest.limitations,m.limitations);assert.equal(n.totalTests,m.tests!.passed+m.tests!.failed+m.tests!.skipped);assert.notEqual(n.manifest,m);
});
for(const maturity of maturities)test(`policy never silently transitions QUALIFIED to ${maturity}`,()=>{
  const old=fixture();const m=refresh(old);m.maturity=maturity;const p=decide(m,published(old));assert.equal(p.decision,maturity==='QUALIFIED'?'auto_refresh':'owner_review');
});
test('policy safe refresh returns explicit diff and affected records',()=>{const old=fixture();const m=refresh(old);m.tests!.passed++;m.evidence[0]!.sha256='4'.repeat(64);const p=decide(m,published(old));assert.equal(p.decision,'auto_refresh');assert(p.diff.some(d=>d.field==='tests'));assert.deepEqual(p.affectedRecords,['prime']);});
const boundaryChanges: [string,(m:Manifest)=>void][]=[
  ['visibility',m=>{m.disclosureClass='public';}],['environment',m=>{m.environment='production';}],
  ['new repo',m=>{m.sourceRepoSafeKey='new-demo';}],['claim',m=>{m.summary='New commercial claim';}],
  ['limitations removal',m=>{m.limitations=['Different limitation'];}],['new URL',m=>{m.evidence[0]!.url='https://evidence.example/new';}],
  ['new address',m=>{m.blockchain={network:'mainnet',signing:true,broadcast:true,realFunds:false,custody:false,addresses:['demo-address']};}],
  ['regulatory',m=>{m.risk.regulatory=true;}],['named parties',m=>{m.risk.namedParties=true;}],['commercial',m=>{m.risk.commercial=true;}],
  ['sensitive',m=>{m.risk.sensitive=true;}],['real execution',m=>{m.risk.realExecution=true;}],
  ['new evidence claim',m=>{m.evidence.push({type:'documentation',artifactKey:'new-claim',sha256:'2'.repeat(64),summary:'New claim'});}],
  ['evidence removal',m=>{m.evidence.pop();}],['evidence claim alteration',m=>{m.evidence[0]!.summary='Mainnet claim';}],
  ['branch',m=>{m.branch='new-branch';}],['auto-publish disabled',m=>{m.autoPublishEligible=false;}]
];
for(const [name,mutate] of boundaryChanges)test(`policy requires owner for ${name}`,()=>{const old=fixture();const m=refresh(old);mutate(m);assert.equal(decide(m,published(old)).decision,'owner_review');});
test('first publication always requires owner',()=>assert.equal(decide(fixture(),null).decision,'owner_review'));
test('unpublished previous record cannot authorize refresh',()=>{const old=published(fixture());old.published=false;assert.equal(decide(refresh(old.manifest),old).decision,'owner_review');});
test('event ordering conflict overrides eligible auto refresh',()=>{const old=fixture();assert.equal(decide(refresh(old),published(old),true).decision,'conflict');});
test('manifest rejects unknown nested properties',()=>{const m=fixture() as unknown as Record<string,unknown>;m.tests={passed:1,failed:0,skipped:0,subtests:0,ownerApproved:true};assert.throws(()=>validateManifest(m));});
test('manifest rejects inconsistent tests',()=>{const m=fixture();m.tests!.failed=1;assert.throws(()=>validateManifest(m));});
test('manifest rejects KYRO blockchain claims',()=>{const m=fixture('kyro');m.blockchain={network:'local',signing:false,broadcast:false,custody:false,realFunds:false,addresses:[]};assert.throws(()=>validateManifest(m));});
test('normalization does not promote local qualification',()=>{const n=normalize(fixture('rig'));assert.equal(n.chain,'local');assert.equal(n.manifest.maturity,'QUALIFIED');assert.equal(n.realFunds,false);});
test('normalization keeps PAPER execution disabled',()=>{const n=normalize(fixture('trade-x'));assert.equal(n.manifest.maturity,'PAPER');assert.equal(n.signing,false);assert.equal(n.broadcast,false);assert.equal(n.manifest.runtime!.orders,0);});
test('HMAC signs exact UTF-8 request bytes with identity binding',async()=>{
  const secret=randomBytes(32).toString('hex');const m=fixture();m.summary='Synthetic Unicode ✓';const body=JSON.stringify(m);const h=sign(body,{source:'prime',keyId:'prime-v1',timestamp:String(Date.now()),nonce:randomUUID()},secret);const source: Source={system:'prime',keyId:'prime-v1',repoKey:'prime-demo',secret,maximumTier:'restricted',staleAfterSeconds:3600};
  await new HmacVerifier().verify(body,h,source,Date.now());await assert.rejects(()=>new HmacVerifier().verify(body+' ',h,source,Date.now()));assert.notEqual(digest(body),digest(body+' '));
});
test('emitter creates, validates, writes and dry-runs without transport',async()=>{
  const m=createManifest(fixture());validateManifest(m);const dir=await mkdtemp(join(tmpdir(),'bus-emitter-'));
  try{await writeManifest(join(dir,'manifest.json'),m);assert.deepEqual(JSON.parse(await readFile(join(dir,'manifest.json'),'utf8')),m);assert.equal((await submit(m,'','',true)).status,'dry_run');}finally{await rm(dir,{recursive:true});}
});
test('emitter rejects short signing key',()=>assert.throws(()=>prepare(fixture(),'short')));
test('emitter rejects non-TLS external endpoint',async()=>assert.rejects(()=>submit(fixture(),'http://example.com/v1/ingest',randomBytes(32).toString('hex'))));
test('policy compares jsonb key order structurally and detects omitted boundaries',()=>{
  const m=fixture('trade-x');const old=published(JSON.parse(JSON.stringify(m,(key,value)=>value && typeof value==='object' && !Array.isArray(value)?Object.fromEntries(Object.entries(value).reverse()):value)));
  assert.equal(decide(refresh(m),old).decision,'auto_refresh');const n=refresh(m);delete n.runtime;assert.equal(decide(n,old).decision,'owner_review');assert(decide(n,old).diff.some(d=>d.field==='runtime'));
});
test('strict JSON rejects duplicate keys at every nesting including escaped aliases',()=>{
  for(const body of ['{"key":1,"key":2}','{"nested":{"a":1,"\\u0061":2}}','{"constructor":1}'])assert.throws(()=>strictJson(body));
  assert.deepEqual(strictJson('{"one":{"x":1},"two":{"x":2},"list":[{"x":3}]}'),{one:{x:1},two:{x:2},list:[{x:3}]});
});
