class SavedHotbar {
    constructor(index) {
        this.index = index;
        this.hotbar = [];
    }
    
    getHotbar() {
        return this.hotbar;
    }

    setHotbar(items) {
        this.hotbar = items;
    }
}

class HotbarManager {
    constructor(player) {
        this.player = player;
        this.hotbars = [];
        for (let index = 0; index < 9; index++) {
            this.hotbars.push(new SavedHotbar(index));
        }
    }

    getActiveHotbarItems() {
        const container = this.player.getComponent('minecraft:inventory')?.container;
        let hotbarItems = {};
        for (let slotIndex = 0; slotIndex < 9; slotIndex++) {
            const itemStack = container.getItem(slotIndex);
            if (itemStack) {
                hotbarItems[slotIndex] = itemStack;
            }
        }
        return hotbarItems;
    }

    saveHotbar(index, items) {
        this.hotbars[index].setHotbar(items);
    }

    loadHotbar(index) {
        let playerInventory = this.player.getComponent('inventory').container;
        const items = this.hotbars[index].getHotbar();
        for (let slotIndex = 0; slotIndex < 9; slotIndex++) {
            const item = items[slotIndex];
            if (item)
                playerInventory.setItem(slotIndex, item);
            else
                playerInventory.setItem(slotIndex, null);
        }
    }

    getItemsString(items) {
        let output = 'Items:';
        for (let slotIndex in items) {
            output += `${slotIndex}: ${items[slotIndex].typeId} x${items[slotIndex].amount}\n`;
        }
        return output;
    }
}

export default HotbarManager;