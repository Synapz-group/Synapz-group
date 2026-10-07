# Codex Supervisor Prompt — Solana Foundation Showcase

You are implementing the SYNAPZ Solana Foundation Showcase on branch:

`feature/solana-foundation-showcase-codex`

Read first:
- `docs/solana-foundation-showcase/CODEX_BUILD_SPEC.md`
- `docs/solana-foundation-showcase/CODEX_TASK.md`
- `docs/solana-foundation-showcase/CURRENT_STATUS_SNAPSHOT.md`

## Operating mode

Run as an end-to-end supervisor.

Do not stop after planning, scaffolding, partial UI, a generic registry browser, or a progress summary.

Continue until either:
1. every mandatory acceptance gate passes; or
2. a genuine external hard wall prevents further progress.

If a command/test/build fails:
- diagnose it;
- fix the underlying issue;
- rerun the failed gate;
- continue.

Do not weaken tests, maturity boundaries, privacy rules or disclosure rules to get green.

## Required final state

The implementation must visibly include:
- THE FULL SYNAPZ SYSTEM architecture map;
- PRIME Core as the central control plane;
- seven named brain functions;
- 1,024 logical-capacity explainer;
- FULL VISION | CURRENT PROOF;
- How PRIME Actually Thinks;
- Full Solana Integration Path;
- Current vs Completed;
- What Will Be Finished;
- Why Solana;
- evidence/maturity drill-down;
- Showcase Copilot context/prompts.

No section may be represented only by a TODO, placeholder, empty card or prose promise.

## Completion gates

Before reporting DONE:
- typecheck PASS;
- lint PASS;
- unit/integration tests PASS;
- adversarial tests PASS;
- E2E PASS;
- production build PASS;
- production dependency/security scan PASS or explicitly documented non-production-only findings;
- secret/marker/privacy scan PASS;
- no console-breaking errors;
- Replit integration handoff complete.

## Stop/report format

If complete, report:
COMPLETED
- feature checklist with PASS per required section
- exact test counts
- exact E2E counts
- typecheck/lint/build results
- dependency/security scan
- files changed
- known limitations
- Replit handoff steps

If blocked, report:
BLOCKED
- exact blocker
- why it is external/hard
- everything already completed
- exact next action required

Do not say DONE if any required section or gate is still missing.
