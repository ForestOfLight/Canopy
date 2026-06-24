import { CustomCommandParamType, CommandPermissionLevel, CustomCommandStatus, system } from "@minecraft/server";
import { VanillaCommand, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin } from "../../../lib/canopy/Canopy";
import Understudies from "../../classes/simplayer/Understudies";

new VanillaCommand({
    name: 'canopy:playersprint',
    description: 'commands.playersprint',
    mandatoryParameters: [
        { name: 'playername', type: CustomCommandParamType.String },
        { name: 'shouldSprint', type: CustomCommandParamType.Boolean }
    ],
    permissionLevel: CommandPermissionLevel.Any,
    allowedSources: [PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin],
    callback: (_origin, playername, shouldSprint) => {
        const understudy = Understudies.get(playername);
        if (!understudy)
            return { status: CustomCommandStatus.Failure, message: Understudies.getNotOnlineMessage(playername) };
        system.run(() => understudy.sprint(shouldSprint));
        return { status: CustomCommandStatus.Success };
    }
});
