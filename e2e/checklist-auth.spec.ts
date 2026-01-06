import { test, expect } from "@playwright/test";

const hasSupabase = Boolean(process.env.E2E_SUPABASE_ENABLED);

test.describe("Customer: signup (optional)", () => {
  test("A new user can sign up successfully", async ({ page }) => {
    test.skip(!hasSupabase, "Requires Supabase auth configured + E2E_SUPABASE_ENABLED=1");

    const baseEmail = process.env.E2E_SIGNUP_EMAIL_BASE;
    const password = process.env.E2E_SIGNUP_PASSWORD;

    test.skip(!baseEmail || !password, "Requires E2E_SIGNUP_EMAIL_BASE and E2E_SIGNUP_PASSWORD");

    // Use plus addressing to create a unique email per run.
    const ts = Date.now();
    const email = baseEmail.includes("+")
      ? baseEmail.replace(/\+.*/, `+e2e${ts}`)
      : baseEmail.replace("@", `+e2e${ts}@`);

    await page.goto("/signup");

    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole("button", { name: /sign up/i }).click();

    // App navigates to /account after signup; some providers may require email confirmation.
    await expect(page).toHaveURL(/\/account/);
  });
});
