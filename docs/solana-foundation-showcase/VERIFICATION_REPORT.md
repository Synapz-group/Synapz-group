# Historical standalone verification — 2026-10-07

**Superseded for the current completion mission:** see [COMPLETION_REPORT.md](COMPLETION_REPORT.md). The original results below describe the earlier standalone build. Current status is **SAFE_TO_PUBLISH_FOR_SOLANA = NO**, pending host source, reviewer-access implementation and host regressions.

Branch: `feature/solana-foundation-showcase-codex`.
Verification date: 2026-10-07. Runtime: Node 24.16.0 on Windows.

## Feature checklist

| Mandatory experience | Result | Implementation / verification |
| --- | --- | --- |
| THE FULL SYNAPZ SYSTEM | PASS | Interactive 25-node architecture map, grouped layers, centered control plane and node detail dialog |
| PRIME Core as central control plane | PASS | Centered PRIME node; governed intelligence role, published scope and remaining work |
| Seven named brain functions | PASS | All seven architecture nodes and functional-stage explanation; ordered thinking flow |
| 1,024 logical-capacity explainer | PASS | Present versus target, absolute non-physical-server disclaimer and seven operational explanations |
| FULL VISION / CURRENT PROOF | PASS | Global mode filter; target-only views removed in proof mode; no-evidence messages and restored vision |
| How PRIME Actually Thinks | PASS | Eleven focusable stages, independent evaluation, governance, fail-closed requirements and separate receipt stage |
| Full Solana Integration Path | PASS | Eight interactive stages; ingestion/read-only versus governed execution, testnet/mainnet and multichain boundaries |
| Current vs Completed | PASS | Eleven subsystem rows with independently sourced evidence and explicit target column |
| What Will Be Finished | PASS | Fourteen workstreams, all visibly PLANNED; no fabricated dates or percentages |
| Why Solana | PASS | Four technical integration explanations with explicit design/evidence boundaries |
| Evidence / maturity drill-down | PASS | Sanitized scoped records, separate observed/verified dates, limitations, visible-only links and eleven distinct maturity definitions |
| Showcase Copilot context / prompts | PASS | Exact ten suggested prompts, selected mode/section/node, visible-only evidence and read-only host bridge |
| Latest engineering snapshots | PASS | Dated adapter contract plus clearly synthetic PRIME, multichain and issuance examples |
| Owner preview | PASS | Safe aggregate count/categories only; flag never expands draft access |
| Replit handoff | PASS | Import, dependency, route, navigation, projection, authorization, Copilot, preview, CSS, environment and integration-test instructions |

## Gates

| Gate | Result |
| --- | --- |
| Typecheck | PASS — `npm run typecheck` |
| Lint | PASS — `npm run lint`, zero errors/warnings |
| Unit/integration/adversarial | PASS — 48 tests across 2 files, including 17 explicitly adversarial cases |
| Production E2E | PASS — 24 tests: 12 desktop Chromium + 12 narrow touch Chromium; production preview |
| Accessibility basics | PASS — axe full page and dialog on both viewports, zero violations; keyboard skip link, Escape and focus restoration |
| Browser errors | PASS — console-breaking page-error check plus all interaction flows complete |
| Production build | PASS — 34 modules; JS 256.90 kB / gzip 80.47 kB, CSS 12.37 kB / gzip 3.79 kB |
| Bundle warnings | None |
| Production dependency audit | PASS — zero vulnerabilities with `npm audit --omit=dev` |
| Full dependency audit | PASS — zero vulnerabilities including development dependencies |
| Secret / marker / privacy scan | PASS — 11 source/build files plus 3 serialized fixture records; host export fixture isolation and handoff completeness |
| Replit modifications | None |

Tests cover client tier escalation, drafts/unpublished records, owner preview, unsafe fixture instructions and identifiers, unsafe navigation, invisible links, invalid/duplicate projections, adapter failure and immediate removal of evidence when authority changes. The mobile suite exposed an overflow caused by hidden maturity-description text; containing that text fixes both layout width and dialog hit targets. The regression assertion compares document scroll width to client width.

The static scanner checks credentials, paths, repository URLs, email, internal endpoints, transaction addresses, unfinished markers and executable write APIs. Application source is checked for unsafe HTML use. React DOM's unused `dangerouslySetInnerHTML` feature-name string in the vendor bundle is explicitly distinguished from application usage; it is not a vulnerability waiver. No application unsafe-HTML usage exists.

## Files added

No existing repository files were modified. Added:

```text
.gitignore
SHOWCASE_README.md
docs/solana-foundation-showcase/REPLIT_HANDOFF.md
docs/solana-foundation-showcase/VERIFICATION_REPORT.md
e2e/showcase.spec.ts
eslint.config.js
index.html
package-lock.json
package.json
playwright.config.ts
scripts/scan.mjs
src/main.tsx
src/showcase/Showcase.tsx
src/showcase/adapter.ts
src/showcase/copilot.tsx
src/showcase/demo.ts
src/showcase/index.ts
src/showcase/model.ts
src/showcase/showcase.css
tests/adapter.test.ts
tests/setup.ts
tests/showcase.test.tsx
tsconfig.json
vite.config.ts
```

## Known limitations and handoff

The standalone launcher deliberately uses DEMO DATA ONLY. Actual approved engineering status and host Copilot require the later Atlas integration. Server-side authorization and semantic disclosure approval cannot be established by browser validation. Never ship private registry records to the browser. Arbitrary external evidence links are unsupported; only links into the currently visible projection are rendered. The reference adapter captures session authority and returns snapshots; the host must replace/unmount it when session or disclosure authority changes.

E2E covers Chromium desktop and touch emulation, not physical devices or other browser engines. The scan is an automated source/build/fixture check, not an independent penetration test. Existing reference documents are not production evidence. Runtime styling has root/body defaults to scope when importing into Atlas.

Follow [REPLIT_HANDOFF.md](REPLIT_HANDOFF.md): import the reusable module without demo/launcher, mount `/solana-showcase`, add navigation, connect the server-authorized approved+published projection, wire read-only Copilot, supply only safe preview aggregates, scope CSS and run host authorization/refresh/accessibility tests. No live Replit changes were made or required for standalone completion.

Required standalone environment variable names: **none**.
