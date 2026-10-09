import { TransferStrategy } from "./TransferStrategy";

export class ConjureTransferStrategy extends TransferStrategy {
    static ignoresSlotIndex = true;

    static peek(container, slotIndex, itemStackToFind, amount) {
        const stack = itemStackToFind.clone();
        stack.amount = amount;
        return { index: slotIndex, stack };
    }

    static consume() {}
}
