import { describe, it, expect } from 'vitest';
import fs from 'fs';
import { getCanopyVersion, manifestPathBP, manifestPathRP } from './utils';

function getManifestObject(manifestPath) {
    const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
    return JSON.parse(manifestContent);
}

describe('Manifests', () => {
    it('BP name should include version number', () => {
        const manifestContentBP = getManifestObject(manifestPathBP);
        expect(manifestContentBP.header.name).toBe(`Canopy [BP] v${getCanopyVersion()}`);
    });

    it('RP name should include version number', () => {
        const manifestContentRP = getManifestObject(manifestPathRP);
        expect(manifestContentRP.header.name).toBe(`Canopy [RP] v${getCanopyVersion()}`);
    });
});