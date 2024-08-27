import { Command } from 'lib/canopy/Canopy'
import Utils from 'stickycore/utils'

const BLOCK_COMPONENTS = ['minecraft:inventory', 'minecraft:lavaContainer', 'minecraft:piston', 'minecraft:potionContainer', 'minecraft:record_player',
    'minecraft:sign', 'minecraft:snowContainer', 'minecraft:waterContainer'];

new Command({
    name: 'data',
    description: 'Displays information about the block or entity you are looking at.',
    usage: 'data',
    callback: dataCommand
});

function dataCommand(sender) {
    let blockRayResult;
    let entityRayResult
    let block;
    let entity;
    let output;

    blockRayResult = sender.getBlockFromViewDirection({ includeLiquidBlocks: true, includePassableBlocks: true, maxDistance: 7 });
    entityRayResult = sender.getEntitiesFromViewDirection({ ignoreBlockCollision: false, includeLiquidBlocks: false, includePassableBlocks: true, maxDistance: 7 });
    block = blockRayResult?.block;
    entity = entityRayResult[0]?.entity;
    if (!block && !entity) return sender.sendMessage('§cNo target found.');

    if (entity) output = formatEntityOutput(entity);
    else if (block) output = formatBlockOutput(block);
    sender.sendMessage(output);
}

function formatBlockOutput(block) {
    let output = '';
    let dimensionId = block.dimension.id.replace('minecraft:', '');
    let properties = formatProperties(block);
    let states = JSON.stringify(block.permutation.getAllStates());
    let components = formatComponents(block, tryGetBlockComponents(block));
    let tags = JSON.stringify(block.getTags());

    output += `§l§a${Utils.parseName(block)}§r: ${Utils.stringifyLocation(block.location, 0)}, ${dimensionId}\n`;
    output += `§aProperties:§r ${properties}\n`;
    output += `§aStates:§r ${states}\n`;
    output += `§aComponents:§r ${components}\n`;
    output += `§aTags:§r ${tags}\n`;

    return output;
}

function formatEntityOutput(entity) {
    let output = '';
    let nameTag = entity.nameTag ? `(${entity.nameTag})` : '';
    let dimensionId = entity.dimension.id.replace('minecraft:', '');
    let properties = formatProperties(entity);
    let components = formatComponents(entity, entity.getComponents());
    let rotation = entity.getRotation();
    let headLocationStr = entity.getHeadLocation() ? Utils.stringifyLocation(entity.getHeadLocation(), 2) : 'none';
    let velocityStr = entity.getVelocity() ? Utils.stringifyLocation(entity.getVelocity(), 3) : 'none';
    let viewDirectionStr = entity.getViewDirection() ? Utils.stringifyLocation(entity.getViewDirection(), 2) : 'none';

    output += `§l§a${Utils.parseName(entity)}${nameTag}§r: §2id:${entity.id}§r, ${Utils.stringifyLocation(entity.location, 2)}, ${dimensionId}\n`;
    output += `§aProperties:§r ${properties}\n`;
    output += `§aComponents:§r ${components}\n`;
    output += `§aDynamicProperties:§r ${JSON.stringify(entity.getDynamicPropertyIds())} total byte count: ${entity.getDynamicPropertyTotalByteCount()}\n`;
    output += `§aEffects:§r ${JSON.stringify(entity.getEffects())}\n`;
    output += `§aTags:§r ${JSON.stringify(entity.getTags())}\n`;
    output += `§aOther:§r head location: ${headLocationStr} rotation: [${rotation.x.toFixed(2)}, ${rotation.y.toFixed(2)}], velocity: ${velocityStr}, view direction: ${viewDirectionStr}\n`;
    
    return output;
}

function formatProperties(target) {
    let output = '';

    for (let key in target) {
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
    }

    return output.slice(0, -2);
}

function tryGetBlockComponents(target) {
    let components = [];
    
    for (const componentType of BLOCK_COMPONENTS) {
        try {
            const component = target.getComponent(componentType);
            if (component) components.push(component);
        } catch(error) {
            console.warn(error.message);
        }
    }

    return components;
}

function formatComponents(target, components) {
    if (components.length === 0) 
        return 'none';
    let output = '';
    for (const component of components) {
        output += formatComponent(target, component);
    }
    return output;
}

function formatComponent(target, component) {
    let output = '';
    for (let key in component) {
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
    }
    output = output.slice(0, -2);
    return `\n  §7>§f ${component.typeId}§7 - {${output}}`;
}

function formatObject(target, object) {
    let output = '';
    for (let key in object) {
        if (typeof object[key] === 'function') continue;
        let value = object[key];
        if (typeof value === 'object') {
            formatObject(target, value);
        }
        output += `${key}=${JSON.stringify(value)}, `;
    }
    output = output.slice(0, -2);
    return `{${output}}`;
}
