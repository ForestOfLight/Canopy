export class PeekCaptureEntity {
    static #TYPE_ID = "canopy:peek_capture";
    static #TYPE_FAMILY = "canopy:peek_capture";

    #entity;

    constructor(entity) {
        this.#entity = entity;
    }

    static get entityTypeId() {
        return PeekCaptureEntity.#TYPE_ID;
    }

    static get typeFamily() {
        return PeekCaptureEntity.#TYPE_FAMILY;
    }

    static spawnFor(player) {
        const entity = player.dimension.spawnEntity(
            PeekCaptureEntity.#TYPE_ID,
            player.getHeadLocation(),
            { initialPersistence: true }
        );
        return new PeekCaptureEntity(entity);
    }

    static isCaptureEntity(entity) {
        return entity?.typeId === PeekCaptureEntity.#TYPE_ID;
    }

    static excludeFrom(entityRayResult) {
        return (entityRayResult ?? []).filter(hit => !PeekCaptureEntity.isCaptureEntity(hit?.entity));
    }

    static sweepOrphans(dimension) {
        const orphans = dimension.getEntities({
            families: [PeekCaptureEntity.#TYPE_FAMILY]
        });
        orphans.forEach(orphan => PeekCaptureEntity.#tryRemove(orphan));
    }

    get entity() {
        return this.#entity;
    }

    get isValid() {
        return this.#entity?.isValid === true;
    }

    matches(entity) {
        return entity !== void 0 && this.#entity === entity;
    }

    teleportTo(location, dimension) {
        if (!this.isValid)
            return;
        this.#entity.teleport(location, { dimension });
    }

    remove() {
        PeekCaptureEntity.#tryRemove(this.#entity);
        this.#entity = void 0;
    }

    static #tryRemove(entity) {
        try {
            entity?.remove();
        } catch (error) {
            console.warn("[Canopy] Failed to remove peek capture entity:", error);
        }
    }
}
