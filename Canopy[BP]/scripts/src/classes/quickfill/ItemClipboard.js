import { InventoryUtils } from "../InventoryUtils";

export class ItemClipboard {
    #items = [];
    #wildcardMask = [];

    get items() {
        return [...this.#items];
    }

    get isEmpty() {
        return this.#items.every(item => !item);
    }

    copy(container) {
        this.#items.length = 0;
        this.#wildcardMask.length = 0;
        for (let i = 0; i < container.size; i++)
            this.#items.push(container.getItem(i));
    }

    transfer(fromContainer, toContainer, wildcardItemStack = void 0) {
        let hasTransferredAll = true;
        for (let i = 0; i < this.#items.length; i++) {
            if (!this.#items[i])
                continue;
            const itemStackToFind = this.#wildcardMask[i] && wildcardItemStack ? wildcardItemStack : this.#items[i];
            const completedTransfer = this.#transferToSlot(fromContainer, toContainer, i, itemStackToFind, this.#items[i].amount);
            if (!completedTransfer)
                hasTransferredAll = false;
        }
        return hasTransferredAll;
    }

    #transferToSlot(fromContainer, toContainer, slotIndex, itemStack, amount) {
        let remainingAmount = amount;
        while (remainingAmount > 0) {
            const sourceIndex = fromContainer.find(itemStack);
            if (sourceIndex === void 0)
                return false;
            const sourceItemStack = fromContainer.getItem(sourceIndex);
            const targetItemStack = toContainer.getItem(slotIndex);
            if (targetItemStack && !InventoryUtils.itemsMatch(targetItemStack, sourceItemStack))
                return false;
            const space = sourceItemStack.maxAmount - (targetItemStack?.amount ?? 0);
            if (space <= 0)
                return false;
            const transferredAmount = Math.min(remainingAmount, sourceItemStack.amount, space);
            const newTargetItemStack = (targetItemStack ?? sourceItemStack).clone();
            newTargetItemStack.amount = (targetItemStack?.amount ?? 0) + transferredAmount;
            toContainer.setItem(slotIndex, newTargetItemStack);
            if (transferredAmount === sourceItemStack.amount) {
                fromContainer.setItem(sourceIndex, void 0);
            } else {
                sourceItemStack.amount -= transferredAmount;
                fromContainer.setItem(sourceIndex, sourceItemStack);
            }
            remainingAmount -= transferredAmount;
        }
        return true;
    }

    transferLikeVanilla(fromContainer, toContainer, wildcardItemStack = void 0) {
        let hasTransferredAll = true;
        for (let i = 0; i < this.#items.length; i++) {
            if (!this.#items[i])
                continue;
            const itemStackToFind = this.#wildcardMask[i] && wildcardItemStack ? wildcardItemStack : this.#items[i];
            const completedTransfer = this.#transferAmountLikeVanilla(fromContainer, toContainer, itemStackToFind, this.#items[i].amount);
            if (!completedTransfer)
                hasTransferredAll = false;
        }
        return hasTransferredAll;
    }

    #transferAmountLikeVanilla(fromContainer, toContainer, itemStack, amount) {
        let remainingAmount = amount;
        while (remainingAmount > 0) {
            const sourceIndex = fromContainer.find(itemStack);
            if (sourceIndex === void 0)
                return false;
            const sourceItemStack = fromContainer.getItem(sourceIndex);
            const itemStackToTransfer = sourceItemStack.clone();
            itemStackToTransfer.amount = Math.min(remainingAmount, sourceItemStack.amount);
            const remainderItemStack = InventoryUtils.addItemLikeVanilla(toContainer, itemStackToTransfer);
            const transferredAmount = itemStackToTransfer.amount - (remainderItemStack?.amount ?? 0);
            if (transferredAmount === sourceItemStack.amount) {
                fromContainer.setItem(sourceIndex, void 0);
            } else {
                sourceItemStack.amount -= transferredAmount;
                fromContainer.setItem(sourceIndex, sourceItemStack);
            }
            if (remainderItemStack)
                return false;
            remainingAmount -= transferredAmount;
        }
        return true;
    }

    insertWithoutCost(container, wildcardItemStack = void 0) {
        for (let i = 0; i < this.#items.length; i++) {
            if (!this.#items[i])
                continue;
            InventoryUtils.addItemLikeVanilla(container, this.#resolveInsertedItem(i, wildcardItemStack));
        }
    }

    insertIntoEmptySlotsWithoutCost(container, wildcardItemStack = void 0) {
        for (let i = 0; i < this.#items.length; i++) {
            if (!this.#items[i])
                continue;
            this.#insertIntoEmptySlot(container, this.#resolveInsertedItem(i, wildcardItemStack));
        }
    }

    #resolveInsertedItem(index, wildcardItemStack) {
        if (this.#wildcardMask[index] && wildcardItemStack) {
            const wildcardedItemStack = wildcardItemStack.clone();
            wildcardedItemStack.amount = this.#items[index].amount;
            return wildcardedItemStack;
        }
        return this.#items[index].clone();
    }

    #insertIntoEmptySlot(container, itemStack) {
        for (let i = 0; i < container.size; i++) {
            if (container.getItem(i))
                continue;
            container.setItem(i, itemStack);
            return;
        }
    }

    transferMultiple(fromContainer, toContainer, numCopies, wildcardItemStack = void 0) {
        let i;
        for (i = 0; i < numCopies; i++) {
            const success = this.transfer(fromContainer, toContainer, wildcardItemStack);
            if (!success)
                break;
        }
        return i;
    }

    setWildcardTypeId(typeIdToWildcard) {
        if (typeIdToWildcard === void 0 || this.isEmpty) {
            this.#wildcardMask.length = 0;
            return;
        }
        for (let i = 0; i < this.#items.length; i++) {
            const itemType = this.#items[i]?.typeId;
            if (itemType !== void 0 && itemType === typeIdToWildcard)
                this.#wildcardMask[i] = true;
            else
                this.#wildcardMask[i] = false;
        }
    }
}