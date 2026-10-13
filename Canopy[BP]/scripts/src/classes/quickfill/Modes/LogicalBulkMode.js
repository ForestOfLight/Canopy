import { GameMode } from "@minecraft/server";
import { BulkContainer } from "../BulkContainer";
import { ItemClipboard } from "../ItemClipboard";
import { SearchTransferStrategy } from "../TransferStrategies/SearchTransferStrategy";
import { SlotTransferStrategy } from "../TransferStrategies/SlotTransferStrategy";
import { ConjureTransferStrategy } from "../TransferStrategies/ConjureTransferStrategy";
import { VanillaTransferStrategy } from "../TransferStrategies/VanillaTransferStrategy";
import { QuickFillMode } from "./QuickFillMode";
import { quickFillModes } from "./QuickFillModes";

export class LogicalBulkMode extends QuickFillMode {
    clipboard;

    constructor(player) {
        super(player);
        this.clipboard = this.#getBulkClipboard();
    }

    get name() {
        return quickFillModes.LOGICAL_BULK.name;
    }

    onFillInteraction(container, heldItemStack, blockLocalizationKey) {
        const logicalItemStack = this.#getMostCommonItemStack(container) || heldItemStack;
        let transferOptions;
        if (this.player.getGameMode() === GameMode.Creative) {
            transferOptions = {
                take: ConjureTransferStrategy,
                put: VanillaTransferStrategy,
                to: container,
                wildcardItemStack: logicalItemStack
            };
        } else {
            transferOptions = {
                take: SearchTransferStrategy,
                put: SlotTransferStrategy,
                from: this.playerContainer,
                to: container,
                wildcardItemStack: logicalItemStack
            };
        }
        const { transferredAmount } = this.clipboard.transfer(transferOptions);
        this.sendFeedback(this.getFillInteractionFeedback(container, transferredAmount, blockLocalizationKey, logicalItemStack.localizationKey));
    }

    onTakeInteraction(container, heldItemStack, blockLocalizationKey) {
        const logicalItemStack = this.#getMostCommonItemStack(container) || heldItemStack;
        const transferOptions = {
            take: SearchTransferStrategy,
            put: VanillaTransferStrategy,
            from: container,
            to: this.playerContainer,
            wildcardItemStack: logicalItemStack
        };
        const { transferredAmount } = this.clipboard.transfer(transferOptions);
        this.sendFeedback(this.getTakeInteractionFeedback(container, transferredAmount, blockLocalizationKey, logicalItemStack.localizationKey));
    }

    #getBulkClipboard() {
        const clipboard = new ItemClipboard();
        const bulkContainer = new BulkContainer();
        clipboard.copy(bulkContainer);
        clipboard.setWildcardTypeId(bulkContainer.getItemTypeId());
        return clipboard;
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