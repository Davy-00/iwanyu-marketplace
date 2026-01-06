import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.E2E_PORT ?? 8080);

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? `http://127.0.0.1:${port}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${port}`,
    url: process.env.E2E_BASE_URL ?? `http://127.0.0.1:${port}`,
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      ...process.env,
      VITE_E2E_DISABLE_SUPABASE: process.env.VITE_E2E_DISABLE_SUPABASE ?? "1",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
