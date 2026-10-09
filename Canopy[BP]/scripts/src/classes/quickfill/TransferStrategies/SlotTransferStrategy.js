import { InventoryUtils } from "../../InventoryUtils";
import { TransferStrategy } from "./TransferStrategy";

export class SlotTransferStrategy extends TransferStrategy {
    static consume(container, found, amount) {
        const itemStack = found.stack ?? container.getItem(found.index);
        if (amount >= itemStack.amount) {
            container.setItem(found.index, void 0);
            return;
        }
        itemStack.amount -= amount;
        container.setItem(found.index, itemStack);
    }

    static put(container, slotIndex, itemStack) {
        if (slotIndex >= container.size)
            return itemStack;
        const targetItemStack = container.getItem(slotIndex);
        if (targetItemStack && !InventoryUtils.itemsMatch(targetItemStack, itemStack))
            return itemStack;
        const space = itemStack.maxAmount - (targetItemStack?.amount ?? 0);
        if (space <= 0)
            return itemStack;
        const putAmount = Math.min(itemStack.amount, space);
        const newTargetItemStack = (targetItemStack ?? itemStack).clone();
        newTargetItemStack.amount = (targetItemStack?.amount ?? 0) + putAmount;
        container.setItem(slotIndex, newTargetItemStack);
        if (putAmount === itemStack.amount)
            return void 0;
        const remainder = itemStack.clone();
        remainder.amount = itemStack.amount - putAmount;
        return remainder;
    }

    static peek(container, slotIndex, itemStackToFind) {
        if (slotIndex >= container.size)
            return void 0;
        const stack = container.getItem(slotIndex);
        if (!InventoryUtils.itemsMatch(stack, itemStackToFind))
            return void 0;
        return { index: slotIndex, stack };
    }
}