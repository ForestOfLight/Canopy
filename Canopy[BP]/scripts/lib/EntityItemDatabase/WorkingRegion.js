import { BlockVolume, world } from "@minecraft/server";
import { Vector } from "../Vector";

export class WorkingRegion {
    static #dimension;
    static #location;
    static #TICKING_AREA_ID = "EntityItemDatabase";
    static #tickingArea;
    static #volume = new Vector(3, 3, 3);

    static async createAt(dimension, location) {
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
        world.tickingAreaManager.removeTickingArea(WorkingRegion.#tickingArea);
    }

    static get isCreated() {
        return WorkingRegion.#dimension !== void 0 && WorkingRegion.#location !== void 0;
    }

    static get volume() {
        return WorkingRegion.#volume;
    }

    static #init(dimension, location) {
        if (WorkingRegion.isCreated)
            throw new Error("Cannot create new WorkingRegion. WorkingRegion already exists.");
        WorkingRegion.#dimension = dimension;
        WorkingRegion.#location = location;
    }

    static async #createTickingArea() {
        const bounds = WorkingRegion.#getBounds();
        const tickingAreaOptions = {
            dimension: WorkingRegion.#dimension,
            from: bounds.min,
            to: bounds.max
        };
        WorkingRegion.#tickingArea = await world.tickingAreaManager.createTickingArea(WorkingRegion.#TICKING_AREA_ID, tickingAreaOptions);
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
