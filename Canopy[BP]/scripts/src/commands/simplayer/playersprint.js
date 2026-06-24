import { CustomCommandParamType, CommandPermissionLevel, CustomCommandStatus, system } from "@minecraft/server";
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
            return { status: CustomCommandStatus.Failure };
        }
        system.run(() => understudy.sprint(shouldSprint));
        return { status: CustomCommandStatus.Success };
    }
}

export const playersprintCommand = new PlayerSprintCommand();
