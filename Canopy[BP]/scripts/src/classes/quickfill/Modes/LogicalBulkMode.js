import { EntityComponentTypes, GameMode } from "@minecraft/server";
import { BulkContainer } from "../BulkContainer";
import { ItemClipboard } from "../ItemClipboard";

export class LogicalBulkMode {
    player;
    clipboard;

    constructor(player) {
        this.player = player;
        this.playerContainer = player.getComponent(EntityComponentTypes.Inventory)?.container;
        this.clipboard = this.#getBulkClipboard();
    }

    destroy() {}

    #getBulkClipboard() {
        const clipboard = new ItemClipboard();
        const bulkContainer = new BulkContainer();
        clipboard.copy(bulkContainer);
        clipboard.setWildcardTypeId(bulkContainer.getItemTypeId());
        return clipboard;
    }

    onFillInteraction(container, heldItemStack) {
        const logicalItemStack = this.#getMostCommonItemStack(container) || heldItemStack;
        if (this.player.getGameMode() === GameMode.Creative)
            this.clipboard.insertWithoutCost(container, logicalItemStack);
        else
            this.clipboard.transfer(this.playerContainer, container, logicalItemStack);
    }

    onGrabInteraction(container, heldItemStack) {
        const logicalItemStack = this.#getMostCommonItemStack(container) || heldItemStack;
        this.clipboard.transferLikeVanilla(container, this.playerContainer, logicalItemStack);
    }

    hasConfigureInteraction() {
        return false;
    }

    #getMostCommonItemStack(container) {
        if (container.size === container.emptySlotsCount)
            return void 0;
        
        const itemCounts = {};
        let mostCommonItemStack;
        let mostCommonCount = -1;
        for (let i = 0; i < container.size; i++) {
            const itemStack = container.getItem(i);
            if (!itemStack) continue;

            itemCounts[itemStack.typeId] ??= 0;
            itemCounts[itemStack.typeId] += itemStack.amount;
            if (itemCounts[itemStack.typeId] > mostCommonCount) {
                mostCommonItemStack = itemStack;
                mostCommonCount = itemCounts[itemStack.typeId];
            }
        }

        return mostCommonItemStack;
    }
}