// Host entry point: demo fixtures are intentionally excluded.
export { Showcase, MaturityBadge, type ShowcaseProps } from "./Showcase";
export {
  ShowcaseCopilotProvider,
  type CopilotBridge,
  type CopilotPayload,
} from "./copilot";
export { loadVisibleEvidence, sanitizeEvidence } from "./adapter";
export {
  maturityLegend,
  type ShowcaseEvidenceAdapter,
  type ShowcaseContext,
  type CurrentEvidence,
  type EvidenceRef,
  type Maturity,
  type Mode,
} from "./model";

export { invalidateShowcaseEvidence, evidenceFreshnessMs } from "./cache";
