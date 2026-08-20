import { ItemComponentTypes } from "@minecraft/server";

export class ItemEquality {
    static equal(itemStackA, itemStackB) {
        if (itemStackA === void 0 && itemStackB === void 0)
            return true;
        if (itemStackA === void 0 || itemStackB === void 0)
            return false;
        if (itemStackA.isStackable !== itemStackB.isStackable)
            return false;
        if (itemStackA.isStackable)
            return itemStackA.isStackableWith(itemStackB) && itemStackA.amount === itemStackB.amount;
        return ItemEquality.#signatureOf(itemStackA) === ItemEquality.#signatureOf(itemStackB);
    }

    static #signatureOf(itemStack) {
        return [
            itemStack.typeId,
            itemStack.amount,
            itemStack.nameTag ?? "",
            ItemEquality.#durabilityOf(itemStack),
            ItemEquality.#enchantmentsOf(itemStack)
        ].join("|");
    }

    static #durabilityOf(itemStack) {
        const durability = itemStack.getComponent(ItemComponentTypes.Durability);
        if (durability === void 0)
            return "";
        return String(durability.damage);
    }

    static #enchantmentsOf(itemStack) {
        const enchantable = itemStack.getComponent(ItemComponentTypes.Enchantable);
        if (enchantable === void 0)
            return "";
        return enchantable.getEnchantments()
            .map(enchantment => `${enchantment.type.id}:${enchantment.level}`)
            .sort()
            .join(",");
    }
}
