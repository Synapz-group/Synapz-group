# Replit / SYNAPZ Deep Dive integration handoff

This is an integration guide only. No Replit application, deployment, database or secret has been modified. All test evidence and fixtures are synthetic; host onboarding must use independently authorized real structured emitters.

## 1. Mount the standalone service

Build `evidence-bus` with Node 24+ using `npm ci` and `npm run build`. Ship `dist/src`, `schema`, `migrations` and `public` together (relative layout matters). Start `node dist/src/main.js` with a private Postgres connection. Expose the service through the host's TLS reverse proxy. Preserve the signed method and `/v1/ingest` pathname; rewriting the signed target requires an explicit shared protocol change.

Mount source ingress `/v1/ingest`, owner console `/owner` and its JS/CSS, owner routes `/v1/owner/*`, read-only reviewer routes `/v1/reviewer/*`, and `/v1/copilot/context`. Do not proxy arbitrary private service routes from the browser. Liveness `/health` reveals only process health. Database availability must be monitored separately.

As an alternative, import `createApp`, `EvidenceBus`, `Store` and `reviewerAdapters` into the host Node server. Supply `Authenticate` as an async function that resolves the host's **verified server-side session** into `{id,role,tier}`. The browser must never supply or override role/tier. Missing/unverified sessions return null. Use pseudonymous IDs; never owner emails. Bind owner role to the host's existing owner authorization, with its existing session revocation/MFA controls. Reviewer roles and tier are derived from the host access registry. Unknown roles and tiers must fail closed. Keep the standalone console bearer binding only if it fits the host's access policy; a host session UI can call the owner APIs through its authenticated server instead.

## 2. Database migration and privileges

Use a dedicated database or dedicated schema with a fixed trusted `search_path`. Back up first. Apply `migrations/001_evidence_bus.sql` through `npm run migrate` using migration privileges. Migration is transactional, idempotent and guarded by a migration advisory lock. It creates events, nonces, candidates, publications, current pointers, audit, source statuses and rate windows plus append-only triggers. No existing Deep Dive table is changed. Run migration once before starting the application; startup verifies the schema exists and never silently recreates it.

Run the service with a non-superuser role that has schema usage, SELECT on all bus tables, INSERT on events/nonces/publications/audit, INSERT+UPDATE on candidates/current/source-status/rate-window tables, and usage on the audit identity sequence. Do not grant update/delete/truncate on immutable event/publication/audit tables or DDL privileges to the runtime role. The test harness uses isolated disposable schemas; do not point it at production. Use host-managed encrypted database storage, TLS connections and backups. This service provides append-only application/database history, not tamper-proof or cryptographically immutable storage.

## 3. Environment variable names only

Server: `DATABASE_URL`, `EVIDENCE_SOURCES_JSON`, `EVIDENCE_AUTH_JSON`, `HOST`, `PORT`.

Source emitters: `EVIDENCE_INGEST_URL`, `EVIDENCE_SIGNING_KEY`.

Scheduled reconciliation CLI: `EVIDENCE_OWNER_URL`, `EVIDENCE_OWNER_TOKEN`.

Verification only: `EVIDENCE_TEST_DATABASE_URL`, `EVIDENCE_TEST_PYTHON`.

Keep configuration values in host/CI secret stores. Never put values in the handoff, committed files, browser JS, URLs, command arguments or logs. Source JSON includes a per-source secret and must be handled as a secret in its entirety. Bearer auth JSON likewise is a secret. `.env` files are ignored. Neither startup nor errors print configuration.

## 4. Reviewer projection / Deep Dive adapter

Server-side code calls `reviewerAdapters(bus, verifiedPrincipal).current(system?,domain?)`; or the host backend calls `/v1/reviewer/current` with the mapped authenticated session. Domain snapshots use explicit safe manifest tags, for example `solana`; no domain inference is performed from prose. Use current-state fields to update the existing Current Proof view. Render all text via escaped text components. Display synthetic state, limitations, maturity, environment and freshness together so evidence does not become a stronger claim in the UI.

Use `/v1/reviewer/evidence?system=...`, `/v1/reviewer/changes?since=...`, `/v1/reviewer/maturity-history?system=...` and `/v1/reviewer/snapshot?domain=...` for details. These endpoints use the same server-side approved + published + tier-visible rule. Owner views may inspect candidates but must never be reused as reviewer data sources. Do not cache authenticated projections in a shared public cache. This release sends `no-store` and does not support browser tier overrides.

The projection contains safe artifact references, not artifact bytes. If the host renders download links, resolve each through the host's own tier-authorized artifact store. Do not turn artifact keys into filesystem paths or fetch arbitrary manifest URLs. No cross-tier evidence download route is supplied by the Bus.

## 5. Copilot adapter

Call `reviewerAdapters(bus, verifiedPrincipal).copilotContext(system?,since?)` or `/v1/copilot/context`. It returns `current`, `changes`, contract version and an untrusted-data marker/instruction. This feed carries only published, approved, session-tier-visible evidence; it does not include draft bodies, owner identities or signing metadata. The host must inject evidence as quoted data, not tool instructions/system prompts, and must preserve limitations and exact maturity labels. PAPER/SHADOW, TESTNET/local and QUALIFIED must retain their semantics. The Evidence Bus itself uses no LLM and does not infer completion or deployment.

