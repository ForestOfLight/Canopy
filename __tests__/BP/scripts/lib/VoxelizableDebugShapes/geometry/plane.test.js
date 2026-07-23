import { describe, it, expect } from 'vitest';
import { planeAxes, lift2D }
    from '../../../../../../Canopy[BP]/scripts/lib/VoxelizableDebugShapes/geometry/plane.js';
import { eulerToBasis }
    from '../../../../../../Canopy[BP]/scripts/lib/VoxelizableDebugShapes/geometry/orient.js';

describe('planeAxes', () => {
    it('identity basis → u=x, v=z, n=y', () => {
        const a = planeAxes(eulerToBasis(0, 0, 0));
        expect(a).toMatchObject({ u: 0, v: 2, n: 1 });
    });
    it('tilted basis → null', () => {
        expect(planeAxes(eulerToBasis(30, 0, 0))).toBe(null);
    });
});

describe('lift2D', () => {
    it('lifts a 2D edge onto the XZ plane at the center y', () => {
        const axes = planeAxes(eulerToBasis(0, 0, 0));
        const out = lift2D(axes, { x: 0, y: 7, z: 0 }, [1, 2, 3, 4]);
        // (p,q) → (x=p, y=7, z=q)
        expect(out).toEqual([1, 7, 2, 3, 7, 4]);
    });
});
