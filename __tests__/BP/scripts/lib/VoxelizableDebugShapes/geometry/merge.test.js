import { describe, it, expect } from 'vitest';
import { mergeAxisAligned }
    from '../../../../../../Canopy[BP]/scripts/lib/VoxelizableDebugShapes/geometry/merge.js';

describe('mergeAxisAligned', () => {
    it('merges two touching collinear x-segments', () => {
        const out = mergeAxisAligned([0, 0, 0, 1, 0, 0, 1, 0, 0, 2, 0, 0]);
        expect(out).toEqual([0, 0, 0, 2, 0, 0]);
    });
    it('does not bridge a gap', () => {
        const out = mergeAxisAligned([0, 0, 0, 1, 0, 0, 2, 0, 0, 3, 0, 0]);
        // two separate runs; order within a grid line is ascending
        expect(out).toEqual([0, 0, 0, 1, 0, 0, 2, 0, 0, 3, 0, 0]);
    });
    it('keeps perpendicular segments', () => {
        const out = mergeAxisAligned([0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1, 0]);
        expect(out.length).toBe(12);
    });
});
