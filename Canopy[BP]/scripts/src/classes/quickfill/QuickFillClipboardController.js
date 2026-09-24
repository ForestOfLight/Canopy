import { BlockComponentTypes, EntityComponentTypes, GameMode } from "@minecraft/server";
import { QuickFillClipboard } from "./QuickFillClipboard";
import { QuickFillClipboardExecutor } from "./QuickFillClipboardExecutor";
import { QuickFillClipboardStore } from "./QuickFillClipboardStore";

export class QuickFillClipboardController {
    static get(player) {
        return QuickFillClipboardStore.get(player);
    }

    static copy(player, block, blockInv = block.getComponent(BlockComponentTypes.Inventory)?.container) {
        if (!blockInv)
            return;

        const clipboard = QuickFillClipboard.copy(block, blockInv);
        if (!clipboard)
            return;

        QuickFillClipboardStore.set(player, clipboard);
        player.onScreenDisplay.setActionBar('§7Quick Fill: copied container to clipboard.');
    }

    static apply(player, block, clipboard, isSneaking, blockInv = block.getComponent(BlockComponentTypes.Inventory)?.container, heldItemStack) {
        const playerInv = player.getComponent(EntityComponentTypes.Inventory)?.container;
        if (!playerInv || !blockInv)
            return;

        const result = this.execute(player, block, playerInv, blockInv, clipboard, isSneaking, heldItemStack);
        this.sendFeedback(player, result, isSneaking);
    }

    static execute(player, block, playerInv, blockInv, clipboard, isSneaking, heldItemStack) {
        const wildcardItems = heldItemStack ? [heldItemStack] : [];
        if (isSneaking)
            return QuickFillClipboardExecutor.remove(playerInv, block, blockInv, clipboard, wildcardItems);
        if (player.getGameMode() === GameMode.Creative)
            return QuickFillClipboardExecutor.applyCreative(block, blockInv, clipboard, wildcardItems);
        return QuickFillClipboardExecutor.applySurvival(playerInv, block, blockInv, clipboard, wildcardItems);
    }

    static deactivate(player) {
        if (!QuickFillClipboardStore.has(player))
            return false;

        QuickFillClipboardStore.clear(player);
        player.onScreenDisplay.setActionBar('§7Quick Fill: clipboard deactivated.');
        return true;
    }

    static sendFeedback(player, result, isRemoving) {
        if (result?.incompatible) {
            player.onScreenDisplay.setActionBar('§cQuick Fill: incompatible container.');
            return;
        }

        if (isRemoving) {
            if (!result?.changedSlots) {
                player.onScreenDisplay.setActionBar('§7Quick Fill: no matching items removed.');
                return;
            }

            const slotText = result.changedSlots === 1 ? 'slot' : 'slots';
            player.onScreenDisplay.setActionBar(`§7Quick Fill: removed clipboard (§a${result.changedSlots}§7 ${slotText}).`);
            return;
        }

        if (!result?.changedSlots) {
            player.onScreenDisplay.setActionBar('§7Quick Fill: no clipboard items pasted.');
            return;
        }

        if (result?.skippedSlots) {
            const slotText = result.skippedSlots === 1 ? 'slot' : 'slots';
            player.onScreenDisplay.setActionBar(`§7Quick Fill: ${result.skippedSlots} clipboard ${slotText} not fully pasted.`);
            return;
        }

        player.onScreenDisplay.setActionBar('§7Quick Fill: pasted clipboard to container.');
    }
}
