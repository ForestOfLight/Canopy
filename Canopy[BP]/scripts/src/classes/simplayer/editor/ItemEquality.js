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
            ItemEquality.#enchantmentsOf(itemStack),
            ItemEquality.#bookOf(itemStack),
            ItemEquality.#potionOf(itemStack),
            ItemEquality.#dyeableOf(itemStack),
            ItemEquality.#inventoryOf(itemStack)
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

    static #bookOf(itemStack) {
        const book = itemStack.getComponent(ItemComponentTypes.Book);
        if (book === void 0)
            return "";
        return [
            book.author ?? "",
            book.contents.join("|"),
            String(book.isSigned),
            String(book.pageCount)
        ].join(":");
    }

    static #potionOf(itemStack) {
        const potion = itemStack.getComponent(ItemComponentTypes.Potion);
        if (potion === void 0)
            return "";
        return `${potion.potionEffectType}:${potion.potionDeliveryType}`;
    }

    static #dyeableOf(itemStack) {
        const dyeable = itemStack.getComponent(ItemComponentTypes.Dyeable);
        if (dyeable === void 0)
            return "";
        const color = dyeable.color ?? { red: 0, green: 0, blue: 0 };
        return `${color.red},${color.green},${color.blue}`;
    }

    static #inventoryOf(itemStack) {
        const inventory = itemStack.getComponent(ItemComponentTypes.Inventory);
        if (inventory === void 0)
            return "";
        const slots = [];
        for (let i = 0; i < inventory.container.size; i++) {
            const item = inventory.container.getItem(i);
            if (item !== void 0)
                slots.push(`${item.typeId}:${item.amount}`);
        }
        return slots.join(";");
    }
}
