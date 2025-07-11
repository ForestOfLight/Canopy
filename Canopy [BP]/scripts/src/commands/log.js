import { VanillaCommand } from "../../lib/canopy/Canopy";
import { EntityMovementLog } from "../classes/EntityMovementLog";
import { EntityTntLog } from "../classes/EntityTntLog";
import { CommandPermissionLevel, CustomCommandParamType, CustomCommandStatus, Player } from "@minecraft/server";

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
    callback: logCommand,
});

export function logCommand(source, type, precision) {
    if (!(source instanceof Player) && source !== "Server")
        return { status: CustomCommandStatus.Failure, message: 'commands.generic.invalidsource' };
    if (source instanceof Player) {
        if (source.getDynamicProperty('logPrecision') === void 0)
            source.setDynamicProperty('logPrecision', 3);
        if (precision)
            setLogPrecision(source, precision);
    }
    if (Object.keys(entityLogs).includes(type))
        toggleLogging(source, type);
    else
        return { status: CustomCommandStatus.Failure, message: 'commands.log.invalidtype' };
}

function setLogPrecision(source, value) {
    const precision = Math.max(0, Math.min(parseInt(value, 10), 15));
    source.setDynamicProperty('logPrecision', precision);
    source.sendMessage({ translate: 'commands.log.precision', with: [String(precision)] });
}

function toggleLogging(source, type) {
    let message;
    if (entityLogs[type].includes(source)) {
        entityLogs[type].unsubscribe(source);
        message = { translate: 'commands.log.stopped', with: [type] };
    } else {
        entityLogs[type].subscribe(source);
        message = { translate: 'commands.log.started', with: [type] };
    }
    source.sendMessage(message);
}