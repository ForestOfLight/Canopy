// Canopy[BP]/scripts/lib/VoxelizableDebugShapes/VoxelizableDebugLine.js
import { VoxelizableDebugShape } from './VoxelizableDebugShape.js';
import { voxelLine } from './geometry/line.js';

export class VoxelizableDebugLine extends VoxelizableDebugShape {
    constructor(config = {}) {
        super(config);
        this._from = config.from ?? { x: 0, y: 0, z: 0 };
        this._to = config.to ?? { x: 0, y: 0, z: 0 };
    }
    get from() { return this._from; }
    set from(v) { this._from = v; this._markGeometry(); }
    get to() { return this._to; }
    set to(v) { this._to = v; this._markGeometry(); }

    computeSegments() {
        const f = this._from, t = this._to;
        if (f.x === t.x && f.y === t.y && f.z === t.z) return [];
        if (this._mode === 'smooth')
            return [{ group: 'line', segments: [f.x, f.y, f.z, t.x, t.y, t.z] }];
        return [{ group: 'line', segments: voxelLine(f.x, f.y, f.z, t.x, t.y, t.z) }];
    }
}
