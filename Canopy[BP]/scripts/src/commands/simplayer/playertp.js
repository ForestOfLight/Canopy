import { CustomCommandParamType, CommandPermissionLevel, CustomCommandStatus, system } from "@minecraft/server";
import { VanillaCommand, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin } from "../../../lib/canopy/Canopy";
import Understudies from "../../classes/simplayer/Understudies";
import { getLocationInfoFromSource } from "../../classes/simplayer/utils";

new VanillaCommand({
    name: 'canopy:playertp',
    description: 'commands.playertp',
    mandatoryParameters: [{ name: 'playername', type: CustomCommandParamType.String }],
    permissionLevel: CommandPermissionLevel.Any,
    allowedSources: [PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin],
    callback: (origin, playername) => {
        const understudy = Understudies.get(playername);
        if (!understudy)
            return { status: CustomCommandStatus.Failure, message: Understudies.getNotOnlineMessage(playername) };
        system.run(() => understudy.teleport(getLocationInfoFromSource(origin.getSource())));
        return { status: CustomCommandStatus.Success };
    }
});
