import { Rule, Command } from 'lib/canopy/Canopy';
import { world } from '@minecraft/server';
import Utils from 'stickycore/utils';

const NETHER_SCALE_FACTOR = 8;

new Rule({
    category: 'Rules',
    identifier: 'commandPos',
    description: { translate: 'rules.commandPos' },
});

new Command({
    name: 'pos',
    description: { translate: 'commands.pos' },
    usage: 'pos [player]',
    args: [
        { type: 'string|number', name: 'player' },
    ],
    callback: posCommand,
    contingentRules: ['commandPos']
});

function posCommand(sender, args) {
    const player = String(args.player);
    let target = world.getPlayers({ name: player })[0];
    if (player === null)
        target = sender;
    else if (!target)
        return sender.sendMessage({ translate: 'generic.player.notfound', with: [player] });

    let output = `§a${player !== null ? `${target.name}'s` : 'Your'} position: §f${Utils.stringifyLocation(target.location, 2)}`;
    output += `\n§7Dimension: §f${Utils.getColoredDimensionName(target.dimension.id)}`;
    if (target.dimension.id === 'minecraft:nether')
        output += `\n§7Relative Overworld position: §a${Utils.stringifyLocation(netherPosToOverworld(target.location), 2)}`;
    else if (target.dimension.id === 'minecraft:overworld')
        output += `\n§7Relative Nether position: §c${Utils.stringifyLocation(overworldPosToNether(target.location), 2)}`;
    sender.sendMessage(output);

    const message = { rawtext: [] }
    if (player !== null)
        message.rawtext.push({ translate: 'commands.pos.other', with: [target.name, Utils.stringifyLocation(target.location, 2)] });
    else
        message.rawtext.push({ translate: 'commands.pos.self', with: [Utils.stringifyLocation(target.location, 2)] });
    message.rawtext.push({ translate: 'commands.pos.dimension', with: [Utils.getColoredDimensionName(netherPosToOverworld(target.location), 2)] });
    if (target.dimension.id === 'minecraft:nether')
        message.rawtext.push({ translate: 'commands.pos.relative.overworld', with: [Utils.stringifyLocation(netherPosToOverworld(target.location), 2)] });
    else if (target.dimension.id === 'minecraft:overworld')
        message.rawtext.push({ translate: 'commands.pos.relative.nether', with: [Utils.stringifyLocation(overworldPosToNether(target.location), 2)]});
}

function netherPosToOverworld(pos) {
    return { x: pos.x * NETHER_SCALE_FACTOR, y: pos.y, z: pos.z * NETHER_SCALE_FACTOR };
}

function overworldPosToNether(pos) {
    return { x: pos.x / NETHER_SCALE_FACTOR, y: pos.y, z: pos.z / NETHER_SCALE_FACTOR };
}
