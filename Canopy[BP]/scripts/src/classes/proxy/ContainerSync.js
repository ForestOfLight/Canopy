import { ItemEquality } from "./ItemEquality";

export class ContainerSync {
    static sync(understudyView, proxyView, proxyBase) {
        const syncedSlotCount = Math.min(understudyView.size, proxyView.size);
        const rejectedItemStacks = [];
        for (let slotIndex = 0; slotIndex < syncedSlotCount; slotIndex++)
            ContainerSync.#syncSlot(understudyView, proxyView, proxyBase[slotIndex], slotIndex, rejectedItemStacks);
        return { proxyBase: ContainerSync.snapshot(proxyView), rejectedItemStacks };
    }

    static snapshot(containerView) {
        const itemStacks = [];
        for (let slotIndex = 0; slotIndex < containerView.size; slotIndex++)
            itemStacks.push(containerView.getItem(slotIndex)?.clone());
        return itemStacks;
    }

    static #syncSlot(understudyView, proxyView, baseItemStack, slotIndex, rejectedItemStacks) {
        try {
            ContainerSync.#syncSlotUnguarded(understudyView, proxyView, baseItemStack, slotIndex, rejectedItemStacks);
        } catch (error) {
            console.warn(`[Canopy] Failed to sync inventory slot ${slotIndex}:`, error);
        }
    }

    static #syncSlotUnguarded(understudyView, proxyView, baseItemStack, slotIndex, rejectedItemStacks) {
        const proxyItemStack = proxyView.getItem(slotIndex);
        if (ItemEquality.equal(proxyItemStack, baseItemStack)) {
            ContainerSync.#mirrorUnderstudySlot(understudyView, proxyView, slotIndex, proxyItemStack);
            return;
        }
        if (ContainerSync.#writeToUnderstudy(understudyView, slotIndex, proxyItemStack))
            return;
        ContainerSync.#undoProxyEdit(understudyView, proxyView, baseItemStack, slotIndex);
        rejectedItemStacks.push(proxyItemStack);
    }

    static #mirrorUnderstudySlot(understudyView, proxyView, slotIndex, proxyItemStack) {
        const understudyItemStack = understudyView.getItem(slotIndex);
        if (!ItemEquality.equal(understudyItemStack, proxyItemStack))
            ContainerSync.#trySetItem(proxyView, slotIndex, understudyItemStack);
    }

    static #writeToUnderstudy(understudyView, slotIndex, itemStack) {
        ContainerSync.#trySetItem(understudyView, slotIndex, itemStack);
        if (itemStack === void 0)
            return true;
        return ContainerSync.#wasWriteAccepted(understudyView, slotIndex, itemStack);
    }

    static #undoProxyEdit(understudyView, proxyView, baseItemStack, slotIndex) {
        if (baseItemStack !== void 0)
            ContainerSync.#trySetItem(understudyView, slotIndex, void 0);
        ContainerSync.#trySetItem(proxyView, slotIndex, void 0);
    }

    static #wasWriteAccepted(containerView, slotIndex, itemStack) {
        try {
            return ItemEquality.equal(containerView.getItem(slotIndex), itemStack);
        } catch (error) {
            console.warn(`[Canopy] Failed to read back inventory slot ${slotIndex}:`, error);
            return false;
        }
    }

    static #trySetItem(containerView, slotIndex, itemStack) {
        try {
            containerView.setItem(slotIndex, itemStack);
        } catch (error) {
            console.warn(`[Canopy] Failed to sync inventory slot ${slotIndex}:`, error);
        }
    }
}
