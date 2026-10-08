import { loadVisibleEvidence } from "./adapter";
import type {
  CurrentEvidence,
  ShowcaseContext,
  ShowcaseEvidenceAdapter,
} from "./model";

export const evidenceFreshnessMs = 60_000;
type Entry = { expires: number; pending: Promise<CurrentEvidence[]> };
type State = {
  revision: number;
  entries: Map<string, Entry>;
  listeners: Set<() => void>;
};
const states = new WeakMap<ShowcaseEvidenceAdapter, State>();
function stateFor(adapter: ShowcaseEvidenceAdapter): State {
  let state = states.get(adapter);
  if (!state) {
    state = { revision: 0, entries: new Map(), listeners: new Set() };
    states.set(adapter, state);
  }
  return state;
}
// An adapter belongs to one authenticated session. The host must invalidate on
// logout, revocation, publication or tier changes, and replace it on identity change.
export function invalidateShowcaseEvidence(adapter: ShowcaseEvidenceAdapter) {
  const state = stateFor(adapter);
  state.entries.clear();
  state.revision++;
  state.listeners.forEach((listener) => listener());
}
export function evidenceRevision(adapter: ShowcaseEvidenceAdapter) {
  return stateFor(adapter).revision;
}
export function subscribeEvidence(
  adapter: ShowcaseEvidenceAdapter,
  listener: () => void,
) {
  const state = stateFor(adapter);
  state.listeners.add(listener);
  return () => {
    state.listeners.delete(listener);
  };
}
export async function loadCachedEvidence(
  adapter: ShowcaseEvidenceAdapter,
  context: ShowcaseContext,
) {
  const state = stateFor(adapter);
  const key = JSON.stringify([context.reviewerTier, context.ownerPreview]);
  let entry = state.entries.get(key);
  if (!entry || entry.expires <= Date.now()) {
    // View state is never an authorization or fetch dimension.
    const pending = loadVisibleEvidence(adapter, {
      reviewerTier: context.reviewerTier,
      ownerPreview: context.ownerPreview,
      mode: "current_proof",
      currentSection: "system",
    });
    entry = { pending, expires: Infinity };
    state.entries.set(key, entry);
    const current = entry;
    pending.then(
      () => {
        current.expires = Date.now() + evidenceFreshnessMs;
      },
      () => {
        if (state.entries.get(key) === current) state.entries.delete(key);
      },
    );
  }
  const revision = state.revision;
  const records = await entry.pending;
  if (revision !== state.revision) throw new Error("Evidence invalidated");
  return structuredClone(records);
}
