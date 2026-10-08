export const maturityLegend = {
  VERIFIED:
    "The described evidence has been verified within its stated scope; this does not imply deployment.",
  QUALIFIED:
    "Passed stated qualification criteria; qualification is not deployment.",
  DEPLOYED:
    "Deployed only in the environment explicitly named by the evidence.",
  TESTNET: "Test network only. No mainnet or production funds claim.",
  PAPER: "Paper decisions only; no live trading.",
  SHADOW: "Observed alongside a system; no live execution authority.",
  DEVELOPMENT: "Engineering work in a development environment.",
  PROTOTYPE: "Experimental implementation with limited validation.",
  PLANNED: "Unfinished work with no implementation claim.",
  TARGET:
    "Curated end-state architecture, not evidence of current implementation.",
  "INTEGRATION IN PROGRESS":
    "Integration remains unfinished within the stated scope.",
} as const;
export type Maturity = keyof typeof maturityLegend;
export type Mode = "full_vision" | "current_proof";
export interface ShowcaseContext {
  reviewerTier: string;
  mode: Mode;
  ownerPreview: boolean;
  currentSection: string;
  selectedNode?: string;
}
export interface EvidenceRef {
  label: string;
  href: string;
}
export interface CurrentEvidence {
  safeKey: string;
  title: string;
  summary: string;
  maturity: Maturity;
  domain: string;
  verifiedAt?: string;
  observedAt?: string;
  limitations: string[];
  evidenceRefs: EvidenceRef[];
  relatedNodes: string[];
}
export interface ShowcaseEvidenceAdapter {
  readonly dataLabel: "DEMO DATA ONLY" | "HOST APPROVED EVIDENCE";
  listVisibleEvidence(context: ShowcaseContext): Promise<CurrentEvidence[]>;
  getVisibleEvidence(
    safeKey: string,
    context: ShowcaseContext,
  ): Promise<CurrentEvidence | undefined>;
  getEvidenceForNode(
    nodeKey: string,
    context: ShowcaseContext,
  ): Promise<CurrentEvidence[]>;
  getLatestSnapshot(
    domain: string,
    context: ShowcaseContext,
  ): Promise<CurrentEvidence | undefined>;
  getMaturityLegend(): typeof maturityLegend;
}
export interface ArchitectureNode {
  key: string;
  title: string;
  group: "control" | "brain" | "fabric" | "solana" | "domain";
  role: string;
  remains: string;
  limitations: string;
}
export const noEvidence = "No approved implementation evidence published yet.";
export const capacityDisclaimer =
  "1,024 is logical-capacity / target architecture. It is not 1,024 currently running physical servers or worker processes.";
