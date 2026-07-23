import { VoxelizableDebugShape } from './VoxelizableDebugShape.js';
import { OrientationFrame } from './geometry/OrientationFrame.js';
import { boxCorners, boxEdges, worldAABB } from './geometry/corners.js';
import { boxVoxel } from './geometry/box.js';
import { voxelizeOutline } from './geometry/line.js';

export class VoxelizableDebugBox extends VoxelizableDebugShape {
    #center;
    #size;
    #from;
    #to;
    #rotation;
    #normal;

    constructor(config = {}) {
        super(config);
        this.#center = config.center;
        this.#size = config.size;
        this.#from = config.from;
        this.#to = config.to;
        this.#rotation = config.rotation;
        this.#normal = config.normal;
    }
    get center() { return this.#center; }
    set center(value) { this.#center = value; this.markGeometryDirty(); }
    get size() { return this.#size; }
    set size(value) { this.#size = value; this.markGeometryDirty(); }
    get from() { return this.#from; }
    set from(value) { this.#from = value; this.markGeometryDirty(); }
    get to() { return this.#to; }
    set to(value) { this.#to = value; this.markGeometryDirty(); }
    get rotation() { return this.#rotation; }
    set rotation(value) { this.#rotation = value; this.markGeometryDirty(); }
    get normal() { return this.#normal; }
    set normal(value) { this.#normal = value; this.markGeometryDirty(); }

    #frame() {
        if (this.#rotation)
            return OrientationFrame.fromEuler(this.#rotation.x || 0, this.#rotation.y || 0, this.#rotation.z || 0);
        if (this.#normal)
            return OrientationFrame.fromNormal(this.#normal.x, this.#normal.y, this.#normal.z);
        return OrientationFrame.fromEuler(0, 0, 0);
    }
    #bounds() {
        if (this.#from && this.#to) {
            const from = this.#from;
            const to = this.#to;
            return {
                centerX: (from.x + to.x) / 2,
                centerY: (from.y + to.y) / 2,
                centerZ: (from.z + to.z) / 2,
                halfU: Math.abs(to.x - from.x) / 2,
                halfNormal: Math.abs(to.y - from.y) / 2,
                halfV: Math.abs(to.z - from.z) / 2,
            };
        }
        const center = this.#center || { x: 0, y: 0, z: 0 };
        const size = this.#size || { x: 0, y: 0, z: 0 };
        return {
            centerX: center.x,
            centerY: center.y,
            centerZ: center.z,
            halfU: size.x / 2,
            halfV: size.z / 2,
            halfNormal: size.y / 2,
        };
    }

    static get configSchema() {
        return [
            VoxelizableDebugShape.vectorField('from'),
            VoxelizableDebugShape.vectorField('to'),
            VoxelizableDebugShape.vectorField('rotation', true),
            VoxelizableDebugShape.modeField,
            ...VoxelizableDebugShape.edgeFields,
            VoxelizableDebugShape.colorField
        ];
    }

    get type() { return 'box'; }
    serialize() { return this.serializeGeometry(super.serialize(), ['center', 'size', 'from', 'to', 'rotation', 'normal']); }

    computeSegments() {
        const bounds = this.#bounds();
        if (bounds.halfU === 0 && bounds.halfV === 0 && bounds.halfNormal === 0)
            return [];
        const frame = this.#frame();
        const corners = boxCorners(frame, bounds.centerX, bounds.centerY, bounds.centerZ, bounds.halfU, bounds.halfV, bounds.halfNormal);
        if (this.mode === 'smooth')
            return [{ group: 'outer', segments: boxEdges(corners) }];
        if (frame.isAxisAligned()) {
            const [minX, minY, minZ, maxX, maxY, maxZ] = worldAABB(corners);
            return boxVoxel(minX, minY, minZ, maxX, maxY, maxZ,
                { innerEdge: this.innerEdge, outerEdge: this.outerEdge, fill: this.fill });
        }
        return [{ group: 'outer', segments: voxelizeOutline(boxEdges(corners)) }];
    }
}
