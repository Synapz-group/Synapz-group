# Evidence Bus completion evidence

Branch: `feature/deep-dive-evidence-bus-codex`. Scope: the standalone `evidence-bus/` directory. Original specification documents and unrelated existing local artifacts are unchanged. Replit was not modified, deployed to, or contacted.

The release gate is `npm run verify`. Authoritative machine-readable results are in [gates.json](gates.json). The synthetic source-to-reviewer proof is [demo-proof.json](demo-proof.json). These records are produced by the test runner and executable demo; engineering truth is never inferred from chat or terminal prose.

| Gate | Result |
|---|---|
| Unit / schema / normalization / policy / emitter | 49 passed |
| Adversarial with real Postgres and HTTP | 33 passed |
| API / persistence / emitter / projection / reconciliation E2E | 18 passed |
| Browser E2E against compiled production service | 4 passed |
| Python emitter tests | 10 passed |
| Total | 114 passed; zero failures, skips, or weakened tests |
| Typecheck | PASS |
| Lint, including SDK examples and verification scripts | PASS |
| Production TypeScript build and actual startup | PASS |
| Node full dependency audit (including development dependencies) | Zero vulnerabilities |
| Python complete pinned runtime dependency closure audit | Six packages; zero vulnerabilities |
| Gitleaks default secret rules, authored source and production output | Zero findings |
| Privacy / browser-boundary scan | Zero findings; seven rule self-tests |
| Signed manifest / deterministic policy / reconciliation proof | 14 assertions passed |
| Replit integration handoff | Complete documentation; no Replit changes |

All database tests use real Postgres 17 in uniquely generated disposable schemas, with no optional skips or in-memory persistence substitute. Browser tests use Chromium. The production-entry test runs the built Node server with configured authentication and verifies migration idempotence, persisted approval and denial of unauthenticated reads. The test harness uses separate randomly generated keys per source.

## Delivered feature checklist

- [x] Versioned strict language-neutral manifest JSON Schema and exact maturity semantics.
- [x] Signed HMAC ingest API; source/key/repository binding; timestamp validation; replay protection; event-ID idempotent rejection; rate/size/content-type limits; safe audits.
- [x] Lossless normalization, deterministic safe-field policy, fail-closed owner review and stale-base conflict checks.
- [x] Postgres migration, transactional event/candidate/publication persistence, provenance, append-only publication/event/audit history.
- [x] Owner console: Incoming, Auto-refreshed, Needs Review, Conflicts, Rejected, Stale Sources, Change Feed; approve/reject/archive/keep/note/temporary-ignore actions.
- [x] Approved + published + server-tier-visible reviewer current/evidence/snapshot/change/maturity-history interfaces and Deep Dive adapter.
- [x] Owner engineering change feed and approved reviewer feed.
- [x] Reconciliation engine, authenticated API and scheduler/manual/CI CLI; stale/missing/conflict/schema-drift/pending-review detection with retained approved state.
- [x] TypeScript emitter SDK and example; Python helper/CLI; schema-only and dry-run modes; response verification.
- [x] GitHub Actions publisher and PowerShell example.
- [x] Synthetic PRIME, Platform/UNIFICATION, Multichain, Trade X, RIG and KYRO fixtures, preserving local/testnet/paper/media boundaries.
- [x] Copilot current-status feed using only the same approved reviewer projection.
- [x] Adversarial, persistence, authorization, E2E and compiled-console verification, production build, dependency audits and secret/privacy scans.
- [x] Precise [Replit handoff](../docs/REPLIT_HANDOFF.md).

## End-to-end proof

The executable demo emits synthetic PRIME structured evidence, validates it, signs the exact request bytes and submits through HTTP to compiled production service modules. It proves replay rejection and first-publication review; records a normalized candidate; owner-approves the baseline; automatically publishes a safe same-maturity test/commit refresh; holds a maturity transition; owner-approves that transition; excludes restricted RIG evidence from the lower-tier projection; verifies the Deep Dive and Copilot adapter; deliberately makes the source observation newer than the registry and detects staleness; then forges a later ingest and proves the last approved state remains visible.

Additional E2E assertions explicitly exclude unpublished rows and inconsistent approval flags from current, changes and Copilot; reject stale owner approvals; retain replay/audit/reconciliation across service instances; roll back failed publications; and enforce database append-only triggers. Adversarial tests cover the required signature/replay/drift/oversize/JSON/prompt/path/tier/maturity/URL/duplicate/ordering attacks plus privacy leakage, unknown fields, source impersonation, quota exhaustion and cross-origin owner access.

## Files and configuration

See [files-changed.txt](files-changed.txt) for the complete feature file inventory. Major groups: `src/`, `schema/`, `migrations/`, `public/`, `python/`, `fixtures/`, `examples/`, `test/`, `scripts/`, `docs/` and `reports/`. Build output, dependency installations, scanner binaries and browser traces are ignored.

Environment variable names only: `DATABASE_URL`, `EVIDENCE_SOURCES_JSON`, `EVIDENCE_AUTH_JSON`, `HOST`, `PORT`, `EVIDENCE_INGEST_URL`, `EVIDENCE_SIGNING_KEY`, `EVIDENCE_OWNER_URL`, `EVIDENCE_OWNER_TOKEN`, `EVIDENCE_TEST_DATABASE_URL`, `EVIDENCE_TEST_PYTHON`.

## Known limits

Real source onboarding and host authentication/scheduler/deployment wiring are documented handoff work; no real engineering status was asserted. HMAC is implemented; OIDC is an extension point only. Artifact hashes are source assertions and are not independently fetched. Reconciliation consumes host-collected structured observations. History is application/database append-only, not cryptographic immutability. A transaction lock serializes state changes; histories need cursor pagination before very large deployments. Coordinated key rotation replaces a source's key, without overlap. Reviewer artifact downloads and publication revocation are host responsibilities. Copilot must continue treating all evidence text as untrusted quoted data.
