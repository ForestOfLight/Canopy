import { TransferStrategy } from "./TransferStrategy";

export class FirstEmptySlotTransferStrategy extends TransferStrategy {
    static ignoresSlotIndex = true;

    static put(container, slotIndex, itemStack) {
        const emptySlotIndex = container.firstEmptySlot();
        if (emptySlotIndex === void 0)
            return itemStack;
        container.setItem(emptySlotIndex, itemStack);
        return void 0;
    }
}
