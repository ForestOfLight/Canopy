import { VoxelizableDebugShape } from './VoxelizableDebugShape.js';
import { eulerToBasis, normalToBasis, isAxisAligned } from './geometry/orient.js';
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
    set center(v) { this.#center = v; this.markGeometryDirty(); }
    get size() { return this.#size; }
    set size(v) { this.#size = v; this.markGeometryDirty(); }
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
    // returns {cx,cy,cz, hu,hv,hn}: hu along local x, hv along local z, hn along local y
    #bounds() {
        if (this.#from && this.#to) {
            const f = this.#from;
            const t = this.#to;
            return {
                cx: (f.x + t.x) / 2, cy: (f.y + t.y) / 2, cz: (f.z + t.z) / 2,
                hu: Math.abs(t.x - f.x) / 2, hn: Math.abs(t.y - f.y) / 2, hv: Math.abs(t.z - f.z) / 2,
            };
        }
        const c = this.#center || { x: 0, y: 0, z: 0 };
        const s = this.#size || { x: 0, y: 0, z: 0 };
        return { cx: c.x, cy: c.y, cz: c.z, hu: s.x / 2, hv: s.z / 2, hn: s.y / 2 };
    }

    computeSegments() {
        const b = this.#bounds();
        if (b.hu === 0 && b.hv === 0 && b.hn === 0) return [];
        const basis = this.#basis();
        const corners = boxCorners(basis, b.cx, b.cy, b.cz, b.hu, b.hv, b.hn);
        if (this.mode === 'smooth')
            return [{ group: 'outer', segments: boxEdges(corners) }];
        if (isAxisAligned(basis)) {
            const [x0, y0, z0, x1, y1, z1] = worldAABB(corners);
            return boxVoxel(x0, y0, z0, x1, y1, z1,
                { innerEdge: this.innerEdge, outerEdge: this.outerEdge, fill: this.fill });
        }
        // rotated fallback: voxelize the wireframe outline (outer only)
        return [{ group: 'outer', segments: voxelizeOutline(boxEdges(corners)) }];
    }
}
