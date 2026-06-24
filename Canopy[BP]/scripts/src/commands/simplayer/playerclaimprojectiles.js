import { CustomCommandParamType, CommandPermissionLevel, CustomCommandStatus, system } from "@minecraft/server";
import { VanillaCommand, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin } from "../../../lib/canopy/Canopy";
import Understudies from "../../classes/simplayer/Understudies";

new VanillaCommand({
    name: 'canopy:playerclaimprojectiles',
    description: 'commands.playerclaimprojectiles',
    mandatoryParameters: [{ name: 'playername', type: CustomCommandParamType.String }],
    optionalParameters: [{ name: 'radius', type: CustomCommandParamType.Float }],
    permissionLevel: CommandPermissionLevel.Any,
    allowedSources: [PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin],
    callback: (_origin, playername, radius = 25) => {
        const understudy = Understudies.get(playername);
        if (!understudy)
            return { status: CustomCommandStatus.Failure, message: Understudies.getNotOnlineMessage(playername) };
        system.run(() => understudy.claimProjectiles(radius));
        return { status: CustomCommandStatus.Success };
    }
});
