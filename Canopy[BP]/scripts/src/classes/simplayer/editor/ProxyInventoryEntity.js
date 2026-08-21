import { EntityComponentTypes } from "@minecraft/server";

export class ProxyInventoryEntity {
    static #ENTITY_TYPE_ID = "canopy:inventory_proxy";

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
        return new ProxyInventoryEntity(entity);
    }

    static get entityTypeId() {
        return ProxyInventoryEntity.#ENTITY_TYPE_ID;
    }

    static sweepOrphans(dimension) {
        const orphans = dimension.getEntities({
            type: ProxyInventoryEntity.#ENTITY_TYPE_ID
        });
        orphans.forEach(orphan => ProxyInventoryEntity.#tryRemove(orphan));
    }

    get entity() {
        return this.#entity;
    }

    get isValid() {
        return this.#entity?.isValid === true;
    }

    get dimensionId() {
        if (!this.isValid)
            return void 0;
        return this.#entity.dimension?.id;
    }

    get container() {
        if (!this.isValid)
            return void 0;
        return this.#entity.getComponent(EntityComponentTypes.Inventory)?.container;
    }

    setName(name) {
        if (!this.isValid || this.#entity.nameTag === name)
            return;
        this.#entity.nameTag = name;
    }

    teleportTo(location, dimension) {
        if (!this.isValid)
            return;
        this.#entity.teleport(location, { dimension });
    }

    dropItem(itemStack) {
        if (!this.isValid)
            return false;
        this.#entity.dimension.spawnItem(itemStack, this.#entity.location);
        return true;
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
