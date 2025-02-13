import { Rule, Command } from "../../lib/canopy/Canopy";
import { world } from "@minecraft/server";
import { isNumeric, stringifyLocation, getColoredDimensionName } from "../../include/utils";

const validDimensions = {
    'o': 'overworld',
    'overworld': 'overworld',
    'minecraft:overworld': 'overworld',
    'n': 'nether',
    'nether': 'nether',
    'minecraft:the_nether': 'nether',
    'e': 'the_end',
    'end': 'the_end',
    'the_end': 'the_end',
    'minecraft:the_end': 'the_end'
};

new Rule({
    category: 'Rules',
    identifier: 'commandChangeDimension',
    description: { translate: 'rules.commandChangeDimension' }
});

const cmd = new Command({
    name: 'dtp',
    description: { translate: 'commands.changedimension' },
    usage: 'dtp <dimension> [x y z]',
    args: [
        { type: 'string', name: 'dimension' },
        { type: 'number', name: 'x' },
        { type: 'number', name: 'y' },
        { type: 'number', name: 'z' },
    ],
    callback: changedimensionCommand,
    contingentRules: ['commandChangeDimension']
});

function changedimensionCommand(player, args) {
    const { dimension, x, y, z } = args;
    if (!dimension)
        return cmd.sendUsage(player);
    const toDimensionId = validDimensions[dimension.toLowerCase()];
    if (!toDimensionId)
        return player.sendMessage({ translate: 'commands.changedimension.notfound', with: [Object.keys(validDimensions).join(', ')] });
    
    const fromDimensionId = player.dimension.id.replace('minecraft:', '');
    const toDimension = world.getDimension(toDimensionId);
    if ((x !== null && y !== null && z !== null) && (isNumeric(x) && isNumeric(y) && isNumeric(z))) {
        const location = { x, y, z };
        player.teleport(location, { dimension: toDimension } );
        player.sendMessage({ translate: 'commands.changedimension.success.coords', with: [stringifyLocation(location), toDimensionId] });
    } else if (x === null && y === null && z === null) {
        player.teleport(convertCoords(fromDimensionId, toDimensionId, player.location), { dimension: toDimension });
        player.sendMessage({ translate: 'commands.changedimension.success', with: [getColoredDimensionName(toDimensionId)] });
    } else {
        player.sendMessage({ translate: 'commands.changedimension.fail.coords' });
    }
}

function convertCoords(fromDimension, toDimension, location) {
    if (fromDimension === 'overworld' && toDimension === 'nether')
        return { x: location.x / 8, y: location.y, z: location.z / 8 };
    else if (fromDimension === 'nether' && toDimension === 'overworld')
        return { x: location.x * 8, y: location.y, z: location.z * 8 };
    return location;
}
