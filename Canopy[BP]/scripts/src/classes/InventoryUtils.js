import { EntityComponentTypes, ItemStack } from "@minecraft/server";

export class InventoryUtils {
    static getInventory(block) {
        const container = block.getComponent('inventory')?.container;
        if (container === undefined) return {};
        const items = {};
        for (let i = 0; i < container.size; i++) {
            const itemStack = container.getItem(i);
            if (itemStack === undefined) continue;
            items[i] = { typeId: itemStack.type.id, amount: itemStack.amount };
        }
        return items;
    }
    
    static restoreInventory(block, items) {
        const container = block.getComponent('inventory')?.container;
        if (container === undefined)
            return;
        for (let i = 0; i < container.size; i++) {
            const item = items[i];
            if (item === undefined)
                continue;
            container.getSlot(i).setItem(new ItemStack(item.typeId, item.amount));
        }
    }

    static pickupItemEntity(entityWithInventory, itemEntity) {
        const itemComponent = itemEntity.getComponent(EntityComponentTypes.Item);
        const itemStack = itemComponent.itemStack;
        const playerInventoryComponent = entityWithInventory?.getComponent(EntityComponentTypes.Inventory);
        const inventory = playerInventoryComponent.container;
        if (!itemStack || !inventory)
            return;
        const canAdd = InventoryUtils.tryAddItemLikeVanilla(inventory, itemStack);
        if (canAdd)
            itemEntity.remove();
    }

    static tryAddItemLikeVanilla(inventory, itemStack) {
        if (InventoryUtils.canAddItem(inventory, itemStack)) {
            InventoryUtils.#addItemLikeVanilla(inventory, itemStack);
            return true;
        }
        return false;
    }

    static canAddItem(inventory, itemStack) {
        if (inventory.emptySlotsCount !== 0)
            return true;
        for (let i = 0; i < inventory.size; i++) {
            const slot = inventory.getSlot(i);
            if (InventoryUtils.#itemFitsInPartiallyFilledSlot(slot, itemStack))
                return true;
        }
        return false;
    }

    static #itemFitsInPartiallyFilledSlot(slot, itemStack) {
        return slot.hasItem() && slot.isStackableWith(itemStack) && slot.amount + itemStack.amount <= slot.maxAmount;
    }

    static #addItemLikeVanilla(inventory, itemStack) {
        const isItemDeposited = InventoryUtils.#partiallyFilledSlotPass(inventory, itemStack);
        if (!isItemDeposited)
            InventoryUtils.#emptySlotPass(inventory, itemStack);
    }

    static #partiallyFilledSlotPass(inventory, itemStack) {
        for (let slotNum = 0; slotNum < inventory.size; slotNum++) {
            const slot = inventory.getSlot(slotNum);
            if (InventoryUtils.#isSlotAvailableForStacking(slot, itemStack)) {
                const remainderAmount = Math.max(0, (slot.amount + itemStack.amount) - slot.maxAmount);
                slot.amount += itemStack.amount - remainderAmount;
                if (remainderAmount > 0) {
                    const remainderStack = new ItemStack(itemStack.typeId, remainderAmount);
                    InventoryUtils.#addItemLikeVanilla(inventory, remainderStack);
                }
                return true;
            }
        }
        return false;
    }

    static #emptySlotPass(inventory, itemStack) {
        for (let slotNum = 0; slotNum < inventory.size; slotNum++) {
            const slot = inventory.getSlot(slotNum);
            if (!slot.hasItem()) {
                slot.setItem(itemStack);
                return true;
            }
        }
        return false;
    }

    static #isSlotAvailableForStacking(slot, itemStack) {
        return slot.hasItem() && slot.isStackableWith(itemStack) && slot.amount !== slot.maxAmount;
    }
}