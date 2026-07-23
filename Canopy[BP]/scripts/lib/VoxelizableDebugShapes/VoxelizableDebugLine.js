// Canopy[BP]/scripts/lib/VoxelizableDebugShapes/VoxelizableDebugLine.js
import { VoxelizableDebugShape } from './VoxelizableDebugShape.js';
import { voxelLine } from './geometry/line.js';

export class VoxelizableDebugLine extends VoxelizableDebugShape {
    #from;
    #to;

    constructor(config = {}) {
        super(config);
        this.#from = config.from ?? { x: 0, y: 0, z: 0 };
        this.#to = config.to ?? { x: 0, y: 0, z: 0 };
    }
    get from() { return this.#from; }
    set from(v) { this.#from = v; this.markGeometryDirty(); }
    get to() { return this.#to; }
    set to(v) { this.#to = v; this.markGeometryDirty(); }

    computeSegments() {
        const f = this.#from;
        const t = this.#to;
        if (f.x === t.x && f.y === t.y && f.z === t.z) return [];
        if (this.mode === 'smooth')
            return [{ group: 'line', segments: [f.x, f.y, f.z, t.x, t.y, t.z] }];
        return [{ group: 'line', segments: voxelLine(f.x, f.y, f.z, t.x, t.y, t.z) }];
    }
}
