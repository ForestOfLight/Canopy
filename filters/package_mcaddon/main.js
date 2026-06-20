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

    const bpInBuild = path.join(buildDir, 'BP');
    const rpInBuild = path.join(buildDir, 'RP');
    const renamedBPInBuild = path.join(buildDir, `${projectName}[BP]`);
    const renamedRPInBuild = path.join(buildDir, `${projectName}[RP]`);

    fs.rmSync(bpInBuild, { recursive: true, force: true });
    fs.rmSync(rpInBuild, { recursive: true, force: true });
    fs.rmSync(renamedBPInBuild, { recursive: true, force: true });
    fs.rmSync(renamedRPInBuild, { recursive: true, force: true });

    fs.renameSync('BP', bpInBuild);
    fs.renameSync('RP', rpInBuild);
    fs.renameSync(bpInBuild, renamedBPInBuild);
    fs.renameSync(rpInBuild, renamedRPInBuild);

    const licenseSrc = path.join(projectRoot, 'LICENSE');
    fs.copyFileSync(licenseSrc, path.join(renamedBPInBuild, 'LICENSE'));
    fs.copyFileSync(licenseSrc, path.join(renamedRPInBuild, 'LICENSE'));

    console.log(`[package-mcaddon] Creating ${projectName}-v${version}.mcaddon...`);
    execFileSync('zip', ['-r', outputPath, `${projectName}[BP]`, `${projectName}[RP]`], {
        stdio: 'inherit',
        cwd: buildDir
    });

    fs.rmSync(renamedBPInBuild, { recursive: true, force: true });
    fs.rmSync(renamedRPInBuild, { recursive: true, force: true });

    console.log(`[package-mcaddon] Saved to: ${outputPath}`);
}

try {
    main();
} catch (err) {
    console.error('[package-mcaddon] Error:', err.message);
    process.exit(1);
}
