import { CustomCommandParamType, CommandPermissionLevel, CustomCommandStatus, system } from "@minecraft/server";
import { VanillaCommand, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin } from "../../../lib/canopy/Canopy";
import Understudies from "../../classes/simplayer/Understudies";
import { getLocationInfoFromSource } from "../../classes/simplayer/utils";

export class PlayerJoinCommand extends VanillaCommand {
    constructor() {
        super({
            name: 'canopy:playerjoin',
            description: 'commands.playerjoin',
            mandatoryParameters: [{ name: 'playername', type: CustomCommandParamType.String }],
            permissionLevel: CommandPermissionLevel.Any,
            allowedSources: [PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin],
            callback: (origin, ...args) => this.playerjoinCommand(origin, ...args)
        });
    }

    playerjoinCommand(origin, playername) {
        if (Understudies.isOnline(playername)) {
            origin.sendMessage(Understudies.getAlreadyOnlineMessage(playername));
            return { status: CustomCommandStatus.Failure };
        }
        system.run(() => {
            const understudy = Understudies.create(playername);
            understudy.join(getLocationInfoFromSource(origin.getSource()));
            Understudies.addNametagPrefix(understudy);
        });
    }
}

export const playerjoinCommand = new PlayerJoinCommand();
