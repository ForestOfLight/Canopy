import { EntityComponentTypes } from "@minecraft/server";

export class ProxyInventoryEntity {
    static PROXY_TAG = "canopy:inventory_proxy";
    static #ENTITY_TYPE_ID = "canopy:nbt_item_database";
    static #BECOME_PROXY_EVENT = "canopy:become_inventory_proxy";

    #entity;

    constructor(entity) {
        this.#entity = entity;
    }

    static spawnFor(player) {
        const entity = player.dimension.spawnEntity(
            ProxyInventoryEntity.#ENTITY_TYPE_ID,
            player.getHeadLocation(),
            { initialPersistence: true }
        );
        entity.addTag(ProxyInventoryEntity.PROXY_TAG);
        entity.triggerEvent(ProxyInventoryEntity.#BECOME_PROXY_EVENT);
        return new ProxyInventoryEntity(entity);
    }

    static sweepOrphans(dimension) {
        const orphans = dimension.getEntities({
            type: ProxyInventoryEntity.#ENTITY_TYPE_ID,
            tags: [ProxyInventoryEntity.PROXY_TAG]
        });
        orphans.forEach(orphan => ProxyInventoryEntity.#tryRemove(orphan));
    }

    get entity() {
        return this.#entity;
    }

    get isValid() {
        return this.#entity?.isValid === true;
    }

    get container() {
        if (!this.isValid)
            return void 0;
        return this.#entity.getComponent(EntityComponentTypes.Inventory)?.container;
    }

    teleportTo(location) {
        if (!this.isValid)
            return;
        this.#entity.teleport(location);
    }

    remove() {
        ProxyInventoryEntity.#tryRemove(this.#entity);
        this.#entity = void 0;
    }

    static #tryRemove(entity) {
        try {
            entity?.remove();
        } catch (error) {
            console.warn("[Canopy] Failed to remove inventory proxy entity:", error);
        }
    }
}
