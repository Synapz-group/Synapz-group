// Qualification statements below are attributed to the supplied forensic audit,
// 2026-10-08, sections 05, 09, 10 and 26. They are not host feed approvals.
export const engineering = [
  [
    "RPC/Geyser",
    "Specify RPC reads versus validator event streams, cluster identity, subscriptions, replay cursors, duplicate handling, reconnect and backpressure. Close with pinned configuration and replay/disconnect tests.",
  ],
  [
    "Signer separation",
    "Keep proposal, policy approval, signing and broadcast in distinct authority boundaries. Bind approvals to exact message bytes, cluster and expiry. Close with custody design and denied-path tests.",
  ],
  [
    "Transaction construction",
    "Specify program and account allowlists, instruction decoding, writable accounts, fee payer, blockhash expiry and simulation. Close with reproducible construction fixtures and tampering/retry tests.",
  ],
  [
    "Finality",
    "Choose commitment and settlement thresholds explicitly; distinguish observation from confirmation and final settlement. Close with dropped-fork, expiry and receipt-reconciliation tests.",
  ],
  [
    "Congestion/rate limits",
    "Specify provider quotas, bounded retries with jitter, queue limits, circuit breaking and idempotent recovery. Close with provider-outage, HTTP 429 and congested-network qualification.",
  ],
  [
    "Compute budgets / priority fees",
    "Set operation-specific compute and fee ceilings using simulation evidence. A priority fee is a scheduling incentive, not guaranteed inclusion. Close with fee-policy fixtures and overload/cost tests.",
  ],
  [
    "Accounts / PDAs",
    "Document account ownership, sizes, writable access, PDA seeds and canonical bumps; validate account substitutions. Close with schema, derivations and negative account-validation tests.",
  ],
  [
    "Token authorities",
    "Document mint, freeze, delegate, update and custody responsibilities plus rotation/revocation. Close with an authority matrix, transition receipts and unauthorized-authority tests. Extensions stay disabled until separately reviewed.",
  ],
] as const;

