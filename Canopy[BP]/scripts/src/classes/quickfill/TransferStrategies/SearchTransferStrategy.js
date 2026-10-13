import { SlotTransferStrategy } from "./SlotTransferStrategy";
import { TransferStrategy } from "./TransferStrategy";

export class SearchTransferStrategy extends TransferStrategy {
    static ignoresSlotIndex = true;

    static peek(container, slotIndex, itemStackToFind) {
        const index = container.find(itemStackToFind);
        if (index === void 0)
            return void 0;
        return { index, stack: container.getItem(index) };
    }

    static consume(container, found, amount) {
        SlotTransferStrategy.consume(container, found, amount);
    }
}
