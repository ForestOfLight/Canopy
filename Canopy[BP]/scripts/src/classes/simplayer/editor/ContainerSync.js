import { ItemEquality } from "./ItemEquality";

export class ContainerSync {
    static sync(understudyView, proxyView, proxyBase) {
        const syncedSlotCount = Math.min(understudyView.size, proxyView.size);
        for (let slotIndex = 0; slotIndex < syncedSlotCount; slotIndex++)
            ContainerSync.#syncSlot(understudyView, proxyView, proxyBase[slotIndex], slotIndex);
        return ContainerSync.snapshot(proxyView);
    }

    static snapshot(containerView) {
        const itemStacks = [];
        for (let slotIndex = 0; slotIndex < containerView.size; slotIndex++)
            itemStacks.push(containerView.getItem(slotIndex)?.clone());
        return itemStacks;
    }

    static #syncSlot(understudyView, proxyView, baseItemStack, slotIndex) {
        const proxyItemStack = proxyView.getItem(slotIndex);
        if (!ItemEquality.equal(proxyItemStack, baseItemStack)) {
            ContainerSync.#trySetItem(understudyView, slotIndex, proxyItemStack);
            return;
        }
        const understudyItemStack = understudyView.getItem(slotIndex);
        if (!ItemEquality.equal(understudyItemStack, proxyItemStack))
            ContainerSync.#trySetItem(proxyView, slotIndex, understudyItemStack);
    }

    static #trySetItem(containerView, slotIndex, itemStack) {
        try {
            containerView.setItem(slotIndex, itemStack);
        } catch (error) {
            console.warn(`[Canopy] Failed to sync inventory slot ${slotIndex}:`, error);
        }
    }
}
