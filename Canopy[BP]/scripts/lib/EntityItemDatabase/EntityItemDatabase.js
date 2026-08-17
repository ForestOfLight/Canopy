import { EntityComponentTypes, InvalidStructureError, StructureSaveMode, world } from "@minecraft/server";
import { WorkingRegion } from "./WorkingRegion";
import { Vector } from "../Vector";
import { EntityItemDatabaseKeyNotFoundError } from "./Errors/EntityItemDatabaseKeyNotFoundError";

export class EntityItemDatabase {
    static #ENTITY_TYPEID = "canopy:nbt_item_database";
    static #ENTITY_TAG_MAX_CHARS = 255;
    static #dimension;
    static #location;
    
    constructor() {
        EntityItemDatabase.#dimension = world.getDimension("overworld");
        EntityItemDatabase.#location = new Vector(1000000, 0, 1000000);
        this.#tryLoadWorkingRegion();
    }

    #tryLoadWorkingRegion() {
        if (!WorkingRegion.isCreated)
            WorkingRegion.createAt(EntityItemDatabase.#dimension, EntityItemDatabase.#location);
    }

    saveContainer(key, containerToSave) {
        this.#assertValid(key);
        const entity = this.#getOrCreateEntity(key);
        const container = this.#resolveContainer(entity);
        this.#writeItemsToContainer(container, containerToSave);
        const structureCreateOptions = {
            includeBlocks: false,
            includeEntities: true,
            saveMode: StructureSaveMode.World
        };
        world.structureManager.delete(key);
        world.structureManager.createFromWorld(key, EntityItemDatabase.#dimension, EntityItemDatabase.#location, EntityItemDatabase.#location, structureCreateOptions);
        entity.remove();
    }

    loadContainer(key, containerToFill) {
        try {
            world.structureManager.place(key, EntityItemDatabase.#dimension, EntityItemDatabase.#location, { includeBlocks: false, includeEntities: true });
        } catch (error) {
            if (error instanceof InvalidStructureError)
                return void 0;
        }
        const entity = this.#getEntity(key);
        const container = this.#resolveContainer(entity);
        this.#writeItemsToContainer(containerToFill, container);
        entity.remove();
    }

    #getOrCreateEntity(key) {
        try {
            return this.#getEntity(key)
        } catch (error) {
            if (error instanceof EntityItemDatabaseKeyNotFoundError)
                return this.#createEntity(key);
            throw error;
        }
    }

    #getEntity(key) {
        const entityQueryOptions = {
            type: EntityItemDatabase.#ENTITY_TYPEID,
            tags: [key],
        };
        const entities = EntityItemDatabase.#dimension.getEntities(entityQueryOptions);
        if (entities.length === 0)
            throw new EntityItemDatabaseKeyNotFoundError(`Item Database Entity with key ${key} was not found.`);
        if (entities.length > 1) {
            console.warn(`Multiple Item Database Entities with key ${key} were found. Only the first will be used and any others will be deleted.`);
            for (let i = 1; i < entities.length; i++) {
                const entity = entities[i];
                try {
                    entity?.remove();
                } catch (error) {
                    console.warn("Error removing Item Database Entity:", error, error.stack);
                }
            }
        }
        return entities[0];
    }
    
    #createEntity(key) {
        const spawnLocation = EntityItemDatabase.#location.add(new Vector(0.5, 0.5, 0.5));
        const entity = EntityItemDatabase.#dimension.spawnEntity(EntityItemDatabase.#ENTITY_TYPEID, spawnLocation, { initialPersistence: true });
        entity.addTag(key);
        return entity;
    }

    #resolveContainer(entity) {
        const entityInventoryComponent = entity.getComponent(EntityComponentTypes.Inventory);
        return entityInventoryComponent.container;
    }

    #assertValid(key) {
        if (key.length > EntityItemDatabase.#ENTITY_TAG_MAX_CHARS)
            throw new Error(`Key must not be longer than ${EntityItemDatabase.#ENTITY_TAG_MAX_CHARS}.`);
    }

    #writeItemsToContainer(writableContainer, sourceContainer) {
        const containerSize = Math.min(writableContainer.size, sourceContainer.size);
        for (let i = 0; i < containerSize; i++) {
            const item = sourceContainer.getItem(i);
            writableContainer.setItem(i, item);
        }
    }
}
