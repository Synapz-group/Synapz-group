import { expect, test } from "@playwright/test";
const sections = [
  "system",
  "thinking",
  "fabric",
  "solana-path",
  "comparison",
  "finished",
  "why-solana",
  "evidence",
  "copilot",
];
test("all nine sections navigate in both modes, reload and traverse history", async ({
  page,
}) => {
  await page.goto("/solana-showcase");
  for (const mode of ["FULL VISION", "CURRENT PROOF"]) {
    await page.getByRole("button", { name: mode, exact: true }).click();
    for (const id of sections) {
      await page
        .getByRole("navigation", { name: "Showcase sections" })
        .locator(`a[href="#${id}"]`)
        .click();
      await expect(page).toHaveURL(new RegExp(`#${id}$`));
      await expect(page.locator(`#${id}`)).toBeInViewport();
      await expect(page.locator(`nav a[href="#${id}"]`)).toHaveAttribute(
        "aria-current",
        "location",
      );
    }
  }
  await page.goBack();
  await expect(page.locator('nav a[href="#evidence"]')).toHaveAttribute(
    "aria-current",
    "location",
  );
  await expect(page.locator("#evidence")).toBeInViewport();
  await page.goForward();
  await expect(page.locator('nav a[href="#copilot"]')).toHaveAttribute(
    "aria-current",
    "location",
  );
  for (const id of sections) {
    await page.goto(`/solana-showcase#${id}`);
    await expect(page.locator(`#${id}`)).toBeInViewport();
    await page.reload();
    await expect(page.locator(`#${id}`)).toBeInViewport();
    await expect(page.locator(`nav a[href="#${id}"]`)).toHaveAttribute(
      "aria-current",
      "location",
    );
  }
});
test("20 technical questions expand with evidence requirements and no page overflow", async ({
  page,
}) => {
  await page.goto("/solana-showcase#solana-path");
  await page.screenshot({ path: `test-results/browser/solana-${test.info().project.name}.png` });
  const questions = page.locator(".review-questions details");
  await expect(questions).toHaveCount(20);
  for (const question of await questions.all()) {
    await question.locator("summary").click();
    await expect(
      question.getByText("NOT YET EVIDENCED / DESIGN DECISION PENDING"),
    ).toBeVisible();
    await expect(
      question.getByText("Evidence required to close:", { exact: true }),
    ).toBeVisible();
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
