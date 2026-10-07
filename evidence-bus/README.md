# SYNAPZ Evidence Bus

Standalone, deterministic evidence ingestion and disclosure service. Engineering processes emit structured manifests; the service never extracts engineering truth from prose, chat, terminal logs, or an LLM. All included source fixtures and the executable demo are synthetic. They are not claims about real SYNAPZ systems.

## Run locally

Requires Node 24+, Python 3.12+, and Postgres 17+ (no paid service).

```powershell
cd evidence-bus
npm.cmd ci
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r python/requirements.txt
```

Provision a dedicated Postgres database. Set `DATABASE_URL`, `EVIDENCE_SOURCES_JSON`, and `EVIDENCE_AUTH_JSON` through your secret manager. Run `npm.cmd run migrate`, `npm.cmd run build`, then `npm.cmd start`. The default bind is loopback port 4318. Open `/owner`. Put TLS and verified host authentication in front of any remote deployment.

`EVIDENCE_SOURCES_JSON` is an array of objects with `system`, `repoKey`, `keyId`, `secret`, `staleAfterSeconds`, `maximumTier`. Signing secrets must be at least 32 characters and generated randomly. Key IDs and secrets must be distinct across sources; duplicate credentials fail startup. System, repo and key identifiers must be disclosure-safe labels. No private repository names belong in these labels. Register each source independently; only registered identity/key/repo combinations may ingest.

`EVIDENCE_AUTH_JSON` is an array of `{token, principal:{id, role, tier}}`. Roles: `owner`, `reviewer`. Tiers in order: `public`, `partner`, `restricted`. Tokens must be at least 32 random characters. Principal IDs must be safe pseudonyms, not emails. This is the standalone auth binding; the host may supply `Authenticate` using its verified server sessions instead. Credentials are server configuration and are never sent to client bundles. The standalone console accepts an owner bearer credential for one in-memory tab session, without browser persistence.

## Data flow and guarantees

1. JSON Schema v1 and semantic safety validation reject unknown fields, privacy leaks, unsafe evidence keys/URLs, inconsistent network/execution claims and invalid counts.
2. HMAC binds exact UTF-8 body hash, HTTP method/path, source, key ID, timestamp and nonce. Signatures and manifests expire after five minutes. A transport-neutral `SignatureVerifier` interface permits a future approved OIDC implementation; this release implements HMAC only.
3. Postgres stores nonces and event IDs atomically. Exact replay and fresh-nonce duplicate event submissions return 409; retries have no duplicate effects. Re-signing a rejected transaction is safe after its underlying fault is fixed.
4. Raw validated event, normalized candidate, deterministic policy and approved publication are separate records. A failed transaction rolls back every state mutation and preserves the previous publication. Rejection codes are audited separately, without request bodies, headers or exception details.
5. Only same-boundary commit, timestamp, test, build and existing evidence hash refreshes inherit approval. First publication, any maturity transition, environment/visibility changes, new claims/references, removed limitations and sensitive execution/regulatory/commercial flags require owner review. Unknown changes require review. New evidence claims conservatively require approval even within a familiar system.
6. Owner approval requires an unchanged approved base and latest source event. Conflicts cannot be approved; the source must emit a corrected, fresh manifest. Individual review only; there is no bulk maturity approval.
7. Reviewer and Copilot reads require server-authenticated principals. They read only approved, published records within that principal's tier. Projection excludes owner identities, signing metadata, repository keys and branches. URL references are inert metadata; the service never fetches them, executes evidence, or runs shell commands from manifests.
8. Reconciliation compares trusted structured source observations with current state; it detects source disappearance, missing evidence, newer source events, schema drift, conflicts, pending review and expiry. Missing sources never delete approved proof. Temporary ignore suppresses operator alerts only and does not hide the stale status or change the evidence.

Events, publications and audit have append-only triggers. This is database/application-level history, not cryptographic immutability. A privileged database administrator can change database controls.

## API

All business endpoints return JSON with `Cache-Control: no-store`. Owner POSTs require JSON. Read filters support `system`, `domain`, `since` as applicable; tier is never a request parameter.

