import { CustomCommandParamType, CommandPermissionLevel, CustomCommandStatus, system } from "@minecraft/server";
import { VanillaCommand, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin } from "../../../lib/canopy/Canopy";
import Understudies from "../../classes/simplayer/Understudies";

export class PlayerPrefixCommand extends VanillaCommand {
    constructor() {
        super({
            name: 'canopy:playerprefix',
            description: 'commands.playerprefix',
            mandatoryParameters: [{ name: 'prefix', type: CustomCommandParamType.String }],
            permissionLevel: CommandPermissionLevel.Any,
            allowedSources: [PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin],
            callback: (origin, ...args) => this.playerprefixCommand(origin, ...args)
        });
    }

    playerprefixCommand(origin, prefix) {
        if (prefix === '-none') {
            system.run(() => Understudies.setNametagPrefix(''));
            return { status: CustomCommandStatus.Success, message: 'commands.playerprefix.removed' };
        }
        system.run(() => Understudies.setNametagPrefix(prefix));
        origin.sendMessage({ translate: 'commands.playerprefix.set', with: [prefix] });
        return { status: CustomCommandStatus.Success };
    }
}

export const playerprefixCommand = new PlayerPrefixCommand();
