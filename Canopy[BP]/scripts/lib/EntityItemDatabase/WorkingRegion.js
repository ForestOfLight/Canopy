import { BlockVolume, world } from "@minecraft/server";
import { Vector } from "../Vector";

export class WorkingRegion {
    static #dimension;
    static #location;
    static #TICKING_AREA_ID = "EntityItemDatabase";
    static #volume = new Vector(3, 3, 3);

    static #ready = Promise.resolve();

    static get isCreated() {
        return WorkingRegion.#dimension !== void 0 && WorkingRegion.#location !== void 0;
    }

    static get volume() {
        return WorkingRegion.#volume;
    }

    static get dimension() {
        return WorkingRegion.#dimension;
    }

    static get location() {
        return WorkingRegion.#location;
    }

    /**
     * Resolves once the most recent createAt() has finished preparing the region.
     * isCreated flips synchronously, so callers that need loaded chunks must await this instead.
     */
    static get ready() {
        return WorkingRegion.#ready;
    }

    static createAt(dimension, location) {
        WorkingRegion.#ready = WorkingRegion.#prepare(dimension, location);
        return WorkingRegion.#ready;
    }

    static async #prepare(dimension, location) {
        try {
            WorkingRegion.#init(dimension, location);
            await WorkingRegion.#createTickingArea();
            WorkingRegion.#fillWithBedrock();
        } catch (error) {
            console.error("Could not create working region. An error ocurred:", error, error.stack);
            WorkingRegion.remove();
        }
    }

    static remove() {
        WorkingRegion.#dimension = void 0;
        WorkingRegion.#location = void 0;
        try {
            world.tickingAreaManager.removeTickingArea(WorkingRegion.#TICKING_AREA_ID);
        } catch (error) {
            console.warn("Could not remove working region ticking area:", error, error.stack);
        }
    }

    static getEntitiesInside() {
        if (!WorkingRegion.isCreated)
            return [];
        const entityQueryOptions = {
            location: WorkingRegion.#location,
            maxDistance: Math.max(WorkingRegion.volume.x, WorkingRegion.volume.y, WorkingRegion.volume.z)
        };
        return WorkingRegion.#dimension.getEntities(entityQueryOptions);
    }

    static clearEntitiesInside() {
        for (const entity of WorkingRegion.getEntitiesInside()) {
            try {
                entity.remove();
            } catch (error) {
                console.warn("Error removing entity from Working Region:", error, error.stack);
            }
        }
    }

    static #init(dimension, location) {
        if (WorkingRegion.isCreated)
            throw new Error("Cannot create new WorkingRegion. WorkingRegion already exists.");
        WorkingRegion.#dimension = dimension;
        WorkingRegion.#location = location;
    }

    static async #createTickingArea() {
        if (world.tickingAreaManager.hasTickingArea(WorkingRegion.#TICKING_AREA_ID))
            return;
        const bounds = WorkingRegion.#getBounds();
        const tickingAreaOptions = {
            dimension: WorkingRegion.#dimension,
            from: bounds.min,
            to: bounds.max
        };
        await world.tickingAreaManager.createTickingArea(WorkingRegion.#TICKING_AREA_ID, tickingAreaOptions);
    }

    static #fillWithBedrock() {
        const bounds = WorkingRegion.#getBounds();
        const blockVolume = new BlockVolume(bounds.min, bounds.max);
        WorkingRegion.#dimension.fillBlocks(blockVolume, "minecraft:bedrock");
    }

    static #getBounds() {
        const areaSizeOffset = WorkingRegion.#volume.subtract(new Vector(1, 1, 1)).scale(1/2).floor();
        return {
            min: Vector.from(WorkingRegion.#location).subtract(areaSizeOffset),
            max: Vector.from(WorkingRegion.#location).add(areaSizeOffset)
        };
    }
}
