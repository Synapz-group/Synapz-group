# Codex Execution Task — SYNAPZ Evidence Bus / Deep Dive Auto-Sync

Read and implement:

`docs/deep-dive-evidence-bus/CODEX_BUILD_SPEC.md`

## Goal

Build the standalone SYNAPZ Evidence Bus that automatically keeps the Deep Dive current from structured engineering evidence.

Do not build a scraper or AI summarizer.

The authoritative flow is:

engineering process
-> versioned evidence manifest
-> signed ingest
-> normalization
-> deterministic policy
-> auto-refresh OR owner review
-> approved reviewer projection
-> Deep Dive / Copilot

## Mandatory deliverables

- evidence manifest JSON Schema;
- secure signed ingestion API;
- normalization layer;
- deterministic policy engine;
- Postgres persistence model/migrations;
- provenance/audit history;
- owner review console;
- reviewer projection API/adapter;
- change feed;
- staleness/reconciliation engine;
- TypeScript emitter SDK;
- Python emitter/CLI;
- GitHub Actions example;
- PowerShell-friendly example;
- sanitized fixtures for PRIME, Multichain, Trade X, RIG and KYRO;
- Copilot current-status adapter;
- Replit integration handoff.

## Critical rules

- Never infer truth from chat/terminal prose.
- Never auto-promote maturity.
- Never auto-publish first-time sensitive claims.
- Safe same-boundary evidence refreshes may auto-update.
- Maturity promotion, mainnet, real funds, regulatory, customer/commercial and visibility expansion require owner review.
- Reviewer projection remains approved + published + tier-visible only.
- Fail closed and keep the last approved state on errors.
- No paid model/service is required.
- No Replit modification from this branch.

## Supervisor mode

Continue through implementation, tests, adversarial tests, E2E, production build, audits, privacy scan and handoff.

Do not stop at architecture/scaffolding.

If something fails, fix and rerun.

Do not weaken tests to get green.

## Completion report

Return:
- feature checklist;
- exact test counts;
- adversarial test counts;
- E2E counts;
- typecheck/lint/build;
- dependency/security audits;
- secret/privacy scan;
- files changed;
- environment variable NAMES ONLY;
- Replit handoff;
- known limitations.

Do not say COMPLETE unless a demo repo emitter can submit a signed manifest end-to-end and the reviewer projection remains correctly protected.
