import { Command } from 'lib/canopy/Canopy'
import Utils from 'stickycore/utils'

const BLOCK_COMPONENTS = ['minecraft:inventory', 'minecraft:lavaContainer', 'minecraft:piston', 'minecraft:potionContainer', 'minecraft:record_player',
    'minecraft:sign', 'minecraft:snowContainer', 'minecraft:waterContainer'];

new Command({
    name: 'data',
    description: 'Get data about the target block or entity you are looking at.',
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
    let properties = `isAir=${block.isAir}, isLiquid=${block.isLiquid}, isSolid=${block.isSolid}, isWaterlogged=${block.isWaterlogged}, canBeWaterlogged=${block.type.canBeWaterlogged}`;
    let states = JSON.stringify(block.permutation.getAllStates());
    let components = tryGetComponents(block, BLOCK_COMPONENTS);
    let tags = JSON.stringify(block.getTags());

    output += `§l§a${Utils.parseName(block)}§r: ${Utils.stringifyLocation(block.location, 0)}, ${dimensionId}\n`;
    output += `§aProperties:§r ${properties}\n`;
    output += `§aStates:§r ${states}\n`;
    output += `§aComponents:§r ${components}\n`;
    output += `§aTags:§r ${tags}\n`;

    return output;
}

function tryGetComponents(target, componentList) {
    let components = [];
    let component;
    let output = '';

    for (let i = 0; i < componentList.length; i++) {
        try {
            component = target.getComponent(componentList[i]);
            if (component) components.push(componentList[i]);
        } catch(error) {
            console.warn(error.message);
        }
    }
    output = JSON.stringify(components);
    if (output === '') output = '[]';
    return output;
}

function formatEntityOutput(entity) {
    let output = '';
    let nameTag = entity.nameTag ? `(${entity.nameTag})` : '';
    let dimensionId = entity.dimension.id.replace('minecraft:', '');
    let properties = `isClimbing=${entity.isClimbing}, isFalling=${entity.isFalling}, isInWater=${entity.isInWater}, isOnGround=${entity.isOnGround}, isSleeping=${entity.isSleeping}, isSneaking=${entity.isSneaking}, isSprinting=${entity.isSprinting}, isSwimming=${entity.isSwimming}, target=${entity.target?.id || 'none'}`;
    let rotation = entity.getRotation();
    let headLocationStr = entity.getHeadLocation() ? Utils.stringifyLocation(entity.getHeadLocation(), 2) : 'none';
    let velocityStr = entity.getVelocity() ? Utils.stringifyLocation(entity.getVelocity(), 3) : 'none';
    let viewDirectionStr = entity.getViewDirection() ? Utils.stringifyLocation(entity.getViewDirection(), 2) : 'none';

    output += `§l§a${Utils.parseName(entity)}${nameTag}§r: §2id:${entity.id}§r, ${Utils.stringifyLocation(entity.location, 2)}, ${dimensionId}\n`;
    output += `§aProperties:§r ${properties}\n`;
    output += `§aComponents:§r ${JSON.stringify(entity.getComponents())}\n`;
    output += `§aDynamicProperties:§r ${JSON.stringify(entity.getDynamicPropertyIds())} total byte count: ${entity.getDynamicPropertyTotalByteCount()}\n`;
    output += `§aEffects:§r ${JSON.stringify(entity.getEffects())}\n`;
    output += `§aTags:§r ${JSON.stringify(entity.getTags())}\n`;
    output += `§aOther:§r head location: ${headLocationStr} rotation: [${rotation.x.toFixed(2)}, ${rotation.y.toFixed(2)}], velocity: ${velocityStr}, view direction: ${viewDirectionStr}\n`;
    
    return output;
}