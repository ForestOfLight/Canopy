import Command from 'stickycore/command'
import Utils from 'stickycore/utils'

const BLOCK_COMPONENTS = ['minecraft:inventory', 'minecraft:lavaContainer', 'minecraft:piston', 'minecraft:potionContainer', 'minecraft:record_player',
    'minecraft:sign', 'minecraft:snowContainer', 'minecraft:waterContainer'];

new Command()
    .setName('data')
    .setCallback(dataCommand)
    .build()

function dataCommand(sender) {
    let blockRayResult;
    let block;
    let output;

    blockRayResult = sender.getBlockFromViewDirection({ includeLiquidBlocks: true, includePassableBlocks: true, maxDistance: 7 });
    block = blockRayResult?.block;
    if (!block) return sender.sendMessage('§cNo target found.');
    output = formatOutput(block);
    sender.sendMessage(output);
}

function formatOutput(target) {
    let output = '';
    let dimensionId = target.dimension.id.replace('minecraft:', '');
    let properties = `isAir=${target.isAir}, isLiquid=${target.isLiquid}, isSolid=${target.isSolid}, isWaterlogged=${target.isWaterlogged}, canBeWaterlogged=${target.type.canBeWaterlogged}`;
    let states = JSON.stringify(target.permutation.getAllStates());
    let components = tryGetComponents(target, BLOCK_COMPONENTS);
    let tags = JSON.stringify(target.getTags());

    output += `§l§a${Utils.parseName(target)}§r: ${Utils.stringifyLocation(target.location, 0)}, ${dimensionId}\n`;
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