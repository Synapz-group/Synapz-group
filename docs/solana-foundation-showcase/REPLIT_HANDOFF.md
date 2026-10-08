# Standalone Showcase → Technical Atlas handoff

## 2026-10-08 completion candidate

See [COMPLETION_REPORT.md](COMPLETION_REPORT.md). This branch is a tested standalone source candidate, **not SAFE TO PUBLISH**. The audited host source is unavailable in this checkout. Guest/investor access, host API wiring, live Copilot adversarial tests and host security verification remain pending Codex work when that source is supplied. Do not use Replit Agent for implementation. No deployment is authorized by this handoff.

### Navigation and evidence freshness integration

All nine section anchors now remain mounted in both modes. Current Proof still filters target map nodes and the comparison target column; explanatory TARGET flows remain explicitly labelled. The roadmap anchor is `#finished`; `#roadmap` remains a compatibility alias. Hash navigation updates the current link and scrolls after mount, including history traversal.

The module caches validated list projections for 60 seconds after successful loading, keyed by adapter identity, reviewer tier and preview scope. Concurrent loads share a promise; each consumer receives a clone. View state never triggers list retrieval. A remount within freshness reuses the projection; an expired remount retrieves it. There is no background polling.

Create a stable adapter per authenticated session, **never one shared across identities** and never a new adapter on every render. The server must continue authorizing every network request. Import `invalidateShowcaseEvidence(adapter)` for logout, revocation, approved publication changes and permission changes. It immediately removes visible claims in mounted consumers and rejects responses from earlier revisions. On logout/identity change, unmount the protected route and replace its adapter; invalidation alone does not revoke a server session. These host hooks must be verified against the actual `/api/review/showcase` network traffic before claiming the endpoint issue closed.

The added engineering text uses audit-reported qualification references and explicit missing-evidence labels. It does not insert records into the approved feed. Official Solana documentation supports platform context only, never a SYNAPZ implementation claim.

No Replit files or live application have been modified. This handoff is for a later host integration.

## Files to import

Copy `src/showcase/` except `demo.ts`. Import `Showcase` and types from `src/showcase/index.ts`. `model.ts` holds curated target definitions, never host factual claims. `adapter.ts` holds projection validation and a reference server-side projector. `copilot.tsx` holds the read-only context bridge. `showcase.css` provides the layout.

Do not import `src/main.tsx` or `demo.ts` into the reviewer app. The standalone launcher deliberately shows DEMO DATA ONLY. Demo snapshots are synthetic design examples, not disclosure approval records.

## Dependencies

Runtime: React and React DOM 19 (lockfile pins tested versions). No wallet, chain, chart, router or Replit-specific SDK is needed. Dev verification uses TypeScript, Vite, Vitest, Testing Library, ESLint, Playwright and axe-core; see package.json and package-lock.json. Node 24 was used. Run `npm ci`; on Windows with script execution disabled use `npm.cmd`.

## Route and Navigation

Mount `<Showcase adapter={approvedAdapter} copilotBridge={bridge} />` on `/solana-showcase` using the host router. Add a navigation link labelled “Solana Showcase”. Use the existing reviewer session guard. Configure the host's SPA fallback so direct refresh at `/solana-showcase#evidence/safe-key` loads the same route. Evidence fragments are handled by the module; unknown/invisible keys fail closed. No admin routes are introduced.

## Adapter and authorization

Implement all `ShowcaseEvidenceAdapter` methods against the existing **approved + published registry projection**. The server must bind reviewer identity/tier to its authenticated session; component props and `ShowcaseContext.reviewerTier` are descriptive hints only. Never let a query parameter or browser-provided tier broaden access. Reauthorize every request and evidence open. On sign-out or authority changes, replace/unmount the module and adapter before displaying a different session.

The browser must receive only approved, published, tier-visible, sanitized `CurrentEvidence` values. Never send private source records, draft bodies, raw internal IDs, source repository identifiers, paths, transaction material or credentials. Do not fetch drafts in either mode. `createReadOnlyAdapter` is a reference projector for use on the server or on an already sanitized browser projection, not a license to bundle a private registry in the client. Publication and visibility are the host's responsibility; browser text validation cannot establish approval or catch every semantic disclosure.

Methods: `listVisibleEvidence(context)`, `getVisibleEvidence(safeKey, context)`, `getEvidenceForNode(nodeKey, context)`, `getLatestSnapshot(domain, context)`, `getMaturityLegend()`. Set `dataLabel` to `HOST APPROVED EVIDENCE`. Return no records if authorization is absent. Fetch failures and unsafe projections show no current claims. Only `#evidence/safe-key` references to records in the visible projection are supported. Route external evidence through a separately authorized host viewer after an explicit integration extension; arbitrary external URLs are rejected in this release.

Record fields: safeKey, title, summary, maturity, domain, optional verifiedAt/observedAt (UTC ISO timestamps), limitations, evidenceRefs and relatedNodes. Use stable public-safe keys mapped server-side to private IDs. Preserve maturity exactly; the eleven supported states have distinct legend meanings. Supply dated PRIME, multichain and issuance snapshots when approved. Do not promote the repository's snapshot reference into production disclosure data.

## Copilot

Supply `copilotBridge(payload)` to connect the existing SYNAPZ Copilot. Payload includes the selected mode, current section/node, requested prompt, visible evidence and a grounding instruction. This bridge can open or prefill the host Copilot; it must not grant tool permissions. The host must reauthorize any retrieval and treat evidence text as untrusted data, never model instructions. Explain target and proof separately. No write/admin/blockchain capability is exposed. Without a host bridge, prompt clicks show a local context preview.

## Owner preview

Set `ownerPreview` only from trusted host identity state. Optional `pendingSummary` accepts an aggregate count and allowlisted categories only (PRIME, Solana, Multichain, Issuance, Applications). Show “Newer engineering evidence awaiting approval”. Do not supply draft bodies. The flag does not change evidence access.

## CSS and design integration

Import `showcase.css` once. The standalone stylesheet includes document defaults; scope those root/body/button rules to the Atlas route container when incorporating into an existing design system. Preserve contrast, keyboard outlines, visible maturity text, responsive map/table overflow and native dialog focus behavior. Use system fonts; there are no remote font/media requests. Keep the DEMO DATA ONLY label if using any fixture data.

## Environment

Required environment variable names: **none** for the standalone module. Keep existing host session/data configuration on the server. Never add credentials to VITE-prefixed variables or pass them to component props.

## Post-integration tests

Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run scan`, `npm audit --omit=dev`, and `npm run test:e2e`. Install browser with `npx playwright install chromium`. Adapt only the route/baseURL for the host. Run E2E against a production build as well.

Additionally test the real host authorization: anonymous requests, reviewer tiers, owner preview, sign-out/session change, revoked approval, unpublished records, invisible direct evidence links and Copilot retrieval. Verify no draft data in network responses or bundles. Confirm browser console, axe checks, narrow layout, keyboard dialog Escape/focus restoration and deep-link refresh. These real host checks require the later authorized integration and are not represented by synthetic standalone tests.
