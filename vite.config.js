import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    deps: {
      external: ['@minecraft/server']
    }
  },
  resolve: {
    alias: {
      '@minecraft/server': `__mocks__/@minecraft/server`,
    }
  },
  test: {
    testFiles: '**/__tests__/**/*.test.js',
    files: '**/__tests__/**',
    env: {
      NODE_ENV: 'test'
    }
  }
});