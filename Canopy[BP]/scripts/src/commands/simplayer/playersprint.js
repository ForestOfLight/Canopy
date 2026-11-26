import { CustomCommandParamType, CommandPermissionLevel, CustomCommandStatus } from "@minecraft/server";
import { VanillaCommand, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin } from "../../../lib/canopy/Canopy";
import Understudies from "../../classes/simplayer/Understudies";

export class PlayerSprintCommand extends VanillaCommand {
    constructor() {
        super({
            name: 'canopy:playersprint',
            description: 'commands.playersprint',
            mandatoryParameters: [
                { name: 'playername', type: CustomCommandParamType.String },
                { name: 'shouldSprint', type: CustomCommandParamType.Boolean }
            ],
            permissionLevel: CommandPermissionLevel.Any,
            allowedSources: [PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin],
            callback: (origin, ...args) => this.playersprintCommand(origin, ...args)
        });
    }

    playersprintCommand(origin, playername, shouldSprint) {
        const understudy = Understudies.get(playername);
        if (!understudy) {
            origin.sendMessage(Understudies.getNotOnlineMessage(playername));
            return;
        }
        const timeline = understudy.actions.timeline;
        if (shouldSprint)
            timeline.setLooping('sprint', void 0, { length: 1, ticks: [0] });
        else
            timeline.clearTrack('sprint');
        return { status: CustomCommandStatus.Success };
    }
}

export const playersprintCommand = new PlayerSprintCommand();
