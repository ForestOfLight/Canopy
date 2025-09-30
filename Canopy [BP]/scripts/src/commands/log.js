import { VanillaCommand } from "../../lib/canopy/Canopy";
import { PlayerCommandOrigin } from "../../lib/canopy/PlayerCommandOrigin";
import { EntityMovementLog } from "../classes/EntityMovementLog";
import { EntityTntLog } from "../classes/EntityTntLog";
import { CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus } from "@minecraft/server";

const MAIN_COLOR = '§7';
const SECONDARY_COLOR = '§c';
const TERTIARY_COLOR = '§a';

const entityLogs = {
    "projectiles": new EntityMovementLog('projectiles', { main: MAIN_COLOR, secondary: SECONDARY_COLOR, tertiary: TERTIARY_COLOR }),
    "falling_blocks": new EntityMovementLog('falling_blocks', { main: MAIN_COLOR, secondary: SECONDARY_COLOR, tertiary: TERTIARY_COLOR }),
    "tnt": new EntityTntLog('tnt', { main: MAIN_COLOR, secondary: SECONDARY_COLOR, tertiary: TERTIARY_COLOR })
};

new VanillaCommand({
    name: 'canopy:log',
    description: 'commands.log',
    enums: [{ name: 'canopy:logtype', values: Object.keys(entityLogs) }],
    mandatoryParameters: [{ name: 'canopy:logtype', type: CustomCommandParamType.Enum }],
    optionalParameters: [{ name: 'precision', type: CustomCommandParamType.Integer }],
    permissionLevel: CommandPermissionLevel.Any,
    allowedSources: [PlayerCommandOrigin],
    callback: logCommand,
});

export function logCommand(origin, type, precision) {
    const player = origin.getSource();
    if (player.getDynamicProperty('logPrecision') === void 0)
        player.setDynamicProperty('logPrecision', 3);
    if (precision)
        setLogPrecision(player, precision);
    if (Object.keys(entityLogs).includes(type))
        toggleLogging(player, type);
    else
        return { status: CustomCommandStatus.Failure, message: 'commands.log.invalidtype' };
}

function setLogPrecision(player, value) {
    const precision = Math.max(0, Math.min(parseInt(value, 10), 15));
    player.setDynamicProperty('logPrecision', precision);
    player.sendMessage({ translate: 'commands.log.precision', with: [String(precision)] });
}

function toggleLogging(player, type) {
    let message;
    if (entityLogs[type].includes(player)) {
        entityLogs[type].unsubscribe(player);
        message = { translate: 'commands.log.stopped', with: [type] };
    } else {
        entityLogs[type].subscribe(player);
        message = { translate: 'commands.log.started', with: [type] };
    }
    player.sendMessage(message);
}