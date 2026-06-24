import { CustomCommandParamType, CommandPermissionLevel, CustomCommandStatus } from "@minecraft/server";
import { VanillaCommand, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin } from "../../../lib/canopy/Canopy";
import Understudies from "../../classes/simplayer/Understudies";

export class PlayerInventoryCommand extends VanillaCommand {
    constructor() {
        super({
            name: 'canopy:playerinventory',
            description: 'commands.playerinventory',
            mandatoryParameters: [{ name: 'playername', type: CustomCommandParamType.String }],
            permissionLevel: CommandPermissionLevel.Any,
            allowedSources: [PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin],
            callback: (origin, ...args) => this.playerinventoryCommand(origin, ...args)
        });
    }

    playerinventoryCommand(origin, playername) {
        const understudy = Understudies.get(playername);
        if (!understudy) {
            origin.sendMessage(Understudies.getNotOnlineMessage(playername));
            return;
        }
        const playerInventory = understudy.getInventory();
        if (!playerInventory)
            return { status: CustomCommandStatus.Success, message: 'commands.playerinventory.noinventory' };
        origin.sendMessage(this.#getInventoryMessage(understudy, playerInventory));
        return { status: CustomCommandStatus.Success };
    }

    #getInventoryMessage(understudy, playerInventory) {
        if (playerInventory.size === playerInventory.emptySlotsCount)
            return { translate: 'commands.playerinventory.empty', with: [understudy.name] };
        return this.#getFormattedInventoryMessage(understudy, playerInventory);
    }

    #getFormattedInventoryMessage(understudy, playerInventory) {
        const rawtext = [{ translate: 'commands.playerinventory.header', with: [understudy.name] }];
        for (let i = 0; i < playerInventory.size; i++) {
            const itemStack = playerInventory.getItem(i);
            if (itemStack !== void 0) {
                const colorCode = i < 10 ? '§a' : '';
                rawtext.push({ text: '\n' });
                rawtext.push({ translate: 'commands.playerinventory.item', with: [colorCode, String(i), itemStack.typeId, String(itemStack.amount)] });
            }
        }
        return { rawtext };
    }
}

export const playerinventoryCommand = new PlayerInventoryCommand();
