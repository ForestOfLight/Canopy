import { describe, it, expect } from 'vitest';
import { debugDrawer, getDrawnShapes } from '@minecraft/debug-utilities';
import { VoxelizableDebugCircle }
    from '../../../../../Canopy[BP]/scripts/lib/VoxelizableDebugShapes/VoxelizableDebugCircle.js';

describe('VoxelizableDebugCircle', () => {
    it('smooth mode draws autoSegments(radius) segments', () => {
        const c = new VoxelizableDebugCircle({ center: { x: 0, y: 0, z: 0 }, radius: 5, mode: 'smooth' });
        c.draw();
        expect(getDrawnShapes(debugDrawer).length).toBe(16); // autoSegments(5)
    });
    it('voxel mode (default inner edge) draws a ring', () => {
        const c = new VoxelizableDebugCircle({ center: { x: 0.5, y: 64, z: 0.5 }, radius: 6, mode: 'voxel' });
        c.draw();
        expect(getDrawnShapes(debugDrawer).length).toBeGreaterThan(0);
    });
    it('radius 0 draws nothing', () => {
        const c = new VoxelizableDebugCircle({ center: { x: 0, y: 0, z: 0 }, radius: 0 });
        c.draw();
        expect(getDrawnShapes(debugDrawer).length).toBe(0);
    });
});
