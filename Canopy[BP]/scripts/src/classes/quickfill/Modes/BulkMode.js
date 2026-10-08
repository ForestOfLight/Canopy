import { EntityComponentTypes, GameMode } from "@minecraft/server";
import { BulkContainer } from "../BulkContainer";
import { ItemClipboard } from "../ItemClipboard";
import { InventoryUtils } from "../../InventoryUtils";

export class BulkMode {
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
        const countBefore = InventoryUtils.getTotalItemCount(container);
        if (this.player.getGameMode() === GameMode.Creative)
            this.clipboard.insertWithoutCost(container, heldItemStack);
        else
            this.clipboard.transfer(this.playerContainer, container, heldItemStack);
        if (InventoryUtils.getTotalItemCount(container) === countBefore)
            this.sendNothingFilledFeedback(blockLocalizationKey);
        else
            this.sendFilledFeedback(container, blockLocalizationKey, heldItemStack.localizationKey);
    }

    onTakeInteraction(container, heldItemStack, blockLocalizationKey) {
        const countBefore = InventoryUtils.getTotalItemCount(container);
        this.clipboard.transferLikeVanilla(container, this.playerContainer, heldItemStack);
        if (InventoryUtils.getTotalItemCount(container) === countBefore)
            this.sendNothingTakenFeedback(blockLocalizationKey);
        else
            this.sendTakenFeedback(container, blockLocalizationKey, heldItemStack.localizationKey);
    }

    hasConfigureInteraction() {
        return false;
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