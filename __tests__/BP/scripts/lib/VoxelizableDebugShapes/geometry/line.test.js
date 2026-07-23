import { describe, it, expect } from 'vitest';
import { voxelLine, voxelizeOutline }
    from '../../../../../../Canopy[BP]/scripts/lib/VoxelizableDebugShapes/geometry/line.js';

describe('voxelLine', () => {
    it('a straight axis line is a single merged segment', () => {
        expect(voxelLine(0, 0, 0, 3, 0, 0)).toEqual([0, 0, 0, 3, 0, 0]);
    });
    it('a 45° XZ diagonal alternates x,z steps', () => {
        // (0,0,0)->(2,0,2): x,z,x,z staircase
        expect(voxelLine(0, 0, 0, 2, 0, 2)).toEqual([
            0, 0, 0, 1, 0, 0,
            1, 0, 0, 1, 0, 1,
            1, 0, 1, 2, 0, 1,
            2, 0, 1, 2, 0, 2,
        ]);
    });
    it('degenerate (same point) yields no segments', () => {
        expect(voxelLine(5, 5, 5, 5, 5, 5)).toEqual([]);
    });
});

describe('voxelizeOutline', () => {
    it('voxelizes each edge and merges', () => {
        // two straight axis edges → two merged segments
        const out = voxelizeOutline([0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 3, 0]);
        expect(out.length / 6).toBe(2);
    });
});
