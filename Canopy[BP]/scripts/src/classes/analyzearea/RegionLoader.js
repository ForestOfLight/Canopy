import { world } from '@minecraft/server';

export class RegionLoader {
    constructor(dimension, min, max, id) {
        this.dimension = dimension;
        this.min = min;
        this.max = max;
        this.id = id;
    }

    #options() {
        return { dimension: this.dimension, from: this.min, to: this.max };
    }

    hasCapacity() {
        return world.tickingAreaManager.hasCapacity(this.#options());
    }

    load() {
        return world.tickingAreaManager.createTickingArea(this.id, this.#options());
    }

    unload() {
        try {
            world.tickingAreaManager.removeTickingArea(this.id);
        } catch {
            // area may already be gone; unload is best-effort
        }
    }
}
