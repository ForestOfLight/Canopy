import { EntityItemDatabase } from "../../../lib/EntityItemDatabase/EntityItemDatabase";

export class UnderstudyInventorySaver {
    constructor(understudy) {
        this.understudy = understudy;
        const namespace = `canopy:${understudy.name}-`;
        this.itemDatabase = new EntityItemDatabase();
        this.inventoryKey = `${namespace}inventory`;
        this.equippableKey = `${namespace}equippable`;
    }

    save() {
        this.#saveInventoryItems();
        // this.#saveEquippableItems({ saveNBT: true });
    }

    load() {
        this.#loadInventoryItems();
        // this.#loadEquippableItems();
    }

    #saveInventoryItems() {
        const inventoryContainer = this.understudy.getInventory();
        if (inventoryContainer === void 0)
            return;
        this.itemDatabase.saveContainer(this.inventoryKey, inventoryContainer);
    }

    // #saveEquippableItems({ saveNBT = true } = {}) {
    //     const equippableItems = {};
    //     const equippable = this.understudy.simulatedPlayer.getComponent(EntityComponentTypes.Equippable);
    //     if (equippable !== void 0) {
    //         for (const equipmentSlot in EquipmentSlot) {
    //             const itemStack = equippable.getEquipment(equipmentSlot);
    //             if (itemStack !== void 0)
    //                 equippableItems[equipmentSlot] = itemStack;
    //         }
    //         this.#saveItemsWithoutNBT(this.equippableKey, equippableItems);
    //         if (saveNBT)
    //             this.#saveItemsWithNBT(this.equippableDBKey, equippableItems);
    //     }
    // }

    #loadInventoryItems() {
        const inventoryContainer = this.understudy.getInventory();
        if (inventoryContainer === void 0)
            return;
        this.itemDatabase.loadContainer(this.inventoryKey, inventoryContainer);
    }

    // #loadEquippableItems() {
    //     const equippable = this.understudy.simulatedPlayer.getComponent(EntityComponentTypes.Equippable);
    //     if (equippable === void 0)
    //         return;
    //     const itemsWithoutNBTStr = world.getDynamicProperty(this.equippableKey);
    //     if (itemsWithoutNBTStr === '{}' || itemsWithoutNBTStr === void 0)
    //         return;
    //     const itemsWithoutNBT = JSON.parse(itemsWithoutNBTStr);
    //     const itemsWithNBT = this.itemDatabase.getItems(this.equippableDBKey) ?? [];
    //     for (const equipmentSlot in EquipmentSlot) {
    //         const itemWithoutNBT = itemsWithoutNBT[equipmentSlot];
    //         let itemStack = void 0;
    //         if (itemWithoutNBT !== void 0) {
    //             itemStack = itemsWithNBT.find(item => item?.typeId === itemWithoutNBT?.typeId && item?.amount === itemWithoutNBT?.amount);
    //             if (itemStack === void 0 && itemWithoutNBT && typeof itemWithoutNBT.typeId === 'string' && Number.isInteger(itemWithoutNBT.amount) && itemWithoutNBT.amount > 0)
    //                 itemStack = { typeId: itemWithoutNBT.typeId, amount: itemWithoutNBT.amount };
    //         }
    //         equippable.setEquipment(equipmentSlot, itemStack);
    //     }
    // }
}
