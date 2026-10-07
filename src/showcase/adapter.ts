import {
  architecture,
  maturityLegend,
  type CurrentEvidence,
  type ShowcaseEvidenceAdapter,
  type ShowcaseContext,
} from "./model";

// Defense in depth for a host-approved, sanitized projection. This is not a replacement
// for server authorization. The trusted host must bind the session before projecting.
const forbidden =
  /(?:https?:\/\/(?:localhost|127\.|10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)|github\.com|gitlab\.com|[A-Z]:[\\/]|\/Users\/|\/home\/|[\w.+-]+@[\w.-]+\.[a-z]{2,}|0x[a-f0-9]{40,}|-----BEGIN|(?:api[_ -]?key|secret|password|private[_ -]?key)\s*[:=]|(?:ignore|override|disregard)\b.{0,60}\b(?:instructions|policy|rules)|system\s*prompt|javascript:|data:)/i;
export function safeText(value: unknown, max = 1400): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= max &&
    !forbidden.test(value) &&
    !/[<>]/.test(value) &&
    !Array.from(value).some(
      (c) => c.charCodeAt(0) < 32 && ![9, 10, 13].includes(c.charCodeAt(0)),
    )
  );
}
// Links are local, visible-evidence references only. The host evidence view must
// reauthorize on open. Arbitrary external URLs and transaction material are rejected.
export function sanitizeEvidence(value: unknown): CurrentEvidence | undefined {
  if (!value || typeof value !== "object") return;
  const r = value as Record<string, unknown>;
  if (
    typeof r.safeKey !== "string" ||
    !/^[a-z][a-z0-9-]{0,63}$/.test(r.safeKey)
  )
    return;
  if (
    !safeText(r.title, 160) ||
    !safeText(r.summary) ||
    !safeText(r.domain, 80)
  )
    return;
  if (
    typeof r.maturity !== "string" ||
    !Object.hasOwn(maturityLegend, r.maturity)
  )
    return;
  if (
    !Array.isArray(r.limitations) ||
    r.limitations.length > 24 ||
    !r.limitations.every((v) => safeText(v, 600))
  )
    return;
  const keys = new Set(architecture.map((n) => n.key).concat("brains"));
  if (
    !Array.isArray(r.relatedNodes) ||
    !r.relatedNodes.every((v) => typeof v === "string" && keys.has(v))
  )
    return;
  if (!Array.isArray(r.evidenceRefs) || r.evidenceRefs.length > 20) return;
  const refs: CurrentEvidence["evidenceRefs"] = [];
  for (const ref of r.evidenceRefs) {
    if (!ref || typeof ref !== "object") return;
    const link = ref as Record<string, unknown>;
    if (
      !safeText(link.label, 120) ||
      typeof link.href !== "string" ||
      !/^#evidence\/[a-z][a-z0-9-]{0,63}$/.test(link.href)
    )
      return;
    refs.push({ label: link.label, href: link.href });
  }
  const dates: { verifiedAt?: string; observedAt?: string } = {};
  for (const field of ["verifiedAt", "observedAt"] as const) {
    if (r[field] !== undefined) {
      if (
        typeof r[field] !== "string" ||
        !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(r[field]) ||
        Number.isNaN(Date.parse(r[field]))
      )
        return;
      dates[field] = r[field];
    }
  }
  return {
    safeKey: r.safeKey,
    title: r.title,
    summary: r.summary,
    maturity: r.maturity as CurrentEvidence["maturity"],
    domain: r.domain,
    limitations: [...r.limitations] as string[],
    relatedNodes: [...r.relatedNodes] as string[],
    evidenceRefs: refs,
    ...dates,
  };
}
export async function loadVisibleEvidence(
  adapter: ShowcaseEvidenceAdapter,
  context: ShowcaseContext,
): Promise<CurrentEvidence[]> {
  const raw = await adapter.listVisibleEvidence(context);
  if (!Array.isArray(raw) || raw.length > 500)
    throw new Error("Invalid evidence projection");
  const records = raw.map(sanitizeEvidence);
  // An invalid projection fails as a whole; never silently show partial claims.
  if (records.some((r) => !r)) throw new Error("Unsafe evidence projection");
  const clean = records as CurrentEvidence[];
  const visible = new Set(clean.map((r) => r.safeKey));
  if (visible.size !== clean.length) throw new Error("Duplicate evidence key");
  return clean.map((r) => ({
    ...r,
    evidenceRefs: r.evidenceRefs.filter((ref) =>
      visible.has(ref.href.slice("#evidence/".length)),
    ),
  }));
}
export interface ProjectionRecord {
  approved: boolean;
  published: boolean;
  audience: readonly string[];
  evidence: unknown;
}
export interface TrustedSession {
  tier: string;
}
// Use on the server, or with an already sanitized projection. Do not bundle private
// source records in a browser. Client context never selects authority or draft access.
export function createReadOnlyAdapter(
  records: readonly ProjectionRecord[],
  session: TrustedSession,
  dataLabel: ShowcaseEvidenceAdapter["dataLabel"] = "HOST APPROVED EVIDENCE",
): ShowcaseEvidenceAdapter {
  const tier = session.tier;
  const eligible = records.filter(
    (r) =>
      r.approved === true && r.published === true && r.audience.includes(tier),
  );
  const visible = eligible
    .map((r) => sanitizeEvidence(r.evidence))
    .filter((r): r is CurrentEvidence => !!r);
  const keys = new Set(visible.map((r) => r.safeKey));
  const frozen = visible.map((r) => ({
    ...r,
    evidenceRefs: r.evidenceRefs.filter((ref) => keys.has(ref.href.slice(10))),
  }));
  const copy = () => structuredClone(frozen);
  return Object.freeze({
    dataLabel,
    async listVisibleEvidence() {
      return copy();
    },
    async getVisibleEvidence(key: string) {
      return copy().find((r) => r.safeKey === key);
    },
    async getEvidenceForNode(key: string) {
      return copy().filter((r) => r.relatedNodes.includes(key));
    },
    async getLatestSnapshot(domain: string) {
      return copy()
        .filter((r) => r.domain === domain)
        .sort((a, b) =>
          (b.observedAt ?? b.verifiedAt ?? "").localeCompare(
            a.observedAt ?? a.verifiedAt ?? "",
          ),
        )[0];
    },
    getMaturityLegend() {
      return maturityLegend;
    },
  });
}
