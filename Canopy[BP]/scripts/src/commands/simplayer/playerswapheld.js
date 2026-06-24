import { CustomCommandParamType, CommandPermissionLevel, CustomCommandStatus, system } from "@minecraft/server";
import { VanillaCommand, PlayerCommandOrigin, EntityCommandOrigin } from "../../../lib/canopy/Canopy";
import Understudies from "../../classes/simplayer/Understudies";

export class PlayerSwapHeldCommand extends VanillaCommand {
    constructor() {
        super({
            name: 'canopy:playerswapheld',
            description: 'commands.playerswapheld',
            mandatoryParameters: [{ name: 'playername', type: CustomCommandParamType.String }],
            permissionLevel: CommandPermissionLevel.Any,
            allowedSources: [PlayerCommandOrigin, EntityCommandOrigin],
            callback: (origin, ...args) => this.playerswapheldCommand(origin, ...args)
        });
    }

    playerswapheldCommand(origin, playername) {
        const understudy = Understudies.get(playername);
        if (!understudy)
            return { status: CustomCommandStatus.Failure, message: Understudies.getNotOnlineMessage(playername) };
        system.run(() => understudy.swapHeldItemWithPlayer(origin.getSource()));
        return { status: CustomCommandStatus.Success };
    }
}

export const playerswapheldCommand = new PlayerSwapHeldCommand();
