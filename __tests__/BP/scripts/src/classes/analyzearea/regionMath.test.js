import { describe, it, expect } from 'vitest';
import { normalizeCorners, regionCapacity, sameCorner } from '../../../../../../Canopy[BP]/scripts/src/classes/analyzearea/regionMath.js';

describe('regionMath', () => {
    it('normalizes swapped/negative corners to floored min/max', () => {
        const { min, max } = normalizeCorners({ x: 5.9, y: 2, z: -3 }, { x: -1, y: 10.2, z: 4 });
        expect(min).toEqual({ x: -1, y: 2, z: -3 });
        expect(max).toEqual({ x: 5, y: 10, z: 4 });
    });

    it('computes inclusive capacity', () => {
        expect(regionCapacity({ x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1 })).toBe(8);
        expect(regionCapacity({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 })).toBe(1);
    });

    it('compares corners exactly', () => {
        expect(sameCorner({ x: 1, y: 2, z: 3 }, { x: 1, y: 2, z: 3 })).toBe(true);
        expect(sameCorner({ x: 1, y: 2, z: 3 }, { x: 1, y: 2, z: 4 })).toBe(false);
    });
});
