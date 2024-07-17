import Command from 'stickycore/command';
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

new Command()
    .setName('changedimension')
    .addArgument('string', 'dimension')
    .addArgument('number', 'x')
    .addArgument('number', 'y')
    .addArgument('number', 'z')
    .setCallback(changedimensionCommand)
    .build();

function changedimensionCommand(player, args) {
    const { dimension, x, y, z } = args;
    if (!dimension) return player.sendMessage('§cUsage: ./changedimension <dimension> [x y z]');
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