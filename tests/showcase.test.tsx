import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Showcase } from "../src/showcase/Showcase";
import { demoAdapter } from "../src/showcase/demo";
import { createReadOnlyAdapter } from "../src/showcase/adapter";
import {
  brainNames,
  capacityDisclaimer,
  copilotPrompts,
} from "../src/showcase/model";
const mount = async (props = {}) => {
  render(<Showcase adapter={demoAdapter} {...props} />);
  await waitFor(() =>
    expect(
      screen.queryByText("Loading authorized evidence…"),
    ).not.toBeInTheDocument(),
  );
};
describe("mandatory showcase experience", () => {
  it("keeps the selected architecture node in Copilot context after closing detail", async () => {
    const bridge = vi.fn();
    await mount({ copilotBridge: bridge });
    fireEvent.click(screen.getByRole("button", { name: "PRIME Core TARGET" }));
    fireEvent.click(screen.getByRole("button", { name: "Close detail panel" }));
    fireEvent.click(screen.getByRole("button", { name: copilotPrompts[0] }));
    expect(bridge.mock.calls[0][0].context.selectedNode).toBe("prime");
  });
  it("immediately removes previous authority evidence during an adapter change", async () => {
    const view = render(<Showcase adapter={demoAdapter} />);
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "PRIME qualification example" }),
      ).toBeVisible(),
    );
    const waitingAdapter = {
      ...demoAdapter,
      listVisibleEvidence: () => new Promise<never>(() => {}),
    };
    view.rerender(
      <Showcase adapter={waitingAdapter} reviewerTier="different-session" />,
    );
    expect(
      screen.queryByRole("heading", { name: "PRIME qualification example" }),
    ).not.toBeInTheDocument();
  });
  it("rejects a forged preview category without disclosing it", async () => {
    await mount({
      ownerPreview: true,
      pendingSummary: { count: 1, categories: ["Private draft body"] },
    });
    expect(screen.queryByText(/Private draft body/)).not.toBeInTheDocument();
  });
  it("documents each maturity through its unique legend", async () => {
    await mount();
    fireEvent.click(
      screen.getByText("Maturity legend — every state has its own meaning"),
    );
    expect(
      screen.getAllByTitle(
        "Passed stated qualification criteria; qualification is not deployment.",
      ).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByTitle(
        "Deployed only in the environment explicitly named by the evidence.",
      ),
    ).toBeVisible();
  });
  it("renders every mandatory section", async () => {
    await mount();
    for (const title of [
      "THE FULL SYNAPZ SYSTEM",
      "How PRIME Actually Thinks",
      "How 1,024 Logical Nodes Work",
      "Full Solana Integration Path",
      "Current vs Completed",
      "What Will Be Finished",
      "Why Solana",
      "Latest Engineering Snapshot",
      "Showcase Copilot",
    ])
      expect(screen.getByRole("heading", { name: title })).toBeVisible();
  });
  it("names all seven functional brains and preserves capacity disclaimer", async () => {
    await mount();
    for (const name of brainNames)
      expect(
        screen.getByRole("button", {
          name: new RegExp("^" + name + " TARGET"),
        }),
      ).toBeVisible();
    expect(screen.getByText(capacityDisclaimer)).toBeVisible();
    expect(screen.getByText(/not seven personalities/)).toBeVisible();
  });
  it("opens PRIME with all node detail fields", async () => {
    await mount();
    fireEvent.click(screen.getByRole("button", { name: /^PRIME Core TARGET/ }));
    const panel = screen.getByRole("dialog");
    for (const name of [
      "End-state role",
      "Current evidence",
      "Current maturity",
      "Limitations",
      "What remains",
    ])
      expect(within(panel).getByRole("heading", { name })).toBeVisible();
    expect(
      within(panel).getByText(/Central governed intelligence/),
    ).toBeVisible();
    fireEvent.click(
      within(panel).getByRole("button", { name: "Close detail panel" }),
    );
    expect(panel).not.toBeVisible();
  });
  it("filters targets out of the map in Current Proof and restores vision", async () => {
    await mount();
    fireEvent.click(screen.getByRole("button", { name: "CURRENT PROOF" }));
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: /^Wallet \/ Payments/ }),
      ).not.toBeInTheDocument(),
    );
    expect(
      screen.queryByRole("heading", { name: "How PRIME Actually Thinks" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText("No approved implementation evidence published yet.")
        .length,
    ).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "FULL VISION" }));
    expect(
      screen.getByRole("heading", { name: "How PRIME Actually Thinks" }),
    ).toBeVisible();
  });
  it("traverses PRIME and separates execution from receipts", async () => {
    await mount();
    const flow = screen.getByLabelText("PRIME ordered thinking flow");
    fireEvent.click(
      within(flow).getByRole("button", { name: /08 Governance/ }),
    );
    expect(
      screen.getByText(/Require policy and explicit approval/),
    ).toBeVisible();
    fireEvent.click(
      within(flow).getByRole("button", { name: /09 Controlled Execution/ }),
    );
    expect(
      screen.getByText(/A separate authorized execution path/),
    ).toBeVisible();
    fireEvent.click(within(flow).getByRole("button", { name: /10 Evidence/ }));
    expect(screen.getByText(/Record actual outcomes/)).toBeVisible();
  });
  it("traverses the Solana path", async () => {
    await mount();
    fireEvent.click(
      within(screen.getByLabelText("Solana integration flow")).getByRole(
        "button",
        { name: /08 Evidence/ },
      ),
    );
    expect(screen.getByText(/Record outcomes, cluster/)).toBeVisible();
  });
  it("separates current evidence from completed target", async () => {
    await mount();
    const table = screen.getByRole("table");
    expect(
      within(table).getByRole("columnheader", { name: "CURRENT EVIDENCE" }),
    ).toBeVisible();
    expect(
      within(table).getByRole("columnheader", {
        name: "COMPLETED INTEGRATION TARGET",
      }),
    ).toBeVisible();
    expect(within(table).getAllByText("TARGET").length).toBe(11);
  });
  it("labels all roadmap work as unfinished", async () => {
    await mount();
    const list = document.querySelector(".roadmap")!;
    expect(within(list as HTMLElement).getAllByRole("listitem")).toHaveLength(
      12,
    );
    expect(within(list as HTMLElement).getAllByText("PLANNED")).toHaveLength(
      12,
    );
  });
  it("opens evidence with dates, scope and limitations", async () => {
    await mount();
    fireEvent.click(
      screen.getAllByRole("button", {
        name: /Inspect evidence and limitations/,
      })[0],
    );
    const panel = screen.getByRole("dialog");
    expect(
      within(panel).getByRole("heading", {
        name: "PRIME qualification example",
      }),
    ).toBeVisible();
    expect(within(panel).getByText(/No claim that 1,024/)).toBeVisible();
    expect(
      within(panel).getByRole("link", { name: /Inspect visible snapshot/ }),
    ).toHaveAttribute("href", "#evidence/prime-example");
  });
  it("provides the exact Copilot prompt set and safe read-only context", async () => {
    const bridge = vi.fn();
    await mount({ copilotBridge: bridge });
    for (const p of copilotPrompts)
      expect(screen.getByRole("button", { name: p })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: copilotPrompts[0] }));
    expect(bridge).toHaveBeenCalledOnce();
    expect(bridge.mock.calls[0][0].context.mode).toBe("full_vision");
    expect(bridge.mock.calls[0][0].instruction).toContain("untrusted data");
  });
  it("shows only a safe owner preview summary", async () => {
    await mount({
      ownerPreview: true,
      pendingSummary: { count: 2, categories: ["Solana"] },
    });
    expect(
      screen.getByText("Newer engineering evidence awaiting approval"),
    ).toBeVisible();
    expect(screen.queryByText("Draft body")).not.toBeInTheDocument();
  });
  it("fails closed when the adapter throws", async () => {
    await mount({
      adapter: {
        ...demoAdapter,
        listVisibleEvidence: async () => {
          throw new Error("private failure");
        },
      },
    });
    expect(screen.getByRole("alert")).toHaveTextContent("fail closed");
    expect(screen.queryByText("private failure")).not.toBeInTheDocument();
    expect(
      screen.queryByText("PRIME qualification example"),
    ).not.toBeInTheDocument();
  });
  it("does not invent evidence for an empty host", async () => {
    await mount({ adapter: createReadOnlyAdapter([], { tier: "reviewer" }) });
    expect(screen.queryByText("DEMO DATA ONLY")).not.toBeInTheDocument();
    expect(
      screen.queryByText("PRIME qualification example"),
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByText("No approved implementation evidence published yet.")
        .length,
    ).toBeGreaterThan(0);
  });
  it("has no admin or write controls", async () => {
    await mount();
    for (const button of screen.getAllByRole("button"))
      expect(button.textContent).not.toMatch(
        /^(approve|publish|sign transaction|execute trade|admin|manage access)\b/i,
      );
    expect(document.querySelector("form")).toBeNull();
  });
  it("fails closed for invisible evidence deep links", async () => {
    window.location.hash = "#evidence/draft";
    await mount();
    expect(
      within(screen.getByRole("dialog")).getByText(/Access fails closed/),
    ).toBeVisible();
  });
});