export const reviewQuestions = [
  [
    "What consensus mechanism does your Solana integration target?",
    "SYNAPZ is an application integration, not a new consensus implementation. The audit reports only local/development qualification; it does not establish cluster consensus or finality behavior for SYNAPZ.",
    "Pinned cluster/client versions, selected commitment levels and fork/finality acceptance tests.",
  ],
  [
    "What SPL Token standard are you using and why?",
    "The audit reports RIG V1.1 qualification using Token-2022. Optional extensions are relevant to future governed issuance but remain disabled pending separate review.",
    "Reproducible Token-2022 qualification manifest, exact mint configuration and separate extension security/compatibility review before enablement.",
  ],
  [
    "What is your account model?",
    "No approved account/mint schema is supplied. A loopback endpoint policy does not establish account ownership or authority design.",
    "Account schema, owner programs, writable/signing requirements, allocation sizes and account-substitution tests.",
  ],
  [
    "Have you audited your Solana programs?",
    "No independent Solana program security audit is documented in the supplied evidence. Qualification is not a security audit.",
    "Named audit scope, pinned program commit, report, remediation results and reproducible build linkage.",
  ],
  [
    "What is your TPS requirement and have you load-tested against Solana's throughput?",
    "No SYNAPZ TPS requirement or throughput qualification is supplied. Logical worker capacity cannot be converted into transaction throughput.",
    "Workload definition, environment, sustained and burst benchmarks, queue depth, error rates and percentile latency.",
  ],
  [
    "How do you handle Solana's transaction fee variability?",
    "No implemented fee-selection strategy is evidenced. The target requires bounded compute and priority-fee spend with rejection above policy ceilings.",
    "Fee policy, estimator inputs, simulated consumption and congestion/cost-ceiling test results.",
  ],
  [
    "What is your approach to handling Solana slots/epochs in your governance model?",
    "No slot/epoch-aware governance implementation is evidenced. Stale or expired approvals must not silently authorize a changed transaction.",
    "Slot/epoch and approval-expiry specification plus boundary, stale-state and epoch-transition tests.",
  ],
  [
    "How does PRIME handle Solana RPC rate limits?",
    "RPC quota handling is not documented in the audit. Bounded backoff and backpressure are target requirements.",
    "Provider quotas, retry/circuit-breaker configuration and 429, disconnect, failover and replay tests.",
  ],
  [
    "What is your devnet deployment status?",
    "The audit establishes a local/development qualification reference only. It confirms no devnet deployment; Multichain development/testnet scope is a separate boundary.",
    "Cluster-specific deployment manifest, build identity, sanitized program/account references and reproducible devnet transaction receipts.",
  ],
  [
    "What are your on-chain program addresses?",
    "No SYNAPZ on-chain program addresses are published in the supplied reviewer evidence. No addresses are invented here.",
    "Approved cluster-specific program manifest with ownership, upgrade authority and deployed-bytecode/build verification.",
  ],
  [
    "How does your token issuance handle mint authority transfer/freeze?",
    "Mint/freeze authority transitions are not documented in the current reviewer evidence.",
    "Authority/custody matrix, policy-approved transfer and freeze/unfreeze tests, revocation tests and receipts.",
  ],
  [
    "What is your approach to Solana's AccountInfo size limits?",
    "No SYNAPZ account sizing or allocation strategy is evidenced; account data sizes and transaction account loading must be evaluated separately.",
    "Pinned runtime limits, serialized layout sizes and boundary, growth, rent-funding and malformed-account tests.",
  ],
  [
    "Do you use PDAs (Program Derived Addresses)?",
    "No SYNAPZ PDA design is established by the supplied evidence. PDA support on Solana does not prove use in this system.",
    "Program IDs, seed schema, canonical-bump rules, ownership checks and collision/substitution tests.",
  ],
  [
    "How does your governance layer interact with Solana's transaction signing model?",
    "RIG local qualification is reported, but an end-to-end signer integration is not documented. No unrestricted signing or broadcast is claimed.",
    "Signer isolation/custody design, exact-message approval binding, independent authorization, expiry/replay rejection and denied-sign/broadcast tests.",
  ],
  [
    "What are your plans for Solana mainnet-beta vs mainnet?",
    "No production/mainnet rollout is evidenced or scheduled. The completion gates require security, operational and signing qualification before any production decision; network terminology alone grants no readiness.",
    "Explicit target cluster, release decision, security sign-off, operational readiness, rollback plan and bounded-funds authorization.",
  ],
  [
    "Have you stress-tested your governed pipeline against Solana network congestion scenarios?",
    "No congestion stress qualification is supplied. Local-validator tests do not establish behavior under public-network congestion.",
    "Reproducible congestion workload, lost/duplicate event and expiry scenarios, resource/cost ceilings and recovery receipts.",
  ],
  [
    "What is your approach to Solana's compute unit limits?",
    "No operation-specific compute-budget strategy is evidenced. The target requires simulation-based estimates and policy ceilings.",
    "Instruction-level consumption measurements, chosen budgets and compute-exhaustion/rejection tests.",
  ],
  [
    "How do you handle Solana's finality model in your settlement layer?",
    "Settlement finality handling is not evidenced. Trade X PAPER scope is not proof of a live settlement layer.",
    "Commitment/finality policy, pending versus settled states, fork reconciliation and duplicate/failed-settlement tests.",
  ],
  [
    "What Solana tooling are you using? (Anchor, native, etc.)",
    "Token-2022 and local-validator qualification are reported. No framework, compiler or SDK version is established by the supplied audit; Anchor usage is not asserted.",
    "Pinned toolchain/lockfiles, reproducible build commands, program artifacts and CI qualification logs.",
  ],
  [
    "Why Solana specifically over other Layer 1s?",
    "The rationale below links event ingestion, account/program composability and Token-2022 to governed workflows. This is a design hypothesis, not a measured superiority claim.",
    "Comparable workload benchmarks, integration prototypes, cost/reliability measurements and evidence that the chosen controls meet requirements.",
  ],
] as const;

