import { Vector } from "../../lib/Vector";

export class StructureBoundsFinder {
    dimension;
    startLocation;
    structureType;
    min;
    max;

    constructor(dimension, startLocation) {
        this.dimension = dimension;
        this.startLocation = Vector.from(startLocation);
        const structureTypes = dimension.getGeneratedStructures(startLocation);
        if (structureTypes.length === 0)
            throw new Error(`[Canopy] No naturally generated structure found at ${this.startLocation}`);
        this.structureType = structureTypes[0];
        this.min = this.findStructureMin();
        this.max = this.findStructureMax();
    }
    
    getBounds() {
        return {
            min: this.findStructureMin(),
            max: this.findStructureMax()
        };
    }

    getMin() {
        return this.min;
    }

    getMax() {
        return this.max;
    }

    getSize() {
        return this.max.subtract(this.min).add(new Vector(1, 1, 1));
    }

    findStructureMin() { // TODO: Throw error for not all chunks loaded
        const min = new Vector(this.startLocation.x, this.startLocation.y, this.startLocation.z)
        while (this.dimension.getGeneratedStructures(min)?.at(0) === this.structureType && this.startLocation.x - min.x < 500)
            min.x--;
        min.x++;
        while (this.dimension.getGeneratedStructures(min)?.at(0) === this.structureType && this.startLocation.y - min.y < 500)
            min.y--;
        min.y++;
        while (this.dimension.getGeneratedStructures(min)?.at(0) === this.structureType && this.startLocation.z - min.z < 500)
            min.z--;
        min.z++;
        return min;
    }

    findStructureMax() { // TODO: Throw error for not all chunks loaded
        const structureType = this.dimension.getGeneratedStructures(this.startLocation)?.at(0);
        const max = new Vector(this.startLocation.x, this.startLocation.y, this.startLocation.z)
        while (this.dimension.getGeneratedStructures(max)?.at(0) === structureType && max.x - this.startLocation.x < 500)
            max.x++;
        max.x--;
        while (this.dimension.getGeneratedStructures(max)?.at(0) === structureType && max.y - this.startLocation.y < 500)
            max.y++;
        max.y--;
        while (this.dimension.getGeneratedStructures(max)?.at(0) === structureType && max.z - this.startLocation.z < 500)
            max.z++;
        max.z--;
        return max;
    }
}