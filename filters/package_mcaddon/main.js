import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(dirname, '../..');
const buildDir = path.join(projectRoot, 'build');

function getPackVersion() {
    const content = fs.readFileSync(path.join(projectRoot, 'Canopy [BP]', 'scripts', 'constants.js'), 'utf8');
    const match = content.match(/PACK_VERSION\s*=\s*['"]([^'"]+)['"]/);
    return match ? match[1] : 'unknown';
}

function main() {
    fs.mkdirSync(buildDir, { recursive: true });

    const version = getPackVersion();
    const outputPath = path.join(buildDir, `Canopy-v${version}.mcaddon`);

    if (fs.existsSync(outputPath))
        fs.unlinkSync(outputPath);

    fs.renameSync('BP', 'Canopy[BP]');
    fs.renameSync('RP', 'Canopy[RP]');

    console.log(`[package-mcaddon] Creating Canopy-v${version}.mcaddon...`);
    execFileSync('zip', ['-r', outputPath, 'Canopy[BP]', 'Canopy[RP]'], { stdio: 'inherit' });
    console.log(`[package-mcaddon] Saved to: ${outputPath}`);
}

try {
    main();
} catch (err) {
    console.error('[package-mcaddon] Error:', err.message);
    process.exit(1);
}
