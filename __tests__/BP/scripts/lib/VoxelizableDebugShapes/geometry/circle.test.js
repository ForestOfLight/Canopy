import { describe, it, expect } from 'vitest';
import { circleVoxel2D, coveredSet, insideSet }
    from '../../../../../../Canopy[BP]/scripts/lib/VoxelizableDebugShapes/geometry/circle.js';

describe('cell classification', () => {
    it('inside ⊆ covered', () => {
        const cov = coveredSet(0.5, 0.5, 4, 4);
        const ins = insideSet(0.5, 0.5, 4, 4);
        for (const k of ins) expect(cov.has(k)).toBe(true);
    });
});

describe('circleVoxel2D', () => {
    it('outer silhouette is within the radius-bounding box and non-empty', () => {
        const [outer] = circleVoxel2D(0.5, 0.5, 3, 3, { outerEdge: true, innerEdge: false, fill: false });
        expect(outer.segments.length).toBeGreaterThan(0);
        let minP = Infinity, maxP = -Infinity;
        for (let i = 0; i < outer.segments.length; i += 2) { minP = Math.min(minP, outer.segments[i]); maxP = Math.max(maxP, outer.segments[i]); }
        expect(minP).toBeGreaterThanOrEqual(-3);
        expect(maxP).toBeLessThanOrEqual(4);
    });
    it('degenerate inner region falls back to covered', () => {
        // radius 1.2 → few/no fully-inside cells; inner group still non-empty
        const g = circleVoxel2D(0.5, 0.5, 1.2, 1.2, { innerEdge: true, outerEdge: false, fill: false });
        expect(g.find((x) => x.group === 'inner').segments.length).toBeGreaterThan(0);
    });
    it('radius <= 0 → no groups', () => {
        expect(circleVoxel2D(0, 0, 0, 0, { outerEdge: true }).length).toBe(0);
    });
});
