import { BlockComponentTypes, EntityComponentTypes, ItemStack } from "@minecraft/server";

export class InventoryUtils {
    static getInventory(block) {
        const container = block.getComponent(BlockComponentTypes.Inventory)?.container;
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
        const container = block.getComponent(BlockComponentTypes.Inventory)?.container;
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
        const remainderItemStck = InventoryUtils.addItemLikeVanilla(inventory, itemStack);
        if (remainderItemStck?.amount === itemStack.amount)
            return;
        if (remainderItemStck !== void 0)
            itemEntity.dimension.spawnItem(remainderItemStck, itemEntity.location);
        itemEntity.remove();
    }

    static addItemLikeVanilla(inventory, itemStack) {
        const remainderItemStack = InventoryUtils.#partiallyFilledSlotPass(inventory, itemStack);
        if (remainderItemStack === void 0)
            return void 0;
        return InventoryUtils.#emptySlotPass(inventory, remainderItemStack);
    }

    static #partiallyFilledSlotPass(inventory, itemStack) {
        let remainingAmount = itemStack.amount;
        for (let i = 0; i < inventory.size && remainingAmount > 0; i++) {
            const slot = inventory.getSlot(i);
            if (!InventoryUtils.#isSlotAvailableForStacking(slot, itemStack))
                continue;

            const amountToAdd = Math.min(remainingAmount, slot.maxAmount - slot.amount);
            slot.amount += amountToAdd;
            remainingAmount -= amountToAdd;
        }

        if (remainingAmount === 0)
            return void 0;

        const remainderItemStack = itemStack.clone();
        remainderItemStack.amount = remainingAmount;
        return remainderItemStack;
    }

    static #emptySlotPass(inventory, itemStack) {
        let remainingAmount = itemStack.amount;
        for (let i = 0; i < inventory.size && remainingAmount > 0; i++) {
            const slot = inventory.getSlot(i);
            if (slot.hasItem())
                continue;

            const amountToAdd = Math.min(remainingAmount, itemStack.maxAmount);
            const stackToAdd = itemStack.clone();
            stackToAdd.amount = amountToAdd;
            slot.setItem(stackToAdd);
            remainingAmount -= amountToAdd;
        }

        if (remainingAmount === 0)
            return undefined;

        const remainder = itemStack.clone();
        remainder.amount = remainingAmount;
        return remainder;
    }

    static #isSlotAvailableForStacking(slot, itemStack) {
        return slot.hasItem() && slot.isStackableWith(itemStack) && slot.amount !== slot.maxAmount;
    }

    static itemsMatch(first, second) {
        if (!first || !second)
            return false;
        if (typeof first.isStackableWith === 'function')
            return first.isStackableWith(second);
        return first.typeId === second.typeId;
    }

    static mergeStacks(current, supplied) {
        const replacement = current.clone();
        replacement.amount += supplied.amount;
        return replacement;
    }

    static getTotalItemCount(container) {
        let total = 0;
        for (let i = 0; i < container.size; i++)
            total += container.getItem(i)?.amount ?? 0;
        return total;
    }

    static hasItemType(container, itemTypeId, slotFilter) {
        for (let slot = 0; slot < container.size; slot++) {
            if (slotFilter && !slotFilter(slot))
                continue;
            if (container.getItem(slot)?.typeId === itemTypeId)
                return true;
        }
        return false;
    }

    static hasAvailableSpace(container, itemStack, slotFilter) {
        for (let slot = 0; slot < container.size; slot++) {
            if (slotFilter && !slotFilter(slot))
                continue;

            const current = container.getItem(slot);
            if (!current || (InventoryUtils.itemsMatch(current, itemStack) && current.amount < current.maxAmount))
                return true;
        }
        return false;
    }

    static getAvailableAmount(container, template) {
        let amount = 0;
        for (let slot = 0; slot < container.size; slot++) {
            const itemStack = container.getItem(slot);
            if (itemStack && InventoryUtils.itemsMatch(itemStack, template))
                amount += itemStack.amount;
        }
        return amount;
    }

    static takeItems(container, template, amount) {
        let remaining = amount;
        let result;
        for (let slot = 0; slot < container.size && remaining > 0; slot++) {
            const source = container.getItem(slot);
            if (!source || !InventoryUtils.itemsMatch(source, template))
                continue;

            const taken = Math.min(source.amount, remaining);
            if (!result)
                result = source.clone();
            result.amount = amount - remaining + taken;
            remaining -= taken;

            if (source.amount === taken) {
                container.setItem(slot, null);
            } else {
                const replacement = source.clone();
                replacement.amount -= taken;
                container.setItem(slot, replacement);
            }
        }
        return remaining === 0 ? result : undefined;
    }
}
