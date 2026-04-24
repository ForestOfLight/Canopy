import { describe, it } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// This file is the entry point for wiki generation. Run via:
//   WIKI_PATH=../Canopy.wiki npm run generate-wiki
//
// Vitest's Vite aliases automatically resolve @minecraft/server to the mock,
// allowing Canopy source files to be imported in Node.js context.

describe('Wiki generator', () => {
    it('generates wiki pages', { timeout: 60000 }, async () => {
        const wikiPath = process.env.WIKI_PATH;
        if (!wikiPath) throw new Error('WIKI_PATH environment variable is required.\nUsage: WIKI_PATH=../Canopy.wiki npm run generate-wiki');

        const __dirname = fileURLToPath(new URL('.', import.meta.url));
        const resolvedWikiPath = path.resolve(__dirname, wikiPath);

        const { main } = await import('./generate-wiki.js');
        await main(resolvedWikiPath);
    });
});
