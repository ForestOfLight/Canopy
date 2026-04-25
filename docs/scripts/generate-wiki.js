import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const projectRoot = path.resolve(__dirname, '../../');

function parseLangFile(langPath) {
    const content = fs.readFileSync(langPath, 'utf8');
    const map = {};
    for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx === -1) continue;
        map[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
    }
    return map;
}

function resolveDescription(desc, lang) {
    if (!desc) return '';
    if (typeof desc === 'string') return lang[desc] ?? desc;
    if (desc.translate) return lang[desc.translate] ?? desc.translate;
    if (desc.text) return desc.text;
    return '';
}

const PARAM_TYPE_DISPLAY = {
    Boolean: 'bool',
    Enum: null,      // replaced by enum values inline
    Float: 'float',
    Integer: 'int',
    Location: 'x y z',
    String: 'string',
    EntitySelector: 'entity',
    EntityType: 'entityType',
    BlockType: 'blockType',
};

function buildParamDisplay(param, enums) {
    if (param.type === 'Enum') {
        const enumDef = enums?.find(e => e.name === param.name);
        return enumDef ? enumDef.values.join('/') : param.name;
    }
    return PARAM_TYPE_DISPLAY[param.type] ?? param.name;
}

function buildVanillaCommandBlock(cmd, lang) {
    const cc = cmd.customCommand;
    const cmdName = cmd.getName();
    const sub = cmd.getSubCommandWikiDescription();
    const isOp = cc.permissionLevel && cc.permissionLevel !== 'Any';
    const opSuffix = isOp ? ' Requires OP.' : '';

    if (Object.keys(sub).length === 0) {
        // Plain command — build single usage string
        const parts = [`/${cmdName}`];
        for (const p of (cc.mandatoryParameters || [])) {
            const display = buildParamDisplay(p, cc.enums);
            const label = p.name.replace(/^[^:]+:/, '');
            parts.push(`<${label}: ${display}>`);
        }
        for (const p of (cc.optionalParameters || [])) {
            const display = buildParamDisplay(p, cc.enums);
            const label = p.name.replace(/^[^:]+:/, '');
            parts.push(`[${label}: ${display}]`);
        }
        const desc = cc.wikiDescription ?? resolveDescription(cc.description, lang);
        return `**Usage: \`${parts.join(' ')}\`**  \n${desc}${opSuffix}`;
    }

    // Sub-command style — one block per enum value
    const remainingMandatory = (cc.mandatoryParameters || []).slice(1);
    const blocks = [];
    for (const [enumVal, info] of Object.entries(sub)) {
        const selectedOptional = (info.params || []).map(pName =>
            (cc.optionalParameters || []).find(p =>
                p.name === pName || p.name.endsWith(`:${pName}`)
            )
        ).filter(Boolean);
        const usageParts = [`/${cmdName}`, enumVal];
        for (const p of remainingMandatory) {
            const display = buildParamDisplay(p, cc.enums);
            const label = p.name.replace(/^[^:]+:/, '');
            usageParts.push(`<${label}: ${display}>`);
        }
        for (const p of selectedOptional) {
            const display = buildParamDisplay(p, cc.enums);
            const label = p.name.replace(/^[^:]+:/, '');
            usageParts.push(`[${label}: ${display}]`);
        }
        blocks.push(`**Usage: \`${usageParts.join(' ')}\`**  \n${info.description}${opSuffix}`);
    }
    return blocks.join('\n\n');
}

function buildCommandBlock(cmd, lang) {
    const isOp = cmd.isOpOnly();
    const opSuffix = isOp ? ' Requires OP.' : '';
    const entries = cmd.getHelpEntries();

    if (entries.length === 0) {
        const usage = cmd.getUsage();
        const desc = cmd.getWikiDescription() ?? resolveDescription(cmd.getDescription(), lang);
        return `**Usage: \`${usage}\`**  \n${desc}${opSuffix}`;
    }

    return entries.map(e => {
        const prefix = cmd.getUsage().startsWith('/') ? '/' : './';
        const usage = `${prefix}${e.usage}`;
        const desc = e.wikiDescription ?? resolveDescription(e.description, lang);
        return `**Usage: \`${usage}\`**  \n${desc}${opSuffix}`;
    }).join('\n\n');
}

