import fs from 'fs';
import path from 'path';

export const manifestPathBP = path.resolve('Canopy [BP]/manifest.json');
export const manifestPathRP = path.resolve('Canopy [RP]/manifest.json');

export function getCanopyVersion() {
    const manifestContent = fs.readFileSync(manifestPathBP, 'utf-8');
    const content = JSON.parse(manifestContent);
    const version = content.header.version;
    return `${version[0]}.${version[1]}.${version[2]}`;
}

export function getMinecraftVersion() {
    const manifestContent = fs.readFileSync(manifestPathBP, 'utf-8');
    const content = JSON.parse(manifestContent);
    const versionList = content.header.min_engine_version;
    return `${versionList[0]}.${versionList[1]}.${versionList[2]}.${versionList[3]}`;
}