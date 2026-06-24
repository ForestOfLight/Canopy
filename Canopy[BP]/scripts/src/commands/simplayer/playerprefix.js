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

    playerprefixCommand(_origin, prefix) {
        if (prefix === '-none') {
            system.run(() => Understudies.setNametagPrefix(''));
            return { status: CustomCommandStatus.Success, message: '§7Simplayer prefix removed.' };
        }
        system.run(() => Understudies.setNametagPrefix(prefix));
        return { status: CustomCommandStatus.Success, message: `§7Simplayer prefix set to "§r${prefix}§r§7".` };
    }
}

export const playerprefixCommand = new PlayerPrefixCommand();