function buildRuleEntry(rule, lang) {
    const id = rule.getID();
    const desc = rule.getWikiDescription()
        ?? lang[`rules.${id}`]
        ?? lang[`rules.infoDisplay.${id}`]
        ?? lang[`rules.infodisplay.${id}`];
    if (!desc) process.stderr.write(`[wiki-gen] No description found for rule: ${id}\n`);
    const type = rule.getType();
    const defaultVal = rule.getDefaultValue();
    const suggested = rule.getSuggestedOptions();

    let entry = `## ${id}\n`;
    if (desc) entry += `${desc}\n\n`;
    entry += `- Type: \`${type}\`\n`;
    entry += `- Default value: \`${defaultVal}\`\n`;
    if (suggested) entry += `- Suggested options: ${suggested.map(v => `\`${v}\``).join(', ')}\n`;
    return entry;
}

function generateRulesPage(rules, lang) {
    const sorted = [...rules].sort((a, b) => a.getID().localeCompare(b.getID()));
    const toc = sorted.map(r => `- [${r.getID()}](#${r.getID().toLowerCase()})`).join('\n');
    const entries = sorted.map(r => buildRuleEntry(r, lang)).join('\n');
    return `<p align="center">\n<img src="./logo.png" alt="pack_icon" width="150"/>\n</p>\n\n**Table of Contents:**\n${toc}\n\n---\n\n${entries}`;
}

function injectCommandsPage(template, commandMap, lang) {
    const usedKeys = new Set();
    let result = template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        usedKeys.add(key);
        const cmd = commandMap.get(key);
        if (!cmd) {
            process.stderr.write(`[wiki-gen] No command found for placeholder: {{${key}}}\n`);
            return match;
        }
        return cmd.isVanilla
            ? buildVanillaCommandBlock(cmd.instance, lang)
            : buildCommandBlock(cmd.instance, lang);
    });

    const unlisted = [...commandMap.entries()]
        .filter(([key]) => !usedKeys.has(key))
        .map(([, cmd]) => {
            const block = cmd.isVanilla
                ? buildVanillaCommandBlock(cmd.instance, lang)
                : buildCommandBlock(cmd.instance, lang);
            const name = cmd.instance.getName();
            return `### ${name}\n${block}`;
        });

    if (unlisted.length > 0) {
        result += `\n\n## Unlisted Commands\n\n${unlisted.join('\n\n')}`;
    }

    return result;
}

export async function main(wikiPath) {
    await import('../../Canopy[BP]/scripts/main.js');
    const lang = parseLangFile(path.join(projectRoot, 'Canopy[RP]/texts/en_US.lang'));
    generateRulesPages(wikiPath, lang);
    generateCommandsPage(wikiPath, lang);
}

async function generateRulesPages(wikiPath, lang) {
    const { Rules } = await import('../../Canopy[BP]/scripts/lib/canopy/rules/Rules.js');
    const { InfoDisplay } = await import('../../Canopy[BP]/scripts/src/rules/infodisplay/InfoDisplay.js');
    new InfoDisplay({ id: 'wiki-gen-mock', setDynamicProperty: () => {} });

    const allRules = Rules.rulesToRegister;
    const globalRules = allRules.filter(r => r.getCategory() === 'Rules');
    const infoDisplayRules = allRules.filter(r => r.getCategory() === 'InfoDisplay');

    fs.writeFileSync(path.join(wikiPath, 'Global-Rules.md'), generateRulesPage(globalRules, lang), 'utf8');
    fs.writeFileSync(path.join(wikiPath, 'InfoDisplay-Rules.md'), generateRulesPage(infoDisplayRules, lang), 'utf8');
    console.log('✓ Generated Global-Rules.md and InfoDisplay-Rules.md');
}

async function generateCommandsPage(wikiPath, lang) {
    const commandMap = await getCommandMap();
    const commandsTemplatePath = path.join(wikiPath, 'Commands.md');
    const template = fs.readFileSync(commandsTemplatePath, 'utf8');
    const injected = injectCommandsPage(template, commandMap, lang);
    fs.writeFileSync(commandsTemplatePath, injected, 'utf8');
    console.log('✓ Injected Commands.md');
}

async function getCommandMap() {
    const { VanillaCommands } = await import('../../Canopy[BP]/scripts/lib/canopy/commands/VanillaCommands.js');
    const { Commands } = await import('../../Canopy[BP]/scripts/lib/canopy/commands/Commands.js');

    const commandMap = new Map();
    for (const cmd of Commands.getAll()) {
        if (cmd.getExtension()) continue;
        if (cmd.isHelpHidden()) continue;
        commandMap.set(cmd.getName(), { instance: cmd, isVanilla: false });
    }
    for (const cmd of VanillaCommands.getAll()) {
        commandMap.set(cmd.getName(), { instance: cmd, isVanilla: true });
    }
    return commandMap;
}