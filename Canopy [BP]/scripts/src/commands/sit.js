import { VanillaCommand } from "../../lib/canopy/Canopy";
import { PlayerCommandOrigin } from "../../lib/canopy/PlayerCommandOrigin";
import { playerSit } from "../rules/playerSit";
import { CommandPermissionLevel, CustomCommandStatus, EntityComponentTypes, system } from "@minecraft/server";

new VanillaCommand({
    name: 'canopy:sit',
    description: 'commands.sit',
    permissionLevel: CommandPermissionLevel.Any,
    allowedSources: [PlayerCommandOrigin],
    callback: sitCommand,
    contingentRules: ['playerSit']
});

function sitCommand(origin, args) {
    const player = origin.getSource();
    if (player?.getComponent(EntityComponentTypes.Riding)?.entityRidingOn)
        return { status: CustomCommandStatus.Failure, message: 'commands.sit.busy' };
    system.run(() => playerSit.sit(player, args));
}