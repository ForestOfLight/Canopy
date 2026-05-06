import { describe, it } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

describe('Wiki generator', () => {
    it('generates wiki pages', { timeout: 60000 }, async () => {
        const wikiPath = process.env.WIKI_PATH;
        if (!wikiPath)
            throw new Error('WIKI_PATH argument is required.\nUsage: npm run generate-wiki <path-to-Canopy.wiki> ');

        const currPath = fileURLToPath(new URL('.', import.meta.url));
        const resolvedWikiPath = path.resolve(currPath, wikiPath);

        const { main } = await import('./generate-wiki.js');
        await main(resolvedWikiPath);
    });
});
