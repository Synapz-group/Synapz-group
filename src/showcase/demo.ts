import { createReadOnlyAdapter, type ProjectionRecord } from "./adapter";
import type { CurrentEvidence } from "./model";
const example = (
  safeKey: string,
  title: string,
  summary: string,
  maturity: CurrentEvidence["maturity"],
  domain: string,
  relatedNodes: string[],
  limitations: string[],
): ProjectionRecord => ({
  approved: true,
  published: true,
  audience: ["reviewer"],
  evidence: {
    safeKey,
    title,
    summary,
    maturity,
    domain,
    relatedNodes,
    limitations,
    evidenceRefs: [
      { label: "Inspect visible snapshot", href: `#evidence/${safeKey}` },
    ],
    observedAt: "2026-10-07T00:00:00Z",
  },
});
// Synthetic examples demonstrate the adapter shape. They are not disclosure
// approval records and are never used by the production host export.
export const demoAdapter = createReadOnlyAdapter(
  [
    example(
      "prime-example",
      "PRIME qualification example",
      "Illustrative qualification snapshot: an isolated runtime with a healthy Prime API and three workers; a preserved node-failure check. Geyser, read-only adapter and Golden Path #2 remain integration work.",
      "QUALIFIED",
      "PRIME / UNIFICATION",
      ["prime", "observation", "registry"],
      [
        "Synthetic demonstration only; not a live runtime measurement.",
        "No claim that 1,024 workers are running.",
        "Qualification does not establish deployment or production readiness.",
      ],
    ),
    example(
      "multichain-example",
      "Multichain testnet example",
      "Illustrative Sepolia V2 requests 2–7 finalized on disposable public testnet; preserved historical-finality evidence. Local suite example: 423 tests plus 75 subtests. Request 8 is not enabled by the current execution path.",
      "TESTNET",
      "Multichain",
      ["multichain"],
      [
        "DEVELOPMENT qualification only.",
        "No mainnet, production treasury or production liquidity claim.",
        "Synthetic snapshot; no transaction hashes or addresses are supplied.",
      ],
    ),
    example(
      "issuance-example",
      "Regulated issuance V0 example",
      "Illustrative local/private V0: Hardhat 5/5 and browser E2E 5/5; build, lint, typecheck and scan examples. Issuer-scope authorization, tamper-evident audit records and a total-supply correction are demonstrated.",
      "DEVELOPMENT",
      "Tokenisation / issuance",
      ["issuance"],
      [
        "External providers are mocked.",
        "No real KYC, payments, custody, RPC, funds, keys, chain deployment or public endpoint.",
        "No independent smart-contract audit. Not live regulated issuance.",
        "Synthetic snapshot; zero production dependency vulnerabilities is an example, not a host audit result.",
      ],
    ),
  ],
  { tier: "reviewer" },
  "DEMO DATA ONLY",
);
