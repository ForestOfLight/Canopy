import { VoxelizableDebugShape } from './VoxelizableDebugShape.js';
import { eulerToBasis, normalToBasis } from './geometry/orient.js';
import { autoSegments, smoothArc } from './geometry/smooth.js';
import { planarVoxel } from './geometry/curve.js';

export class VoxelizableDebugCircle extends VoxelizableDebugShape {
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
    #segCount() { return this.segments ?? autoSegments(Math.max(1e-6, this.#radius)); }

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

    get type() { return 'circle'; }
    serialize() { return this.serializeGeometry(super.serialize(), ['center', 'radius', 'rotation', 'normal']); }

    computeSegments() {
        const r = this.#radius;
        if (r <= 0) return [];
        const basis = this.#basis();
        const c = this.#center;
        const n = this.#segCount();
        const smooth = smoothArc(basis, c.x, c.y, c.z, r, r, 0, 360, n);
        if (this.mode === 'smooth') return [{ group: 'outer', segments: smooth }];
        return planarVoxel(basis, c, r, r,
            { innerEdge: this.innerEdge, outerEdge: this.outerEdge, fill: this.fill }, smooth);
    }
}
