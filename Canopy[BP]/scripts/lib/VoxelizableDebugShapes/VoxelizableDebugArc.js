import { VoxelizableDebugShape } from './VoxelizableDebugShape.js';
import { eulerToBasis, normalToBasis } from './geometry/orient.js';
import { autoSegments, smoothArc } from './geometry/smooth.js';
import { arcVoxel2D } from './geometry/arc.js';
import { planeAxes, lift2D } from './geometry/plane.js';
import { mergeAxisAligned } from './geometry/merge.js';
import { voxelizeOutline } from './geometry/line.js';

export class VoxelizableDebugArc extends VoxelizableDebugShape {
    constructor(config = {}) {
        super(config);
        this._center = config.center ?? { x: 0, y: 0, z: 0 };
        this._radius = config.radius;
        this._radii = config.radii;
        this._startAngle = config.startAngle ?? 0;
        this._endAngle = config.endAngle ?? 360;
        this._rotation = config.rotation;
        this._normal = config.normal;
    }
    get center() { return this._center; }
    set center(v) { this._center = v; this._markGeometry(); }
    get radius() { return this._radius; }
    set radius(v) { this._radius = v; this._markGeometry(); }
    get radii() { return this._radii; }
    set radii(v) { this._radii = v; this._markGeometry(); }
    get startAngle() { return this._startAngle; }
    set startAngle(v) { this._startAngle = v; this._markGeometry(); }
    get endAngle() { return this._endAngle; }
    set endAngle(v) { this._endAngle = v; this._markGeometry(); }
    get rotation() { return this._rotation; }
    set rotation(v) { this._rotation = v; this._markGeometry(); }
    get normal() { return this._normal; }
    set normal(v) { this._normal = v; this._markGeometry(); }

    _basis() {
        if (this._rotation) return eulerToBasis(this._rotation.x || 0, this._rotation.y || 0, this._rotation.z || 0);
        if (this._normal) return normalToBasis(this._normal.x, this._normal.y, this._normal.z);
        return eulerToBasis(0, 0, 0);
    }
    _radiiPair() {
        if (this._radii) return [this._radii.x || 0, this._radii.z || 0];
        return [this._radius || 0, this._radius || 0];
    }

    computeSegments() {
        const [ru, rv] = this._radiiPair();
        if (ru <= 0 || rv <= 0 || this._startAngle === this._endAngle) return [];
        const basis = this._basis(), c = this._center;
        const n = this._segmentsOverride ?? autoSegments(Math.max(1e-6, Math.max(ru, rv)));
        const smooth = smoothArc(basis, c.x, c.y, c.z, ru, rv, this._startAngle, this._endAngle, n);
        if (this._mode === 'smooth') return [{ group: 'outer', segments: smooth }];

        const axes = planeAxes(basis);
        if (!axes) return [{ group: 'outer', segments: voxelizeOutline(smooth) }];
        const cArr = [c.x, c.y, c.z];
        const g2d = arcVoxel2D(cArr[axes.u], cArr[axes.v], ru, rv, this._startAngle, this._endAngle,
            { innerEdge: this._innerEdge, outerEdge: this._outerEdge, fill: this._fill });
        return g2d.map((g) => ({ group: g.group, segments: mergeAxisAligned(lift2D(axes, c, g.segments)) }));
    }
}
