import { BlockComponentTypes, EntityComponentTypes, GameMode } from "@minecraft/server";
import { QuickFillClipboard } from "./QuickFillClipboard";
import { QuickFillClipboardExecutor } from "./QuickFillClipboardExecutor";
import { QuickFillClipboardStore } from "./QuickFillClipboardStore";

export class QuickFillClipboardController {
    static get(player) {
        return QuickFillClipboardStore.get(player);
    }

    static copy(player, block) {
        const blockInv = block.getComponent(BlockComponentTypes.Inventory)?.container;
        if (!blockInv)
            return;

        const clipboard = QuickFillClipboard.copy(block, blockInv);
        if (!clipboard)
            return;

        QuickFillClipboardStore.set(player, clipboard);
        const occupiedSlots = clipboard.getOccupiedSlotCount();
        if (!occupiedSlots) {
            player.onScreenDisplay.setActionBar('§7Quick Fill: copied empty clipboard.');
            return;
        }

        const slotText = occupiedSlots === 1 ? 'slot' : 'slots';
        player.onScreenDisplay.setActionBar(`§7Quick Fill: copied §a${occupiedSlots}§7 occupied ${slotText}.`);
    }

    static apply(player, block, clipboard, isSneaking) {
        const playerInv = player.getComponent(EntityComponentTypes.Inventory)?.container;
        const blockInv = block.getComponent(BlockComponentTypes.Inventory)?.container;
        if (!playerInv || !blockInv)
            return;

        const result = this.execute(player, block, playerInv, blockInv, clipboard, isSneaking);
        this.sendFeedback(player, result, isSneaking);
    }

    static execute(player, block, playerInv, blockInv, clipboard, isSneaking) {
        if (isSneaking)
            return QuickFillClipboardExecutor.remove(playerInv, block, blockInv, clipboard);
        if (player.getGameMode() === GameMode.Creative)
            return QuickFillClipboardExecutor.applyCreative(block, blockInv, clipboard);
        return QuickFillClipboardExecutor.applySurvival(playerInv, block, blockInv, clipboard);
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
        if (result?.insufficient) {
            player.onScreenDisplay.setActionBar('§cQuick Fill: insufficient resources.');
            return;
        }
        if (!result?.changedSlots) {
            player.onScreenDisplay.setActionBar(isRemoving
                ? '§7Quick Fill: no matching items removed.'
                : '§7Quick Fill: no changes applied.');
            return;
        }

        const slotText = result.changedSlots === 1 ? 'slot' : 'slots';
        player.onScreenDisplay.setActionBar(`§7Quick Fill: ${isRemoving ? 'removed' : 'applied'} clipboard (§a${result.changedSlots}§7 ${slotText}).`);
    }
}
