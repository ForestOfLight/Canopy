import { Command } from 'lib/canopy/Canopy';
import Utils from 'stickycore/utils';
import { world } from '@minecraft/server';

const validDimensions = {
    'o': 'overworld',
    'overworld': 'overworld',
    'n': 'nether',
    'nether': 'nether',
    'e': 'the_end',
    'end': 'the_end',
    'the_end': 'the_end',
};

const cmd = new Command({
    name: 'changedimension',
    description: 'Change dimension.',
    usage: 'changedimension <dimension> [x y z]',
    args: [
        { type: 'string', name: 'dimension' },
        { type: 'number', name: 'x' },
        { type: 'number', name: 'y' },
        { type: 'number', name: 'z' },
    ],
    callback: changedimensionCommand
});

function changedimensionCommand(player, args) {
    const { dimension, x, y, z } = args;
    if (!dimension) return cmd.sendUsage(player);
    const validDimensionId = validDimensions[dimension.toLowerCase()];
    if (!validDimensionId) return player.sendMessage(`§cInvalid dimension. Please use one of these: ${Object.keys(validDimensions).join(', ')}`);
    
    const validDimension = world.getDimension(validDimensionId);
    if ((x !== null && y !== null && z !== null) && (Utils.isNumeric(x) && Utils.isNumeric(y) && Utils.isNumeric(z))) {
        player.teleport({ x, y, z }, { dimension: validDimension } );
        player.sendMessage(`§7Teleported to ${x}, ${y}, ${z} in the ${validDimensionId} dimension.`);
    } else if (x === null && y === null && z === null) {
        player.teleport(player.location, { dimension: validDimension });
        player.sendMessage(`§7Changed to ${validDimensionId} dimension.`);
    } else {
        player.sendMessage('§cInvalid coordinates. Please provide all x, y, z numeric values or none.');
    }
}