export const workstreams = [
  [
    "PRIME",
    "Audit reports Phase 2 safe integration qualification; test totals remain owner-stated.",
    "Bind runtime state, routing and evaluation to reproducible evidence.",
    "Pinned CI manifest and traceable allowed/denied task receipts reproduce the qualified scope.",
  ],
  [
    "Brain integration",
    "Six brain stages remain TARGET; governance has bounded local qualification reference.",
    "Integrate Self-Model, Instinct Router, Memory, Specialists, Simulation and Independent Evaluation.",
    "End-to-end traces and independent rejection tests prove each stage without self-approval.",
  ],
  [
    "Logical fabric/recovery",
    "1,024 is logical target capacity; no qualified 1,024-worker run is supplied.",
    "Qualify claims, leases, ceilings, isolation, health and reassignment under load.",
    "Node-loss and split-state tests show bounded recovery and no duplicate effects at each claimed scale.",
  ],
  [
    "Solana",
    "Audit reports PRIME read-only and RIG local-validator / Token-2022 QUALIFIED.",
    "Close RPC/Geyser, event provenance, replay and attached-consumer gaps.",
    "Pinned environment and event-to-receipt qualification demonstrate the exact approved integration boundary.",
  ],
  [
    "Governed execution/signing",
    "No unrestricted signing/broadcast; no mainnet or real-funds claim.",
    "Specify custody, transaction construction, approval binding and execution isolation.",
    "Denied-path, tampering, expiry and replay tests pass before any separately authorized execution.",
  ],
  [
    "Multichain",
    "Development/testnet boundary only.",
    "Qualify per-chain adapters, propagation policy and reconciliation.",
    "Cluster-specific receipts and failure/replay tests substantiate each claimed pathway.",
  ],
  [
    "Observability/evidence automation",
    "Audit observed Evidence Bus fallback; bridges were not configured.",
    "Attach authorized sources with freshness, redaction and publication controls.",
    "Outage/fallback, stale evidence, draft denial and provenance tests pass without authority expansion.",
  ],
  [
    "Wallet/payments",
    "No approved integrated wallet/payment proof supplied.",
    "Qualify wallet boundaries, payment intents, fee ceilings and reconciliation.",
    "Approved sandbox flows pass denial, duplicate-payment, expiry and reconciliation tests.",
  ],
  [
    "Issuance/tokenisation",
    "RIG V1.1 local/development Token-2022 qualification reference; extensions disabled.",
    "Close mint/account authority and extension-review gaps.",
    "Reproducible issuance and authority-lifecycle tests pass; any extension has separate security sign-off.",
  ],
  [
    "Settlement",
    "No live settlement or finality qualification supplied.",
    "Define finality, pending/settled state and accounting recovery.",
    "Fork, failed/duplicate transaction and reconciliation tests preserve accounting invariants.",
  ],
  [
    "Markets/apps",
    "Trade X PAPER; no production application inference.",
    "Integrate governed market/application actions with scoped permissions.",
    "Environment-labelled application traces prove permitted behavior and blocked consequential paths.",
  ],
  [
    "Production security",
    "Audit reports read-only protections; no independent program audit supplied.",
    "Complete threat model, custody review, operational controls and independent assessment.",
    "Auth/tier/admin isolation, privacy, supply-chain, adversarial and recovery gates pass with reviewed findings.",
  ],
] as const;

export const whySolana = [
  [
    "High-throughput events / low-latency state changes",
    "Fast-changing chain state motivates event-driven routing rather than repeated full-state polling. The target must keep interpretation and evaluation aligned with state freshness, and measure backlog and end-to-end latency before claiming any performance benefit.",
    "https://solana.com/docs/rpc",
  ],
  [
    "Account/program model and composability",
    "Explicit accounts and program instructions give the target a concrete surface for ownership checks and governed proposals. Composability also increases the account-validation burden.",
    "https://solana.com/docs/core/accounts",
  ],
  [
    "Token-2022",
    "Optional extensions are a possible fit for governed issuance. Compatibility and authority implications require review; their existence does not mean SYNAPZ enables them.",
    "https://solana.com/docs/tokens/extensions",
  ],
  [
    "Geyser/event streams",
    "Validator account and transaction notifications offer an event ingestion surface. The target still needs durable cursors, provenance, replay and backpressure; a stream is not execution authority.",
    "https://docs.anza.xyz/validator/geyser/",
  ],
  [
    "Compute budgeting / priority fees",
    "Explicit compute budgets and priority fees give proposals a cost-control surface. Fee ceilings, expiry and simulation must constrain decisions under congestion.",
    "https://solana.com/docs/core/fees",
  ],
] as const;
