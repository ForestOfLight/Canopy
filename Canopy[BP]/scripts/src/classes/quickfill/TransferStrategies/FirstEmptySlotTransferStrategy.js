import { TransferStrategy } from "./TransferStrategy";

export class FirstEmptySlotTransferStrategy extends TransferStrategy {
    static put(container, slotIndex, itemStack) {
        for (let i = 0; i < container.size; i++) {
            if (container.getItem(i))
                continue;
            container.setItem(i, itemStack);
            return void 0;
        }
        return itemStack;
    }
}
