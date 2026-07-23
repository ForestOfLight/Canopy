import { VoxelizableDebugShape } from './VoxelizableDebugShape.js';
import { eulerToBasis, normalToBasis, isAxisAligned, mapLocal } from './geometry/orient.js';
import { boxVoxel } from './geometry/box.js';
import { voxelizeOutline } from './geometry/line.js';

export class VoxelizableDebugSquare extends VoxelizableDebugShape {
    #center;
    #width;
    #height;
    #from;
    #to;
    #rotation;
    #normal;

    constructor(config = {}) {
        super(config);
        this.#center = config.center;
        this.#width = config.width;
        this.#height = config.height;
        this.#from = config.from;
        this.#to = config.to;
        this.#rotation = config.rotation;
        this.#normal = config.normal;
    }
    get center() { return this.#center; }
    set center(v) { this.#center = v; this.markGeometryDirty(); }
    get width() { return this.#width; }
    set width(v) { this.#width = v; this.markGeometryDirty(); }
    get height() { return this.#height; }
    set height(v) { this.#height = v; this.markGeometryDirty(); }
    get from() { return this.#from; }
    set from(v) { this.#from = v; this.markGeometryDirty(); }
    get to() { return this.#to; }
    set to(v) { this.#to = v; this.markGeometryDirty(); }
    get rotation() { return this.#rotation; }
    set rotation(v) { this.#rotation = v; this.markGeometryDirty(); }
    get normal() { return this.#normal; }
    set normal(v) { this.#normal = v; this.markGeometryDirty(); }

    #basis() {
        if (this.#rotation) return eulerToBasis(this.#rotation.x || 0, this.#rotation.y || 0, this.#rotation.z || 0);
        if (this.#normal) return normalToBasis(this.#normal.x, this.#normal.y, this.#normal.z);
        return eulerToBasis(0, 0, 0);
    }
    // planar bounds: hu along local x (width), hv along local z (height), hn = 0
    #bounds() {
        if (this.#from && this.#to) {
            const f = this.#from;
            const t = this.#to;
            return {
                cx: (f.x + t.x) / 2, cy: (f.y + t.y) / 2, cz: (f.z + t.z) / 2,
                hu: Math.abs(t.x - f.x) / 2, hv: Math.abs(t.z - f.z) / 2,
            };
        }
        const c = this.#center || { x: 0, y: 0, z: 0 };
        return { cx: c.x, cy: c.y, cz: c.z, hu: (this.#width || 0) / 2, hv: (this.#height || 0) / 2 };
    }
    #corners(basis, b) {
        const c = [];
        for (const su of [-1, 1]) {
            for (const sv of [-1, 1]) {
                const p = [0, 0, 0];
                mapLocal(basis, b.cx, b.cy, b.cz, su * b.hu, sv * b.hv, 0, p, 0);
                c.push(p);
            }
        }
        return c; // order: (--),(-+),(+-),(++)
    }
    #rectEdges(c) {
        const e = (a, d) => [c[a][0], c[a][1], c[a][2], c[d][0], c[d][1], c[d][2]];
        return [...e(0, 1), ...e(1, 3), ...e(3, 2), ...e(2, 0)];
    }

    computeSegments() {
        const b = this.#bounds();
        if (b.hu === 0 && b.hv === 0) return [];
        const basis = this.#basis();
        const corners = this.#corners(basis, b);
        if (this.mode === 'smooth')
            return [{ group: 'outer', segments: this.#rectEdges(corners) }];
        if (isAxisAligned(basis)) {
            const a = [Infinity, Infinity, Infinity];
            const d = [-Infinity, -Infinity, -Infinity];
            for (const p of corners) {
                for (let k = 0; k < 3; k++) {
                    a[k] = Math.min(a[k], p[k]);
                    d[k] = Math.max(d[k], p[k]);
                }
            }
            return boxVoxel(a[0], a[1], a[2], d[0], d[1], d[2],
                { innerEdge: this.innerEdge, outerEdge: this.outerEdge, fill: this.fill });
        }
        return [{ group: 'outer', segments: voxelizeOutline(this.#rectEdges(corners)) }];
    }
}
