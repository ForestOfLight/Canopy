import { Rule, Rules, VanillaCommand } from "../../lib/canopy/Canopy";
import { CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus } from "@minecraft/server";
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

function posCommand(origin, player) {
    if (!Rules.getNativeValue('commandPosOthers') && player)
        return origin.sendMessage({ translate: 'rules.generic.blocked', with: ['commandPosOthers'] });
    if (player?.length > 0) {
        for (const currPlayer of player) {
            if (!currPlayer)
                continue;
            sendPosMessage(origin, currPlayer);
        }
    } else if (origin.getType() === "Player") {
        sendPosMessage(origin);
    } else {
        return { status: CustomCommandStatus.Failure, message: 'commands.generic.invalidsource' };
    }
}

function sendPosMessage(origin, target = void 0) {
    target = target === void 0 ? origin.getSource() : target;
    origin.sendMessage({
        rawtext: [
            getPositionText(origin, target), { text: '\n' },
            getDimensionText(target), { text: '\n' },
            getRelativeDimensionPositionText(target)
        ]
    });
}

function getPositionText(origin, target) {
    if (origin.getSource() === target)
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
