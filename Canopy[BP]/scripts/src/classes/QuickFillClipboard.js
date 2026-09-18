import { QuickFillContainerPolicy } from "./QuickFillContainerPolicy";

export class QuickFillClipboard {
    static WildcardAll = 'all';

    constructor({
        shape,
        slots = [],
        wildcardMask = []
    } = {}) {
        this.shape = shape;
        this.slots = slots;
        this.wildcardMask = wildcardMask;
    }

    static createDefault() {
        return new QuickFillClipboard({
            shape: QuickFillContainerPolicy.AdaptiveShape,
            wildcardMask: this.WildcardAll
        });
    }

    static copy(block, container) {
        if (!block || !container)
            return;

        const shape = QuickFillContainerPolicy.getShape(
            block,
            container
        );

        if (!shape)
            return;

        const slots = [];

        for (let slot = 0; slot < container.size; slot++) {
            const itemStack = container.getItem(slot);

            slots.push(itemStack?.clone());
        }

        return new QuickFillClipboard({
            shape,
            slots,
            wildcardMask: new Array(container.size).fill(false)
        });
    }

    isCompatibleWith(block, container) {
        const targetShape = QuickFillContainerPolicy.getShape(
            block,
            container
        );

        return QuickFillContainerPolicy.isCompatible(
            this.shape,
            targetShape
        );
    }

    isWildcard(slot) {
        if (this.wildcardMask === QuickFillClipboard.WildcardAll)
            return true;

        return this.wildcardMask[slot] === true;
    }

    resolveSlot(slot, heldItem) {
        if (this.isWildcard(slot))
            return heldItem?.clone();

        return this.slots[slot]?.clone();
    }

    getSlotCount(container) {
        if (this.shape === QuickFillContainerPolicy.AdaptiveShape)
            return container?.size ?? 0;

        return this.slots.length;
    }

    hasWildcards() {
        if (this.wildcardMask === QuickFillClipboard.WildcardAll)
            return true;

        return this.wildcardMask.some(Boolean);
    }

    clone() {
        return new QuickFillClipboard({
            shape: this.shape,
            slots: this.slots.map(itemStack => itemStack?.clone()),
            wildcardMask:
                this.wildcardMask === QuickFillClipboard.WildcardAll
                    ? QuickFillClipboard.WildcardAll
                    : [...this.wildcardMask]
        });
    }
}