import { CustomCommandParamType, CommandPermissionLevel, CustomCommandStatus, system } from "@minecraft/server";
import { VanillaCommand, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin } from "../../../lib/canopy/Canopy";
import Understudies from "../../classes/simplayer/Understudies";
import { getLocationInfoFromSource } from "../../classes/simplayer/utils";

new VanillaCommand({
    name: 'canopy:playerjoin',
    description: 'commands.playerjoin',
    mandatoryParameters: [{ name: 'playername', type: CustomCommandParamType.String }],
    permissionLevel: CommandPermissionLevel.Any,
    allowedSources: [PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin],
    callback: (origin, playername) => {
        if (Understudies.isOnline(playername))
            return { status: CustomCommandStatus.Failure, message: Understudies.getAlreadyOnlineMessage(playername) };
        system.run(() => {
            const understudy = Understudies.create(playername);
            understudy.join(getLocationInfoFromSource(origin.getSource()));
            Understudies.addNametagPrefix(understudy);
        });
    }
});
