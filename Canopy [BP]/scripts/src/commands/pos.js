import { Rule, Command } from 'lib/canopy/Canopy';
import { world } from '@minecraft/server';
import Utils from 'stickycore/utils';

const NETHER_SCALE_FACTOR = 8;

new Rule({
    category: 'Rules',
    identifier: 'commandPos',
    description: 'Enables pos command.'
});

new Command({
    name: 'pos',
    description: 'Shows your current position, or the position of another player.',
    usage: 'pos [player]',
    args: [
        { type: 'string', name: 'player' },
    ],
    callback: posCommand,
    contingentRules: ['commandPos']
});

function posCommand(sender, args) {
    const { player } = args;
    let target = world.getPlayers({ name: player })[0];
    if (player === null)
        target = sender;
    else if (!target)
        return sender.sendMessage(`§cPlayer ${player} not found.`);

    let output = `§a${player !== null ? `${target.name}'s` : 'Your'} position: §f${Utils.stringifyLocation(target.location, 2)}`;
    output += `\n§7Dimension: §f${Utils.getColoredDimensionName(target.dimension.id)}`;
    if (target.dimension.id === 'minecraft:nether')
        output += `\n§7Relative Overworld position: §a${Utils.stringifyLocation(netherPosToOverworld(target.location), 2)}`;
    else if (target.dimension.id === 'minecraft:overworld')
        output += `\n§7Relative Nether position: §c${Utils.stringifyLocation(overworldPosToNether(target.location), 2)}`;
    sender.sendMessage(output);
}

function netherPosToOverworld(pos) {
    return { x: pos.x * NETHER_SCALE_FACTOR, y: pos.y, z: pos.z * NETHER_SCALE_FACTOR };
}

function overworldPosToNether(pos) {
    return { x: pos.x / NETHER_SCALE_FACTOR, y: pos.y, z: pos.z / NETHER_SCALE_FACTOR };
}