| Method | Route | Access / behavior |
|---|---|---|
| POST | `/v1/ingest` | Source-specific signed manifest; 202 with matching event ID, candidate status and policy decision |
| GET | `/v1/owner/state` | Owner candidates, normalized diffs, provenance, source statuses, engineering changes and audit codes |
| POST | `/v1/owner/review` | Owner `{eventId,action,note}`; action approve/reject/archive/keep |
| POST | `/v1/owner/ignore` | Owner `{source,until}`; future expiry at most seven days |
| POST | `/v1/owner/reconcile` | Owner `{observations:[...]}` |
| GET | `/v1/reviewer/current` | Latest approved current state and freshness |
| GET | `/v1/reviewer/evidence` | Evidence by system |
| GET | `/v1/reviewer/snapshot` | Current state by domain tag |
| GET | `/v1/reviewer/changes` | Approved change history, optionally since an ISO date |
| GET | `/v1/reviewer/maturity-history` | Approved history by system |
| GET | `/v1/copilot/context` | Tier-visible current proof and changes, explicitly marked untrusted data |
| GET | `/owner` | Static console; data loads only after owner authentication |
| GET | `/health` | Liveness only, no source information |

Evidence references carry artifact key, type and SHA-256, optionally a clean HTTPS URL. Hashes record emitter assertions; the service does not independently download or verify artifacts. Hosts must resolve artifacts through their own authenticated, tier-aware access layer.

## Emitters

Node/TypeScript: import `createManifest`, `validateManifest`, `prepare`, `writeManifest`, `submit` from `src/emitter.ts` (or the compiled package export). See `examples/emit.ts`. `submit(..., true)` validates and dry-runs without network access. Responses must be 202 with matching event ID and recognized status/decision. Redirects are forbidden. Remote endpoints require HTTPS; loopback HTTP is allowed for development.

Python: `python python/emitter.py structured.json --create --output manifest.json --send`. Use `--dry-run` to avoid sending; `--schema` prints the language-neutral JSON Schema. The CLI reads endpoint/signing key from environment, never command arguments, never prints signatures, and never echoes unsafe input on failure. Use the PowerShell example in `examples/emit.ps1`. `examples/github-evidence.yml` shows a protected CI publisher; the source repository supplies the authoritative structured test/build emitter, not a log parser. Plain GitHub webhooks are not accepted as evidence: a workflow must create and sign the manifest.

The Python helper functions `create_manifest`, `validate_manifest`, `prepare`, and `submit` are usable without the CLI. A source can use any language against `schema/manifest-v1.json` and the signing protocol in `docs/SIGNING.md`.

## Verification and demo

Set `EVIDENCE_TEST_DATABASE_URL` to a **dedicated disposable** Postgres database. Tests create uniquely named schemas and remove only those schemas. They require real Postgres and never skip missing database tests.

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run test:e2e
npm.cmd run build
npx.cmd playwright install chromium
npm.cmd run test:ui
.venv\Scripts\python.exe -m unittest discover -s python -v
npm.cmd run demo
npm.cmd audit
.venv\Scripts\python.exe -m pip_audit -r python/requirements.lock --no-deps --disable-pip --cache-dir .tools/pip-audit-cache
npm.cmd run scan
```

`npm.cmd run demo` uses compiled production service modules, a real HTTP listener and real Postgres. It creates a synthetic PRIME manifest, signs/submits it, proves replay rejection, initial review, safe automatic refresh, maturity approval, tier isolation, Deep Dive/Copilot filtering, reconciliation and retained state after failed ingest. It writes machine-readable `reports/demo-proof.json` and cleans up its test schema. It never connects to Replit or claims real deployments.

Independent Gitleaks scan: `gitleaks dir . --config .gitleaks.toml --redact --report-format json --report-path reports/gitleaks.json`. The config retains default secret rules; it excludes only third-party installations and generated browser traces. Authored source, fixtures, documentation, package locks and production output are scanned. `npm run scan` additionally checks privacy and browser security boundaries, with rule self-tests.

`npm.cmd run verify` runs the complete gate sequence and writes `reports/gates.json`, the signed demo proof, dependency audit reports and scan reports. Install Gitleaks on PATH (on Windows `.tools/gitleaks/gitleaks.exe` is also recognized). The Python audit lists every package in the pinned runtime closure; `--no-deps --disable-pip` avoids an unnecessary resolver run rather than excluding transitive packages. The full lock is installed through `python/requirements.txt`.

Read [Replit handoff](docs/REPLIT_HANDOFF.md), [signing protocol](docs/SIGNING.md), and [completion evidence](reports/VERIFICATION.md). No Replit changes are made by this repository.

## Operational boundaries

This is a standalone release with synthetic source onboarding. Real source credentials, host sessions, scheduled observation collection and production deployment belong to the host integration. No real SYNAPZ repository state has been asserted or upgraded. A single transactional advisory lock prioritizes correctness over ingestion throughput. Lists are intended for a controlled evidence registry; add cursor pagination/retention before very large deployments. Nonces are retained indefinitely; rate windows may be pruned after their enforcement interval. No OIDC verifier, artifact fetcher, LLM, or paid infrastructure is required or bundled. Prompt-like strings remain untrusted quoted data; a consuming Copilot must honor the context contract.
