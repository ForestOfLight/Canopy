import { Rule, Rules, VanillaCommand } from "../../lib/canopy/Canopy";
import { CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus, Player } from "@minecraft/server";
import { stringifyLocation, getColoredDimensionName } from "../../include/utils";

const NETHER_SCALE_FACTOR = 8;

new Rule({
    category: 'Rules',
    identifier: 'commandPosOthers',
    description: { translate: 'rules.commandPosOthers' }
});

new VanillaCommand({
    name: 'canopy:pos',
    description: 'commands.pos',
    optionalParameters: [{ name: 'player', type: CustomCommandParamType.PlayerSelector }],
    permissionLevel: CommandPermissionLevel.Any,
    callback: posCommand
});

function posCommand(source, player) {
    if (!Rules.getNativeValue('commandPosOthers') && player)
        return source.sendMessage({ translate: 'rules.generic.blocked', with: ['commandPosOthers'] });
    if (player?.length > 0) {
        for (const currPlayer of player) {
            if (!currPlayer)
                continue;
            sendPosMessage(source, currPlayer);
        }
    } else if (source instanceof Player) {
        sendPosMessage(source);
    } else {
        return { status: CustomCommandStatus.Failure, message: 'commands.generic.invalidsource' };
    }
}

function sendPosMessage(source, target = void 0) {
    target = target === void 0 ? source : target;
    source.sendMessage({
        rawtext: [
            getPositionText(source, target), { text: '\n' },
            getDimensionText(target), { text: '\n' },
            getRelativeDimensionPositionText(target)
        ]
    });
}

function getPositionText(player, target) {
    if (player === target)
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
