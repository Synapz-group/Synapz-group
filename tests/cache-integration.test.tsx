import { StrictMode } from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { Showcase } from "../src/showcase/Showcase";
import { demoAdapter } from "../src/showcase/demo";
import { invalidateShowcaseEvidence } from "../src/showcase/cache";

it("fetches once across StrictMode, interaction, hash changes, scroll and remount", async () => {
  const list = vi.fn(demoAdapter.listVisibleEvidence);
  const adapter = { ...demoAdapter, listVisibleEvidence: list };
  const view = render(
    <StrictMode>
      <Showcase adapter={adapter} />
    </StrictMode>,
  );
  await screen.findByRole("heading", { name: "PRIME qualification example" });
  fireEvent.click(screen.getByRole("button", { name: "CURRENT PROOF" }));
  fireEvent.click(screen.getByRole("button", { name: "FULL VISION" }));
  fireEvent.click(screen.getByRole("button", { name: "PRIME Core TARGET" }));
  fireEvent.click(screen.getByRole("button", { name: "Close detail panel" }));
  fireEvent.scroll(window);
  act(() => {
    window.location.hash = "#fabric";
  });
  view.unmount();
  render(<Showcase adapter={adapter} />);
  await screen.findByRole("heading", { name: "PRIME qualification example" });
  expect(list).toHaveBeenCalledTimes(1);
});

it("explicit invalidation removes prior claims immediately and refreshes mounted consumers once", async () => {
  const list = vi.fn(demoAdapter.listVisibleEvidence);
  const adapter = { ...demoAdapter, listVisibleEvidence: list };
  render(<Showcase adapter={adapter} />);
  await screen.findByRole("heading", { name: "PRIME qualification example" });
  let resolve!: (value: []) => void;
  list.mockImplementationOnce(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  act(() => invalidateShowcaseEvidence(adapter));
  expect(
    screen.queryByRole("heading", { name: "PRIME qualification example" }),
  ).toBeNull();
  await act(async () => resolve([]));
  await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
  expect(
    screen.queryByRole("heading", { name: "PRIME qualification example" }),
  ).toBeNull();
});

it("tier transitions clear existing claims while a new projection is pending", async () => {
  const list = vi.fn(demoAdapter.listVisibleEvidence);
  const adapter = { ...demoAdapter, listVisibleEvidence: list };
  const view = render(<Showcase adapter={adapter} />);
  await screen.findByRole("heading", { name: "PRIME qualification example" });
  list.mockImplementationOnce(() => new Promise(() => {}));
  view.rerender(<Showcase adapter={adapter} reviewerTier="other" />);
  expect(
    screen.queryByRole("heading", { name: "PRIME qualification example" }),
  ).toBeNull();
  expect(list).toHaveBeenCalledTimes(2);
});
