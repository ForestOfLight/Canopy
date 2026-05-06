import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(dirname, '../..');
const buildDir = path.join(projectRoot, 'build');
const projectName = JSON.parse(fs.readFileSync(path.join(projectRoot, 'config.json'), 'utf8')).name;

function getPackVersion() {
    const content = fs.readFileSync(path.join(projectRoot, `${projectName}[BP]`, 'scripts', 'constants.js'), 'utf8');
    const match = content.match(/PACK_VERSION\s*=\s*['"]([^'"]+)['"]/);
    return match ? match[1] : 'unknown';
}

function main() {
    fs.mkdirSync(buildDir, { recursive: true });

    const version = getPackVersion();
    const outputPath = path.join(buildDir, `${projectName}-v${version}.mcaddon`);

    if (fs.existsSync(outputPath))
        fs.unlinkSync(outputPath);

    fs.renameSync('BP', `${projectName}[BP]`);
    fs.renameSync('RP', `${projectName}[RP]`);

    const licenseSrc = path.join(projectRoot, 'LICENSE');
    fs.copyFileSync(licenseSrc, path.join(`${projectName}[BP]`, 'LICENSE'));
    fs.copyFileSync(licenseSrc, path.join(`${projectName}[RP]`, 'LICENSE'));

    console.log(`[package-mcaddon] Creating ${projectName}-v${version}.mcaddon...`);
    execFileSync('zip', ['-r', outputPath, `${projectName}[BP]`, `${projectName}[RP]`], { stdio: 'inherit' });
    console.log(`[package-mcaddon] Saved to: ${outputPath}`);
}

try {
    main();
} catch (err) {
    console.error('[package-mcaddon] Error:', err.message);
    process.exit(1);
}
