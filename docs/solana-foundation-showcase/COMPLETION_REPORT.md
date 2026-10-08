# Solana Showcase completion candidate — 2026-10-08

**SAFE_TO_PUBLISH_FOR_SOLANA = NO**

Branch: `feature/solana-showcase-completion-codex`.
Base: `52feb2636f39c3adab9bafafef7742c1e762dcac` (committed standalone Showcase).
This is partial mission completion in the available standalone module. It does not establish HOLD → SEND for the audited host application. No Replit use, deployment, hosted account creation or production configuration change occurred.

## Implemented and locally verified

- All nine anchors remain in both modes: system, thinking, fabric, solana-path, comparison, finished, why-solana, evidence, copilot. The old roadmap fragment remains compatible. Direct hashes, reload and history traversal update the navigation and scroll position.
- Eleven-stage PRIME lifecycle explicitly marked TARGET; six TARGET brain stages are not claimed deployed. Current Proof map filtering and the comparison column retain their evidence boundaries.
- Permanent exact 1,024 logical-capacity disclaimer, target roles, claims, permission ceilings, routing, isolation, health, recovery and scaling explanations.
- Eight-stage Solana event → read-only ingestion → routing → proposal → simulation/evaluation → policy → execution boundary → receipt path. Qualification references are attributed to the supplied audit; they do not become approved feed records.
- Eight engineering gap subsections and all 20 questions from forensic audit section 26, with evidence required to close each gap. No framework, account/PDA, signer, fee, finality or production facts invented.
- Why Solana for SYNAPZ / Why SYNAPZ could matter to Solana, technical fit and engineering challenges, with official platform documentation links.
- Twelve completion workstreams, each with Current Proof / Remaining Work / Completion Standard. No schedule or completion percentages.
- Validated evidence-list cache with concurrent deduplication, 60-second freshness after successful retrieval, per-adapter/tier/preview isolation, explicit invalidation, stale-response rejection and defensive copies. Navigation, mode, node selection, scroll and fresh component remount do not cause list refetches. Host wiring remains unverified.

## Verification

| Gate | Exact result | Scope |
| --- | --- | --- |
| Unit/integration | 56 passed, 0 failed | Four files: adapter 29, cache 5, cache integration 3, Showcase 19 |
| Adversarial disclosure cases | 17 passed, included in the 56 | Client adapter sanitization; **not** the live host Copilot adversarial suite |
| Production browser | 28 passed, 0 skipped/failed/flaky | 14 desktop Chromium + 14 iPhone 13 touch-emulation Chromium |
| Nine anchors | PASS in both modes | Click, direct URL, reload, Back/Forward; desktop and mobile |
| Q&A | PASS | All 20 expand and expose evidence requirements; no document overflow |
| Accessibility | PASS | Existing axe page/dialog and keyboard/focus checks on both viewports |
| Typecheck | PASS | `npm run typecheck`, also included in build |
| Lint | PASS | `npm run lint` |
| Production build | PASS | 37 modules; JS 272.83 kB / gzip 85.78 kB; CSS 12.75 kB / gzip 3.90 kB |
| Dependency audit | PASS | Full `npm audit --json`, all severities zero; no dependency changes |
| Privacy/secret scan | PASS | Existing heuristic source/build scan: 14 files and 3 serialized fixture records; export isolation and handoff checks |
| Visual review | PASS | Desktop/mobile Solana screenshots inspected |
| Guest reviewer credential workflow | NOT IMPLEMENTED / NOT RUN | Existing host guest/investor system is absent from this repository |
| API/security and admin denial | HOST BLOCKED | No host server/routes/session database; client projection tests are not API tests |
| Live Copilot adversarial suite | HOST BLOCKED | Standalone module has a read-only bridge/prompt explorer, not the audited host Copilot |
| `/api/review/showcase` request counts | HOST BLOCKED | Endpoint and its host adapter are absent; module-level deduplication is tested |

Commands run: `npm ci --no-fund`, `npm run typecheck`, `npm run lint`, `npm test -- --reporter=json --outputFile=test-results/unit.json`, `npm run build`, `npm run scan`, `npm audit --json`, and `E2E_PRODUCTION=1 npm run test:e2e` (environment set using PowerShell on Windows).

Local ignored artifacts: `test-results/unit.json`, `test-results/dependency-audit.json`, `test-results/browser/e2e-results.json`, screenshots and any retained failure traces. Dependency audit covers installed package advisories; the static scan is heuristic, not an independent penetration test. Browser mobile coverage is emulation, not a physical device. The standalone launcher still displays explicitly synthetic DEMO DATA ONLY.

## Remaining mission blockers

The audited host source containing `/api/review/showcase`, Clerk/session integration, existing guest/investor access and owner controls was not found in the available local source or inspected Git branches. The user has been asked for its folder/repository/branch. No replacement auth system has been invented.

Once that source is supplied, Codex must finish:

1. Owner-only **Create Solana Foundation Review Access** through the existing guest/investor system: highest reviewer due-diligence tier, seven-day default expiry, revocation, username/password, password hashing, one-time plaintext display, no admin/owner/draft/higher-tier access.
2. Stable per-session host adapter integration and explicit invalidation on auth/permission/publication changes. Verify actual endpoint request counts and avoid duplicate host-level loaders.
3. Integrate this source candidate into the audited host without weakening existing auth, tier isolation, maturity terminology, Copilot protection or Evidence Bus fallback.
4. Run guest login/expiry/revocation, owner-only creation, admin denial, all API/security and live Copilot adversarial regressions against that host, plus its complete build/check suite.

Replit remains reserved for the later final publish after a genuine YES. Do not use Replit Agent to complete these implementation steps.

## Changed files

`src/showcase/Showcase.tsx`, `ReviewDepth.tsx`, `reviewContent.ts`, `cache.ts`, `model.ts`, `index.ts`, `showcase.css`; `tests/cache.test.ts`, `cache-integration.test.tsx`, `showcase.test.tsx`, `setup.ts`; `e2e/navigation.spec.ts`, `showcase.spec.ts`; `playwright.config.ts`; `SHOWCASE_README.md`; `docs/solana-foundation-showcase/REPLIT_HANDOFF.md`, `VERIFICATION_REPORT.md`, and this report.

The commit SHA is available from `git rev-parse HEAD` after commit; it is not embedded into its own commit. Push status must be confirmed against the remote ref.
