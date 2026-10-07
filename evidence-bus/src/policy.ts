import type { Manifest, Normalized, Policy, Published } from './model.js';
import { isDeepStrictEqual } from 'node:util';
export function normalize(manifest: Manifest): Normalized {
  const m = structuredClone(manifest);
  return { version: '1', manifest: m, observedAt: m.observedAt ?? m.emittedAt,
    totalTests: m.tests ? m.tests.passed + m.tests.failed + m.tests.skipped : null,
    runtimeState: m.runtime?.state ?? 'unknown', deploymentState: m.deployment?.state ?? 'none',
    chain: m.blockchain?.network ?? 'none', signing: m.blockchain?.signing ?? false,
    broadcast: m.blockchain?.broadcast ?? false, realFunds: m.blockchain?.realFunds ?? false, custody: m.blockchain?.custody ?? false };
}
const same = isDeepStrictEqual;
export function decide(m: Manifest, previous: Published|null, orderingConflict = false): Policy {
  const old = previous?.manifest;
  const keys = [...new Set([...Object.keys(m),...Object.keys(old ?? {})])] as (keyof Manifest)[];
  const diff = keys.filter(k => !same(old?.[k], m[k])).map(k => ({ field: k, before: old?.[k] ?? null, after: m[k] ?? null }));
  const reasons: string[] = [];
  const risks: string[] = [];
  if (!previous?.published) reasons.push('first_publication_or_unpublished');
  if (!m.autoPublishEligible) reasons.push('source_disallows_auto_publish');
  if (orderingConflict) reasons.push('event_order_conflict');
  if (old && m.maturity !== old.maturity) reasons.push('maturity_change_requires_owner');
  for (const [k,v] of Object.entries(m.risk)) if (v) risks.push(k);
  if (m.blockchain?.realFunds) risks.push('real_funds');
  if (m.blockchain?.custody) risks.push('custody');
  if (risks.length) reasons.push('explicit_risk_requires_owner');
  // Only this narrow field set can inherit an existing owner approval.
  const safe = new Set(['eventId','commitSha','emittedAt','observedAt','tests','build','signature','supersedes','correlationId','evidence']);
  for (const d of diff) if (old && !safe.has(d.field)) reasons.push(`changed_boundary:${d.field}`);
  if (old) {
    for (const item of old.evidence) {
      const next = m.evidence.find(e => e.artifactKey === item.artifactKey);
      if (!next || next.type !== item.type || next.url !== item.url || next.summary !== item.summary) reasons.push('evidence_removed_or_claim_changed');
    }
    const approvedUrls = new Set(old.evidence.map(e => e.url).filter(Boolean));
    if (m.evidence.some(e => e.url && !approvedUrls.has(e.url))) reasons.push('new_external_url');
    if (m.evidence.some(e => !old.evidence.some(p => p.artifactKey === e.artifactKey))) reasons.push('new_evidence_claim_requires_owner');
  }
  return { decision: orderingConflict ? 'conflict' : reasons.length ? 'owner_review' : 'auto_refresh',
    reasons: [...new Set(reasons)], requiredOwnerAction: reasons.length ? 'Inspect provenance and diff; approve, reject, archive, or keep current.' : 'None',
    diff, affectedRecords: [m.sourceSystem], riskFlags: risks };
}
