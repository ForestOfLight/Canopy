import { VoxelizableDebugShape } from './VoxelizableDebugShape.js';
import { eulerToBasis, normalToBasis, isAxisAligned } from './geometry/orient.js';
import { boxCorners, boxEdges, worldAABB } from './geometry/corners.js';
import { boxVoxel } from './geometry/box.js';
import { voxelizeOutline } from './geometry/line.js';

export class VoxelizableDebugBox extends VoxelizableDebugShape {
    constructor(config = {}) {
        super(config);
        this._center = config.center;
        this._size = config.size;
        this._from = config.from;
        this._to = config.to;
        this._rotation = config.rotation;
        this._normal = config.normal;
    }
    get center() { return this._center; }
    set center(v) { this._center = v; this._markGeometry(); }
    get size() { return this._size; }
    set size(v) { this._size = v; this._markGeometry(); }
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
    // returns {cx,cy,cz, hu,hv,hn}: hu along local x, hv along local z, hn along local y
    _bounds() {
        if (this._from && this._to) {
            const f = this._from, t = this._to;
            return {
                cx: (f.x + t.x) / 2, cy: (f.y + t.y) / 2, cz: (f.z + t.z) / 2,
                hu: Math.abs(t.x - f.x) / 2, hn: Math.abs(t.y - f.y) / 2, hv: Math.abs(t.z - f.z) / 2,
            };
        }
        const c = this._center || { x: 0, y: 0, z: 0 };
        const s = this._size || { x: 0, y: 0, z: 0 };
        return { cx: c.x, cy: c.y, cz: c.z, hu: s.x / 2, hv: s.z / 2, hn: s.y / 2 };
    }

    computeSegments() {
        const b = this._bounds();
        if (b.hu === 0 && b.hv === 0 && b.hn === 0) return [];
        const basis = this._basis();
        const corners = boxCorners(basis, b.cx, b.cy, b.cz, b.hu, b.hv, b.hn);
        if (this._mode === 'smooth')
            return [{ group: 'outer', segments: boxEdges(corners) }];
        if (isAxisAligned(basis)) {
            const [x0, y0, z0, x1, y1, z1] = worldAABB(corners);
            return boxVoxel(x0, y0, z0, x1, y1, z1,
                { innerEdge: this._innerEdge, outerEdge: this._outerEdge, fill: this._fill });
        }
        // rotated fallback: voxelize the wireframe outline (outer only)
        return [{ group: 'outer', segments: voxelizeOutline(boxEdges(corners)) }];
    }
}
