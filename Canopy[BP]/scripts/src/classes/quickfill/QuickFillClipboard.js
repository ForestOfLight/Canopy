import { QuickFillContainerPolicy } from "./QuickFillContainerPolicy";

export class QuickFillClipboard {
    constructor({ shape, slots = [], wildcardGroups = [] } = {}) {
        this.shape = shape;
        this.slots = slots;
        this.wildcardGroups = Array.from(
            { length: slots.length },
            (_, slot) => wildcardGroups[slot] ?? null
        );
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

    getWildcardGroup(slot) {
        return this.wildcardGroups[slot] ?? null;
    }

    setWildcardGroup(itemTypeId, group = 0) {
        const matchingSlots = [];
        for (let slot = 0; slot < this.slots.length; slot++) {
            if (this.slots[slot]?.typeId === itemTypeId)
                matchingSlots.push(slot);
        }

        if (matchingSlots.length === 0)
            return false;

        for (let slot = 0; slot < this.wildcardGroups.length; slot++) {
            if (this.wildcardGroups[slot] === group)
                this.wildcardGroups[slot] = null;
        }

        for (const slot of matchingSlots)
            this.wildcardGroups[slot] = group;

        return true;
    }

    clone() {
        return new QuickFillClipboard({
            shape: this.shape,
            slots: this.slots.map(itemStack => itemStack?.clone()),
            wildcardGroups: [...this.wildcardGroups]
        });
    }
}
