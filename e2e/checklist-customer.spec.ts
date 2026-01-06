import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    try {
      window.localStorage.clear();
      window.sessionStorage.clear();
    } catch {
      // ignore
    }
  });
  await page.reload();
});

test("Customer: a user can find a product easily (search)", async ({ page }) => {
  await page.goto("/");
  const firstProduct = page.locator('a[href^="/product/"]').first();
  await expect(firstProduct).toBeVisible();
  await firstProduct.click();

  const title = (await page.locator("h1").first().textContent())?.trim() ?? "";
  const token = title.split(/\s+/).filter(Boolean)[0] ?? "";
  test.skip(!token, "No product title token available");

  await page.goto(`/search?q=${encodeURIComponent(token)}`);
  await expect(page).toHaveURL(/\/search\?q=/);
  await expect(page.locator('a[href^="/product/"]').first()).toBeVisible();
});

test("Customer: a user can add a product to cart", async ({ page }) => {
  await page.goto("/");
  const inStockLink = page.locator('a[href^="/product/"]', { hasText: "✓ In Stock" }).first();
  await expect(inStockLink).toBeVisible();
  await inStockLink.click();

  await page.getByRole("button", { name: /add to cart/i }).first().click();
  await page.getByRole("button", { name: /view cart/i }).click();
  await expect(page.getByRole("heading", { name: /your shopping cart/i })).toBeVisible();
});

test("Customer: placing an order requires login (redirect)", async ({ page }) => {
  // Add something to cart
  await page.goto("/");
  const inStockLink = page.locator('a[href^="/product/"]', { hasText: "✓ In Stock" }).first();
  await expect(inStockLink).toBeVisible();
  await inStockLink.click();
  await page.getByRole("button", { name: /add to cart/i }).first().click();
  await page.getByRole("button", { name: /view cart/i }).click();

  // Go to checkout
  await page.getByRole("button", { name: /checkout/i }).first().click();
  await expect(page.getByRole("heading", { name: /checkout/i })).toBeVisible();

  // Fill minimum required fields to enable the button
  await page.getByPlaceholder("you@example.com").fill("test@example.com");
  await page.getByPlaceholder("Street, City, State").fill("Kigali, Rwanda");
  await page.getByPlaceholder("07xxxxxxxx").fill("0781234567");

  // Click Place order should redirect to login when not authenticated
  await page.getByRole("button", { name: /place order/i }).click();
  await expect(page).toHaveURL(/\/login/);
});
