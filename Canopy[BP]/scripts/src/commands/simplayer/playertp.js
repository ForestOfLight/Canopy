import { CustomCommandParamType, CommandPermissionLevel, CustomCommandStatus, system } from "@minecraft/server";
import { VanillaCommand, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin } from "../../../lib/canopy/Canopy";
import Understudies from "../../classes/simplayer/Understudies";
import { getLocationInfoFromSource } from "../../classes/simplayer/utils";

export class PlayerTpCommand extends VanillaCommand {
    constructor() {
        super({
            name: 'canopy:playertp',
            description: 'commands.playertp',
            mandatoryParameters: [{ name: 'playername', type: CustomCommandParamType.String }],
            permissionLevel: CommandPermissionLevel.Any,
            allowedSources: [PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin],
            callback: (origin, ...args) => this.playertpCommand(origin, ...args)
        });
    }

    playertpCommand(origin, playername) {
        const understudy = Understudies.get(playername);
        if (!understudy) {
            origin.sendMessage(Understudies.getNotOnlineMessage(playername));
            return;
        }
        system.run(() => understudy.teleport(getLocationInfoFromSource(origin.getSource())));
        return { status: CustomCommandStatus.Success };
    }
}

export const playertpCommand = new PlayerTpCommand();
