# SYNAPZ Evidence Bus / Deep Dive Auto-Sync — Codex Build Specification

## Objective

Build a production-quality, standalone evidence-ingestion and synchronization service that keeps the SYNAPZ Private Technical Deep Dive current automatically as SYNAPZ projects change.

The system must turn structured engineering outputs from repositories, CI, supervisors and deployments into sanitized, provenance-linked evidence updates for the Deep Dive.

The goal is:

**engineering work -> structured evidence -> signed ingest -> policy validation -> owner-review / auto-refresh -> reviewer-visible Current Proof + Copilot**

The system must reduce or eliminate manual Deep Dive maintenance without weakening disclosure controls.

---

## Core principle

The Evidence Bus must never infer engineering truth from prose, chat logs or terminal output alone.

Authoritative updates must arrive as a machine-readable manifest emitted by the build/test/deployment/supervisor process itself.

AI may explain evidence after ingestion. AI must not decide what happened.

---

## Initial source systems

Build the architecture so any SYNAPZ repository can join later, but provide first-class adapters/examples for:

- PRIME / SYNAPZ Core
- Platform / UNIFICATION
- Multichain
- Trade X / market-control
- Regulated Issuance / RIG / tokenisation
- KYRO application/video pipeline

Do not hard-code private local paths or credentials.

---

## 1. Canonical Evidence Manifest

Define a versioned JSON schema.

Required fields should include:

- schemaVersion
- eventId
- sourceSystem
- sourceRepoSafeKey
- sourceType
- branch
- commitSha
- emittedAt
- observedAt?
- environment
- maturity
- result
- title
- summary
- evidence[]
- tests?
- build?
- deployment?
- blockchain?
- limitations[]
- nextSteps[]
- tags[]
- relationships[]
- disclosureClass
- autoPublishEligible
- supersedes?
- correlationId?
- signature metadata

Support evidence item types such as:
- test_report
- build_report
- runtime_evidence
- deployment_observation
- transaction_receipt
- security_scan
- dependency_audit
- supervisor_completion
- generated_artifact
- documentation
- human_review_required

The manifest must preserve exact maturity semantics.

---

## 2. Maturity and claim semantics

Supported states at minimum:

- VERIFIED
- QUALIFIED
- DEPLOYED
- TESTNET
- PAPER
- SHADOW
- DEVELOPMENT
- PROTOTYPE
- PLANNED
- TARGET
- INTEGRATION_IN_PROGRESS

Absolute rules:

- QUALIFIED != DEPLOYED
- TESTNET != MAINNET
- PAPER/SHADOW != live trading
- PLANNED/TARGET != implemented
- VERIFIED does not automatically mean production
- a test pass cannot silently promote maturity
- a public-testnet transaction cannot silently promote to mainnet/deployed
- a local validator result cannot silently promote to public network

Maturity transitions must go through policy rules.

---

## 3. Ingestion API

Build a secure server-side ingest API.

Requirements:
- signed requests;
- timestamp validation;
- replay protection;
- idempotency by eventId;
- schema validation;
- size limits;
- content-type enforcement;
- rate limiting;
- source allowlist;
- per-source signing identity;
- reject unsigned/expired/replayed events;
- audit trail of accepted/rejected events;
- no secrets in browser code.

Support GitHub Actions/webhook-friendly ingestion.

Prefer a transport-neutral signing abstraction so the host may use HMAC, GitHub OIDC/JWT verification, or another approved signer later.

Do not hard-code secret values.

---

## 4. Normalization layer

Normalize source-specific manifests into a common internal evidence model.

Normalize:
- test counts;
- pass/fail state;
- commits;
- dates;
- environments;
- maturity;
- limitations;
- evidence provenance;
- runtime state;
- deployment state;
- chain/network;
- whether signing/broadcast occurred;
- whether money/custody/mainnet is involved.

Never drop limitations during normalization.

Never convert source text into stronger claims.

---

## 5. Policy engine

Implement a deterministic policy engine that decides:

### A. Safe auto-refresh
Examples:
- new commit SHA;
- test counts;
- build status;
- evidence timestamp;
- runtime observation timestamp;
- same-maturity evidence refresh;
- additional evidence on an already-approved claim;
- status staying within the same approved disclosure boundary.

