import { ItemStack } from "@minecraft/server";

export class BulkContainer {
    #items = [];
    #itemTypeId;
    size;
    
    constructor(itemTypeId = "minecraft:stone", size = 54) {
        this.#itemTypeId = itemTypeId;
        this.size = size;
        this.#setupItems();
    }

    getItem(index) {
        return this.#items[index];
    }

    #setupItems() {
        for (let i = 0; i < this.size; i++)
            this.#items.push(new ItemStack(this.#itemTypeId, 64))
    }

    getItemTypeId() {
        return this.#itemTypeId;
    }
}