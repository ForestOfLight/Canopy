import { CustomCommandParamType, CommandPermissionLevel, CustomCommandStatus } from "@minecraft/server";
import { VanillaCommand, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin } from "../../../lib/canopy/Canopy";
import Understudies from "../../classes/simplayer/Understudies";

new VanillaCommand({
    name: 'canopy:playerinventory',
    description: 'commands.playerinventory',
    mandatoryParameters: [{ name: 'playername', type: CustomCommandParamType.String }],
    permissionLevel: CommandPermissionLevel.Any,
    allowedSources: [PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin],
    callback: (_origin, playername) => {
        const understudy = Understudies.get(playername);
        if (!understudy)
            return { status: CustomCommandStatus.Failure, message: Understudies.getNotOnlineMessage(playername) };
        const playerInventory = understudy.getInventory();
        if (!playerInventory)
            return { status: CustomCommandStatus.Success, message: '§cNo inventory found' };
        if (playerInventory.size === playerInventory.emptySlotsCount)
            return { status: CustomCommandStatus.Success, message: `§7${understudy.name}'s inventory is empty.` };
        let message = `${understudy.name}'s inventory:`;
        for (let i = 0; i < playerInventory.size; i++) {
            const itemStack = playerInventory.getItem(i);
            if (itemStack !== void 0) {
                const colorCode = i < 10 ? '§a' : '';
                message += `\n§7- ${colorCode}${i}§7: ${itemStack.typeId} x${itemStack.amount}`;
            }
        }
        return { status: CustomCommandStatus.Success, message };
    }
});
