import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      '@minecraft/server': `${__dirname}/__mocks__/@minecraft/server`,
      '@minecraft/server-ui': `${__dirname}/__mocks__/@minecraft/server-ui`,
    }
  },
  test: {
    setupFiles: ['./vitest.setup.js'],
    env: {
      NODE_ENV: 'test'
    },
    exclude: ['**/node_modules/**', 'docs/scripts/**']
  }
});