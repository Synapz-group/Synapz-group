# SYNAPZ Solana Foundation Showcase

Standalone, read-only technical showcase for the complete target architecture and separately scoped current evidence. The launcher uses **DEMO DATA ONLY**, never production reviewer data. No Replit files are changed.

## Run locally

```sh
npm ci
npm run dev
```

Open `/solana-showcase`. Vite handles direct SPA refreshes. `npm run build` produces `dist/`; `npm run preview` serves that production build. On Windows, use `npm.cmd` if PowerShell execution policy blocks `npm.ps1`.

## Verify

```sh
npm run typecheck
npm run lint
npm test
npx playwright install chromium
npm run test:e2e
npm run build
npm run scan
npm audit --omit=dev
```

Set `E2E_PRODUCTION=1` when running `npm run test:e2e` to use the production preview instead of the dev server (build first). The suite exercises desktop Chromium and a narrow touch viewport. Axe checks both the full page and evidence dialog. Screenshots, traces and JSON results are local ignored artifacts under `test-results/`.

## Host integration

The reusable entry is `src/showcase/index.ts`. It excludes demo fixtures. Supply a `ShowcaseEvidenceAdapter` from a server-authorized approved/published projection and optionally a Copilot bridge. The browser does not own authorization. It only validates and renders the sanitized projection. Target definitions do not imply implementation; missing current evidence is explicit. Current Proof removes target nodes and target explanatory sections, while Full Vision restores them.

See [Replit handoff](docs/solana-foundation-showcase/REPLIT_HANDOFF.md) for exact route, adapter, disclosure, styling, Copilot, owner-preview and post-integration requirements.

No environment variables, credentials, wallets, chain connections or external services are required for the standalone module. The host's live registry and Copilot are intentionally integration contracts, not fabricated standalone services.
