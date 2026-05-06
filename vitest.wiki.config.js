import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    fs: {
      strict: false
    }
  },
  resolve: {
    alias: {
      '@minecraft/server': `@forestoflight/minecraft-vitest-mocks/server`,
      '@minecraft/server-ui': `@forestoflight/minecraft-vitest-mocks/server-ui`,
      '@minecraft/debug-utilities': `@forestoflight/minecraft-vitest-mocks/debug-utilities`,
      'lib/canopy/Canopy': `${__dirname}/Canopy[BP]/scripts/lib/canopy/Canopy.js`,
      'src/commands/trackevent': `${__dirname}/Canopy[BP]/scripts/src/commands/trackevent.js`,
      'src/classes/Instaminable': `${__dirname}/Canopy[BP]/scripts/src/classes/Instaminable.js`,
      'src/rules/durabilityNotifier': `${__dirname}/Canopy[BP]/scripts/src/rules/durabilityNotifier.js`,
    },
  },
  test: {
    env: {
      NODE_ENV: 'test'
    },
    include: ['docs/scripts/generate-wiki.test.js'],
    setupFiles: ['@forestoflight/minecraft-vitest-mocks/setup'],
    server: {
      deps: {
        inline: ['@forestoflight/minecraft-vitest-mocks']
      }
    },
  }
});
