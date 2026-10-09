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
        const templatesByTypeId = this.#getDistinctItemStacksByTypeId(to);
        const fullItemStacks = [];
        let totalTransferred = 0;
        for (let i = 0; i < from.size; i++) {
            const itemStack = from.getItem(i);
            if (!itemStack || !this.#matchesAny(templatesByTypeId.get(itemStack.typeId), itemStack))
                continue;
            if (this.#matchesAny(fullItemStacks, itemStack))
                continue;
            const remainderItemStack = VanillaTransferStrategy.put(to, i, itemStack);
            const transferredAmount = itemStack.amount - (remainderItemStack?.amount ?? 0);
            if (transferredAmount > 0)
                SlotTransferStrategy.consume(from, { index: i, stack: itemStack }, transferredAmount);
            if (remainderItemStack)
                fullItemStacks.push(remainderItemStack);
            totalTransferred += transferredAmount;
        }
        return totalTransferred;
    }

    #matchesAny(itemStacks, itemStack) {
        return itemStacks?.some(entry => InventoryUtils.itemsMatch(entry, itemStack)) ?? false;
    }

    #getDistinctItemStacksByTypeId(container) {
        const itemStacksByTypeId = new Map();
        for (let i = 0; i < container.size; i++) {
            const itemStack = container.getItem(i);
            if (!itemStack)
                continue;
            const itemStacks = itemStacksByTypeId.get(itemStack.typeId);
            if (!itemStacks)
                itemStacksByTypeId.set(itemStack.typeId, [itemStack]);
            else if (!this.#matchesAny(itemStacks, itemStack))
                itemStacks.push(itemStack);
        }
        return itemStacksByTypeId;
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
