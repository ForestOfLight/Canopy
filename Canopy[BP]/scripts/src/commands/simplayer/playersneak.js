import { CustomCommandParamType, CommandPermissionLevel, CustomCommandStatus, system } from "@minecraft/server";
import { VanillaCommand, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin } from "../../../lib/canopy/Canopy";
import Understudies from "../../classes/simplayer/Understudies";

export class PlayerSneakCommand extends VanillaCommand {
    constructor() {
        super({
            name: 'canopy:playersneak',
            description: 'commands.playersneak',
            mandatoryParameters: [
                { name: 'playername', type: CustomCommandParamType.String },
                { name: 'shouldSneak', type: CustomCommandParamType.Boolean }
            ],
            permissionLevel: CommandPermissionLevel.Any,
            allowedSources: [PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin],
            callback: (origin, ...args) => this.playersneakCommand(origin, ...args)
        });
    }

    playersneakCommand(origin, playername, shouldSneak) {
        const understudy = Understudies.get(playername);
        if (!understudy) {
            origin.sendMessage(Understudies.getNotOnlineMessage(playername));
            return;
        }
        system.run(() => understudy.sneak(shouldSneak));
        return { status: CustomCommandStatus.Success };
    }
}

export const playersneakCommand = new PlayerSneakCommand();
