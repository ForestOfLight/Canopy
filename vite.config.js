import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    deps: {
      external: ['@minecraft/server', '@minecraft/server-ui'],
    }
  },
  resolve: {
    alias: {
      '@minecraft/server': `__mocks__/@minecraft/server`,
      '@minecraft/server-ui': `__mocks__/@minecraft/server-ui`,
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