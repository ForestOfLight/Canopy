import { CustomCommandParamType, CommandPermissionLevel, CustomCommandStatus } from "@minecraft/server";
import { VanillaCommand, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin } from "../../../lib/canopy/Canopy";
import Understudies from "../../classes/simplayer/Understudies";

export class PlayerGlideCommand extends VanillaCommand {
    constructor() {
        super({
            name: 'canopy:playerglide',
            description: 'commands.playerglide',
            mandatoryParameters: [
                { name: 'playername', type: CustomCommandParamType.String },
                { name: 'shouldGlide', type: CustomCommandParamType.Boolean }
            ],
            permissionLevel: CommandPermissionLevel.Any,
            allowedSources: [PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin],
            callback: (origin, ...args) => this.playerglideCommand(origin, ...args)
        });
    }

    playerglideCommand(origin, playername, shouldGlide) {
        const understudy = Understudies.get(playername);
        if (!understudy) {
            origin.sendMessage(Understudies.getNotOnlineMessage(playername));
            return;
        }
        const timeline = understudy.actions.timeline;
        if (shouldGlide)
            timeline.setLooping('glide', void 0, { length: 1, ticks: [0] });
        else
            timeline.clearTrack('glide');
        return { status: CustomCommandStatus.Success };
    }
}

export const playerglideCommand = new PlayerGlideCommand();
