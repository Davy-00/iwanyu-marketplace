import { test, expect } from "@playwright/test";

test("Customer: track order status page exists (requires sign-in)", async ({ page }) => {
  await page.goto("/orders");
  await expect(page.getByRole("heading", { name: /your orders/i })).toBeVisible();
  await expect(page.getByText(/sign in to see your orders/i)).toBeVisible();
});
