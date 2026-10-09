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

    transfer({ take, put, from, to, wildcardItemStack = void 0 }) {
        const result = { completed: true, transferredAmount: 0 };
        for (let i = 0; i < this.#items.length; i++) {
            if (!this.#items[i])
                continue;
            const itemStackToFind = this.#wildcardMask[i] && wildcardItemStack ? wildcardItemStack : this.#items[i];
            const entryResult = this.#transferEntry({ take, put, from, to }, i, itemStackToFind);
            result.transferredAmount += entryResult.transferredAmount;
            if (!entryResult.completed)
                result.completed = false;
        }
        return result;
    }

    #transferEntry({ take, put, from, to }, slotIndex, itemStackToFind) {
        const amount = this.#items[slotIndex].amount;
        let remainingAmount = amount;
        let totalTransferred = 0;
        while (remainingAmount > 0) {
            const found = take.peek(from, slotIndex, itemStackToFind, remainingAmount);
            if (found === void 0)
                return { completed: false, transferredAmount: totalTransferred };
            const offeredItemStack = found.stack.clone();
            offeredItemStack.amount = Math.min(remainingAmount, found.stack.amount);
            const remainderItemStack = put.put(to, slotIndex, offeredItemStack);
            const transferredAmount = offeredItemStack.amount - (remainderItemStack?.amount ?? 0);
            if (transferredAmount > 0)
                take.consume(from, found, transferredAmount);
            totalTransferred += transferredAmount;
            remainingAmount -= transferredAmount;
            if (remainderItemStack)
                return { completed: false, transferredAmount: totalTransferred };
        }
        return { completed: true, transferredAmount: totalTransferred };
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