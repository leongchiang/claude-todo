import { defineConfig, devices } from "@playwright/test";

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

// CI sets these via the workflow env block; local dev uses the defaults below.
// TEST_ENV reads process.env first so the webServer and the test helpers always
// share the same values — a mismatch causes NextAuth to reject forged cookies.
const TEST_ENV = {
  DATABASE_PATH: process.env.DATABASE_PATH ?? "./data/playwright.db",
  AUTH_SECRET: process.env.AUTH_SECRET ?? "playwright-test-secret-32-chars-min-required-here",
  NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? BASE_URL,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? "sk-test-do-not-use",
};

// Backfill any keys the workflow didn't set so test helpers see the same values.
for (const [k, v] of Object.entries(TEST_ENV)) {
  process.env[k] ??= v;
}

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  ...(process.env.CI ? { workers: 1 } : {}),
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: TEST_ENV,
  },
});
