import { VoxelizableDebugShape } from './VoxelizableDebugShape.js';
import { eulerToBasis, normalToBasis } from './geometry/orient.js';
import { autoSegments, smoothSphere } from './geometry/smooth.js';
import { sphereVoxel } from './geometry/sphere.js';
import { voxelizeOutline } from './geometry/line.js';

export class VoxelizableDebugSphere extends VoxelizableDebugShape {
    #center;
    #radius;
    #rotation;
    #normal;

    constructor(config = {}) {
        super(config);
        this.#center = config.center ?? { x: 0, y: 0, z: 0 };
        this.#radius = config.radius ?? 0;
        this.#rotation = config.rotation;
        this.#normal = config.normal;
    }
    get center() { return this.#center; }
    set center(v) { this.#center = v; this.markGeometryDirty(); }
    get radius() { return this.#radius; }
    set radius(v) { this.#radius = v; this.markGeometryDirty(); }
    get rotation() { return this.#rotation; }
    set rotation(v) { this.#rotation = v; this.markGeometryDirty(); }
    get normal() { return this.#normal; }
    set normal(v) { this.#normal = v; this.markGeometryDirty(); }

    #basis() {
        if (this.#rotation) return eulerToBasis(this.#rotation.x || 0, this.#rotation.y || 0, this.#rotation.z || 0);
        if (this.#normal) return normalToBasis(this.#normal.x, this.#normal.y, this.#normal.z);
        return eulerToBasis(0, 0, 0);
    }

    static get configSchema() {
        return [
            VoxelizableDebugShape.vectorField('center'),
            VoxelizableDebugShape.numberField('radius'),
            VoxelizableDebugShape.vectorField('rotation', true),
            VoxelizableDebugShape.modeField,
            ...VoxelizableDebugShape.edgeFields,
            VoxelizableDebugShape.segmentsField,
            VoxelizableDebugShape.colorField
        ];
    }

    get type() { return 'sphere'; }
    serialize() { return this.serializeGeometry(super.serialize(), ['center', 'radius', 'rotation', 'normal']); }

    computeSegments() {
        const r = this.#radius;
        if (r <= 0) return [];
        const basis = this.#basis();
        const c = this.#center;
        const n = this.segments ?? autoSegments(r);
        if (this.mode === 'smooth')
            return [{ group: 'outer', segments: smoothSphere(basis, c.x, c.y, c.z, r, n) }];
        const res = sphereVoxel(basis, c, r,
            { innerEdge: this.innerEdge, outerEdge: this.outerEdge, fill: this.fill });
        if (res !== null) return res;
        // rotated fallback: voxelize the smooth lat-long outline
        return [{ group: 'outer', segments: voxelizeOutline(smoothSphere(basis, c.x, c.y, c.z, r, n)) }];
    }
}
