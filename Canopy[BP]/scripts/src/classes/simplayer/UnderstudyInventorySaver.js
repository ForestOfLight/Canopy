import { EntityItemDatabase } from "../../../lib/EntityItemDatabase/EntityItemDatabase";
import { UnderstudyStorageView } from "./UnderstudyStorageView";

export class UnderstudyInventorySaver {
    static buildInventoryKey(name) {
        return `canopy:${name}-inventory`;
    }

    constructor(understudy) {
        this.understudy = understudy;
        this.itemDatabase = new EntityItemDatabase();
        this.inventoryKey = UnderstudyInventorySaver.buildInventoryKey(understudy.name);
    }

    save() {
        const storage = this.#resolveStorage();
        if (storage === void 0)
            return;
        this.itemDatabase.saveContainer(this.inventoryKey, storage);
    }

    load() {
        const storage = this.#resolveStorage();
        if (storage === void 0)
            return;
        this.itemDatabase.loadContainer(this.inventoryKey, storage);
    }

    #resolveStorage() {
        const inventoryContainer = this.understudy.getInventory();
        if (inventoryContainer === void 0)
            return void 0;
        return new UnderstudyStorageView(inventoryContainer, this.understudy.getEquippable());
    }
}
