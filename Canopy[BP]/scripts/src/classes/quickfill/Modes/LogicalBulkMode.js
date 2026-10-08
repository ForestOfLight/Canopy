import { EntityComponentTypes, GameMode } from "@minecraft/server";
import { BulkContainer } from "../BulkContainer";
import { ItemClipboard } from "../ItemClipboard";
import { quickFillModes } from "./QuickFillModes";

export class LogicalBulkMode {
    player;
    clipboard;

    constructor(player) {
        this.player = player;
        this.playerContainer = player.getComponent(EntityComponentTypes.Inventory)?.container;
        this.clipboard = this.#getBulkClipboard();
    }

    destroy() {}

    get name() {
        return quickFillModes.LOGICAL_BULK.name;
    }

    #getBulkClipboard() {
        const clipboard = new ItemClipboard();
        const bulkContainer = new BulkContainer();
        clipboard.copy(bulkContainer);
        clipboard.setWildcardTypeId(bulkContainer.getItemTypeId());
        return clipboard;
    }

    onFillInteraction(container, heldItemStack, blockLocalizationKey) {
        const logicalItemStack = this.#getMostCommonItemStack(container) || heldItemStack;
        const transferredAmount = this.player.getGameMode() === GameMode.Creative
            ? this.clipboard.insertWithoutCost(container, logicalItemStack)
            : this.clipboard.transfer(this.playerContainer, container, logicalItemStack).transferredAmount;
        if (transferredAmount === 0 && container.emptySlotsCount === 0)
            this.sendContainerFullFeedback(blockLocalizationKey);
        else if (transferredAmount === 0)
            this.sendNothingFilledFeedback(blockLocalizationKey, logicalItemStack.localizationKey);
        else
            this.sendFilledFeedback(container, blockLocalizationKey, logicalItemStack.localizationKey);
    }

    onTakeInteraction(container, heldItemStack, blockLocalizationKey) {
        const logicalItemStack = this.#getMostCommonItemStack(container) || heldItemStack;
        const { transferredAmount } = this.clipboard.transferLikeVanilla(container, this.playerContainer, logicalItemStack);
        if (transferredAmount === 0)
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
            { translate: 'rules.quickFillContainer.filled.bulk', with: { rawtext: [{ translate: blockLocalizationKey }, { translate: itemStackLocalizationKey }] } },
            { text: ` (${fullSlotsCount}/${container.size})`}
        ]});
    }

    sendTakenFeedback(container, blockLocalizationKey, itemStackLocalizationKey) {
        const fullSlotsCount = container.size - container.emptySlotsCount;
        this.player.onScreenDisplay.setActionBar({ rawtext: [
            { translate: 'rules.quickFillContainer.taken.bulk', with: { rawtext: [{ translate: itemStackLocalizationKey }, { translate: blockLocalizationKey }] } },
            { text: ` (${fullSlotsCount}/${container.size})`}
        ]});
    }

    sendContainerFullFeedback(blockLocalizationKey) {
        this.player.onScreenDisplay.setActionBar({ rawtext: [
            { translate: 'rules.quickFillContainer.filled.full', with: { rawtext: [{ translate: blockLocalizationKey }] } }
        ]});
    }

    sendNothingFilledFeedback(blockLocalizationKey, itemStackLocalizationKey) {
        this.player.onScreenDisplay.setActionBar({ rawtext: [
            { translate: 'rules.quickFillContainer.filled.noitem', with: { rawtext: [{ translate: blockLocalizationKey }, { translate: itemStackLocalizationKey }] } }
        ]});
    }

    sendNothingTakenFeedback(blockLocalizationKey) {
        this.player.onScreenDisplay.setActionBar({ rawtext: [
            { translate: 'rules.quickFillContainer.taken.empty', with: { rawtext: [{ translate: blockLocalizationKey }] } }
        ]});
    }
}