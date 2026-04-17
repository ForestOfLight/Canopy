import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(dirname, '../..');
const settings = JSON.parse(process.env.FILTER_SETTINGS || '{}');

function bumpVersion(versionStr, type) {
    const parts = versionStr.split('.').map(Number);
    if (type === 'major') { parts[0]++; parts[1] = 0; parts[2] = 0; }
    else if (type === 'minor') { parts[1]++; parts[2] = 0; }
    else { parts[2]++; }
    return parts.join('.');
}

function versionToArray(versionStr) {
    return versionStr.split('.').map(Number);
}

function getCurrentVersion() {
    const content = fs.readFileSync(
        path.join(projectRoot, 'Canopy [BP]', 'scripts', 'constants.js'), 'utf8'
    );
    const match = content.match(/PACK_VERSION\s*=\s*['"]([^'"]+)['"]/);
    if (!match) throw new Error('Could not find PACK_VERSION in constants.js');
    return match[1];
}

function updateConstants(filePath, newVersion) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(
        /(PACK_VERSION\s*=\s*['"])[^'"]+(['"])/,
        `$1${newVersion}$2`
    );
    fs.writeFileSync(filePath, content, 'utf8');
}

function detectIndent(content) {
    const match = content.match(/^[ \t]+/m);
    return match ? match[0] : '  ';
}

function updateManifest(filePath, newVersion) {
    const content = fs.readFileSync(filePath, 'utf8');
    const indent = detectIndent(content);
    const data = JSON.parse(content);
    const versionArray = versionToArray(newVersion);

    data.header.name = data.header.name.replace(/v[\d.]+/, `v${newVersion}`);
    data.header.version = versionArray;

    for (const dep of (data.dependencies || [])) {
        if (Array.isArray(dep.version))
            dep.version = versionArray;
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, indent) + '\n', 'utf8');
}

function promptBumpType(currentVersion) {
    return new Promise((resolve, reject) => {
        const patch = bumpVersion(currentVersion, 'patch');
        const minor = bumpVersion(currentVersion, 'minor');
        const major = bumpVersion(currentVersion, 'major');

        const ttyInput = fs.createReadStream('/dev/tty');
        const ttyOutput = fs.createWriteStream('/dev/tty');
        const rl = readline.createInterface({ input: ttyInput, output: ttyOutput });

        ttyOutput.write(`[bump-version] Current version: v${currentVersion}\n`);
        ttyOutput.write(`  1) patch  v${currentVersion} → v${patch}\n`);
        ttyOutput.write(`  2) minor  v${currentVersion} → v${minor}\n`);
        ttyOutput.write(`  3) major  v${currentVersion} → v${major}\n`);

        rl.question('Select bump type [1-3] (default: 1): ', (answer) => {
            rl.close();
            ttyInput.destroy();
            const choice = answer.trim() || '1';
            if (choice === '2') resolve('minor');
            else if (choice === '3') resolve('major');
            else resolve('patch');
        });

        ttyInput.on('error', reject);
    });
}

async function main() {
    const currentVersion = getCurrentVersion();

    let bumpType;
    try {
        bumpType = await promptBumpType(currentVersion);
    } catch {
        bumpType = settings.bumpType || 'patch';
    }

    const newVersion = bumpVersion(currentVersion, bumpType);
    console.log(`[bump-version] ${currentVersion} → ${newVersion}`);

    updateConstants(path.join(projectRoot, 'Canopy [BP]', 'scripts', 'constants.js'), newVersion);
    updateManifest(path.join(projectRoot, 'Canopy [BP]', 'manifest.json'), newVersion);
    updateManifest(path.join(projectRoot, 'Canopy [RP]', 'manifest.json'), newVersion);

    updateConstants('BP/scripts/constants.js', newVersion);
    updateManifest('BP/manifest.json', newVersion);
    updateManifest('RP/manifest.json', newVersion);

    console.log(`[bump-version] Updated to v${newVersion}`);
}

main().catch(err => {
    console.error('[bump-version] Error:', err.message);
    process.exit(1);
});