export const brainNames = [
  "Self-Model",
  "Instinct Router",
  "Simulation",
  "Memory",
  "Specialists",
  "Evaluation",
  "Governance",
] as const;
const node = (
  key: string,
  title: string,
  group: ArchitectureNode["group"],
  role: string,
  remains: string,
  limitations = "Target architecture only. Current scope is defined solely by published evidence.",
): ArchitectureNode => ({ key, title, group, role, remains, limitations });
export const architecture: ArchitectureNode[] = [
  node(
    "omega",
    "SYNAPZ / OMEGA",
    "control",
    "System-wide objectives and coordinated application capabilities.",
    "Integrate the complete governed system.",
  ),
  node(
    "prime",
    "PRIME Core",
    "control",
    "Central governed intelligence/control plane: interpret objectives, route work, evaluate outcomes and enforce policy.",
    "Complete runtime observation, integration and production hardening.",
  ),
  node(
    "self-model",
    "Self-Model",
    "brain",
    "Maintain structured awareness of system state, identity, capability and constraints.",
    "Complete runtime queries and validate state freshness.",
  ),
  node(
    "instinct",
    "Instinct Router",
    "brain",
    "Route events by intent, risk, permissions and available worker roles.",
    "Qualify routing and overload handling.",
  ),
  node(
    "simulation",
    "Simulation",
    "brain",
    "Explore candidate outcomes before consequential execution.",
    "Validate simulation fidelity and required preflight coverage.",
  ),
  node(
    "memory",
    "Memory",
    "brain",
    "Retrieve relevant context and preserve scoped learning from receipts.",
    "Validate provenance, retention and access boundaries.",
  ),
  node(
    "specialists",
    "Specialists",
    "brain",
    "Prepare domain-specific analysis and proposals; never self-approve.",
    "Integrate role-aware workers with independent evaluation.",
  ),
  node(
    "evaluation",
    "Evaluation",
    "brain",
    "Independently evaluate proposals and supporting evidence.",
    "Qualify independent checks and rejection paths.",
  ),
  node(
    "governance",
    "Governance",
    "brain",
    "Apply policy and explicit approvals before consequential actions.",
    "Validate policy, identity and approval enforcement.",
  ),
  node(
    "fabric",
    "1,024 logical node fabric",
    "fabric",
    "Role-aware logical workers with scoped task claims, isolation and capacity routing.",
    "Scale logical capacity with observed health and recovery.",
  ),
  node(
    "observation",
    "System self-observation / Project OS",
    "fabric",
    "Query structured runtime state and expose operational health.",
    "Complete structured self-observation and freshness checks.",
  ),
  node(
    "registry",
    "Node registry / health / recovery",
    "fabric",
    "Track worker health, detect failures and reassign recoverable claims.",
    "Qualify failure detection, recovery and reassignment under load.",
  ),
  node(
    "receipts",
    "Evidence / receipts / event history",
    "fabric",
    "Record execution outcomes separately from approvals and proposals.",
    "Automate sanitized evidence projection and audit verification.",
  ),
  node(
    "policy",
    "Policy / approvals / signer separation",
    "fabric",
    "Require identity, policy, evidence, approval, simulation and separate signer controls; fail closed on missing requirements.",
    "Qualify every missing-requirement rejection and signer boundary.",
  ),
  node(
    "solana",
    "Solana",
    "solana",
    "Event-driven data and controlled execution integration with PRIME.",
    "Complete the governed integration pathway.",
  ),
  node(
    "geyser",
    "Geyser / event ingestion",
    "solana",
    "Receive and normalize chain events for scoped interpretation.",
    "Harden ingestion, backpressure and event integrity.",
  ),
  node(
    "readonly",
    "Read-only Solana adapter",
    "solana",
    "Supply scoped chain reads without signing or transaction authority.",
    "Qualify read freshness, error handling and access boundaries.",
  ),
  node(
    "execution",
    "Governed Solana execution path",
    "solana",
    "Separate proposal, simulation, evaluation, approval, signer and execution stages.",
    "Complete Golden Path #2 and independent execution qualification.",
  ),
  node(
    "multichain",
    "Multichain",
    "domain",
    "Propagate permitted state across chain-specific adapters under policy.",
    "Qualify cross-chain finality and permitted propagation.",
  ),
  node(
    "markets",
    "Markets / Trading",
    "domain",
    "Route market analysis through simulation, risk controls and explicit execution policy.",
    "Integrate market controls and qualify paper/shadow boundaries.",
  ),
  node(
    "wallet",
    "Wallet / Payments",
    "domain",
    "Connect payment intent and wallet interfaces to governed operations.",
    "Qualify custody, consent and payment-provider integration.",
  ),
  node(
    "nft",
    "NFT / Digital Assets",
    "domain",
    "Support asset lifecycle and provenance through scoped integrations.",
    "Qualify asset adapters and lifecycle evidence.",
  ),
  node(
    "issuance",
    "Tokenisation / RWA / regulated issuance",
    "domain",
    "Coordinate issuer-scoped asset workflows and compliance controls.",
    "Complete provider integration and regulatory readiness.",
  ),
  node(
    "settlement",
    "Settlement / treasury / governance rails",
    "domain",
    "Reconcile permitted outcomes and settlement evidence.",
    "Qualify settlement, treasury policies and reconciliation.",
  ),
  node(
    "applications",
    "Application layer",
    "domain",
    "Expose governed capabilities to applications; KYRO is an application example only.",
    "Integrate applications without treating media work as infrastructure proof.",
  ),
];
export const comparisonKeys = [
  "prime",
  "brains",
  "fabric",
  "solana",
  "multichain",
  "markets",
  "wallet",
  "nft",
  "issuance",
  "settlement",
  "applications",
];
export const primeSteps = [
  [
    "Objective / Event",
    "Receive a scoped objective or event. Establish identity, provenance and intent.",
  ],
  [
    "Self-Model",
    "Check capabilities, constraints and observed runtime state. Missing identity or stale required state blocks progression.",
  ],
  [
    "Instinct Router",
    "Route by role, permission and risk; a routed task grants no execution approval.",
  ],
  [
    "Memory Context",
    "Retrieve authorized context with provenance and retention boundaries.",
  ],
  [
    "Specialists",
    "Prepare analysis and candidate work. Specialists do not self-approve.",
  ],
  [
    "Simulation",
    "Test candidate outcomes before action. Missing required simulation fails closed.",
  ],
  [
    "Independent Evaluation",
    "Evaluate independently from proposal authors. Missing evidence or failed evaluation blocks action.",
  ],
  [
    "Governance",
    "Require policy and explicit approval. Missing identity/policy/evidence/approval/simulation/signer requirements fail closed.",
  ],
  [
    "Controlled Execution",
    "A separate authorized execution path checks signer separation. This showcase never executes or signs.",
  ],
  [
    "Evidence / Receipt",
    "Record actual outcomes, separately from proposal, approval and execution stages.",
  ],
  [
    "Memory Update",
    "Store scoped outcomes with provenance to inform later work.",
  ],
] as const;
export const solanaSteps = [
  [
    "Solana/local event",
    "A scoped chain or local-validator event begins the TARGET pathway; it grants no authority.",
    "geyser",
  ],
  [
    "Read-only ingestion",
    "Normalize events with cluster, slot and provenance. Reads cannot authorize signing or broadcast.",
    "geyser",
  ],
  [
    "PRIME interpretation/routing",
    "Interpret events and route scoped tasks through PRIME.",
    "prime",
  ],
  [
    "Specialist proposal",
    "Prepare chain-specific proposals without self-approval.",
    "specialists",
  ],
  [
    "Simulation/evaluation",
    "Simulate candidate outcomes and independently evaluate evidence.",
    "simulation",
  ],
  [
    "Governance/policy gate",
    "Apply identity, policy and approval requirements; fail closed.",
    "governance",
  ],
  [
    "Controlled adapter/execution boundary",
    "Target governed execution is separate from current read-only qualification. No unrestricted signing or broadcast; no mainnet or real-funds claim.",
    "execution",
  ],
  [
    "Evidence/receipt",
    "Record outcomes, cluster, transaction identity and environment-specific finality evidence. Receipt creation is not proof of final settlement.",
    "receipts",
  ],
] as const;
export const copilotPrompts = [
  "Show me the fully integrated SYNAPZ architecture.",
  "What will PRIME look like when complete?",
  "Explain the seven brains end to end.",
  "What does 1,024 logical nodes actually mean?",
  "Show current proof versus the finished target.",
  "How does Solana plug into PRIME?",
  "What remains before the full integration is complete?",
  "What is the latest multichain status?",
  "What is the current tokenisation/issuance status?",
  "What is built versus planned?",
];
