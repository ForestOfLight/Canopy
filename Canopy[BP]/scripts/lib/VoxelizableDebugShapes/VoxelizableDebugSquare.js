import { VoxelizableDebugShape } from './VoxelizableDebugShape.js';
import { eulerToBasis, normalToBasis, isAxisAligned, mapLocal } from './geometry/orient.js';
import { boxVoxel } from './geometry/box.js';
import { voxelizeOutline } from './geometry/line.js';

export class VoxelizableDebugSquare extends VoxelizableDebugShape {
    constructor(config = {}) {
        super(config);
        this._center = config.center;
        this._width = config.width;
        this._height = config.height;
        this._from = config.from;
        this._to = config.to;
        this._rotation = config.rotation;
        this._normal = config.normal;
    }
    get center() { return this._center; }
    set center(v) { this._center = v; this._markGeometry(); }
    get width() { return this._width; }
    set width(v) { this._width = v; this._markGeometry(); }
    get height() { return this._height; }
    set height(v) { this._height = v; this._markGeometry(); }
    get from() { return this._from; }
    set from(v) { this._from = v; this._markGeometry(); }
    get to() { return this._to; }
    set to(v) { this._to = v; this._markGeometry(); }
    get rotation() { return this._rotation; }
    set rotation(v) { this._rotation = v; this._markGeometry(); }
    get normal() { return this._normal; }
    set normal(v) { this._normal = v; this._markGeometry(); }

    _basis() {
        if (this._rotation) return eulerToBasis(this._rotation.x || 0, this._rotation.y || 0, this._rotation.z || 0);
        if (this._normal) return normalToBasis(this._normal.x, this._normal.y, this._normal.z);
        return eulerToBasis(0, 0, 0);
    }
    // planar bounds: hu along local x (width), hv along local z (height), hn = 0
    _bounds() {
        if (this._from && this._to) {
            const f = this._from, t = this._to;
            return {
                cx: (f.x + t.x) / 2, cy: (f.y + t.y) / 2, cz: (f.z + t.z) / 2,
                hu: Math.abs(t.x - f.x) / 2, hv: Math.abs(t.z - f.z) / 2,
            };
        }
        const c = this._center || { x: 0, y: 0, z: 0 };
        return { cx: c.x, cy: c.y, cz: c.z, hu: (this._width || 0) / 2, hv: (this._height || 0) / 2 };
    }
    _corners(basis, b) {
        const c = [];
        for (const su of [-1, 1]) for (const sv of [-1, 1]) {
            const p = [0, 0, 0];
            mapLocal(basis, b.cx, b.cy, b.cz, su * b.hu, sv * b.hv, 0, p, 0);
            c.push(p);
        }
        return c; // order: (--),(-+),(+-),(++)
    }
    _rectEdges(c) {
        const e = (a, d) => [c[a][0], c[a][1], c[a][2], c[d][0], c[d][1], c[d][2]];
        return [...e(0, 1), ...e(1, 3), ...e(3, 2), ...e(2, 0)];
    }

    computeSegments() {
        const b = this._bounds();
        if (b.hu === 0 && b.hv === 0) return [];
        const basis = this._basis();
        const corners = this._corners(basis, b);
        if (this._mode === 'smooth')
            return [{ group: 'outer', segments: this._rectEdges(corners) }];
        if (isAxisAligned(basis)) {
            let a = [Infinity, Infinity, Infinity], d = [-Infinity, -Infinity, -Infinity];
            for (const p of corners) for (let k = 0; k < 3; k++) { a[k] = Math.min(a[k], p[k]); d[k] = Math.max(d[k], p[k]); }
            return boxVoxel(a[0], a[1], a[2], d[0], d[1], d[2],
                { innerEdge: this._innerEdge, outerEdge: this._outerEdge, fill: this._fill });
        }
        return [{ group: 'outer', segments: voxelizeOutline(this._rectEdges(corners)) }];
    }
}
