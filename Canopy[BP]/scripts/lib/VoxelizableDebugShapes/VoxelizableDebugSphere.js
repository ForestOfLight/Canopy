import { VoxelizableDebugShape } from './VoxelizableDebugShape.js';
import { eulerToBasis, normalToBasis } from './geometry/orient.js';
import { autoSegments, smoothSphere } from './geometry/smooth.js';
import { sphereVoxel } from './geometry/sphere.js';
import { voxelizeOutline } from './geometry/line.js';

export class VoxelizableDebugSphere extends VoxelizableDebugShape {
    constructor(config = {}) {
        super(config);
        this._center = config.center ?? { x: 0, y: 0, z: 0 };
        this._radius = config.radius ?? 0;
        this._rotation = config.rotation;
        this._normal = config.normal;
    }
    get center() { return this._center; }
    set center(v) { this._center = v; this._markGeometry(); }
    get radius() { return this._radius; }
    set radius(v) { this._radius = v; this._markGeometry(); }
    get rotation() { return this._rotation; }
    set rotation(v) { this._rotation = v; this._markGeometry(); }
    get normal() { return this._normal; }
    set normal(v) { this._normal = v; this._markGeometry(); }

    _basis() {
        if (this._rotation) return eulerToBasis(this._rotation.x || 0, this._rotation.y || 0, this._rotation.z || 0);
        if (this._normal) return normalToBasis(this._normal.x, this._normal.y, this._normal.z);
        return eulerToBasis(0, 0, 0);
    }

    computeSegments() {
        const r = this._radius;
        if (r <= 0) return [];
        const basis = this._basis(), c = this._center;
        const n = this._segmentsOverride ?? autoSegments(r);
        if (this._mode === 'smooth')
            return [{ group: 'outer', segments: smoothSphere(basis, c.x, c.y, c.z, r, n) }];
        const res = sphereVoxel(basis, c, r,
            { innerEdge: this._innerEdge, outerEdge: this._outerEdge, fill: this._fill });
        if (res !== null) return res;
        // rotated fallback: voxelize the smooth lat-long outline
        return [{ group: 'outer', segments: voxelizeOutline(smoothSphere(basis, c.x, c.y, c.z, r, n)) }];
    }
}
