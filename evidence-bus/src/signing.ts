import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import type { Source } from './model.js';
import { BusError } from './validation.js';
export interface SignedHeaders { source: string; keyId: string; timestamp: string; nonce: string; signature: string }
export const digest = (body: string) => createHash('sha256').update(body, 'utf8').digest('hex');
export function signingInput(h: Omit<SignedHeaders,'signature'>, body: string): string {
  return ['SYNAPZ-EVIDENCE-V1', 'POST', '/v1/ingest', h.source, h.keyId, h.timestamp, h.nonce, digest(body)].join('\n');
}
export function sign(body: string, h: Omit<SignedHeaders,'signature'>, secret: string): SignedHeaders {
  return { ...h, signature: createHmac('sha256', secret).update(signingInput(h, body)).digest('hex') };
}
export interface SignatureVerifier { verify(body: string, headers: SignedHeaders, source: Source, now: number): Promise<void> }
export class HmacVerifier implements SignatureVerifier {
  async verify(body: string, h: SignedHeaders, source: Source, now: number): Promise<void> {
    if (source.system !== h.source || source.keyId !== h.keyId || !/^[0-9]{13}$/.test(h.timestamp) || !/^[a-zA-Z0-9-]{16,100}$/.test(h.nonce) || !/^[a-f0-9]{64}$/.test(h.signature)) throw new BusError('signature_invalid', 401);
    if (Math.abs(now - Number(h.timestamp)) > 300_000) throw new BusError('signature_expired', 401);
    const expected = sign(body, h, source.secret).signature;
    if (!timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(h.signature, 'hex'))) throw new BusError('signature_invalid', 401);
  }
}
export function httpHeaders(h: SignedHeaders): Record<string,string> {
  return { 'content-type': 'application/json', 'x-evidence-source': h.source, 'x-evidence-key': h.keyId, 'x-evidence-timestamp': h.timestamp, 'x-evidence-nonce': h.nonce, 'x-evidence-signature': h.signature };
}
