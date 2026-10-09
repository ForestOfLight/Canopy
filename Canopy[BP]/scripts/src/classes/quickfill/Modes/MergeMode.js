import { InventoryUtils } from "../../InventoryUtils";
import { SlotTransferStrategy } from "../TransferStrategies/SlotTransferStrategy";
import { VanillaTransferStrategy } from "../TransferStrategies/VanillaTransferStrategy";
import { QuickFillMode } from "./QuickFillMode";
import { quickFillModes } from "./QuickFillModes";

export class MergeMode extends QuickFillMode {
    get name() {
        return quickFillModes.MERGE.name;
    }

    onFillInteraction(container, heldItemStack, blockLocalizationKey) {
        const transferredAmount = this.#mergeInto(this.playerContainer, container);
        this.sendFeedback(this.getFillInteractionFeedback(container, transferredAmount, blockLocalizationKey));
    }

    onTakeInteraction(container, heldItemStack, blockLocalizationKey) {
        const transferredAmount = this.#mergeInto(container, this.playerContainer);
        this.sendFeedback(this.getTakeInteractionFeedback(container, transferredAmount, blockLocalizationKey));
    }

    #mergeInto(from, to) {
        const templates = this.#getDistinctItemStacks(to);
        let totalTransferred = 0;
        for (let i = 0; i < from.size; i++) {
            const itemStack = from.getItem(i);
            if (!itemStack || !templates.some(template => InventoryUtils.itemsMatch(template, itemStack)))
                continue;
            const remainderItemStack = VanillaTransferStrategy.put(to, i, itemStack);
            const transferredAmount = itemStack.amount - (remainderItemStack?.amount ?? 0);
            if (transferredAmount > 0)
                SlotTransferStrategy.consume(from, { index: i }, transferredAmount);
            totalTransferred += transferredAmount;
        }
        return totalTransferred;
    }

    #getDistinctItemStacks(container) {
        const itemStacks = [];
        for (let i = 0; i < container.size; i++) {
            const itemStack = container.getItem(i);
            if (itemStack && !itemStacks.some(entry => InventoryUtils.itemsMatch(entry, itemStack)))
                itemStacks.push(itemStack);
        }
        return itemStacks;
    }

    getFilledFeedback(container, transferredAmount, blockLocalizationKey) {
        return { rawtext: [
            { translate: 'rules.quickFillContainer.filled.merge', with: { rawtext: [{ translate: blockLocalizationKey }] } },
            { text: ` (${transferredAmount})`}
        ]};
    }

    getTakenFeedback(container, transferredAmount, blockLocalizationKey) {
        return { rawtext: [
            { translate: 'rules.quickFillContainer.taken.merge', with: { rawtext: [{ translate: blockLocalizationKey }] } },
            { text: ` (${transferredAmount})`}
        ]};
    }

    getNothingFilledFeedback(blockLocalizationKey) {
        return { rawtext: [
            { translate: 'rules.quickFillContainer.filled.nomatch', with: { rawtext: [{ translate: blockLocalizationKey }] } }
        ]};
    }

    getNothingTakenFeedback(blockLocalizationKey) {
        return { rawtext: [
            { translate: 'rules.quickFillContainer.taken.nomatch', with: { rawtext: [{ translate: blockLocalizationKey }] } }
        ]};
    }
}
