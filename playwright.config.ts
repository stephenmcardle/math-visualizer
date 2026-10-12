import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;

/**
 * End-to-end smoke tests against the production build in out/. Run
 * `npm run build` first; `npm run test:e2e` starts the static server itself.
 */
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["github"]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // CI runners have no GPU; SwiftShader gives Pixi and Three.js a software WebGL.
        launchOptions: { args: ["--enable-unsafe-swiftshader", "--use-angle=swiftshader"] },
      },
    },
  ],
  webServer: {
    command: "node e2e/static-server.mjs",
    url: `http://localhost:${PORT}`,
    env: { PORT: String(PORT) },
    reuseExistingServer: !process.env.CI,
  },
});
