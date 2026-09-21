import { QuickFillContainerPolicy } from "./QuickFillContainerPolicy";

export class QuickFillClipboard {
    constructor({ shape, slots = [] } = {}) {
        this.shape = shape;
        this.slots = slots;
    }

    static copy(block, container) {
        if (!block || !container)
            return;

        const shape = QuickFillContainerPolicy.getShape(block, container);
        if (!shape)
            return;

        const slots = [];
        const slotCount = QuickFillContainerPolicy.getClipboardSlotCount(block, container);
        for (let slot = 0; slot < slotCount; slot++)
            slots.push(container.getItem(slot)?.clone());

        return new QuickFillClipboard({ shape, slots });
    }

    isCompatibleWith(block, container) {
        return QuickFillContainerPolicy.isCompatible(this.shape, QuickFillContainerPolicy.getShape(block, container));
    }

    resolveSlot(slot) {
        return this.slots[slot]?.clone();
    }

    getSlotCount() {
        return this.slots.length;
    }


    clone() {
        return new QuickFillClipboard({
            shape: this.shape,
            slots: this.slots.map(itemStack => itemStack?.clone())
        });
    }
}
