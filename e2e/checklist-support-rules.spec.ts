import { test, expect } from "@playwright/test";

test("Customer: user can contact support (Help page exists)", async ({ page }) => {
  // /help is currently a placeholder StaticPage, so we assert reachability.
  await page.goto("/help");
  await expect(page.getByRole("heading", { name: "Help", exact: true })).toBeVisible();

  // Contact details live in Privacy Policy / Terms.
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { name: "Privacy Policy", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "11. Contact Us", exact: true })).toBeVisible();
  await expect(page.getByText(/privacy@iwanyu\.store/i)).toBeVisible();
});

test("Vendor: vendor understands platform rules (Terms include fulfillment/refunds)", async ({ page }) => {
  await page.goto("/terms");
  await expect(page.getByRole("heading", { name: "Terms of Service", exact: true })).toBeVisible();
  await expect(page.getByText(/4\.3 Order Fulfillment/i)).toBeVisible();
  await expect(page.getByText(/5\.2 Returns and Refunds/i)).toBeVisible();
});

test("Money & Trust: refund policy text is discoverable", async ({ page }) => {
  await page.goto("/terms");
  await expect(page.getByText(/returns and refunds/i)).toBeVisible();
});
