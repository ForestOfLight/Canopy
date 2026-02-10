import { Vector } from "../../lib/Vector";
import { GeneratedStructureError } from "./errors/GeneratedStructureError";

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
        if (structureTypes.length < 1)
            throw new GeneratedStructureError('commands.hss.started.nostructure');
        this.structureType = structureTypes[0];
        this.tryAnalyzeStructureBounds();
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

    getCenterpoint() {
        return this.min.add(this.getSize().multiply(0.5));
    }

    tryAnalyzeStructureBounds() {
        try {
            this.min = this.findStructureMin();
            this.max = this.findStructureMax();
        } catch (error) {
            if (error.name === "LocationInUnloadedChunkError")
                throw new GeneratedStructureError('commands.hss.started.unloaded');
            else if (error.name === "LocationOutOfWorldBoundariesError")
                throw new GeneratedStructureError('commands.hss.started.worldbounds');
            else
                throw error;
        }
    }

    findStructureMin() {
        const min = new Vector(this.startLocation.x, this.startLocation.y, this.startLocation.z)
        while (this.dimension.getGeneratedStructures(min)?.at(0) === this.structureType && this.startLocation.x - min.x < 500)
            min.x--;
        min.x++;
        while (this.dimension.getGeneratedStructures(min)?.at(0) === this.structureType && min.y > this.dimension.heightRange.min)
            min.y--;
        min.y++;
        while (this.dimension.getGeneratedStructures(min)?.at(0) === this.structureType && this.startLocation.z - min.z < 500)
            min.z--;
        min.z++;
        return min;
    }

    findStructureMax() {
        const structureType = this.dimension.getGeneratedStructures(this.startLocation)?.at(0);
        const max = new Vector(this.startLocation.x, this.startLocation.y, this.startLocation.z)
        while (this.dimension.getGeneratedStructures(max)?.at(0) === structureType && max.x - this.startLocation.x < 500)
            max.x++;
        max.x--;
        while (this.dimension.getGeneratedStructures(max)?.at(0) === structureType && max.y < this.dimension.heightRange.max)
            max.y++;
        max.y--;
        while (this.dimension.getGeneratedStructures(max)?.at(0) === structureType && max.z - this.startLocation.z < 500)
            max.z++;
        max.z--;
        return max;
    }
}