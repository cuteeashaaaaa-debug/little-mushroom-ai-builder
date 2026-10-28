import { defineConfig } from '@playwright/test';

const chromePath = process.env.CHROME_PATH ?? (process.platform === 'win32' ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : undefined);
const repositoryName = process.env.GITHUB_ACTIONS && process.env.GITHUB_REPOSITORY ? process.env.GITHUB_REPOSITORY.split('/')[1] : undefined;
const basePath = repositoryName ? `/${repositoryName}/` : '/';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  reporter: 'list',
  timeout: 30_000,
  use: {
    baseURL: `http://127.0.0.1:5173${basePath}`,
    browserName: 'chromium',
    headless: true,
    launchOptions: chromePath ? { executablePath: chromePath } : {},
    viewport: { width: 1366, height: 768 },
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1',
    url: `http://127.0.0.1:5173${basePath}`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
