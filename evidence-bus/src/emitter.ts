import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import type { Manifest } from './model.js';
import { validateManifest } from './validation.js';
import { httpHeaders, sign } from './signing.js';
export { validateManifest } from './validation.js';
export type { Manifest } from './model.js';
export function createManifest(input: Omit<Manifest,'eventId'|'emittedAt'|'schemaVersion'>): Manifest {
  const manifest: Manifest={...input,schemaVersion:'1.0',eventId:randomUUID(),emittedAt:new Date().toISOString()};
  validateManifest(manifest); return manifest;
}
export async function writeManifest(path: string, m: Manifest) {validateManifest(m);await writeFile(path,JSON.stringify(m,null,2)+'\n',{mode:0o600});}
export function prepare(m: Manifest, secret: string) {
  validateManifest(m); if(secret.length<32) throw new Error('signing_key_too_short');
  const body=JSON.stringify(m);
  return {body,headers:httpHeaders(sign(body,{source:m.sourceSystem,keyId:m.signature.keyId,timestamp:String(Date.now()),nonce:randomUUID()},secret))};
}
export async function submit(m: Manifest, endpoint: string, secret: string, dryRun=false) {
  validateManifest(m);
  if(dryRun) return {eventId:m.eventId,status:'dry_run',decision:'not_submitted'};
  const url=new URL(endpoint);
  if(url.username || url.password || url.search || url.hash || url.pathname!=='/v1/ingest' || (url.protocol!=='https:' && !(url.protocol==='http:' && ['127.0.0.1','localhost'].includes(url.hostname)))) throw new Error('unsafe_ingest_endpoint');
  const request=prepare(m,secret);
  const response=await fetch(url,{method:'POST',...request,redirect:'error',signal:AbortSignal.timeout(10000)});
  if(response.status!==202) throw new Error(`ingest_rejected_${response.status}`);
  const value=await response.json() as Record<string,unknown>;
  if(value.eventId!==m.eventId || !['needs_review','auto_refreshed','conflict'].includes(String(value.status)) || !['owner_review','auto_refresh','conflict'].includes(String(value.decision))) throw new Error('ingest_response_invalid');
  return value;
}
