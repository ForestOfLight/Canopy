import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      '@minecraft/server': `${__dirname}/__mocks__/@minecraft/server`,
      '@minecraft/server-ui': `${__dirname}/__mocks__/@minecraft/server-ui`,
      '@minecraft/server-gametest': `${__dirname}/__mocks__/@minecraft/server-gametest`,
    }
  },
  test: {
    setupFiles: ['./vitest.setup.js'],
    env: {
      NODE_ENV: 'test'
    },
    include: ['__tests__/**/*.test.js']
  }
});