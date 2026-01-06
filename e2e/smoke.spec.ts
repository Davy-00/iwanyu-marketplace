import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // Ensure a clean slate between tests (avoid leaking Supabase auth sessions
  // and previous cart/wishlist state). Do this once per test so reloads inside
  // a test still validate persistence.
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

test("home loads and has products", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("banner").getByRole("img", { name: /iwanyu/i })).toBeVisible();

  // Expect at least one product card link
  const productLinks = page.locator('a[href^="/product/"]');
  await expect(productLinks.first()).toBeVisible();
});

test("wishlist persists across reload (guest)", async ({ page }) => {
  await page.goto("/");

  // Add first product to wishlist
  const addButton = page.getByRole("button", { name: "Add to wishlist" }).first();
  await expect(addButton).toBeVisible();
  await addButton.click();

  // Wait for the toggle to apply (aria-label changes)
  await expect(page.getByRole("button", { name: "Remove from wishlist" }).first()).toBeVisible();

  // Verify persistence via localStorage (guest wishlist should survive reloads)
  const raw1 = await page.evaluate(() => window.localStorage.getItem("iwanyu:wishlist"));
  const list1 = raw1 ? (JSON.parse(raw1) as unknown) : [];
  expect(Array.isArray(list1)).toBeTruthy();
  expect((list1 as unknown[]).length).toBeGreaterThan(0);

  await page.reload();

  const raw2 = await page.evaluate(() => window.localStorage.getItem("iwanyu:wishlist"));
  const list2 = raw2 ? (JSON.parse(raw2) as unknown) : [];
  expect(Array.isArray(list2)).toBeTruthy();
  expect((list2 as unknown[]).length).toBeGreaterThan(0);
});

test("add to cart then reach checkout and can enter payment details", async ({ page }) => {
  await page.goto("/");

  // Open an in-stock product (the stock label is inside the product link)
  const inStockProduct = page.locator('a[href^="/product/"]', { hasText: "✓ In Stock" }).first();
  await expect(inStockProduct).toBeVisible();
  await inStockProduct.click();

  // Add to cart and go to cart
  const addBtn = page.getByRole("button", { name: /add to cart/i }).first();
  await expect(addBtn).toBeVisible();
  await expect(addBtn).toBeEnabled();
  await addBtn.click();

  // Navigate using the app (avoids full reload before persistence effects run)
  await page.getByRole("button", { name: /view cart/i }).click();
  await expect(page.getByRole("heading", { name: /your shopping cart/i })).toBeVisible();

  // Checkout
  const checkoutBtn = page.getByRole("button", { name: /checkout/i }).first();
  await expect(checkoutBtn).toBeVisible();
  await checkoutBtn.click();

  await expect(page.getByRole("heading", { name: /^checkout$/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /^payment$/i })).toBeVisible();

  // Fill required checkout fields (minimal)
  await page.getByPlaceholder("you@example.com").fill("buyer@example.com");
  await page.getByPlaceholder("Street, City, State").fill("Kigali, KG 123 St");

  // Default is momo in the UI; fill phone to enable pay
  await page.getByPlaceholder("07xxxxxxxx").fill("0788888888");

  // The primary action should become enabled.
  const placeOrderButton = page.getByRole("button", { name: /place order|pay/i }).first();
  await expect(placeOrderButton).toBeEnabled();

  // Guest checkout should redirect to login (payment requires authentication).
  await placeOrderButton.click();

  // Depending on environment configuration, checkout may redirect to login or
  // show an explicit configuration error. Accept either outcome.
  await page.waitForTimeout(1500);
  if (!page.url().includes("/login")) {
    await expect(page.getByText(/checkout failed/i)).toBeVisible({ timeout: 15000 });
  }
});

test.describe("auth flows (optional)", () => {
  test.skip(!process.env.E2E_TEST_EMAIL || !process.env.E2E_TEST_PASSWORD, "Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD");

  test("login works", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel(/email/i).fill(process.env.E2E_TEST_EMAIL!);
    await page.getByLabel(/password/i).fill(process.env.E2E_TEST_PASSWORD!);

    await page.getByRole("button", { name: /sign in|login/i }).click();

    // App should navigate away or show logged-in UI
    await page.waitForTimeout(1500);
    await expect(page.getByRole("link", { name: /account/i })).toBeVisible();
  });
});
