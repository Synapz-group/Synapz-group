# Codex Supervisor Prompt — SYNAPZ Evidence Bus

Checkout branch:

`feature/deep-dive-evidence-bus-codex`

Read:
- `docs/deep-dive-evidence-bus/CODEX_BUILD_SPEC.md`
- `docs/deep-dive-evidence-bus/CODEX_TASK.md`

Operate continuously until all mandatory gates pass or a genuine external hard wall is reached.

## Mandatory end-to-end proof

Before COMPLETE, prove at least this flow with synthetic safe fixtures:

1. PRIME emitter creates manifest.
2. Manifest validates.
3. Manifest is signed.
4. Ingest accepts valid signature.
5. Replay is rejected.
6. Normalizer creates candidate.
7. Same-maturity evidence refresh auto-updates allowed fields.
8. Maturity promotion is held for owner review.
9. Owner approval publishes the candidate.
10. Reviewer projection shows the approved update.
11. Lower tier cannot see higher-tier evidence.
12. Copilot context feed reflects only reviewer-visible approved data.
13. Reconciliation detects a deliberately stale source.
14. Prior approved state remains visible if a later ingest fails.

## Stop criteria

COMPLETE only if:
- typecheck PASS;
- lint PASS;
- unit/integration PASS;
- adversarial PASS;
- E2E PASS;
- production build PASS;
- dependency audits PASS;
- secret/privacy scan PASS;
- manifest/signing/policy/reconciliation proof PASS;
- Replit handoff complete.

If blocked, report one exact hard wall and continue every independent task.

Do not modify Replit.
