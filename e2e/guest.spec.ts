import { expect, test } from "@playwright/test";

test("a guest can calculate and see insights, but not the ledger", async ({ page }) => {
  await page.goto("/calculator");
  await expect(page.getByRole("heading", { name: /typical week/i })).toBeVisible();
  const electricity = page.locator(".field", { hasText: /electricity/i }).locator("input");
  await electricity.fill("300");
  await page.getByRole("button", { name: /see my insights/i }).click();
  await expect(page).toHaveURL(/\/insights/);
  await expect(page.getByText(/tonnes CO₂e a year/)).toBeVisible();
  await page.goto("/track");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Ftrack/);
});

test("a guest with nothing logged is sent back to the calculator", async ({ page }) => {
  await page.goto("/insights");
  await expect(page).toHaveURL(/\/calculator/);
});
