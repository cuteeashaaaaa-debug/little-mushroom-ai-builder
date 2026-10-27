import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1];
export default defineConfig({ plugins: [react()], base: process.env.GITHUB_ACTIONS && repoName ? `/${repoName}/` : '/', test: { environment: 'jsdom', setupFiles: './src/test/setup.ts' } });
