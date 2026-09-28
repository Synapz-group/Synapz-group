# Codex Execution Task — SYNAPZ Technical Copilot

Read and implement the complete specification at:

`docs/technical-atlas-copilot/CODEX_BUILD_SPEC.md`

## Execution mode

Build this end-to-end as a finished standalone module. Do not stop at planning, scaffolding, mock UI, partial API, or a hand-wavy integration note.

Work continuously through:
1. architecture;
2. implementation;
3. security boundaries;
4. retrieval adapter;
5. model adapter;
6. guided journeys;
7. UI;
8. tests;
9. adversarial tests;
10. E2E;
11. build;
12. dependency/security checks;
13. documentation;
14. Replit integration handoff.

## Hard constraints

- READ ONLY.
- Reviewer-visible approved+published content only.
- Server-side tier enforcement.
- No owner/admin endpoints.
- No registry writes.
- No infrastructure actions.
- No blockchain/trading/wallet execution.
- No secrets or private URLs.
- No prompt-based privilege escalation.
- No hidden drafts.
- Preserve maturity distinctions.
- Degraded non-LLM mode must still work.
- Demo fixtures must be clearly marked and never treated as canonical production data.

## Completion

Do not report complete until every quality gate in the build specification passes.

At completion provide:
- exact files added/changed;
- architecture summary;
- security summary;
- test counts/results;
- E2E result;
- build result;
- dependency/security scan result;
- required environment variable NAMES ONLY;
- Replit integration steps;
- known limitations, if any.

If a requirement cannot be completed because of a genuine external dependency, fail closed, document the dependency precisely, and continue everything else that does not depend on it.
