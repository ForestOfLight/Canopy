import { VanillaCommand } from "../../lib/canopy/Canopy";
import { BlockComponentTypes, CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus, Player } from "@minecraft/server";
import { getColoredDimensionName, stringifyLocation } from "../../include/utils";

const TARGET_DISTANCE = 100;

new VanillaCommand({
    name: 'canopy:data',
    description: 'commands.data',
    optionalParameters: [{ name: 'entity', type: CustomCommandParamType.EntitySelector }],
    permissionLevel: CommandPermissionLevel.Any,
    callback: dataCommand
});

function dataCommand(source, entity) {
    if (!(source instanceof Player))
        return { status: CustomCommandStatus.Failure, message: 'commands.generic.invalidsource' };
    let message = [];
    if (!entity) {
        message = getTargetedMessage(source);
    } else if (entity.length > 0) {
        entity.forEach((currEntity) => {
            message.push(formatEntityOutput(currEntity));
        });
    } else {
        message = { translate: 'generic.target.notfound' };
    }
    source.sendMessage(message);
}

function getTargetedMessage(sender) {
    const blockRayResult = sender.getBlockFromViewDirection({ includeLiquidBlocks: true, includePassableBlocks: true, maxDistance: TARGET_DISTANCE });
    const entityRayResult = sender.getEntitiesFromViewDirection({ ignoreBlockCollision: false, includeLiquidBlocks: false, includePassableBlocks: true, maxDistance: TARGET_DISTANCE });
    const block = blockRayResult?.block;
    const entity = entityRayResult[0]?.entity;
    if (!block && !entity)
        return { translate: 'generic.target.notfound' };

    if (entity)
        return formatEntityOutput(entity);
    else if (block)
        return formatBlockOutput(block);
}

function formatBlockOutput(block) {
    const dimensionId = block.dimension.id.replace('minecraft:', '');
    const properties = formatProperties(block);
    const states = JSON.stringify(block.permutation.getAllStates());
    const components = formatComponents(block, tryGetBlockComponents(block));
    const tags = JSON.stringify(block.getTags());

    const message = {
        rawtext: [
            { text: `§l§a${block.typeId}§r: ${stringifyLocation(block.location, 0)}, ${getColoredDimensionName(dimensionId)}\n` },
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
    const nameTag = entity.nameTag ? `§r§a(§o${entity.nameTag}§r§a)` : '';
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
            { text: `§l§a${entity.typeId}${nameTag}§r: §2id:${entity.id}§r, ${stringifyLocation(entity.location, 2)}, ${getColoredDimensionName(dimensionId)}\n` },
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
    for (const componentType of Object.values(BlockComponentTypes)) {
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
