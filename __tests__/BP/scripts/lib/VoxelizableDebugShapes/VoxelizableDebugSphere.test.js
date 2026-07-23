import { describe, it, expect } from 'vitest';
import { debugDrawer, getDrawnShapes } from '@minecraft/debug-utilities';
import { VoxelizableDebugSphere }
    from '../../../../../Canopy[BP]/scripts/lib/VoxelizableDebugShapes/VoxelizableDebugSphere.js';

describe('VoxelizableDebugSphere', () => {
    it('voxel mode draws stacked rings (more lines than a single ring)', () => {
        const s = new VoxelizableDebugSphere({ center: { x: 0.5, y: 64.5, z: 0.5 }, radius: 6, mode: 'voxel' });
        s.draw();
        expect(getDrawnShapes(debugDrawer).length).toBeGreaterThan(6);
    });
    it('smooth mode draws lat-long rings', () => {
        const s = new VoxelizableDebugSphere({ center: { x: 0, y: 0, z: 0 }, radius: 5, mode: 'smooth' });
        s.draw();
        expect(getDrawnShapes(debugDrawer).length).toBeGreaterThan(0);
    });
    it('radius 0 draws nothing', () => {
        const s = new VoxelizableDebugSphere({ center: { x: 0, y: 0, z: 0 }, radius: 0 });
        s.draw();
        expect(getDrawnShapes(debugDrawer).length).toBe(0);
    });
});
