import { afterEach, describe, expect, it, vi } from "vitest";
import {
  evidenceFreshnessMs,
  invalidateShowcaseEvidence,
  loadCachedEvidence,
} from "../src/showcase/cache";
import { demoAdapter } from "../src/showcase/demo";
import type { CurrentEvidence, ShowcaseContext } from "../src/showcase/model";
const context: ShowcaseContext = {
  reviewerTier: "reviewer",
  ownerPreview: false,
  mode: "current_proof",
  currentSection: "system",
};
afterEach(() => vi.useRealTimers());
describe("session-scoped evidence freshness", () => {
  it("deduplicates concurrent loads and ignores navigation and mode", async () => {
    const list = vi.fn(demoAdapter.listVisibleEvidence);
    const adapter = { ...demoAdapter, listVisibleEvidence: list };
    const [first, second] = await Promise.all([
      loadCachedEvidence(adapter, context),
      loadCachedEvidence(adapter, {
        ...context,
        currentSection: "fabric",
        mode: "full_vision",
        selectedNode: "prime",
      }),
    ]);
    await loadCachedEvidence(adapter, context);
    expect(list).toHaveBeenCalledTimes(1);
    expect(first).toEqual(second);
    expect(first).not.toBe(second);
    first.length = 0;
    expect((await loadCachedEvidence(adapter, context)).length).toBeGreaterThan(
      0,
    );
  });
  it("separates authenticated adapters, tiers and preview scope", async () => {
    const list = vi.fn(demoAdapter.listVisibleEvidence);
    const adapter = { ...demoAdapter, listVisibleEvidence: list };
    await loadCachedEvidence(adapter, context);
    await loadCachedEvidence(adapter, { ...context, reviewerTier: "other" });
    await loadCachedEvidence(adapter, { ...context, ownerPreview: true });
    await loadCachedEvidence({ ...adapter }, context);
    expect(list).toHaveBeenCalledTimes(4);
  });
  it("refetches on freshness expiry", async () => {
    vi.useFakeTimers();
    const list = vi.fn(demoAdapter.listVisibleEvidence);
    const adapter = { ...demoAdapter, listVisibleEvidence: list };
    await loadCachedEvidence(adapter, context);
    vi.advanceTimersByTime(evidenceFreshnessMs - 1);
    await loadCachedEvidence(adapter, context);
    expect(list).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    await loadCachedEvidence(adapter, context);
    expect(list).toHaveBeenCalledTimes(2);
  });
  it("invalidates explicitly and rejects an obsolete pending response", async () => {
    let resolve!: (value: CurrentEvidence[]) => void;
    const list = vi.fn(
      () =>
        new Promise<CurrentEvidence[]>((done) => {
          resolve = done;
        }),
    );
    const adapter = { ...demoAdapter, listVisibleEvidence: list };
    const pending = loadCachedEvidence(adapter, context);
    const assertion = expect(pending).rejects.toThrow("invalidated");
    invalidateShowcaseEvidence(adapter);
    resolve([]);
    await assertion;
    const next = loadCachedEvidence(adapter, context);
    resolve([]);
    await next;
    expect(list).toHaveBeenCalledTimes(2);
  });
  it("does not retain failures or leak their private details into evidence", async () => {
    const list = vi
      .fn()
      .mockRejectedValueOnce(new Error("unavailable"))
      .mockResolvedValue([]);
    const adapter = { ...demoAdapter, listVisibleEvidence: list };
    await expect(loadCachedEvidence(adapter, context)).rejects.toThrow(
      "unavailable",
    );
    expect(await loadCachedEvidence(adapter, context)).toEqual([]);
    expect(list).toHaveBeenCalledTimes(2);
  });
});
