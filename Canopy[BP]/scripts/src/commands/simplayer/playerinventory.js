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

    playerinventoryCommand(_origin, playername) {
        const understudy = Understudies.get(playername);
        if (!understudy)
            return { status: CustomCommandStatus.Failure, message: Understudies.getNotOnlineMessage(playername) };
        const playerInventory = understudy.getInventory();
        if (!playerInventory)
            return { status: CustomCommandStatus.Success, message: '§cNo inventory found' };
        return { status: CustomCommandStatus.Success, message: this.#getInventoryMessage(understudy, playerInventory) };
    }

    #getInventoryMessage(understudy, playerInventory) {
        if (playerInventory.size === playerInventory.emptySlotsCount)
            return `§7${understudy.name}'s inventory is empty.`;
        return this.#getFormattedInventoryMessage(understudy, playerInventory);
    }

    #getFormattedInventoryMessage(understudy, playerInventory) {
        let message = `${understudy.name}'s inventory:`;
        for (let i = 0; i < playerInventory.size; i++) {
            const itemStack = playerInventory.getItem(i);
            if (itemStack !== void 0) {
                const colorCode = i < 10 ? '§a' : '';
                message += `
§7- ${colorCode}${i}§7: ${itemStack.typeId} x${itemStack.amount}`;
            }
        }
        return message;
    }
}

export const playerinventoryCommand = new PlayerInventoryCommand();
