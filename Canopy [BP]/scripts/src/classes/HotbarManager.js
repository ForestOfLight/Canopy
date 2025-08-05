import SRCItemDatabase from "../../lib/SRCItemDatabase/ItemDatabase.js";
import { EntityComponentTypes } from "@minecraft/server";

export class HotbarManager {
    constructor(player) {
        this.player = player;
        const tableName = 'bar' + player.id.toString().substr(0, 9);
        this.itemDatabase = new SRCItemDatabase(tableName);
    }

    saveHotbar() {
        const index = this.getLastLoadedHotbar();
        const items = this.getActiveHotbarItems().map(item => ({ ...item, key: `${index}-${item.key}` }));
        this.itemDatabase.setMany(items);
        for (let slotIndex = 0; slotIndex < 9; slotIndex++) {
            if (!items.some(item => item.key === `${index}-${slotIndex}`))
                this.itemDatabase.delete(`${index}-${slotIndex}`);
        }
    }

    loadHotbar(index) {
        const playerInventory = this.player.getComponent(EntityComponentTypes.Inventory).container;
        for (let slotIndex = 0; slotIndex < 9; slotIndex++) {
            const item = this.itemDatabase.getAsync(`${index}-${slotIndex}`);
            if (item)
                playerInventory.setItem(slotIndex, item);
            else
                playerInventory.setItem(slotIndex, null);
        }
        this.setLastLoadedHotbar(index);
    }

    getActiveHotbarItems() {
        const container = this.player.getComponent(EntityComponentTypes.Inventory)?.container;
        const hotbarItems = [];
        for (let slotIndex = 0; slotIndex < 9; slotIndex++) {
            const itemStack = container.getItem(slotIndex);
            if (itemStack)
                hotbarItems.push({ key: slotIndex, item: itemStack });
        }
        return hotbarItems;
    }

    getItemsString(items) {
        let output = 'Items:';
        for (const slotIndex in items) {
            const itemStruct = items[slotIndex];
            output += `\n${itemStruct.key}: ${itemStruct.item.typeId} x${itemStruct.item.count}`;
        }
        return output;
    }

    setLastLoadedHotbar(index) {
        this.player.setDynamicProperty('lastLoadedHotbar', index);
    }

    getLastLoadedHotbar() {
        const lastLoadedHotbar = this.player.getDynamicProperty('lastLoadedHotbar');
        if (lastLoadedHotbar === void 0) 
            return 0;
        return parseInt(lastLoadedHotbar, 10);
    }
}