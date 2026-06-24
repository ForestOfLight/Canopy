import { CustomCommandParamType, CommandPermissionLevel, CustomCommandStatus, system } from "@minecraft/server";
import { VanillaCommand, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin } from "../../../lib/canopy/Canopy";
import Understudies from "../../classes/simplayer/Understudies";

export class PlayerStopCommand extends VanillaCommand {
    constructor() {
        super({
            name: 'canopy:playerstop',
            description: 'commands.playerstop',
            mandatoryParameters: [{ name: 'playername', type: CustomCommandParamType.String }],
            permissionLevel: CommandPermissionLevel.Any,
            allowedSources: [PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin],
            callback: (origin, ...args) => this.playerstopCommand(origin, ...args)
        });
    }

    playerstopCommand(origin, playername) {
        const understudy = Understudies.get(playername);
        if (!understudy) {
            origin.sendMessage(Understudies.getNotOnlineMessage(playername));
            return;
        }
        system.run(() => understudy.stopAll());
        return { status: CustomCommandStatus.Success };
    }
}

export const playerstopCommand = new PlayerStopCommand();
