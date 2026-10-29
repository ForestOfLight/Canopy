import { RecipeProcessingSlot } from "./RecipeProcessingSlot";

export class RecipeProcessingContainer {
    #recipeProcessing;

    constructor(recipeProcessing) {
        this.#recipeProcessing = recipeProcessing;
    }

    get size() {
        return this.#recipeProcessing.inputSlotCount;
    }

    get isValid() {
        try {
            return this.#recipeProcessing.isValid !== false;
        } catch {
            return false;
        }
    }

    get emptySlotsCount() {
        let count = 0;
        for (let i = 0; i < this.size; i++) {
            if (this.#isEmptyAndEnabled(i))
                count++;
        }
        return count;
    }

    isSlotEnabled(slot) {
        try {
            return this.#recipeProcessing.getInputSlotEnabled(slot);
        } catch {
            return true;
        }
    }

    getItem(slot) {
        return this.#recipeProcessing.getInputItem(slot);
    }

    setItem(slot, itemStack) {
        if (itemStack !== void 0 && !this.isSlotEnabled(slot))
            return;
        this.#recipeProcessing.setInputItem(slot, itemStack ?? void 0);
    }

    getSlot(slot) {
        return new RecipeProcessingSlot(this, slot);
    }

    clearAll() {
        for (let i = 0; i < this.size; i++)
            this.#recipeProcessing.setInputItem(i, void 0);
    }

    find(itemStack) {
        for (let i = 0; i < this.size; i++) {
            if (this.getItem(i)?.isStackableWith(itemStack))
                return i;
        }
        return void 0;
    }

    firstEmptySlot() {
        for (let i = 0; i < this.size; i++) {
            if (this.#isEmptyAndEnabled(i))
                return i;
        }
        return void 0;
    }

    #isEmptyAndEnabled(slot) {
        return this.getItem(slot) === void 0 && this.isSlotEnabled(slot);
    }
}
