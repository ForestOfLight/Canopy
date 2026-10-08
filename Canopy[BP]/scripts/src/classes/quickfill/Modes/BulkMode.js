import { EntityComponentTypes, GameMode } from "@minecraft/server";
import { BulkContainer } from "../BulkContainer";
import { ItemClipboard } from "../ItemClipboard";
import { quickFillModes } from "./QuickFillModes";

export class BulkMode {
    player;
    clipboard;

    constructor(player) {
        this.player = player;
        this.playerContainer = player.getComponent(EntityComponentTypes.Inventory)?.container;
        this.clipboard = this.#getBulkClipboard();
    }

    destroy() {}

    get name() {
        return quickFillModes.BULK.name;
    }

    #getBulkClipboard() {
        const clipboard = new ItemClipboard();
        const bulkContainer = new BulkContainer();
        clipboard.copy(bulkContainer);
        clipboard.setWildcardTypeId(bulkContainer.getItemTypeId());
        return clipboard;
    }

    onFillInteraction(container, heldItemStack, blockLocalizationKey) {
        const transferredAmount = this.player.getGameMode() === GameMode.Creative
            ? this.clipboard.insertWithoutCost(container, heldItemStack)
            : this.clipboard.transfer(this.playerContainer, container, heldItemStack).transferredAmount;
        if (transferredAmount === 0 && container.emptySlotsCount === 0)
            this.sendContainerFullFeedback(blockLocalizationKey);
        else if (transferredAmount === 0)
            this.sendNothingFilledFeedback(blockLocalizationKey, heldItemStack.localizationKey);
        else
            this.sendFilledFeedback(container, blockLocalizationKey, heldItemStack.localizationKey);
    }

    onTakeInteraction(container, heldItemStack, blockLocalizationKey) {
        const { transferredAmount } = this.clipboard.transferLikeVanilla(container, this.playerContainer, heldItemStack);
        if (transferredAmount === 0)
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