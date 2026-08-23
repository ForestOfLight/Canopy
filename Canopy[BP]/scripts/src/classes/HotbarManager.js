import { EntityComponentTypes } from "@minecraft/server";
import { EntityItemDatabase } from "../../lib/EntityItemDatabase/EntityItemDatabase";
import { HotbarView } from "./HotbarView";

export class HotbarManager {
    static buildHotbarKey(playerId, index) {
        return `canopy:hotbar-${playerId}-${index}`;
    }

    constructor(player) {
        this.player = player;
        this.itemDatabase = new EntityItemDatabase();
    }

    saveHotbar() {
        const hotbar = this.#resolveHotbar();
        if (hotbar === void 0)
            return;
        this.itemDatabase.saveContainer(HotbarManager.buildHotbarKey(this.player.id, this.getLastLoadedHotbar()), hotbar);
    }

    loadHotbar(index) {
        const hotbar = this.#resolveHotbar();
        if (hotbar === void 0)
            return;
        hotbar.clear();
        this.itemDatabase.loadContainer(HotbarManager.buildHotbarKey(this.player.id, index), hotbar);
        this.setLastLoadedHotbar(index);
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

    #resolveHotbar() {
        const inventoryContainer = this.player.getComponent(EntityComponentTypes.Inventory)?.container;
        if (inventoryContainer === void 0)
            return void 0;
        return new HotbarView(inventoryContainer);
    }
}
