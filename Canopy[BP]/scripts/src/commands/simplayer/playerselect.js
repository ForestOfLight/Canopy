import { CustomCommandParamType, CommandPermissionLevel, CustomCommandStatus, system } from "@minecraft/server";
import { VanillaCommand, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin } from "../../../lib/canopy/Canopy";
import Understudies from "../../classes/simplayer/Understudies";

export class PlayerSelectCommand extends VanillaCommand {
    constructor() {
        super({
            name: 'canopy:playerselect',
            description: 'commands.playerselect',
            mandatoryParameters: [
                { name: 'playername', type: CustomCommandParamType.String },
                { name: 'slotNumber', type: CustomCommandParamType.Integer }
            ],
            permissionLevel: CommandPermissionLevel.Any,
            allowedSources: [PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin],
            callback: (origin, ...args) => this.playerselectCommand(origin, ...args)
        });
    }

    playerselectCommand(origin, playername, slotNumber) {
        const understudy = Understudies.get(playername);
        if (!understudy) {
            origin.sendMessage(Understudies.getNotOnlineMessage(playername));
            return { status: CustomCommandStatus.Failure };
        }
        if (slotNumber < 0 || slotNumber > 8) {
            origin.sendMessage({ translate: 'commands.playerselect.invalidslot', with: [String(slotNumber)] });
            return { status: CustomCommandStatus.Failure };
        }
        system.run(() => understudy.selectSlot(slotNumber));
        return { status: CustomCommandStatus.Success };
    }
}

export const playerselectCommand = new PlayerSelectCommand();
