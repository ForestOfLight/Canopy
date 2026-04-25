import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@minecraft/server': `${__dirname}/__mocks__/@minecraft/server`,
      '@minecraft/server-ui': `${__dirname}/__mocks__/@minecraft/server-ui`,
    }
  },
  test: {
    env: {
      NODE_ENV: 'test'
    },
    include: ['__tests__/**/*.test.js']
  }
});
