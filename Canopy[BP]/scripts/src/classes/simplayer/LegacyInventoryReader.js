import { InvalidStructureError, ItemStack, world } from "@minecraft/server";
import { WorkingRegion } from "../../../lib/EntityItemDatabase/WorkingRegion";
import { UnderstudyStorageView } from "./UnderstudyStorageView";

export class LegacyInventoryReader {
    static #STRUCTURE_KEY_PATTERN = /^bot_(.{1,8})_item:(?:inv|equ)$/;
    static #PLAYER_INVENTORY_SIZE = 36;
    static #ITEM_ENTITY_TYPEID = "minecraft:item";
    static #ITEM_COMPONENT_ID = "minecraft:item";

    #inventoryKey;
    #equippableKey;
    #inventoryDP;
    #equippableDP;

    static findSavedNames() {
        const names = new Set();
        for (const structureId of world.structureManager.getWorldStructureIds()) {
            const match = LegacyInventoryReader.#STRUCTURE_KEY_PATTERN.exec(structureId);
            if (match !== null)
                names.add(match[1]);
        }
        return names;
    }

    constructor(truncatedName) {
        this.#inventoryKey = `bot_${truncatedName}_item:inv`;
        this.#equippableKey = `bot_${truncatedName}_item:equ`;
        this.#inventoryDP = `bot_${truncatedName}_inventory`;
        this.#equippableDP = `bot_${truncatedName}_equippable`;
    }

    readStorage() {
        const inventoryItems = this.#readInventoryItems();
        const equipmentItems = this.#readEquipmentItems();
        return this.#buildStorageView(inventoryItems, equipmentItems);
    }

    remove() {
        world.structureManager.delete(this.#inventoryKey);
        world.structureManager.delete(this.#equippableKey);
        world.setDynamicProperty(this.#inventoryDP, void 0);
        world.setDynamicProperty(this.#equippableDP, void 0);
    }

    #buildStorageView(inventoryItems, equipmentItems) {
        const inventoryContainer = {
            size: LegacyInventoryReader.#PLAYER_INVENTORY_SIZE,
            getItem: (slotIndex) => inventoryItems[slotIndex]
        };
        const equippable = {
            getEquipment: (equipmentSlot) => equipmentItems[equipmentSlot]
        };
        return new UnderstudyStorageView(inventoryContainer, equippable);
    }

    #readInventoryItems() {
        const slotEntries = this.#readSlotEntries(this.#inventoryDP);
        if (slotEntries === void 0)
            return [];
        const savedItems = this.#placeAndCollectItems(this.#inventoryKey);
        const inventoryItems = [];
        for (let i = 0; i < LegacyInventoryReader.#PLAYER_INVENTORY_SIZE; i++)
            inventoryItems[i] = this.#resolveItemStack(slotEntries[i], savedItems);
        return inventoryItems;
    }

    #readEquipmentItems() {
        const slotEntries = this.#readSlotEntries(this.#equippableDP);
        if (slotEntries === void 0)
            return {};
        const savedItems = this.#placeAndCollectItems(this.#equippableKey);
        const equipmentItems = {};
        for (const [equipmentSlot, slotEntry] of Object.entries(slotEntries)) {
            const itemStack = this.#resolveItemStack(slotEntry, savedItems);
            if (itemStack !== void 0)
                equipmentItems[equipmentSlot] = itemStack;
        }
        return equipmentItems;
    }

    #readSlotEntries(dynamicProperty) {
        const slotEntriesStr = world.getDynamicProperty(dynamicProperty);
        if (typeof slotEntriesStr !== 'string')
            return void 0;
        let slotEntries;
        try {
            slotEntries = JSON.parse(slotEntriesStr);
        } catch (error) {
            console.warn(`[Canopy] Could not parse legacy simplayer inventory property '${dynamicProperty}':`, error);
            return void 0;
        }
        if (slotEntries === null || typeof slotEntries !== 'object')
            return void 0;
        return slotEntries;
    }

    #placeAndCollectItems(structureKey) {
        try {
            world.structureManager.place(structureKey, WorkingRegion.dimension, WorkingRegion.location, { includeBlocks: false, includeEntities: true });
        } catch (error) {
            if (error instanceof InvalidStructureError)
                return [];
            throw error;
        }
        try {
            return WorkingRegion.getEntitiesInside()
                .filter(entity => entity.typeId === LegacyInventoryReader.#ITEM_ENTITY_TYPEID)
                .map(entity => entity.getComponent(LegacyInventoryReader.#ITEM_COMPONENT_ID)?.itemStack)
                .filter(itemStack => itemStack !== void 0);
        } finally {
            WorkingRegion.clearEntitiesInside();
        }
    }

    #resolveItemStack(slotEntry, savedItems) {
        if (!LegacyInventoryReader.#isValidSlotEntry(slotEntry))
            return void 0;
        const foundIndex = savedItems.findIndex(itemStack => itemStack.typeId === slotEntry.typeId && itemStack.amount === slotEntry.amount);
        if (foundIndex !== -1)
            return savedItems.splice(foundIndex, 1)[0];
        try {
            return new ItemStack(slotEntry.typeId, slotEntry.amount);
        } catch (error) {
            console.warn(`[Canopy] Dropping legacy simplayer item '${slotEntry.typeId}' that can no longer be created:`, error);
            return void 0;
        }
    }

    static #isValidSlotEntry(slotEntry) {
        return slotEntry !== null
            && typeof slotEntry === 'object'
            && typeof slotEntry.typeId === 'string'
            && Number.isInteger(slotEntry.amount)
            && slotEntry.amount > 0;
    }
}
