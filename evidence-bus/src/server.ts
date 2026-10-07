import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createHash, timingSafeEqual } from 'node:crypto';
import type { EvidenceBus } from './service.js';
import type { Principal, SourceObservation } from './model.js';
import { BusError } from './validation.js';
import { asset } from './paths.js';
import { strictJson } from './json.js';
export type Authenticate = (request: IncomingMessage) => Promise<Principal|null>;
export interface Credential { token: string; principal: Principal }
export function bearerAuth(credentials: Credential[]): Authenticate {
  if (credentials.some(c=>c.token.length<32 || !['owner','reviewer'].includes(c.principal.role) || !['public','partner','restricted'].includes(c.principal.tier) || !/^[a-zA-Z0-9_.-]{1,100}$/.test(c.principal.id))) throw new Error('invalid_auth_configuration');
  if (new Set(credentials.map(c=>c.token)).size !== credentials.length) throw new Error('duplicate_auth_credential');
  return async req=>{
    const token = req.headers.authorization?.replace(/^Bearer /,'') ?? '';
    const hash = createHash('sha256').update(token).digest();
    return credentials.find(c=>timingSafeEqual(hash,createHash('sha256').update(c.token).digest()))?.principal ?? null;
  };
}
async function body(req: IncomingMessage, max: number): Promise<string> {
  if (req.headers['content-type']?.split(';')[0] !== 'application/json') throw new BusError('content_type_required',415);
  if (Number(req.headers['content-length'])>max) throw new BusError('payload_too_large',413);
  const chunks: Buffer[] = []; let size=0;
  for await (const chunk of req) { size+=chunk.length; if (size>max) throw new BusError('payload_too_large',413); chunks.push(chunk); }
  const bytes = Buffer.concat(chunks);
  try { return new TextDecoder('utf-8',{fatal:true}).decode(bytes); } catch { throw new BusError('utf8_invalid'); }
}
function json(res: ServerResponse, status: number, value: unknown) { res.writeHead(status,{'content-type':'application/json; charset=utf-8'}); res.end(JSON.stringify(value)); }
function parse(value: string): Record<string,unknown> {
  const v = strictJson(value); if (!v || typeof v!=='object' || Array.isArray(v)) throw new BusError('json_invalid'); return v as Record<string,unknown>;
}
export function createApp(bus: EvidenceBus, authenticate: Authenticate) {
  const server = createServer(async (req,res)=>{
    res.setHeader('cache-control','no-store'); res.setHeader('x-content-type-options','nosniff'); res.setHeader('referrer-policy','no-referrer');
    res.setHeader('content-security-policy',"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    res.setHeader('strict-transport-security','max-age=31536000');
    try {
      const url = new URL(req.url ?? '/', 'http://evidence.invalid');
      if (req.method==='GET' && url.pathname==='/health') return json(res,200,{status:'ok'});
      if (req.method==='GET' && ['/owner','/owner.js','/owner.css'].includes(url.pathname)) {
        const name = url.pathname==='/owner' ? 'owner.html' : url.pathname.slice(1);
        res.writeHead(200,{'content-type':name.endsWith('.html')?'text/html; charset=utf-8':name.endsWith('.js')?'text/javascript; charset=utf-8':'text/css; charset=utf-8'});
        res.end(await readFile(asset(`public/${name}`))); return;
      }
      // Bucket keys are hashes of actual peer IPs, never manifest-controlled labels or forwarding headers.
      await bus.store.rate(`ip:${createHash('sha256').update(req.socket.remoteAddress ?? 'unknown').digest('hex')}`,bus.clock(),300);
      if (req.method==='POST' && url.pathname==='/v1/ingest') {
        const header = (name: string) => typeof req.headers[name]==='string' ? req.headers[name] as string : '';
        const result = await bus.ingest(await body(req,65536),{ source:header('x-evidence-source'),keyId:header('x-evidence-key'),timestamp:header('x-evidence-timestamp'),nonce:header('x-evidence-nonce'),signature:header('x-evidence-signature') });
        return json(res,202,result);
      }
      const principal = await authenticate(req);
      if (!principal) throw new BusError('authentication_required',401);
      if (url.pathname.startsWith('/v1/owner/')) {
        bus.requireOwner(principal);
        // Browser owner requests may use only same-origin fetch; bearer credentials are not cookies.
        if (req.headers['sec-fetch-site'] && !['same-origin','none'].includes(String(req.headers['sec-fetch-site']))) throw new BusError('cross_origin_rejected',403);
        if (req.method==='GET' && url.pathname==='/v1/owner/state') return json(res,200,await bus.ownerState(principal));
        if (req.method==='POST') {
          const data = parse(await body(req,32768));
          if (url.pathname==='/v1/owner/review') {
            if (Object.keys(data).some(k=>!['eventId','action','note'].includes(k)) || typeof data.eventId!=='string' || typeof data.action!=='string' || typeof data.note!=='string') throw new BusError('review_invalid');
            return json(res,200,await bus.review(principal,data.eventId,data.action as 'approve',data.note));
          }
          if (url.pathname==='/v1/owner/ignore') {
            if (typeof data.source!=='string' || typeof data.until!=='string' || Object.keys(data).length!==2) throw new BusError('ignore_invalid');
            await bus.ignore(principal,data.source,data.until); return json(res,200,{status:'ignored_temporarily'});
          }
          if (url.pathname==='/v1/owner/reconcile') {
            if (Object.keys(data).length!==1 || !Array.isArray(data.observations)) throw new BusError('observations_invalid');
            return json(res,200,await bus.reconcile(principal,data.observations as SourceObservation[]));
          }
        }
      }
      if (req.method==='GET') {
        if ([...url.searchParams.keys()].some(k=>!['system','domain','since'].includes(k))) throw new BusError('query_invalid');
        const system=url.searchParams.get('system') ?? undefined, domain=url.searchParams.get('domain') ?? undefined, since=url.searchParams.get('since') ?? undefined;
        if (since && !Number.isFinite(Date.parse(since))) throw new BusError('query_invalid');
        if (['/v1/reviewer/current','/v1/reviewer/evidence','/v1/reviewer/snapshot'].includes(url.pathname)) return json(res,200,await bus.projection(principal,system,domain));
        if (['/v1/reviewer/changes','/v1/reviewer/maturity-history'].includes(url.pathname)) return json(res,200,await bus.feed(principal,since,system));
        if (url.pathname==='/v1/copilot/context') return json(res,200,await bus.copilot(principal,system,since));
      }
      throw new BusError('route_missing',404);
    } catch(e) {
      const err=e instanceof BusError ? e : new BusError('internal_error',500);
      // Never record body, URL, authorization/signature headers, exception text, or untrusted source labels.
      try { await bus.store.audit('rejected',err.code); } catch { /* Database failure still returns no evidence. */ }
      if (!res.headersSent) json(res,err.status,{error:err.code}); else res.end();
    }
  });
  server.requestTimeout=15000; server.headersTimeout=10000; server.maxHeadersCount=40;
  return server;
}
