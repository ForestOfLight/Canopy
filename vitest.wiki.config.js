import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      '@minecraft/server': `${__dirname}/__mocks__/@minecraft/server`,
      '@minecraft/server-ui': `${__dirname}/__mocks__/@minecraft/server-ui`,
      '@minecraft/debug-utilities': `${__dirname}/__mocks__/@minecraft/debug-utilities`,
      'lib/canopy/Canopy': `${__dirname}/Canopy[BP]/scripts/lib/canopy/Canopy.js`,
      'src/commands/trackevent': `${__dirname}/Canopy[BP]/scripts/src/commands/trackevent.js`,
      'src/classes/Instaminable': `${__dirname}/Canopy[BP]/scripts/src/classes/Instaminable.js`,
      'src/rules/durabilityNotifier': `${__dirname}/Canopy[BP]/scripts/src/rules/durabilityNotifier.js`,
    }
  },
  test: {
    env: {
      NODE_ENV: 'test'
    },
    include: ['docs/scripts/generate-wiki.test.js']
  }
});
