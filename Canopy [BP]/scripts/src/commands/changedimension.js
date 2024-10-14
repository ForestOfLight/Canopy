import { Rule, Command } from 'lib/canopy/Canopy';
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

new Rule({
    category: 'Rules',
    identifier: 'commandChangeDimension',
    description: { translate: 'rules.commandChangeDimension.description' }
});

const cmd = new Command({
    name: 'changedimension',
    description: { translate: 'commands.changedimension.description' },
    usage: 'changedimension <dimension> [x y z]',
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
    const validDimensionId = validDimensions[dimension.toLowerCase()];
    if (!validDimensionId)
        return player.sendMessage({ translate: 'commands.changedimension.notfound', with: Object.keys(validDimensions).join(', ')});
    
    const validDimension = world.getDimension(validDimensionId);
    if ((x !== null && y !== null && z !== null) && (Utils.isNumeric(x) && Utils.isNumeric(y) && Utils.isNumeric(z))) {
        const location = { x, y, z };
        player.teleport(location, { dimension: validDimension } );
        player.sendMessage({ translate: 'commands.changedimension.success.coords', with: [Utils.stringifyLocation(location), validDimensionId] });
    } else if (x === null && y === null && z === null) {
        player.teleport(player.location, { dimension: validDimension });
        player.sendMessage({ translate: 'commands.changedimension.success', with: [validDimensionId] });
    } else {
        player.sendMessage({ translate: 'commands.changedimension.fail.coords' });
    }
}