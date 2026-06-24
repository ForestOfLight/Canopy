import { CustomCommandParamType, CommandPermissionLevel, CustomCommandStatus, system } from "@minecraft/server";
import { VanillaCommand, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin } from "../../../lib/canopy/Canopy";
import Understudies from "../../classes/simplayer/Understudies";

export class PlayerLeaveCommand extends VanillaCommand {
    constructor() {
        super({
            name: 'canopy:playerleave',
            description: 'commands.playerleave',
            mandatoryParameters: [{ name: 'playername', type: CustomCommandParamType.String }],
            permissionLevel: CommandPermissionLevel.Any,
            allowedSources: [PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin],
            callback: (origin, ...args) => this.playerleaveCommand(origin, ...args)
        });
    }

    playerleaveCommand(origin, playername) {
        const understudy = Understudies.get(playername);
        if (!understudy) {
            origin.sendMessage(Understudies.getNotOnlineMessage(playername));
            return { status: CustomCommandStatus.Failure };
        }
        system.run(() => {
            understudy.leave();
            Understudies.remove(understudy);
        });
    }
}

export const playerleaveCommand = new PlayerLeaveCommand();
