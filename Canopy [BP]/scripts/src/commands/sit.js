import { VanillaCommand } from "../../lib/canopy/Canopy"
import { playerSit } from "../rules/playerSit"
import { CommandPermissionLevel, CustomCommandStatus, EntityComponentTypes, Player, system } from "@minecraft/server"

new VanillaCommand({
    name: 'canopy:sit',
    description: 'commands.sit',
    permissionLevel: CommandPermissionLevel.Any,
    callback: sitCommand,
    contingentRules: ['playerSit']
});

function sitCommand(source, args) {
    if (!(source instanceof Player))
        return { status: CustomCommandStatus.Failure, message: 'commands.generic.invalidsource' };
    if (source?.getComponent(EntityComponentTypes.Riding)?.entityRidingOn)
        return { status: CustomCommandStatus.Failure, message: 'commands.sit.busy' };
    system.run(() => playerSit.sit(source, args));
}