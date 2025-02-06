import { describe, it, expect, beforeAll } from "vitest";
import fs from "fs";
import path from 'path';
import { PACK_VERSION, MC_VERSION } from "../Canopy [BP]/scripts/constants";

const manifestPathBP = path.resolve('Canopy [BP]/manifest.json');
const manifestPathRP = path.resolve('Canopy [RP]/manifest.json');

function getManifestObject(manifestPath) {
    const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
    return JSON.parse(manifestContent);
}

function getCanopyManifestVersion() {
    const manifestContent = fs.readFileSync(manifestPathBP, 'utf-8');
    const content = JSON.parse(manifestContent);
    const version = content.header.version;
    return `${version[0]}.${version[1]}.${version[2]}`;
}

describe('Manifests', () => {
    describe('BP', () => {
        let manifestContentBP;
        let packVersion;
        let mcVersion;
        beforeAll(() => {
            manifestContentBP = getManifestObject(manifestPathBP);
            packVersion = PACK_VERSION.split('.').map(Number);
            mcVersion = MC_VERSION.split('.').map(Number);
        });

        it('should include version number in its name', () => {
            expect(manifestContentBP.header.name).toBe(`Canopy [BP] v${getCanopyManifestVersion()}`);
        });
    
        it('should match constants version number', () => {
            expect(manifestContentBP.header.version).toEqual(packVersion);
        });

        it('should match constants min_engine_version', () => {
            expect(manifestContentBP.header.min_engine_version).toEqual(mcVersion.slice(0, -1));
        });
    });

    it('RP name should include version number', () => {
        const manifestContentRP = getManifestObject(manifestPathRP);
        expect(manifestContentRP.header.name).toBe(`Canopy [RP] v${getCanopyManifestVersion()}`);
    });
});