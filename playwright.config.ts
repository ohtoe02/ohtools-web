import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:4321",
    trace: "retain-on-failure",
  },
  webServer: {
    command:
      "pnpm sync:catalog && pnpm astro build && pnpm exec sirv dist --host 127.0.0.1 --port 4321",
    url: "http://localhost:4321/",
    reuseExistingServer: !process.env.CI,
    env: {
      OHTOOLS_CATALOG_BOOTSTRAP: "1",
      SITE_BASE: "/",
    },
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
