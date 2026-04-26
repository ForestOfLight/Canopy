import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@minecraft/server': `@forestoflight/minecraft-vitest-mocks/server`,
      '@minecraft/server-ui': `@forestoflight/minecraft-vitest-mocks/server-ui`,
      '@minecraft/debug-utilities': `@forestoflight/minecraft-vitest-mocks/debug-utilities`
    },
    setupFiles: ['@forestoflight/minecraft-vitest-mocks/setup']
  },
  test: {
    env: {
      NODE_ENV: 'test'
    },
    include: ['__tests__/**/*.test.js']
  }
});
