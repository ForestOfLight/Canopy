// __tests__/BP/scripts/lib/VoxelizableDebugShapes/VoxelizableDebugLine.test.js
import { describe, it, expect } from 'vitest';
import { debugDrawer, getDrawnShapes } from '@minecraft/debug-utilities';
import { VoxelizableDebugLine }
    from '../../../../../Canopy[BP]/scripts/lib/VoxelizableDebugShapes/VoxelizableDebugLine.js';

describe('VoxelizableDebugLine', () => {
    it('smooth mode draws a single DebugLine', () => {
        const l = new VoxelizableDebugLine({ from: { x: 0, y: 0, z: 0 }, to: { x: 5, y: 2, z: 3 }, mode: 'smooth' });
        l.draw();
        const d = getDrawnShapes(debugDrawer);
        expect(d.length).toBe(1);
        expect(d[0].endLocation).toEqual({ x: 5, y: 2, z: 3 });
    });
    it('voxel mode draws a staircase (more than one line for a diagonal)', () => {
        const l = new VoxelizableDebugLine({ from: { x: 0, y: 0, z: 0 }, to: { x: 2, y: 0, z: 2 }, mode: 'voxel' });
        l.draw();
        expect(getDrawnShapes(debugDrawer).length).toBeGreaterThan(1);
    });
    it('degenerate line draws nothing', () => {
        const l = new VoxelizableDebugLine({ from: { x: 1, y: 1, z: 1 }, to: { x: 1, y: 1, z: 1 } });
        l.draw();
        expect(getDrawnShapes(debugDrawer).length).toBe(0);
    });
});
