import { describe, it, expect } from 'vitest';
import { wireBox, latticeFill, boxVoxel }
    from '../../../../../../Canopy[BP]/scripts/lib/VoxelizableDebugShapes/geometry/box.js';

/** true if flat `out` contains segment (a→b) in either direction. */
function hasSeg(out, a, b) {
    for (let i = 0; i < out.length; i += 6) {
        const s = out.slice(i, i + 6);
        const f = [a[0], a[1], a[2], b[0], b[1], b[2]];
        const r = [b[0], b[1], b[2], a[0], a[1], a[2]];
        if (s.every((v, k) => v === f[k]) || s.every((v, k) => v === r[k])) return true;
    }
    return false;
}

describe('wireBox', () => {
    it('has 12 edges for a proper box', () => {
        expect(wireBox(0, 0, 0, 3, 1, 3).length / 6).toBe(12);
        expect(hasSeg(wireBox(0, 0, 0, 3, 1, 3), [0, 0, 0], [3, 0, 0])).toBe(true);
    });
    it('drops zero-length edges for a flat (square) box', () => {
        // flat on Y: y0==y1 → 4 edges
        expect(wireBox(0, 5, 0, 2, 5, 2).length / 6).toBe(4);
    });
});

describe('boxVoxel', () => {
    it('outerEdge only → outer wireframe via floor/ceil', () => {
        const groups = boxVoxel(0.3, 0, 0.3, 2.7, 1, 2.7, { innerEdge: false, outerEdge: true, fill: false });
        const outer = groups.find((g) => g.group === 'outer');
        expect(hasSeg(outer.segments, [0, 0, 0], [3, 0, 0])).toBe(true);
        expect(outer.segments.length / 6).toBe(12);
    });
    it('innerEdge only → inner wireframe via ceil/floor', () => {
        const groups = boxVoxel(0.3, 0, 0.3, 2.7, 1, 2.7, { innerEdge: true, outerEdge: false, fill: false });
        const inner = groups.find((g) => g.group === 'inner');
        expect(hasSeg(inner.segments, [1, 0, 1], [2, 0, 1])).toBe(true);
    });
    it('empty inner region degenerates to outer', () => {
        // min/max within one cell → inner empty → degenerate to outer box
        const groups = boxVoxel(0.3, 0.3, 0.3, 0.7, 0.7, 0.7, { innerEdge: true, outerEdge: false, fill: false });
        const inner = groups.find((g) => g.group === 'inner');
        expect(hasSeg(inner.segments, [0, 0, 0], [1, 0, 0])).toBe(true);
    });
});