For “today/week”, supply a server-computed ISO `since`; for latest PRIME/Solana, supply `system=prime` or use the `solana` domain snapshot. “Blocked”, “planned” and “stale” are derived from returned structured result/limitations/maturity/freshness fields, never manufactured from chat. Owner Copilot preview can use safe structured owner metadata through separately authorized host code; raw candidates are not included in the standard Copilot feed.

## 6. Scheduler / reconciliation

Run a host-owned server job nightly, on demand, and after missed CI notifications. It gathers source observations from configured trusted repository artifact APIs/registries with server-side credentials. The Bus does not scrape repositories or accept arbitrary fetch URLs from manifests. A source observation is:

```json
{"source":"prime","latestEventId":null,"observedAt":"2026-10-07T00:00:00.000Z","schemaVersion":"1.0","evidencePresent":false,"conflicting":false}
```

For a present source use its actual last event UUID. `observedAt` represents the source's latest structured evidence observation, not the scheduler's polling clock. Compare the source's real schema version and artifact availability; do not fabricate them. Mark `conflicting` only from structured source registry conflicts. Pass an array to `/v1/owner/reconcile` as `{observations:[...]}`, or write the array to a local job file and run `npm run reconcile -- observations.json`. The CLI uses configured owner URL/token, TLS, timeout and no redirects. Its JSON result can feed host alerts.

Outputs are `in_sync`, `stale`, `source_missing`, `conflict`, `owner_review_required`, `error`. Missing observations flag source missing. Pending candidates require review. Newer/different event IDs, missing evidence and elapsed freshness flag stale. Schema drift flags error. Reconciliation updates diagnostic state only, never publications. Owner Ignore is time-limited and alert-only; retain staleness in reviewer context.

## 7. CI / GitHub publisher

Adapt `examples/github-evidence.yml` in each source repo. It assumes `scripts/engineering_evidence.py` is implemented by that engineering process and writes structured results directly from its test/build APIs. It is an integration contract, not a supplied test runner for a different repo. Include this emitter directory/schema or build the TypeScript SDK in that source. Use protected workflow environments, least-privilege read-only GitHub permissions and per-source signing keys. Never expose signing secrets to fork pull requests or untrusted workflow code. The supplied action SHAs are pinned.

Plain GitHub webhook payloads cannot update proof. GitHub Actions must emit/sign a schema-valid manifest; for existing webhook infrastructure, let a trusted server adapter obtain the structured manifest and sign it with its registered identity. Do not substitute GitHub's webhook HMAC for the Evidence Bus signature. Source-specific registration and the five-minute transport/emission window apply equally to both paths. For deployment systems use the same protocol after the actual structured observation.

## 8. First-source onboarding

1. Assign safe system/repo/key labels and a maximum disclosure tier. Generate a unique random signing secret and register it only in server/CI secret stores.
2. Implement the engineering emitter against the checked-in v1 schema; every evidence item needs an artifact key and SHA-256 of the actual structured artifact. Include precise environment/maturity, limitations, structured execution flags and explicit sensitivity flags. Never convert a local validator or test pass to a production claim.
3. Dry-run and validate locally. Submit a fresh signed manifest. Expect `needs_review`; first publication never inherits approval.
4. Owner inspects provenance, diff, limitations and safe evidence references, then approves individually in `/owner`. Reviewer/Copilot should see it only at the allowed tier; lower tier should see no record.
5. Emit a new same-boundary test/commit refresh and confirm auto-refresh. Emit a synthetic maturity transition in a test environment and confirm review. Enable nightly observation collection. Use the demo and tests as verification, not real engineering evidence.

Adding another repo requires a source registry entry, secret-store registration and an emitter, without application code changes. Built-in fixtures cover PRIME/Platform, Multichain, Trade X, RIG and KYRO. All six are synthetic and deliberately omit real wallet/transaction/customer/credential values. Preserve the KYRO media/blockchain separation.

## 9. Rollback and recovery

Disable source publishers and owner writes first. Keep the last approved projection available. Route the host back to its previous approved static registry or prior Evidence Bus release; never route reviewers to candidate tables. Do not erase audit history or delete evidence when a source is missing. Restore database backups only through the host's approved recovery process. Since this is an additive standalone schema, rollback does not require changing existing host tables; retain it for review. Re-enable publishing after resolving the fault and verifying the required gates against a disposable database.

Do not directly edit an append-only publication to “fix” maturity. Emit a corrected structured manifest, inspect policy, and approve a superseding publication. Conflicts/stale approvals need a fresh source event and explicit current-base review. To revoke access, revoke the verified host session/token or lower its server-side tier. Host-level publication withdrawal requires a separately audited host operation; this release's normal workflow supersedes or keeps existing proof rather than deleting it.

## 10. Acceptance and limits

Run every command in the README before host activation. `reports/demo-proof.json` proves the signed synthetic source-to-projection flow with real Postgres and compiled service modules. Browser tests prove console actions and credential/tier denial. Production verification must repeat the projection checks with the actual host auth binding. No Replit activation has been performed here.

Current limits: HMAC only; source observations are collected by the host; no automatic artifact hash retrieval; append-only database controls are not cryptographic immutability; one transaction lock serializes state changes; histories lack cursor pagination; key rotation is a coordinated cutover. Owner Ignore does not falsify freshness. Treat consuming Copilot prompts as a separate host trust boundary. None of these limits permits auto-promoting maturity or exposing candidate data.
