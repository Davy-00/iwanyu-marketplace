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

test("product details shows category-based recommended products when available", async ({ page }) => {
  await page.goto("/");

  // Open an in-stock product to reduce flakiness.
  const inStockProduct = page.locator('a[href^="/product/"]', { hasText: "✓ In Stock" }).first();
  await expect(inStockProduct).toBeVisible();
  const currentHref = await inStockProduct.getAttribute("href");
  await inStockProduct.click();

  await expect(page).toHaveURL(/\/product\//);

  // Read category from the breadcrumb link.
  const categoryLink = page.locator('a[href^="/category/"]').first();
  await expect(categoryLink).toBeVisible();
  const categoryName = (await categoryLink.textContent())?.trim();
  expect(categoryName).toBeTruthy();

  // Find a different product on the home page with the same category.
  await page.goto("/");

  const otherHref = await page
    .locator('a[href^="/product/"]', { hasText: categoryName! })
    .evaluateAll((nodes, current) => {
      const hrefs = nodes
        .map((n) => n.getAttribute("href") || "")
        .filter(Boolean);
      return hrefs.find((h) => h !== current) || null;
    }, currentHref);

  // Go back to the original product and assert recommendations include otherHref.
  await page.goto(currentHref!);

  const recommendationsContainer = page.getByRole("heading", { name: /recommended products/i }).locator("xpath=..");
  await expect(recommendationsContainer).toBeVisible();

  const recommendedLinks = recommendationsContainer.locator('a[href^="/product/"]');
  if (otherHref) {
    await expect(recommendedLinks.first()).toBeVisible();
    await expect(recommendationsContainer.locator(`a[href="${otherHref}"]`)).toBeVisible();
  } else {
    await expect(recommendedLinks).toHaveCount(0);
  }
});
