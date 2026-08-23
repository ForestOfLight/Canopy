import { EntityComponentTypes } from "@minecraft/server";
import { ProxyLayout } from "./ProxyLayout";

export class ProxyInventoryEntity {
    static #TYPE_FAMILY = "canopy:inventory_proxy";

    static #ENTITY_TYPE_IDS = Object.freeze({
        [ProxyLayout.Hopper]: "canopy:inventory_proxy_hopper",
        [ProxyLayout.Chest]: "canopy:inventory_proxy"
    });

    #entity;

    constructor(entity) {
        this.#entity = entity;
    }

    static spawnFor(player, layout = ProxyLayout.Chest) {
        const entity = player.dimension.spawnEntity(
            ProxyInventoryEntity.entityTypeIdFor(layout),
            player.getHeadLocation(),
            { initialPersistence: true }
        );
        return new ProxyInventoryEntity(entity);
    }

    static entityTypeIdFor(layout) {
        return ProxyInventoryEntity.#ENTITY_TYPE_IDS[layout]
            ?? ProxyInventoryEntity.#ENTITY_TYPE_IDS[ProxyLayout.Chest];
    }

    static get entityTypeId() {
        return ProxyInventoryEntity.#ENTITY_TYPE_IDS[ProxyLayout.Chest];
    }

    static get typeFamily() {
        return ProxyInventoryEntity.#TYPE_FAMILY;
    }

    static isProxyEntity(entity) {
        if (entity === void 0)
            return false;
        return Object.values(ProxyInventoryEntity.#ENTITY_TYPE_IDS).includes(entity.typeId);
    }

    static excludeFrom(entityRayResult) {
        return (entityRayResult ?? []).filter(hit => !ProxyInventoryEntity.isProxyEntity(hit?.entity));
    }

    static sweepOrphans(dimension) {
        const orphans = dimension.getEntities({
            families: [ProxyInventoryEntity.#TYPE_FAMILY]
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
