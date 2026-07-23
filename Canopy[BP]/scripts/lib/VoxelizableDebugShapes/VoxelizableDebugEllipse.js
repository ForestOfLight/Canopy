import { VoxelizableDebugShape } from './VoxelizableDebugShape.js';
import { eulerToBasis, normalToBasis } from './geometry/orient.js';
import { autoSegments, smoothArc } from './geometry/smooth.js';
import { planarVoxel } from './geometry/curve.js';

export class VoxelizableDebugEllipse extends VoxelizableDebugShape {
    #center;
    #radii;
    #rotation;
    #normal;

    constructor(config = {}) {
        super(config);
        this.#center = config.center ?? { x: 0, y: 0, z: 0 };
        this.#radii = config.radii ?? { x: 0, z: 0 };
        this.#rotation = config.rotation;
        this.#normal = config.normal;
    }
    get center() { return this.#center; }
    set center(v) { this.#center = v; this.markGeometryDirty(); }
    get radii() { return this.#radii; }
    set radii(v) { this.#radii = v; this.markGeometryDirty(); }
    get rotation() { return this.#rotation; }
    set rotation(v) { this.#rotation = v; this.markGeometryDirty(); }
    get normal() { return this.#normal; }
    set normal(v) { this.#normal = v; this.markGeometryDirty(); }

    #basis() {
        if (this.#rotation) return eulerToBasis(this.#rotation.x || 0, this.#rotation.y || 0, this.#rotation.z || 0);
        if (this.#normal) return normalToBasis(this.#normal.x, this.#normal.y, this.#normal.z);
        return eulerToBasis(0, 0, 0);
    }

    get type() { return 'ellipse'; }
    serialize() { return this.serializeGeometry(super.serialize(), ['center', 'radii', 'rotation', 'normal']); }

    computeSegments() {
        const ru = this.#radii.x || 0;
        const rv = this.#radii.z || 0;
        if (ru <= 0 || rv <= 0) return [];
        const basis = this.#basis();
        const c = this.#center;
        const n = this.segments ?? autoSegments(Math.max(1e-6, Math.max(ru, rv)));
        const smooth = smoothArc(basis, c.x, c.y, c.z, ru, rv, 0, 360, n);
        if (this.mode === 'smooth') return [{ group: 'outer', segments: smooth }];
        return planarVoxel(basis, c, ru, rv,
            { innerEdge: this.innerEdge, outerEdge: this.outerEdge, fill: this.fill }, smooth);
    }
}
