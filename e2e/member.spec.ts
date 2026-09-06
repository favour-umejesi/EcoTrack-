import { expect, test } from "@playwright/test";

/**
 * Creates a throwaway member, walks the ledger and the board, then deletes the account through the UI, which
 * removes every row it created. Needs a database and Neon Auth in .env.
 */
const email = `e2e-${Date.now()}@example.com`;
const password = "correct-horse-battery";

test.describe.serial("member journey", () => {
  test("sign up imports guest sums and logs a first week", async ({ page }) => {
    await page.goto("/calculator");
    await page.evaluate(() => localStorage.setItem("ecotrack.inputs", JSON.stringify({ country: "gb", mode: "bus", commuteKm: 20, electricityKwh: 200, meatMeals: 3 })));
    await page.goto("/sign-in?view=new");
    await page.getByPlaceholder(/anything you like/i).fill("E2E Heron");
    await page.locator('input[autocomplete="email"]').fill(email);
    await page.locator('input[autocomplete="new-password"]').fill(password);
    await page.getByRole("button", { name: /start my ledger/i }).click();
    await expect(page).toHaveURL(/\/track/, { timeout: 30_000 });
    await expect(page.getByRole("heading", { name: /your first month/i })).toBeVisible();
    await expect(page.getByText(/Logged the week of/)).toBeVisible();
  });

  test("shares a post, reacts, and sees it on the board", async ({ page }) => {
    await signIn(page);
    await page.goto("/community/new");
    await page.getByPlaceholder(/tote bag/i).fill("E2E: mended a torn jacket sleeve");
    await page.getByPlaceholder(/what it took/i).fill("Fifteen minutes with a needle and thread. It looks fine from a metre away.");
    await page.getByRole("button", { name: /share with the community/i }).click();
    await expect(page).toHaveURL(/\/community$/, { timeout: 30_000 });
    await expect(page.getByRole("heading", { name: /mended a torn jacket sleeve/i })).toBeVisible();
    await page.getByRole("button", { name: /Helpful \(0\)/ }).first().click();
    await expect(page.getByRole("button", { name: /Helpful \(1\)/ }).first()).toBeVisible();
  });

  test("deletes the account and cannot sign in again", async ({ page }) => {
    await signIn(page);
    await page.goto("/profile");
    await page.getByRole("button", { name: /delete account/i }).click();
    await page.getByRole("button", { name: /yes, delete everything/i }).click();
    await expect(page).toHaveURL(/\/$/, { timeout: 30_000 });
    await page.goto("/sign-in");
    await page.locator('input[autocomplete="email"]').fill(email);
    await page.locator('input[autocomplete="current-password"]').fill(password);
    await page.getByRole("button", { name: /^sign in$/i }).click();
    await expect(page.getByText(/do not match any ledger/i)).toBeVisible({ timeout: 30_000 });
  });
});

async function signIn(page: import("@playwright/test").Page) {
  await page.goto("/sign-in");
  await page.locator('input[autocomplete="email"]').fill(email);
  await page.locator('input[autocomplete="current-password"]').fill(password);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await expect(page).toHaveURL(/\/track/, { timeout: 30_000 });
}
