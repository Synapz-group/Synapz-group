export const maturities = ['VERIFIED','QUALIFIED','DEPLOYED','TESTNET','PAPER','SHADOW','DEVELOPMENT','PROTOTYPE','PLANNED','TARGET','INTEGRATION_IN_PROGRESS'] as const;
export type Maturity = typeof maturities[number];
export const tiers = ['public', 'partner', 'restricted'] as const;
export type Tier = typeof tiers[number];
export interface Evidence {
  type: string; artifactKey: string; sha256: string; summary: string; url?: string;
}
export interface Manifest {
  schemaVersion: '1.0'; eventId: string; sourceSystem: string; sourceRepoSafeKey: string;
  sourceType: 'ci'|'supervisor'|'deployment'|'manual'; branch: string; commitSha: string;
  emittedAt: string; observedAt?: string; environment: 'local'|'development'|'testnet'|'staging'|'production';
  maturity: Maturity; result: 'pass'|'fail'|'partial'|'pending'; title: string; summary: string;
  evidence: Evidence[]; limitations: string[]; nextSteps: string[]; tags: string[]; relationships: string[];
  disclosureClass: Tier; autoPublishEligible: boolean; synthetic: boolean;
  tests?: { passed: number; failed: number; skipped: number; subtests: number };
  build?: { status: 'pass'|'fail'|'pending'; artifactKey: string };
  deployment?: { state: 'none'|'observed'|'deployed'; providerLive: boolean; liveJobs: number };
  runtime?: { state: 'healthy'|'degraded'|'stopped'|'unknown'; positions: number; orders: number; paperEquity?: number };
  blockchain?: { network: 'none'|'local'|'testnet'|'mainnet'; signing: boolean; broadcast: boolean; realFunds: boolean; custody: boolean; addresses: string[] };
  risk: { regulatory: boolean; namedParties: boolean; commercial: boolean; sensitive: boolean; realExecution: boolean };
  supersedes?: string; correlationId?: string;
  signature: { algorithm: 'hmac-sha256'; keyId: string };
}
export interface Normalized {
  version: '1'; manifest: Manifest; observedAt: string; totalTests: number | null;
  runtimeState: string; deploymentState: string; chain: string; signing: boolean; broadcast: boolean;
  realFunds: boolean; custody: boolean;
}
export interface Policy {
  decision: 'auto_refresh'|'owner_review'|'conflict'; reasons: string[]; requiredOwnerAction: string;
  diff: { field: string; before: unknown; after: unknown }[]; affectedRecords: string[]; riskFlags: string[];
}
export interface Candidate {
  id: string; source: string; baseEvent: string|null; normalized: Normalized; policy: Policy;
  status: 'needs_review'|'auto_refreshed'|'approved'|'rejected'|'archived'|'conflict';
  createdAt: string;
}
export interface Published {
  eventId: string; source: string; manifest: Manifest; approved: true; published: boolean;
  approvedBy: string; approvedAt: string; reviewerNote: string; previousEvent: string|null;
}
export interface Source {
  system: string; repoKey: string; keyId: string; secret: string;
  staleAfterSeconds: number; maximumTier: Tier;
}
export interface Principal { id: string; role: 'owner'|'reviewer'; tier: Tier }
export interface SourceObservation { source: string; latestEventId: string|null; observedAt: string; schemaVersion: string; evidencePresent: boolean; conflicting: boolean }
export interface Reconciliation { source: string; status: 'in_sync'|'stale'|'source_missing'|'conflict'|'owner_review_required'|'error'; reasons: string[]; checkedAt: string }
