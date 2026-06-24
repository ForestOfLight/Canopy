import { CustomCommandParamType, CommandPermissionLevel, CustomCommandStatus, system } from "@minecraft/server";
import { VanillaCommand, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin } from "../../../lib/canopy/Canopy";
import Understudies from "../../classes/simplayer/Understudies";
import { getLocationInfoFromSource } from "../../classes/simplayer/utils";

new VanillaCommand({
    name: 'canopy:playerrejoin',
    description: 'commands.playerrejoin',
    mandatoryParameters: [{ name: 'playername', type: CustomCommandParamType.String }],
    permissionLevel: CommandPermissionLevel.Any,
    allowedSources: [PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin],
    callback: (origin, playername) => {
        if (Understudies.isOnline(playername))
            return { status: CustomCommandStatus.Failure, message: Understudies.getAlreadyOnlineMessage(playername) };
        system.run(() => {
            const understudy = Understudies.create(playername);
            try {
                understudy.rejoin();
            } catch (error) {
                console.warn(`[Canopy] Error while rejoining. Joining normally instead. Error: ${String(error)}`);
                understudy.join(getLocationInfoFromSource(origin.getSource()));
            }
            Understudies.addNametagPrefix(understudy);
        });
        return { status: CustomCommandStatus.Success };
    }
});
