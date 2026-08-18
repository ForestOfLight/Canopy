export class HotbarView {
    static #HOTBAR_SLOT_COUNT = 9;

    #inventory;

    constructor(inventoryContainer) {
        this.#inventory = inventoryContainer;
    }

    get size() {
        return Math.min(this.#inventory.size, HotbarView.#HOTBAR_SLOT_COUNT);
    }

    getItem(slotIndex) {
        if (!this.#isHotbarSlot(slotIndex))
            return void 0;
        return this.#inventory.getItem(slotIndex);
    }

    setItem(slotIndex, itemStack) {
        if (!this.#isHotbarSlot(slotIndex))
            return;
        this.#inventory.setItem(slotIndex, itemStack);
    }

    clear() {
        for (let slotIndex = 0; slotIndex < this.size; slotIndex++)
            this.#inventory.setItem(slotIndex, void 0);
    }

    #isHotbarSlot(slotIndex) {
        return slotIndex >= 0 && slotIndex < this.size;
    }
}
