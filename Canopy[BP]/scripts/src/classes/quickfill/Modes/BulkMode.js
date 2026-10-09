import { GameMode } from "@minecraft/server";
import { BulkContainer } from "../BulkContainer";
import { ItemClipboard } from "../ItemClipboard";
import { SearchTransferStrategy } from "../TransferStrategies/SearchTransferStrategy";
import { SlotTransferStrategy } from "../TransferStrategies/SlotTransferStrategy";
import { ConjureTransferStrategy } from "../TransferStrategies/ConjureTransferStrategy";
import { VanillaTransferStrategy } from "../TransferStrategies/VanillaTransferStrategy";
import { QuickFillMode } from "./QuickFillMode";
import { quickFillModes } from "./QuickFillModes";

export class BulkMode extends QuickFillMode {
    clipboard;

    constructor(player) {
        super(player);
        this.clipboard = this.#getBulkClipboard();
    }

    get name() {
        return quickFillModes.BULK.name;
    }

    onFillInteraction(container, heldItemStack, blockLocalizationKey) {
        let transferOptions;
        if (this.player.getGameMode() === GameMode.Creative) {
            transferOptions = {
                take: ConjureTransferStrategy,
                put: VanillaTransferStrategy,
                to: container,
                wildcardItemStack: heldItemStack
            };
        } else {
            transferOptions = {
                take: SearchTransferStrategy,
                put: SlotTransferStrategy,
                from: this.playerContainer,
                to: container,
                wildcardItemStack: heldItemStack
            };
        }
        const { transferredAmount } = this.clipboard.transfer(transferOptions);
        this.sendFeedback(this.getFillInteractionFeedback(container, transferredAmount, blockLocalizationKey, heldItemStack.localizationKey));
    }

    onTakeInteraction(container, heldItemStack, blockLocalizationKey) {
        const transferOptions = {
            take: SearchTransferStrategy,
            put: VanillaTransferStrategy,
            from: container,
            to: this.playerContainer,
            wildcardItemStack: heldItemStack
        };
        const { transferredAmount } = this.clipboard.transfer(transferOptions);
        this.sendFeedback(this.getTakeInteractionFeedback(container, transferredAmount, blockLocalizationKey, heldItemStack.localizationKey));
    }

    #getBulkClipboard() {
        const clipboard = new ItemClipboard();
        const bulkContainer = new BulkContainer();
        clipboard.copy(bulkContainer);
        clipboard.setWildcardTypeId(bulkContainer.getItemTypeId());
        return clipboard;
    }

    getFilledFeedback(container, transferredAmount, blockLocalizationKey, itemStackLocalizationKey) {
        return { rawtext: [
            { translate: 'rules.quickFillContainer.filled.bulk', with: { rawtext: [{ translate: blockLocalizationKey }, { translate: itemStackLocalizationKey }] } },
            { text: ` (${transferredAmount})`}
        ]};
    }

    getTakenFeedback(container, transferredAmount, blockLocalizationKey, itemStackLocalizationKey) {
        return { rawtext: [
            { translate: 'rules.quickFillContainer.taken.bulk', with: { rawtext: [{ translate: itemStackLocalizationKey }, { translate: blockLocalizationKey }] } },
            { text: ` (${transferredAmount})`}
        ]};
    }

    getNothingFilledFeedback(blockLocalizationKey, itemStackLocalizationKey) {
        return { rawtext: [
            { translate: 'rules.quickFillContainer.filled.noitem', with: { rawtext: [{ translate: blockLocalizationKey }, { translate: itemStackLocalizationKey }] } }
        ]};
    }
}