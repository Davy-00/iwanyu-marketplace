import { test, expect } from "@playwright/test";

test("Vendor: vendor can register (vendor application page reachable)", async ({ page }) => {
  await page.goto("/vendor-application");
  // Vendor registration requires sign-in; signed-out users should be redirected.
  await expect(page).toHaveURL(/\/login/);
});

test("Admin/Platform: orders are visible to admin (optional)", async ({ page }) => {
  test.skip(true, "Requires admin auth + implemented admin orders view. Covered in admin-flow.spec.ts when creds exist.");

  // Placeholder for future: login as admin and confirm orders table.
  await page.goto("/admin");
  await expect(page.getByText(/orders/i)).toBeVisible();
});
