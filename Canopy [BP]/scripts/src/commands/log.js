import { Command } from "../../lib/canopy/Canopy";
import { EntityMovementLog } from "../classes/EntityMovementLog";
import { EntityTntLog } from "../classes/EntityTntLog";

const MAIN_COLOR = '§7';
const SECONDARY_COLOR = '§c';
const TERTIARY_COLOR = '§a';

const entityLogs = {
    "projectiles": new EntityMovementLog('projectiles', { main: MAIN_COLOR, secondary: SECONDARY_COLOR, tertiary: TERTIARY_COLOR }),
    "falling_blocks": new EntityMovementLog('falling_blocks', { main: MAIN_COLOR, secondary: SECONDARY_COLOR, tertiary: TERTIARY_COLOR }),
    "tnt": new EntityTntLog('tnt', { main: MAIN_COLOR, secondary: SECONDARY_COLOR, tertiary: TERTIARY_COLOR })
};

const cmd = new Command({
    name: 'log',
    description: { translate: 'commands.log' },
    usage: 'log <tnt/projectiles/falling_blocks> [precision]',
    args: [
        { type: 'string', name: 'type' },
        { type: 'number', name: 'precision' }
    ],
    callback: logCommand
});

export function logCommand(sender, args) {
    const { type, precision } = args;
    if (sender.getDynamicProperty('logPrecision') === undefined)
        sender.setDynamicProperty('logPrecision', 3);
    if (precision !== null)
        setLogPrecsion(sender, precision);
    if (Object.keys(entityLogs).includes(type))
        toggleLogging(sender, type);
    else
        cmd.sendUsage(sender);
}

function setLogPrecsion(sender, value) {
    const precision = Math.max(0, Math.min(parseInt(value, 10), 15));
    sender.setDynamicProperty('logPrecision', precision);
    sender.sendMessage({ translate: 'commands.log.precision', with: [String(precision)] });
}

function toggleLogging(sender, type) {
    let message;
    if (entityLogs[type].includes(sender)) {
        entityLogs[type].unsubscribe(sender);
        message = { translate: 'commands.log.stopped', with: [type] };
    } else {
        entityLogs[type].subscribe(sender);
        message = { translate: 'commands.log.started', with: [type] };
    }
    sender.sendMessage(message);
}