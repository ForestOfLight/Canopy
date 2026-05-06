import fs from 'fs';

const GITHUB_API = 'https://api.github.com/repos/Mojang/bedrock-samples';
const RAW_BASE = 'https://raw.githubusercontent.com/Mojang/bedrock-samples';

function stripJsonComments(text) {
    return text
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/[^\n]*/g, '');
}

async function githubFetch(url) {
    const res = await fetch(url, {
        headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'regolith-update-mob-data-filter'
        }
    });
    if (!res.ok) {
        const msg = await res.text();
        throw new Error(`GitHub API ${res.status} for ${url}: ${msg}`);
    }
    return res.json();
}

async function getLatestStableTag() {
    const tags = await githubFetch(`${GITHUB_API}/tags?per_page=20`);
    const stable = tags.find(t => !t.name.includes('preview'));
    if (!stable) throw new Error('No stable tag found in first 20 tags');
    return stable.name;
}

async function walkDir(dirPath, ref) {
    const results = [];
    const items = await githubFetch(`${GITHUB_API}/contents/${dirPath}?ref=${encodeURIComponent(ref)}`);
    for (const item of items) {
        if (item.type === 'file')
            results.push(item);
        else if (item.type === 'dir')
            results.push(...(await walkDir(item.path, ref)));
    }
    return results;
}

async function buildCategoryToMobMap(tag) {
    const files = await walkDir('behavior_pack/spawn_rules', tag);
    const map = {};

    await Promise.all(files.map(async (file) => {
        if (!file.name.endsWith('.json')) return;
        const mobName = file.name.slice(0, -5);
        const res = await fetch(`${RAW_BASE}/${tag}/behavior_pack/spawn_rules/${file.name}`);
        const text = await res.text();
        const data = JSON.parse(stripJsonComments(text));
        const category = data?.['minecraft:spawn_rules']?.description?.population_control ?? 'none';
        if (!map[category]) map[category] = [];
        map[category].push(mobName);
    }));

    for (const cat of Object.keys(map)) map[cat].sort();
    return map;
}

async function buildMeleeMobs(tag) {
    const files = await walkDir('behavior_pack/entities', tag);
    const meleeMobs = [];

    await Promise.all(files.map(async (file) => {
        if (!file.name.endsWith('.json')) return;
        const mobName = file.name.slice(0, -5);
        const res = await fetch(`${RAW_BASE}/${tag}/behavior_pack/entities/${file.name}`);
        const text = await res.text();
        if (text.includes('"minecraft:attack"'))
            meleeMobs.push(mobName);
    }));

    return meleeMobs.sort();
}

function formatMobMap(map) {
    const entries = Object.entries(map).map(([cat, mobs]) => {
        const mobList = mobs.map(m => `        '${m}'`).join(',\n');
        return `    '${cat}' : [\n${mobList}\n    ]`;
    });
    return `export const categoryToMobMap = {\n${entries.join(',\n')}\n}`;
}

function formatMeleeMobs(mobs) {
    const list = mobs.map(m => `    '${m}'`).join(',\n');
    return `export const meleeMobs = [\n${list}\n]`;
}

async function main() {
    const tag = await getLatestStableTag();
    console.log(`[update-mob-data] Using bedrock-samples tag: ${tag}`);

    const [categoryToMobMap, meleeMobs] = await Promise.all([
        buildCategoryToMobMap(tag),
        buildMeleeMobs(tag)
    ]);

    const dataPath = 'BP/scripts/include/data.js';
    let content = fs.readFileSync(dataPath, 'utf8');

    content = content.replace(
        /export const categoryToMobMap = \{[\s\S]*?\n\}/,
        formatMobMap(categoryToMobMap)
    );
    content = content.replace(
        /export const meleeMobs = \[[\s\S]*?\n\]/,
        formatMeleeMobs(meleeMobs)
    );

    fs.writeFileSync(dataPath, content, 'utf8');
    console.log(`[update-mob-data] Updated categoryToMobMap (${Object.values(categoryToMobMap).flat().length} mobs across ${Object.keys(categoryToMobMap).length} categories) and meleeMobs (${meleeMobs.length} mobs)`);
}

main().catch(err => {
    console.error('[update-mob-data] Error:', err.message);
    process.exit(1);
});
