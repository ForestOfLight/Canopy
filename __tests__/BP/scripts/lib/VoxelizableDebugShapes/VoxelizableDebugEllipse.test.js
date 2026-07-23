import { describe, it, expect } from 'vitest';
import { debugDrawer, getDrawnShapes } from '@minecraft/debug-utilities';
import { VoxelizableDebugEllipse }
    from '../../../../../Canopy[BP]/scripts/lib/VoxelizableDebugShapes/VoxelizableDebugEllipse.js';

describe('VoxelizableDebugEllipse', () => {
    it('voxel mode draws a ring for unequal radii', () => {
        const e = new VoxelizableDebugEllipse({ center: { x: 0.5, y: 64, z: 0.5 }, radii: { x: 6, z: 3 }, mode: 'voxel' });
        e.draw();
        expect(getDrawnShapes(debugDrawer).length).toBeGreaterThan(0);
    });
    it('smooth mode uses the larger radius for segment count', () => {
        const e = new VoxelizableDebugEllipse({ center: { x: 0, y: 0, z: 0 }, radii: { x: 5, z: 1 }, mode: 'smooth' });
        e.draw();
        expect(getDrawnShapes(debugDrawer).length).toBe(16); // autoSegments(5)
    });
});
