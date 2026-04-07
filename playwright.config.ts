import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  workers: 1,
  fullyParallel: false,
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    viewport: { width: 390, height: 844 },
    screenshot: 'on',
  },
  projects: [
    {
      name: 'iphone',
      use: { viewport: { width: 390, height: 844 } },
    },
    {
      name: 'ipad',
      use: { viewport: { width: 820, height: 1180 } },
    },
  ],
  reporter: [['list']],
});
