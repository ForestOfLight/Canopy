import { Command } from "../../lib/canopy/Canopy";
import { world } from "@minecraft/server";
import { parseName, stringifyLocation } from "../../include/utils";

const BLOCK_COMPONENTS = ['minecraft:inventory', 'minecraft:lavaContainer', 'minecraft:piston', 'minecraft:potionContainer', 'minecraft:record_player',
    'minecraft:sign', 'minecraft:snowContainer', 'minecraft:waterContainer'];

new Command({
    name: 'data',
    description: { translate: 'commands.data' },
    usage: 'data [id]',
    args: [
        { type: 'number', name: 'id' }
    ],
    callback: dataCommand
});

function dataCommand(sender, args) {
    const targetId = args.id;
    let message;
    if (targetId === null) 
        message = getTargetedMessage(sender);
    else 
        message = getIdentifierMessage(targetId);
    sender.sendMessage(message);
}

function getTargetedMessage(sender) {
    const blockRayResult = sender.getBlockFromViewDirection({ includeLiquidBlocks: true, includePassableBlocks: true, maxDistance: 7 });
    const entityRayResult = sender.getEntitiesFromViewDirection({ ignoreBlockCollision: false, includeLiquidBlocks: false, includePassableBlocks: true, maxDistance: 7 });
    const block = blockRayResult?.block;
    const entity = entityRayResult[0]?.entity;
    if (!block && !entity)
        return sender.sendMessage({ translate: 'generic.target.notfound' });

    if (entity)
        return formatEntityOutput(entity);
    else if (block)
        return formatBlockOutput(block);
}

function getIdentifierMessage(targetId) {
    const entity = world.getEntity(String(targetId));
    if (entity)
        return formatEntityOutput(entity);
    return { translate: 'commands.data.notarget.id', with: [targetId] };
}

function formatBlockOutput(block) {
    const dimensionId = block.dimension.id.replace('minecraft:', '');
    const properties = formatProperties(block);
    const states = JSON.stringify(block.permutation.getAllStates());
    const components = formatComponents(block, tryGetBlockComponents(block));
    const tags = JSON.stringify(block.getTags());

    const message = {
        rawtext: [
            { text: `§l§a${parseName(block)}§r: ${stringifyLocation(block.location, 0)}, ${dimensionId}\n` },
            { rawtext: [
                { translate: 'commands.data.properties', with: [properties] }, { text: '\n' },
                { translate: 'commands.data.states', with: [states] }, { text: '\n' },
                { translate: 'commands.data.components', with: [components] }, { text: '\n' },
                { translate: 'commands.data.tags', with: [tags] }, { text: '\n' }
            ]}
        ]
    };

    return message;
}

function formatEntityOutput(entity) {
    const nameTag = entity.nameTag ? `(${entity.nameTag})` : '';
    const dimensionId = entity.dimension.id.replace('minecraft:', '');
    const properties = formatProperties(entity);
    const components = formatComponents(entity, entity.getComponents());
    const dynamicProperties = JSON.stringify(entity.getDynamicPropertyIds());
    const effects = JSON.stringify(entity.getEffects());
    const tags = JSON.stringify(entity.getTags());
    const headLocationStr = entity.getHeadLocation() ? stringifyLocation(entity.getHeadLocation(), 2) : 'none';
    const rotation = entity.getRotation();
    const velocityStr = entity.getVelocity() ? stringifyLocation(entity.getVelocity(), 3) : 'none';
    const viewDirectionStr = entity.getViewDirection() ? stringifyLocation(entity.getViewDirection(), 2) : 'none';
    
    const message = {
        rawtext: [
            { text: `§l§a${parseName(entity)}${nameTag}§r: §2id:${entity.id}§r, ${stringifyLocation(entity.location, 2)}, ${dimensionId}\n` },
            { rawtext: [
                { translate: 'commands.data.properties', with: [properties] }, { text: '\n' },
                { translate: 'commands.data.components', with: [components] }, { text: '\n' },
                { translate: 'commands.data.dynamicProperties', with: [dynamicProperties, entity.getDynamicPropertyTotalByteCount().toString()] }, { text: '\n' },
                { translate: 'commands.data.effects', with: [effects] }, { text: '\n' },
                { translate: 'commands.data.tags', with: [tags] }, { text: '\n' },
                { translate: 'commands.data.other', with: [headLocationStr, rotation.x.toFixed(2), rotation.y.toFixed(2), velocityStr, viewDirectionStr] }, { text: '\n' }
            ]}
        ]
    }
    return message;
}

function formatProperties(target) {
    let output = '';

    for (const key in target) {
        try {
            let value = target[key];
            if (typeof value === 'function') 
                continue;
            else if (target === value)
                value = 'this';
            else if (typeof value === 'object')
                value = formatObject(target, value);
            else 
                value = JSON.stringify(value);
            output += `§7${key}=§b${value}§7, `;
        } catch(error) {
            console.warn(error);
        }
    }

    return output.slice(0, -2);
}

function tryGetBlockComponents(target) {
    const components = [];
    
    for (const componentType of BLOCK_COMPONENTS) {
        try {
            const component = target.getComponent(componentType);
            if (component) components.push(component);
        } catch(error) {
            console.warn(error);
        }
    }

    return components;
}

function formatComponents(target, components) {
    if (components.length === 0) 
        return 'none';
    let output = '';
    for (const component of components) 
        output += formatComponent(target, component);
    
    return output;
}

function formatComponent(target, component) {
    let output = '';
    for (const key in component) {
        try {
            let value = component[key];
            if (typeof value === 'function')
                continue;
            else if (target === value) 
                value = 'this';
            else if (typeof value === 'object')
                value = formatObject(target, value);
            else 
                value = JSON.stringify(value);
            output += `${key}=§b${value}§7, `;
        } catch(error) {
            console.warn(error);
        }
    }
    output = output.slice(0, -2);
    return `\n  §7>§f ${component.typeId}§7 - {${output}}`;
}

function formatObject(target, object) {
    let output = '';
    for (const key in object) {
        try {
            if (typeof object[key] === 'function') continue;
            let value = object[key];
            if (target === value)
                value = 'this';
            else if (typeof value === 'object')
                formatObject(target, value);
            
            output += `${key}=${JSON.stringify(value)}, `;
        } catch(error) {
            console.warn(error);
        }
    }
    output = output.slice(0, -2);
    return `{${output}}`;
}
