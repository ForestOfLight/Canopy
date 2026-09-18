import { GameMode } from "@minecraft/server";
import { QuickFillClipboard } from "./QuickFillClipboard";
import { QuickFillClipboardExecutor } from "./QuickFillClipboardExecutor";
import { QuickFillClipboardStore } from "./QuickFillClipboardStore";

export class QuickFillClipboardController {
    static get(player) {
        return QuickFillClipboardStore.get(player);
    }

    static copy(player, block) {
        const blockInv =
            block.getComponent('inventory')?.container;

        if (!blockInv)
            return;

        const clipboard = QuickFillClipboard.copy(
            block,
            blockInv
        );

        if (!clipboard)
            return;

        QuickFillClipboardStore.set(
            player,
            clipboard
        );

        player.onScreenDisplay.setActionBar(
            `§7Quick Fill: copied §a${blockInv.size}§7-slot clipboard.`
        );
    }

    static apply(player, block, clipboard, isSneaking) {
        const playerInv =
            player.getComponent('inventory')?.container;

        const blockInv =
            block.getComponent('inventory')?.container;

        if (!playerInv || !blockInv)
            return;

        const result = this.execute(
            player,
            block,
            playerInv,
            blockInv,
            clipboard,
            isSneaking
        );

        this.sendFeedback(
            player,
            result,
            isSneaking
        );
    }

    static execute(
        player,
        block,
        playerInv,
        blockInv,
        clipboard,
        isSneaking
    ) {
        if (isSneaking) {
            return QuickFillClipboardExecutor.remove(
                playerInv,
                block,
                blockInv,
                clipboard
            );
        }

        if (player.getGameMode() === GameMode.Creative) {
            return QuickFillClipboardExecutor.applyCreative(
                block,
                blockInv,
                clipboard
            );
        }

        return QuickFillClipboardExecutor.applySurvival(
            playerInv,
            block,
            blockInv,
            clipboard
        );
    }
    static deactivate(player) {
        if (!QuickFillClipboardStore.has(player))
            return false;

        QuickFillClipboardStore.clear(player);
        player.onScreenDisplay.setActionBar("Quick Fill clipboard deactivated.");
        return true;
    }
    static sendFeedback(player, result, isRemoving) {
        if (result?.incompatible) {
            player.onScreenDisplay.setActionBar(
                '§cQuick Fill: incompatible container.'
            );
            return;
        }

        if (result?.insufficient) {
            player.onScreenDisplay.setActionBar(
                '§cQuick Fill: insufficient resources.'
            );
            return;
        }

        if (!result?.changedSlots) {
            const action = isRemoving
                ? 'remove'
                : 'apply';

            player.onScreenDisplay.setActionBar(
                `§7Quick Fill: nothing to ${action}.`
            );
            return;
        }

        const action = isRemoving
            ? 'removed'
            : 'applied';

        player.onScreenDisplay.setActionBar(
            `§7Quick Fill: ${action} clipboard (§a${result.changedSlots}§7 slots).`
        );
    }
}