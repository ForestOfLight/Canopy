import { VanillaCommand } from "../../lib/canopy/Canopy";
import { printDimensionEntities } from "../commands/entitydensity";
import { Profiler } from '../classes/Profiler';
import { CommandPermissionLevel, CustomCommandStatus, Player, system } from "@minecraft/server";

new VanillaCommand({
    name: 'canopy:health',
    description: 'commands.health',
    permissionLevel: CommandPermissionLevel.Any,
    callback: healthCommand
});

export function healthCommand(source) {
    if (source instanceof Player) {
        system.runTimeout(async () => {
            const profile = await Profiler.profile();
            printDimensionEntities(source);
            source.sendMessage(formatProfileMessage(profile));
        }, Profiler.profileTime);
    }
    return { status: CustomCommandStatus.Success, message: 'commands.health.startprofile' };
}

function formatProfileMessage(profile) {
    let message = `§7Tps:§r ${profile.tps.result >= 20.0 ? `§a20.0` : `§c${profile.tps.result.toFixed(1)}`}`;
    message += ` §7Range: ${profile.tps.min.toFixed(1)}-${profile.tps.max.toFixed(1)}\n`;
    message += `§7Mspt:§r ${profile.mspt.result < 50 ? '§a' : '§c'}${profile.mspt.result.toFixed(1)}`;
    message += ` §7Range: ${profile.mspt.min.toFixed(1)}-${profile.mspt.max.toFixed(1)}`;
    return message;
}
