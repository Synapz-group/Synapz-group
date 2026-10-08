import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test.beforeEach(async ({ page }) => {
  await page.goto("/solana-showcase");
  await expect(page.getByText("Loading authorized evidence…")).toHaveCount(0);
});
test("loads all mandatory sections and has no console-breaking errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "THE FULL SYNAPZ SYSTEM" }),
  ).toBeVisible();
  for (const title of [
    "How PRIME Actually Thinks",
    "How 1,024 Logical Nodes Work",
    "Full Solana Integration Path",
    "Current vs Completed",
    "What Will Be Finished",
    "Why Solana",
    "Latest Engineering Snapshot",
    "Showcase Copilot",
  ])
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeAttached();
  expect(errors).toEqual([]);
});
test("global proof filter and full vision restoration", async ({ page }) => {
  await page
    .getByRole("button", { name: "CURRENT PROOF", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: /^Wallet \/ Payments/ }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /^PRIME Core QUALIFIED/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "FULL VISION", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /^Wallet \/ Payments TARGET/ }),
  ).toBeVisible();
});
test("PRIME detail opens, closes with Escape and restores focus", async ({
  page,
}) => {
  const prime = page.getByRole("button", { name: /^PRIME Core TARGET/ });
  await prime.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("dialog").getByRole("heading", { name: "End-state role" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(prime).toBeFocused();
});
test("traverses every PRIME stage including seven functions", async ({
  page,
}) => {
  const flow = page.getByLabel("PRIME ordered thinking flow");
  const buttons = flow.getByRole("button");
  for (let i = 0; i < 11; i++) {
    await buttons.nth(i).click();
    await expect(buttons.nth(i)).toHaveAttribute("aria-pressed", "true");
  }
  await expect(
    page.getByRole("heading", { name: "Memory Update", exact: true }),
  ).toBeVisible();
});
test("logical capacity disclaimer and present versus target", async ({
  page,
}) => {
  await expect(
    page.getByText("TARGET CAPACITY", { exact: true }),
  ).toBeAttached();
  await expect(
    page.getByText("PRESENT FABRIC", { exact: true }),
  ).toBeAttached();
  await expect(
    page.getByText(/1,024 is logical-capacity \/ target architecture/),
  ).toBeAttached();
});
test("traverses the full Solana integration path", async ({ page }) => {
  const buttons = page
    .getByLabel("Solana integration flow")
    .getByRole("button");
  for (let i = 0; i < 8; i++) {
    await buttons.nth(i).click();
    await expect(buttons.nth(i)).toHaveAttribute("aria-pressed", "true");
  }
  await expect(page.getByText(/Record outcomes, cluster/)).toBeVisible();
});
test("comparison and unfinished roadmap", async ({ page }) => {
  await expect(
    page.getByRole("columnheader", { name: "CURRENT EVIDENCE" }),
  ).toBeAttached();
  await expect(
    page.getByRole("columnheader", { name: "COMPLETED INTEGRATION TARGET" }),
  ).toBeAttached();
  await expect(page.locator("tbody tr")).toHaveCount(11);
  await expect(page.locator(".roadmap li")).toHaveCount(12);
  await expect(page.locator(".roadmap .badge")).toHaveText(
    Array(12).fill("PLANNED: Unfinished work with no implementation claim."),
  );
});
test("evidence drilldown and authorized deep-link refresh", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Inspect evidence and limitations ↗" })
    .first()
    .click();
  await expect(
    page.getByRole("dialog").getByRole("heading", { name: "Limitations" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Inspect visible snapshot ↗" }).click();
  await page.reload();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("heading", { name: "PRIME qualification example" }),
  ).toBeVisible();
});
test("unavailable evidence and admin navigation fail closed", async ({
  page,
}) => {
  await page.goto("/solana-showcase#evidence/draft");
  await expect(
    page.getByRole("dialog").getByText(/Access fails closed/),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /admin|publish|approve/i }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", {
      name: /^sign transaction|^execute trade|^approve|^publish/i,
    }),
  ).toHaveCount(0);
});
test("Copilot prompts carry contextual standalone preview", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "How does Solana plug into PRIME?" })
    .click();
  await expect(page.locator(".prompt-preview")).toContainText(
    "How does Solana plug into PRIME?",
  );
  await expect(page.locator(".prompt-preview")).toContainText("full_vision");
});
test("responsive layout stays inside viewport with keyboard access", async ({
  page,
}) => {
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to showcase" }),
  ).toBeFocused();
  await page.screenshot({
    path: `test-results/showcase-${test.info().project.name}.png`,
    fullPage: true,
  });
});
test("accessibility basics pass with and without evidence dialog", async ({
  page,
}) => {
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole("button", { name: /^PRIME Core TARGET/ }).click();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
