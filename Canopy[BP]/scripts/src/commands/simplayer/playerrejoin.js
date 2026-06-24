import { CustomCommandParamType, CommandPermissionLevel, CustomCommandStatus, system } from "@minecraft/server";
import { VanillaCommand, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin } from "../../../lib/canopy/Canopy";
import Understudies from "../../classes/simplayer/Understudies";
import { getLocationInfoFromSource } from "../../classes/simplayer/utils";

export class PlayerRejoinCommand extends VanillaCommand {
    constructor() {
        super({
            name: 'canopy:playerrejoin',
            description: 'commands.playerrejoin',
            mandatoryParameters: [{ name: 'playername', type: CustomCommandParamType.String }],
            permissionLevel: CommandPermissionLevel.Any,
            allowedSources: [PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin],
            callback: (origin, ...args) => this.playerrejoinCommand(origin, ...args)
        });
    }

    playerrejoinCommand(origin, playername) {
        if (Understudies.isOnline(playername)) {
            origin.sendMessage(Understudies.getAlreadyOnlineMessage(playername));
            return { status: CustomCommandStatus.Failure };
        }
        system.run(() => this.#tryRejoin(origin, playername));
        return { status: CustomCommandStatus.Success };
    }

    #tryRejoin(origin, playername) {
        const understudy = Understudies.create(playername);
        try {
            understudy.rejoin();
        } catch (error) {
            console.warn(`[Canopy] Error while rejoining. Joining normally instead. Error: ${String(error)}`);
            understudy.join(getLocationInfoFromSource(origin.getSource()));
        }
        Understudies.addNametagPrefix(understudy);
    }
}

export const playerrejoinCommand = new PlayerRejoinCommand();
