import { VoxelizableDebugShape } from './VoxelizableDebugShape.js';
import { eulerToBasis, normalToBasis } from './geometry/orient.js';
import { autoSegments, smoothArc } from './geometry/smooth.js';
import { arcVoxel2D } from './geometry/arc.js';
import { planeAxes, lift2D } from './geometry/plane.js';
import { mergeAxisAligned } from './geometry/merge.js';
import { voxelizeOutline } from './geometry/line.js';

export class VoxelizableDebugArc extends VoxelizableDebugShape {
    #center;
    #radius;
    #radii;
    #startAngle;
    #endAngle;
    #rotation;
    #normal;

    constructor(config = {}) {
        super(config);
        this.#center = config.center ?? { x: 0, y: 0, z: 0 };
        this.#radius = config.radius;
        this.#radii = config.radii;
        this.#startAngle = config.startAngle ?? 0;
        this.#endAngle = config.endAngle ?? 360;
        this.#rotation = config.rotation;
        this.#normal = config.normal;
    }
    get center() { return this.#center; }
    set center(v) { this.#center = v; this.markGeometryDirty(); }
    get radius() { return this.#radius; }
    set radius(v) { this.#radius = v; this.markGeometryDirty(); }
    get radii() { return this.#radii; }
    set radii(v) { this.#radii = v; this.markGeometryDirty(); }
    get startAngle() { return this.#startAngle; }
    set startAngle(v) { this.#startAngle = v; this.markGeometryDirty(); }
    get endAngle() { return this.#endAngle; }
    set endAngle(v) { this.#endAngle = v; this.markGeometryDirty(); }
    get rotation() { return this.#rotation; }
    set rotation(v) { this.#rotation = v; this.markGeometryDirty(); }
    get normal() { return this.#normal; }
    set normal(v) { this.#normal = v; this.markGeometryDirty(); }

    #basis() {
        if (this.#rotation) return eulerToBasis(this.#rotation.x || 0, this.#rotation.y || 0, this.#rotation.z || 0);
        if (this.#normal) return normalToBasis(this.#normal.x, this.#normal.y, this.#normal.z);
        return eulerToBasis(0, 0, 0);
    }
    #radiiPair() {
        if (this.#radii) return [this.#radii.x || 0, this.#radii.z || 0];
        return [this.#radius || 0, this.#radius || 0];
    }

    computeSegments() {
        const [ru, rv] = this.#radiiPair();
        if (ru <= 0 || rv <= 0 || this.#startAngle === this.#endAngle) return [];
        const basis = this.#basis();
        const c = this.#center;
        const n = this.segments ?? autoSegments(Math.max(1e-6, Math.max(ru, rv)));
        const smooth = smoothArc(basis, c.x, c.y, c.z, ru, rv, this.#startAngle, this.#endAngle, n);
        if (this.mode === 'smooth') return [{ group: 'outer', segments: smooth }];

        const axes = planeAxes(basis);
        if (!axes) return [{ group: 'outer', segments: voxelizeOutline(smooth) }];
        const cArr = [c.x, c.y, c.z];
        const g2d = arcVoxel2D(cArr[axes.u], cArr[axes.v], ru, rv, this.#startAngle, this.#endAngle,
            { innerEdge: this.innerEdge, outerEdge: this.outerEdge, fill: this.fill });
        return g2d.map((g) => ({ group: g.group, segments: mergeAxisAligned(lift2D(axes, c, g.segments)) }));
    }
}
