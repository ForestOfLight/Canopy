import { EntityComponentTypes, EquipmentSlot, world } from "@minecraft/server";
import SRCItemDatabase from "../../../lib/SRCItemDatabase/ItemDatabase.js";

export class UnderstudyInventorySaver {
    constructor(understudy) {
        this.understudy = understudy;
        const tableName = `bot_${understudy.name.substr(0, 8)}`;
        this.itemDatabase = new SRCItemDatabase(tableName);
        this.inventoryDP = `${tableName}_inventory`;
        this.equippableDP = `${tableName}_equippable`;
        this.inventoryDBKey = 'inv';
        this.equippableDBKey = 'equ';
    }

    save() {
        this.#saveInventoryItems({ saveNBT: true });
        this.#saveEquippableItems({ saveNBT: true });
    }

    saveWithoutNBT() {
        this.#saveInventoryItems({ saveNBT: false });
        this.#saveEquippableItems({ saveNBT: false });
    }

    load() {
        this.#loadInventoryItems();
        this.#loadEquippableItems();
    }

    #saveInventoryItems({ saveNBT = true } = {}) {
        const inventoryItems = {};
        const inventoryContainer = this.understudy.getInventory();
        if (inventoryContainer !== void 0) {
            for (let i = 0; i < inventoryContainer.size; i++) {
                const itemStack = inventoryContainer.getItem(i);
                inventoryItems[i] = itemStack ?? void 0;
            }
            this.#saveItemsWithoutNBT(this.inventoryDP, inventoryItems);
            if (saveNBT)
                this.#saveItemsWithNBT(this.inventoryDBKey, inventoryItems);
        }
    }

    #saveEquippableItems({ saveNBT = true } = {}) {
        const equippableItems = {};
        const equippable = this.understudy.simulatedPlayer.getComponent(EntityComponentTypes.Equippable);
        if (equippable !== void 0) {
            for (const equipmentSlot in EquipmentSlot) {
                const itemStack = equippable.getEquipment(equipmentSlot);
                if (itemStack !== void 0)
                    equippableItems[equipmentSlot] = itemStack;
            }
            this.#saveItemsWithoutNBT(this.equippableDP, equippableItems);
            if (saveNBT)
                this.#saveItemsWithNBT(this.equippableDBKey, equippableItems);
        }
    }

    #saveItemsWithoutNBT(dynamicProperty, itemStacks) {
        const items = {};
        for (const [key, itemStack] of Object.entries(itemStacks)) {
            if (itemStack)
                items[key] = { typeId: itemStack.typeId, amount: itemStack.amount };
        }
        world.setDynamicProperty(dynamicProperty, JSON.stringify(items));
    }

    #saveItemsWithNBT(DBKey, itemStacks) {
        const itemsWithNBT = Object.values(itemStacks).filter(item => item !== void 0);
        this.itemDatabase.setItems(DBKey, itemsWithNBT);
    }

    #loadInventoryItems() {
        const inventoryContainer = this.understudy.getInventory();
        if (inventoryContainer === void 0)
            return;
        const itemsWithoutNBTStr = world.getDynamicProperty(this.inventoryDP);
        if (itemsWithoutNBTStr === '{}' || itemsWithoutNBTStr === void 0)
            return;
        const itemsWithoutNBT = JSON.parse(itemsWithoutNBTStr);
        const itemsWithNBT = this.itemDatabase.getItems(this.inventoryDBKey) ?? [];
        for (let i = 0; i < inventoryContainer.size; i++) {
            const itemWithoutNBT = itemsWithoutNBT[i];
            let itemStack = void 0;
            if (itemWithoutNBT !== void 0) {
                const foundIndex = itemsWithNBT.findIndex(item => item?.typeId === itemWithoutNBT?.typeId && item?.amount === itemWithoutNBT?.amount);
                if (foundIndex >= 0) {
                    itemStack = itemsWithNBT[foundIndex];
                    itemsWithNBT.splice(foundIndex, 1);
                } else if (itemWithoutNBT && typeof itemWithoutNBT.typeId === 'string' && Number.isInteger(itemWithoutNBT.amount) && itemWithoutNBT.amount > 0) {
                    itemStack = { typeId: itemWithoutNBT.typeId, amount: itemWithoutNBT.amount };
                }
            }
            inventoryContainer.setItem(i, itemStack);
        }
    }

    #loadEquippableItems() {
        const equippable = this.understudy.simulatedPlayer.getComponent(EntityComponentTypes.Equippable);
        if (equippable === void 0)
            return;
        const itemsWithoutNBTStr = world.getDynamicProperty(this.equippableDP);
        if (itemsWithoutNBTStr === '{}' || itemsWithoutNBTStr === void 0)
            return;
        const itemsWithoutNBT = JSON.parse(itemsWithoutNBTStr);
        const itemsWithNBT = this.itemDatabase.getItems(this.equippableDBKey) ?? [];
        for (const equipmentSlot in EquipmentSlot) {
            const itemWithoutNBT = itemsWithoutNBT[equipmentSlot];
            let itemStack = void 0;
            if (itemWithoutNBT !== void 0) {
                itemStack = itemsWithNBT.find(item => item?.typeId === itemWithoutNBT?.typeId && item?.amount === itemWithoutNBT?.amount);
                if (itemStack === void 0 && itemWithoutNBT && typeof itemWithoutNBT.typeId === 'string' && Number.isInteger(itemWithoutNBT.amount) && itemWithoutNBT.amount > 0)
                    itemStack = { typeId: itemWithoutNBT.typeId, amount: itemWithoutNBT.amount };
            }
            equippable.setEquipment(equipmentSlot, itemStack);
        }
    }
}
