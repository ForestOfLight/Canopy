import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@minecraft/server': `@forestoflight/minecraft-vitest-mocks/server`,
      '@minecraft/server-ui': `@forestoflight/minecraft-vitest-mocks/server-ui`,
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
