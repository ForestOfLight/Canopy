import { Command } from 'lib/canopy/Canopy';

const cmd = new Command({
    name: 'checksim',
    description: { translate: 'commands.checksim' },
    usage: 'checksim [dimension x y z]',
    args: [
        { type: 'string', name: 'dimension' },
        { type: 'number', name: 'x' },
        { type: 'number', name: 'y' },
        { type: 'number', name: 'z' },
    ],
    callback: checksimCommand
});

function checksimCommand(player, args) {
    const { dimension, x, y, z } = args;
    if (!dimension)
        return cmd.sendUsage(player);
    const toDimensionId = validDimensions[dimension.toLowerCase()];
    if (!toDimensionId)
        return player.sendMessage({ translate: 'commands.changedimension.notfound', with: [Object.keys(validDimensions).join(', ')] });
    
    const fromDimensionId = player.dimension.id.replace('minecraft:', '');
    const toDimension = world.getDimension(toDimensionId);
    if ((x !== null && y !== null && z !== null) && (Utils.isNumeric(x) && Utils.isNumeric(y) && Utils.isNumeric(z))) {
        const location = { x, y, z };
        player.teleport(location, { dimension: toDimension } );
        player.sendMessage({ translate: 'commands.changedimension.success.coords', with: [Utils.stringifyLocation(location), toDimensionId] });
    } else if (x === null && y === null && z === null) {
        player.teleport(convertCoords(fromDimensionId, toDimensionId, player.location), { dimension: toDimension });
        player.sendMessage({ translate: 'commands.changedimension.success', with: [toDimensionId] });
    } else {
        player.sendMessage({ translate: 'commands.changedimension.fail.coords' });
    }
}

function convertCoords(fromDimension, toDimension, location) {
    if (fromDimension === 'overworld' && toDimension === 'nether')
        return { x: location.x / 8, y: location.y, z: location.z / 8 };
    else if (fromDimension === 'nether' && toDimension === 'overworld')
        return { x: location.x * 8, y: location.y, z: location.z * 8 };
    else
        return location;
}
