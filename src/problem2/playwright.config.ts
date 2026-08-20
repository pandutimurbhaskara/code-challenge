import { defineConfig, devices } from '@playwright/test'

// Local-only end-to-end run: drives the app in a real browser and saves
// screenshots to e2e/screenshots. Intentionally kept out of CI.
export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/.output',
  reporter: [['list'], ['html', { outputFolder: 'e2e/report', open: 'never' }]],
  use: {
    baseURL: 'http://localhost:5173',
    viewport: { width: 1280, height: 900 },
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
