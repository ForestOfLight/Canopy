import { VanillaCommand } from "../../lib/canopy/Canopy";
import { CommandPermissionLevel, CustomCommandStatus } from '@minecraft/server';

export const DEBUG_ACTION = Object.freeze({
    Add: 'add',
    Remove: 'remove'
});

new VanillaCommand({
    name: 'canopy:debugentity',
    description: 'commands.debugentity',
    permissionLevel: CommandPermissionLevel.GameDirectors,
    callback: debugEntityCommand
});

function debugEntityCommand() {
    return { status: CustomCommandStatus.Failure, message: `This command is not available with the Realms version of Canopy.` };
}