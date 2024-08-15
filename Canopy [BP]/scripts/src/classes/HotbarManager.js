import SRCItemDatabase from 'src/classes/SRCItemDatabase';

class HotbarManager {
    constructor(player) {
        this.player = player;
        let tableName = 'bar' + player.id.toString().substr(0, 9);
        this.itemDatabase = new SRCItemDatabase(tableName);
    }

    getActiveHotbarItems() {
        const container = this.player.getComponent('minecraft:inventory')?.container;
        let hotbarItems = [];
        for (let slotIndex = 0; slotIndex < 9; slotIndex++) {
            const itemStack = container.getItem(slotIndex);
            if (itemStack) {
                hotbarItems.push({ key: slotIndex, item: itemStack });
            }
        }
        return hotbarItems;
    }

    saveHotbar(index) {
        if (index === undefined) throw new Error('Index must be provided to save hotbar');
        const items = this.getActiveHotbarItems().map(item => ({ ...item, key: `${index}-${item.key}` }));
        this.itemDatabase.setMany(items);
        for (let slotIndex = 0; slotIndex < 9; slotIndex++) {
            if (!items.some(item => item.key === `${index}-${slotIndex}`)) {
                this.itemDatabase.delete(`${index}-${slotIndex}`);
            }
        }
    }

    loadHotbar(index) {
        let playerInventory = this.player.getComponent('inventory').container;
        for (let slotIndex = 0; slotIndex < 9; slotIndex++) {
            const item = this.itemDatabase.get(`${index}-${slotIndex}`);
            if (item)
                playerInventory.setItem(slotIndex, item);
            else
                playerInventory.setItem(slotIndex, null);
        }
    }

    getItemsString(items) {
        let output = 'Items:';
        for (let slotIndex in items) {
            const itemStruct = items[slotIndex];
            output += `\n${itemStruct.key}: ${itemStruct.item.typeId} x${itemStruct.item.count}`;
        }
        return output;
    }
}

export default HotbarManager;