### B. Owner review required
Examples:
- maturity promotion;
- first-time system publication;
- TESTNET -> DEPLOYED/MAINNET;
- PAPER/SHADOW -> real execution;
- real funds/custody;
- regulatory/legal claims;
- named customers/partners;
- commercial data;
- new token/contract addresses;
- new external public URLs;
- new repository identifiers;
- anything marked sensitive;
- anything that broadens reviewer visibility.

Default must fail closed to owner review.

The policy engine must return:
- decision
- reasons
- requiredOwnerAction
- diff summary
- affected records
- risk flags

---

## 6. Deep Dive synchronization model

Do not directly mutate reviewer-visible content from raw ingest.

Use three stages:

1. **Ingested Evidence**
2. **Normalized Candidate Update**
3. **Approved/Published Reviewer Projection**

Safe auto-refresh may update already-approved facts that remain within the same disclosure and maturity boundary.

Anything else enters owner review.

The reviewer application must continue to read only approved + published + tier-visible data.

---

## 7. Provenance and audit

Every accepted update must be traceable to:
- source system;
- safe repo key;
- branch;
- commit SHA;
- event ID;
- timestamp;
- signature identity;
- evidence file or artifact key;
- normalization version;
- policy decision;
- owner approval if required;
- previous/superseded evidence.

Maintain append-only event history at the application level.

Do not claim cryptographic immutability unless actually implemented.

---

## 8. Change feed

Build an owner-facing engineering change feed.

Example entries:
- PRIME Phase 2 -> COMPLETE
- Solana Golden Path #2 -> evidence added
- RIG V1.1 -> verification passed
- Multichain -> public-testnet evidence refreshed
- Trade X -> PAPER research active
- KYRO -> media pipeline qualification updated

Each change shows:
- system
- source commit
- what changed
- maturity before/after
- policy decision
- auto-refreshed or owner review
- evidence links
- timestamp

Reviewer-facing change feed may show only approved/published items.

---

## 9. Staleness and reconciliation

Build a reconciliation service/job.

Purpose:
- detect webhook misses;
- detect stale Deep Dive status;
- detect source manifest newer than registry;
- detect missing evidence;
- detect manifest schema drift;
- detect conflicting latest events.

The reconciliation process must not scrape private repos from browser code.

Design it to be callable by:
- nightly scheduler;
- manual owner action;
- CI workflow.

Outputs:
- in_sync
- stale
- source_missing
- conflict
- owner_review_required
- error

Never auto-delete reviewer evidence because a source temporarily disappears.

---

## 10. Repository emitter SDK / CLI

Build a lightweight emitter usable by SYNAPZ repos.

Provide:
- TypeScript/Node API;
- Python CLI/helper;
- JSON-schema-only mode for other languages;
- GitHub Action example;
- PowerShell-friendly invocation example.

Functions:
- create manifest;
- validate manifest;
- sign/send manifest;
- dry-run;
- write manifest to file;
- submit to Evidence Bus;
- verify response.

Do not require every repo to use the same language.

---

## 11. Example source adapters / fixtures

Create sanitized fixtures demonstrating the real shapes needed by current SYNAPZ work.

Examples should model:

### PRIME / UNIFICATION
- supervisor COMPLETE marker;
- Prime/Platform commit SHAs;
- node failure evidence;
- Solana adapter evidence;
- Golden Path #2 evidence.

### Multichain
- requests 2-7 finalized on disposable public testnet;
- 423 tests + 75 subtests;
- request 8 not yet enabled;
- TESTNET/DEVELOPMENT boundary;
- no production/mainnet claim.

### Trade X
- PAPER research active;
- healthy feed;
- paper equity;
- zero positions/orders;
- funded execution/signer/real orders disabled.

### RIG / tokenisation
- local Solana validator qualification;
- Token-2022 local mint/transfer/burn/supply inspection;
- local governance/vesting/compliance references;
- production dependency audit clean;
- explicit no devnet/mainnet/real funds/KYC/custody/legal approval.

### KYRO
- pipeline/test counts;
- provider/live-job state;
- media artifact status;
- never use media production as blockchain evidence.

All fixtures must be marked synthetic/demo and contain no private local paths, secrets, wallet addresses, transaction hashes, emails or credentials.

---

## 12. Owner review UI

Build a standalone owner-review console for candidate updates.

Required views:
- Incoming
- Auto-refreshed
- Needs Review
- Conflicts
- Rejected
- Stale Sources
- Change Feed

