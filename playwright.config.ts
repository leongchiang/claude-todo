import { defineConfig, devices } from "@playwright/test";

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

// Shared between the dev server (via webServer.env) and the test helpers
// (via process.env). The DB lives under data/ which is .gitignored.
const TEST_ENV = {
  DATABASE_PATH: "./data/playwright.db",
  AUTH_SECRET: "playwright-test-secret-32-chars-min-required-here",
  NEXTAUTH_URL: BASE_URL,
  // Real AI calls are mocked in unit tests; e2e tests that hit AI endpoints
  // should stub the SDK at a higher level, never with a real key.
  ANTHROPIC_API_KEY: "sk-test-do-not-use",
};

// Make the same env visible to the test helpers running in the Playwright
// worker process.
for (const [k, v] of Object.entries(TEST_ENV)) {
  process.env[k] = process.env[k] ?? v;
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
