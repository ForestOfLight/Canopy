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
    set from(value) { this.#from = value; this.markGeometryDirty(); }
    get to() { return this.#to; }
    set to(value) { this.#to = value; this.markGeometryDirty(); }

    static get configSchema() {
        return [
            VoxelizableDebugShape.vectorField('from'),
            VoxelizableDebugShape.vectorField('to'),
            VoxelizableDebugShape.modeField,
            VoxelizableDebugShape.colorField
        ];
    }

    get type() { return 'line'; }
    serialize() { return this.serializeGeometry(super.serialize(), ['from', 'to']); }

    computeSegments() {
        const from = this.#from;
        const to = this.#to;
        if (from.x === to.x && from.y === to.y && from.z === to.z)
            return [];
        if (this.mode === 'smooth')
            return [{ group: 'line', segments: [from.x, from.y, from.z, to.x, to.y, to.z] }];
        return [{ group: 'line', segments: voxelLine(from.x, from.y, from.z, to.x, to.y, to.z) }];
    }
}
