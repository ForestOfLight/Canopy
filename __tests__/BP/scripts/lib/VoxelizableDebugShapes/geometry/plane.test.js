import { describe, it, expect } from 'vitest';
import { lift2D }
    from '../../../../../../Canopy[BP]/scripts/lib/VoxelizableDebugShapes/geometry/plane.js';
import { OrientationFrame }
    from '../../../../../../Canopy[BP]/scripts/lib/VoxelizableDebugShapes/geometry/OrientationFrame.js';

describe('OrientationFrame#planeAxes', () => {
    it('identity frame → u=x, v=z, n=y', () => {
        const mapping = OrientationFrame.fromEuler(0, 0, 0).planeAxes();
        expect(mapping).toMatchObject({ uAxis: 0, vAxis: 2, normalAxis: 1 });
    });
    it('tilted frame → null', () => {
        expect(OrientationFrame.fromEuler(30, 0, 0).planeAxes()).toBe(null);
    });
});

describe('lift2D', () => {
    it('lifts a 2D edge onto the XZ plane at the center y', () => {
        const axes = OrientationFrame.fromEuler(0, 0, 0).planeAxes();
        const out = lift2D(axes, { x: 0, y: 7, z: 0 }, [1, 2, 3, 4]);
        expect(out).toEqual([1, 7, 2, 3, 7, 4]);
    });
});
