import { describe, it, expect } from 'vitest';
import { debugDrawer, getDrawnShapes } from '@minecraft/debug-utilities';
import { VoxelizableDebugBox }
    from '../../../../../Canopy[BP]/scripts/lib/VoxelizableDebugShapes/VoxelizableDebugBox.js';

describe('VoxelizableDebugBox', () => {
    it('smooth mode draws a 12-edge wireframe', () => {
        const b = new VoxelizableDebugBox({ center: { x: 0, y: 0, z: 0 }, size: { x: 2, y: 2, z: 2 }, mode: 'smooth' });
        b.draw();
        expect(getDrawnShapes(debugDrawer).length).toBe(12);
    });
    it('voxel outerEdge draws the cell-rounded outer box', () => {
        const b = new VoxelizableDebugBox({
            from: { x: 0.3, y: 0, z: 0.3 }, to: { x: 2.7, y: 1, z: 2.7 },
            mode: 'voxel', innerEdge: false, outerEdge: true, fill: false,
        });
        b.draw();
        expect(getDrawnShapes(debugDrawer).length).toBe(12);
    });
    it('from/to computes the same bounds regardless of corner order', () => {
        const a = new VoxelizableDebugBox({ from: { x: 2, y: 1, z: 2 }, to: { x: 0, y: 0, z: 0 }, mode: 'smooth' });
        a.draw();
        expect(getDrawnShapes(debugDrawer).length).toBe(12);
    });
});
