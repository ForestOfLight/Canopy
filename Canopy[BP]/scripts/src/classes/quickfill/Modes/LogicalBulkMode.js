import { EntityComponentTypes, GameMode } from "@minecraft/server";
import { BulkContainer } from "../BulkContainer";
import { ItemClipboard } from "../ItemClipboard";
import { InventoryUtils } from "../../InventoryUtils";

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

    onFillInteraction(container, heldItemStack, blockLocalizationKey) {
        const logicalItemStack = this.#getMostCommonItemStack(container) || heldItemStack;
        const countBefore = InventoryUtils.getTotalItemCount(container);
        if (this.player.getGameMode() === GameMode.Creative)
            this.clipboard.insertWithoutCost(container, logicalItemStack);
        else
            this.clipboard.transfer(this.playerContainer, container, logicalItemStack);
        if (InventoryUtils.getTotalItemCount(container) === countBefore)
            this.sendNothingFilledFeedback(blockLocalizationKey);
        else
            this.sendFilledFeedback(container, blockLocalizationKey, logicalItemStack.localizationKey);
    }

    onTakeInteraction(container, heldItemStack, blockLocalizationKey) {
        const logicalItemStack = this.#getMostCommonItemStack(container) || heldItemStack;
        const countBefore = InventoryUtils.getTotalItemCount(container);
        this.clipboard.transferLikeVanilla(container, this.playerContainer, logicalItemStack);
        if (InventoryUtils.getTotalItemCount(container) === countBefore)
            this.sendNothingTakenFeedback(blockLocalizationKey);
        else
            this.sendTakenFeedback(container, blockLocalizationKey, logicalItemStack.localizationKey);
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

    sendFilledFeedback(container, blockLocalizationKey, itemStackLocalizationKey) {
        const fullSlotsCount = container.size - container.emptySlotsCount;
        this.player.onScreenDisplay.setActionBar({ rawtext: [
            { translate: 'rules.quickFillContainer.filled.bulk', with: [blockLocalizationKey, itemStackLocalizationKey] },
            { text: ` (${fullSlotsCount}/${container.size})`}
        ]});
    }

    sendTakenFeedback(container, blockLocalizationKey, itemStackLocalizationKey) {
        const fullSlotsCount = container.size - container.emptySlotsCount;
        this.player.onScreenDisplay.setActionBar({ rawtext: [
            { translate: 'rules.quickFillContainer.taken.bulk', with: [itemStackLocalizationKey, blockLocalizationKey] },
            { text: ` (${fullSlotsCount}/${container.size})`}
        ]});
    }

    sendNothingFilledFeedback(blockLocalizationKey) {
        this.player.onScreenDisplay.setActionBar({ rawtext: [
            { translate: 'rules.quickFillContainer.filled.empty', with: [blockLocalizationKey] }
        ]});
    }

    sendNothingTakenFeedback(blockLocalizationKey) {
        this.player.onScreenDisplay.setActionBar({ rawtext: [
            { translate: 'rules.quickFillContainer.taken.empty', with: [blockLocalizationKey] }
        ]});
    }
}