Owner can:
- inspect normalized diff;
- inspect provenance;
- approve;
- reject;
- archive candidate;
- add safe reviewer note;
- keep existing value;
- mark source temporarily ignored.

No bulk auto-approval for maturity upgrades.

Credentials/secrets must never be displayed.

---

## 13. Reviewer projection contract

Expose a read-only projection interface for the Deep Dive.

Methods/endpoints should support:
- latest approved current state;
- change feed;
- evidence by system;
- maturity history;
- freshness/staleness;
- latest approved snapshot by domain;
- safe evidence references.

Tier enforcement remains server-side.

No draft/candidate data may appear in reviewer projection.

---

## 14. Copilot integration

The Evidence Bus should provide a safe read-only context feed for SYNAPZ Copilot.

This enables questions:
- What changed today?
- What changed this week?
- What is the latest PRIME status?
- What is the latest Solana status?
- What is the latest multichain status?
- What has just completed?
- What is still blocked?
- What evidence changed?
- What is stale?
- What is built vs planned?

Copilot must only receive reviewer-visible projection for reviewer sessions.

Owner Copilot preview may receive safe owner-review metadata but not secrets or raw draft bodies unless separately authorized by the host.

---

## 15. Security requirements

Absolute requirements:
- no secrets in client bundle;
- no raw webhook secret storage in browser;
- no arbitrary URL fetch from manifests;
- no shell execution from manifests;
- no code execution from evidence;
- treat all manifest text as untrusted data;
- strict schema validation;
- replay protection;
- rate limiting;
- signature verification;
- source allowlist;
- input size limits;
- no path traversal;
- safe filenames/keys;
- no HTML injection;
- no owner email/private repo name leaks;
- no token/credential logging;
- redact sensitive headers;
- structured audit logs only.

Add adversarial tests for:
- replay;
- forged signature;
- timestamp drift;
- oversized payload;
- malicious JSON strings;
- prompt-injection text inside evidence;
- path traversal;
- tier escalation;
- maturity escalation;
- malicious evidence URL;
- duplicate event;
- event ordering conflict.

---

## 16. Failure behavior

Fail closed.

If ingestion, normalization, policy or projection fails:
- do not update reviewer-visible state;
- retain prior approved state;
- create owner-visible error/event;
- preserve enough metadata to diagnose safely.

If a source is stale:
- mark stale;
- do not manufacture a newer state.

---

## 17. Deployment model

Build standalone first.

Recommended components:
- API service;
- persistence layer;
- owner review UI;
- emitter SDK/CLI;
- reconciliation command;
- test fixtures;
- integration docs.

Use a simple relational persistence model suitable for Postgres.

Do not require paid external services.

No LLM is required in the Evidence Bus itself.

---

## 18. Replit handoff

At completion provide a precise integration guide for the existing SYNAPZ Deep Dive/Replit app.

Cover:
- API routes to mount;
- DB migrations;
- environment variable NAMES ONLY;
- owner auth binding;
- reviewer projection adapter;
- Copilot adapter;
- scheduler/reconciliation setup;
- GitHub webhook/Action setup;
- source allowlist configuration;
- rollback;
- first-source onboarding;
- how to add another SYNAPZ repo.

Do not modify Replit from this standalone branch.

---

## 19. Tests and quality gates

Required:
- schema tests;
- signing/replay tests;
- policy matrix tests;
- normalization tests;
- persistence tests;
- owner-review tests;
- reviewer-projection authorization tests;
- staleness/reconciliation tests;
- emitter tests;
- adversarial tests;
- E2E owner workflow;
- E2E reviewer projection;
- production build;
- typecheck;
- lint;
- dependency audit;
- secret/privacy scan.

Do not report complete until all mandatory gates pass.

---

## 20. Completion standard

The build is complete only when a SYNAPZ repository can emit a signed structured evidence manifest and the system can:

1. validate it;
2. normalize it;
3. decide auto-refresh vs owner review;
4. persist provenance;
5. update or queue the Deep Dive state safely;
6. expose only approved/published/tier-visible current proof;
7. surface freshness/change history;
8. feed current approved context to Copilot;
9. detect stale/missed updates;
10. onboard another repo without product code changes.

This should make the Deep Dive self-maintaining without sacrificing evidence discipline.
