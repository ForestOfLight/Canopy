export class RecipeProcessingSlot {
    #container;
    #slot;

    constructor(container, slot) {
        this.#container = container;
        this.#slot = slot;
    }

    get amount() {
        return this.getItem()?.amount ?? 0;
    }

    set amount(amount) {
        const itemStack = this.getItem();
        if (itemStack === void 0)
            return;
        itemStack.amount = amount;
        this.setItem(itemStack);
    }

    get maxAmount() {
        return this.getItem()?.maxAmount ?? 0;
    }

    hasItem() {
        return this.getItem() !== void 0 || !this.#container.isSlotEnabled(this.#slot);
    }

    isStackableWith(itemStack) {
        return this.getItem()?.isStackableWith(itemStack) ?? false;
    }

    getItem() {
        return this.#container.getItem(this.#slot);
    }

    setItem(itemStack) {
        this.#container.setItem(this.#slot, itemStack);
    }
}
