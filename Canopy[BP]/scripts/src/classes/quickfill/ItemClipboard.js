import { InventoryUtils } from "../InventoryUtils";

export class ItemClipboard {
    #items = [];
    #wildcardMask = [];
    #filledCount = 0;

    get items() {
        return [...this.#items];
    }

    get isEmpty() {
        return this.#filledCount === 0;
    }

    copy(container) {
        this.#items.length = 0;
        this.#wildcardMask.length = 0;
        this.#filledCount = 0;
        for (let i = 0; i < container.size; i++) {
            const itemStack = container.getItem(i);
            this.#items.push(itemStack);
            if (itemStack)
                this.#filledCount++;
        }
    }

    transfer({ take, put, from, to, wildcardItemStack = void 0 }) {
        const result = { completed: true, transferredAmount: 0 };
        const failures = { takes: [], puts: [] };
        for (let i = 0; i < this.#items.length; i++) {
            if (!this.#items[i])
                continue;
            const itemStackToFind = this.#wildcardMask[i] && wildcardItemStack ? wildcardItemStack : this.#items[i];
            const entryResult = this.#transferEntry({ take, put, from, to }, i, itemStackToFind, failures);
            result.transferredAmount += entryResult.transferredAmount;
            if (!entryResult.completed)
                result.completed = false;
        }
        return result;
    }

    #transferEntry({ take, put, from, to }, slotIndex, itemStackToFind, failures) {
        const amount = this.#items[slotIndex].amount;
        let remainingAmount = amount;
        let totalTransferred = 0;
        while (remainingAmount > 0) {
            if (failures.takes.includes(itemStackToFind))
                return { completed: false, transferredAmount: totalTransferred };
            const found = take.peek(from, slotIndex, itemStackToFind, remainingAmount);
            if (found === void 0) {
                if (take.ignoresSlotIndex)
                    failures.takes.push(itemStackToFind);
                return { completed: false, transferredAmount: totalTransferred };
            }
            if (failures.puts.some(failedItemStack => InventoryUtils.itemsMatch(failedItemStack, found.stack)))
                return { completed: false, transferredAmount: totalTransferred };
            const offeredItemStack = found.stack.clone();
            offeredItemStack.amount = Math.min(remainingAmount, found.stack.amount);
            const remainderItemStack = put.put(to, slotIndex, offeredItemStack);
            const transferredAmount = offeredItemStack.amount - (remainderItemStack?.amount ?? 0);
            if (transferredAmount > 0)
                take.consume(from, found, transferredAmount);
            totalTransferred += transferredAmount;
            remainingAmount -= transferredAmount;
            if (remainderItemStack) {
                if (put.ignoresSlotIndex)
                    failures.puts.push(offeredItemStack);
                return { completed: false, transferredAmount: totalTransferred };
            }
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
