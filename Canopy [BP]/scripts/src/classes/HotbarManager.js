import SRCItemDatabase from 'lib/SRCItemDatabase';

class HotbarManager {
    constructor(player) {
        this.player = player;
        const tableName = 'bar' + player.id.toString().substr(0, 9);
        this.itemDatabase = new SRCItemDatabase(tableName);
        this.lastLoadedHotbar = this.#getLastLoadedHotbar();
    }

    getActiveHotbarItems() {
        const container = this.player.getComponent('minecraft:inventory')?.container;
        const hotbarItems = [];
        for (let slotIndex = 0; slotIndex < 9; slotIndex++) {
            const itemStack = container.getItem(slotIndex);
            if (itemStack) 
                hotbarItems.push({ key: slotIndex, item: itemStack });
            
        }
        return hotbarItems;
    }

    saveHotbar() {
        const index = this.#getLastLoadedHotbar();
        const items = this.getActiveHotbarItems().map(item => ({ ...item, key: `${index}-${item.key}` }));
        this.itemDatabase.setMany(items);
        for (let slotIndex = 0; slotIndex < 9; slotIndex++) {
            if (!items.some(item => item.key === `${index}-${slotIndex}`)) 
                this.itemDatabase.delete(`${index}-${slotIndex}`);
        }
    }

    loadHotbar(index) {
        const playerInventory = this.player.getComponent('inventory').container;
        for (let slotIndex = 0; slotIndex < 9; slotIndex++) {
            const item = this.itemDatabase.get(`${index}-${slotIndex}`);
            if (item)
                playerInventory.setItem(slotIndex, item);
            else
                playerInventory.setItem(slotIndex, null);
        }
        this.player.setDynamicProperty('lastLoadedHotbar', index);
    }

    getItemsString(items) {
        let output = 'Items:';
        for (const slotIndex in items) {
            const itemStruct = items[slotIndex];
            output += `\n${itemStruct.key}: ${itemStruct.item.typeId} x${itemStruct.item.count}`;
        }
        return output;
    }

    #getLastLoadedHotbar() {
        const lastLoadedHotbar = this.player.getDynamicProperty('lastLoadedHotbar');
        if (lastLoadedHotbar === undefined) 
            return 0;
        return parseInt(lastLoadedHotbar, 10);
    }
}

export default HotbarManager;