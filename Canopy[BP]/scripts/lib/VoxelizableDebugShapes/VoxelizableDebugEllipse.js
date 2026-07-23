import { VoxelizableDebugShape } from './VoxelizableDebugShape.js';
import { eulerToBasis, normalToBasis } from './geometry/orient.js';
import { autoSegments, smoothArc } from './geometry/smooth.js';
import { planarVoxel } from './geometry/curve.js';

export class VoxelizableDebugEllipse extends VoxelizableDebugShape {
    constructor(config = {}) {
        super(config);
        this._center = config.center ?? { x: 0, y: 0, z: 0 };
        this._radii = config.radii ?? { x: 0, z: 0 };
        this._rotation = config.rotation;
        this._normal = config.normal;
    }
    get center() { return this._center; }
    set center(v) { this._center = v; this._markGeometry(); }
    get radii() { return this._radii; }
    set radii(v) { this._radii = v; this._markGeometry(); }
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
        const ru = this._radii.x || 0, rv = this._radii.z || 0;
        if (ru <= 0 || rv <= 0) return [];
        const basis = this._basis(), c = this._center;
        const n = this._segmentsOverride ?? autoSegments(Math.max(1e-6, Math.max(ru, rv)));
        const smooth = smoothArc(basis, c.x, c.y, c.z, ru, rv, 0, 360, n);
        if (this._mode === 'smooth') return [{ group: 'outer', segments: smooth }];
        return planarVoxel(basis, c, ru, rv,
            { innerEdge: this._innerEdge, outerEdge: this._outerEdge, fill: this._fill }, smooth);
    }
}
