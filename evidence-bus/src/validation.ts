import { readFileSync } from 'node:fs';
import { Ajv } from 'ajv';
import addFormats from 'ajv-formats';
import type { Manifest } from './model.js';
import { asset } from './paths.js';

export class BusError extends Error {
  constructor(public code: string, public status = 400) { super(code); }
}
const ajv = new Ajv({ allErrors: false, strict: true });
// CommonJS package interop is explicit to work in both tsx and compiled Node ESM.
const formats = addFormats as unknown as (a: Ajv) => void;
formats(ajv);
const schema = JSON.parse(readFileSync(asset('schema/manifest-v1.json'), 'utf8'));
const validate = ajv.compile<Manifest>(schema);
const forbidden = /(?:[A-Z]:[\\/]|\/(?:Users|home|etc|var)\/|[\w.+-]+@[\w.-]+\.[a-z]{2,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|\b(?:gh[pousr]_[A-Za-z0-9]{20,}|AKIA[A-Z0-9]{16}|sk-[A-Za-z0-9]{20,})\b|(?:password|secret|api[_-]?key|access[_-]?token)\s*[:=]\s*\S+|<\/?[a-z][^>]*>)/i;
export function safeText(value: string): boolean { return !forbidden.test(value) && !value.includes(String.fromCharCode(0)) && !value.includes('\\u0000'); }
export function validateManifest(value: unknown): asserts value is Manifest {
  if (!validate(value)) throw new BusError('schema_invalid');
  const m = value;
  const serialized = JSON.stringify(m);
  if (!safeText(serialized) || serialized.includes('..') || /(?:__proto__|constructor|prototype)"\s*:/.test(serialized)) throw new BusError('unsafe_content');
  if (Date.parse(m.observedAt ?? m.emittedAt) > Date.parse(m.emittedAt)) throw new BusError('observation_after_emission');
  for (const e of m.evidence) {
    if (!e.url) continue;
    const u = new URL(e.url);
    if (u.protocol !== 'https:' || u.username || u.password || u.port || u.search || u.hash || u.hostname === 'localhost' || /^[\d.]+$/.test(u.hostname) || u.hostname.includes(':') || !u.hostname.includes('.') || /\.(local|internal|localhost)$/.test(u.hostname)) throw new BusError('unsafe_evidence_url');
  }
  if (m.tests && m.result === 'pass' && m.tests.failed > 0) throw new BusError('inconsistent_test_result');
  if (['PAPER','SHADOW'].includes(m.maturity) && (m.risk.realExecution || m.blockchain?.realFunds || m.blockchain?.custody)) throw new BusError('inconsistent_execution_boundary');
  if (m.environment === 'testnet' && m.blockchain && !['none','testnet'].includes(m.blockchain.network)) throw new BusError('inconsistent_network');
  if (m.environment === 'local' && m.blockchain && !['none','local'].includes(m.blockchain.network)) throw new BusError('inconsistent_network');
  if (m.sourceSystem === 'kyro' && m.blockchain && m.blockchain.network !== 'none') throw new BusError('media_is_not_blockchain_evidence');
}
