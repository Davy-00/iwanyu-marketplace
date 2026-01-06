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

test("category page shows recommended products section", async ({ page }) => {
  await page.goto("/");

  // Navigate to a category (avoid /category/all).
  const categoryHref = await page.locator('a[href^="/category/"]').evaluateAll((nodes) => {
    const hrefs = nodes
      .map((n) => n.getAttribute("href") || "")
      .filter(Boolean);
    return hrefs.find((h) => h !== "/category/all" && !h.endsWith("/all")) || null;
  });

  test.skip(!categoryHref, "No category link found");
  await page.goto(categoryHref);

  await expect(page).toHaveURL(/\/category\//);
  await expect(page.getByRole("heading", { name: /recommended products/i })).toBeVisible();

  // Either an empty state or at least one product link.
  const section = page.getByRole("heading", { name: /recommended products/i }).locator("xpath=..");
  const links = section.locator('a[href^="/product/"]');

  const count = await links.count();
  if (count === 0) {
    await expect(section.getByText(/no recommendations available/i)).toBeVisible();
  } else {
    await expect(links.first()).toBeVisible();
  }
});

test("cart shows recommended products section after adding an item", async ({ page }) => {
  await page.goto("/");

  const inStockProduct = page.locator('a[href^="/product/"]', { hasText: "✓ In Stock" }).first();
  await expect(inStockProduct).toBeVisible();
  await inStockProduct.click();

  await expect(page).toHaveURL(/\/product\//);

  const addBtn = page.getByRole("button", { name: /add to cart/i }).first();
  await expect(addBtn).toBeVisible();
  await addBtn.click();

  await page.getByRole("button", { name: /view cart/i }).click();
  await expect(page.getByRole("heading", { name: /your shopping cart/i })).toBeVisible();

  await expect(page.getByRole("heading", { name: /recommended products/i })).toBeVisible();

  const section = page.getByRole("heading", { name: /recommended products/i }).locator("xpath=..");
  const links = section.locator('a[href^="/product/"]');
  const count = await links.count();

  if (count === 0) {
    await expect(section.getByText(/no recommendations available/i)).toBeVisible();
  } else {
    await expect(links.first()).toBeVisible();
  }
});
