import { Rule, Command, Rules } from "../../lib/canopy/Canopy";
import { world } from "@minecraft/server";
import { stringifyLocation, getColoredDimensionName } from "../../include/utils";

const NETHER_SCALE_FACTOR = 8;

new Rule({
    category: 'Rules',
    identifier: 'commandPosOthers',
    description: { translate: 'rules.commandPosOthers' }
});

new Command({
    name: 'pos',
    description: { translate: 'commands.pos' },
    usage: 'pos [player]',
    args: [
        { type: 'string|number', name: 'player' }
    ],
    callback: posCommand
});

function posCommand(sender, args) {
    const { player } = args;
    if (!Rules.getNativeValue('commandPosOthers') && player !== null)
        return sender.sendMessage({ translate: 'rules.generic.blocked', with: ['commandPosOthers'] });
    const target = player === null ? sender : world.getPlayers({ name: String(player) })[0];
    if (!target)
        return sender.sendMessage({ translate: 'generic.player.notfound', with: [player] });

    const message = {
        rawtext: [
            getPositionText(player, target), { text: '\n' },
            getDimensionText(target), { text: '\n' },
            getRelativeDimensionPositionText(target)
        ]
    };
    sender.sendMessage(message);
}

function getPositionText(player, target) {
    if (player === null)
        return { translate: 'commands.pos.self', with: [stringifyLocation(target.location, 2)] };
    return { translate: 'commands.pos.other', with: [target.name, stringifyLocation(target.location, 2)] };
}

function getDimensionText(target) {
    return { translate: 'commands.pos.dimension', with: [getColoredDimensionName(target.dimension.id)] };
}

function getRelativeDimensionPositionText(target) {
    if (target.dimension.id === 'minecraft:nether')
        return { translate: 'commands.pos.relative.overworld', with: [stringifyLocation(netherPosToOverworld(target.location), 2)] };
    else if (target.dimension.id === 'minecraft:overworld')
        return { translate: 'commands.pos.relative.nether', with: [stringifyLocation(overworldPosToNether(target.location), 2)] };
}

function netherPosToOverworld(pos) {
    return { x: pos.x * NETHER_SCALE_FACTOR, y: pos.y, z: pos.z * NETHER_SCALE_FACTOR };
}

function overworldPosToNether(pos) {
    return { x: pos.x / NETHER_SCALE_FACTOR, y: pos.y, z: pos.z / NETHER_SCALE_FACTOR };
}
