import { describe, it, expect } from 'vitest';
import { debugDrawer, getDrawnShapes } from '@minecraft/debug-utilities';
import { VoxelizableDebugSquare }
    from '../../../../../Canopy[BP]/scripts/lib/VoxelizableDebugShapes/VoxelizableDebugSquare.js';

describe('VoxelizableDebugSquare', () => {
    it('smooth mode draws a 4-edge outline', () => {
        const s = new VoxelizableDebugSquare({ center: { x: 0, y: 0, z: 0 }, width: 4, height: 2, mode: 'smooth' });
        s.draw();
        expect(getDrawnShapes(debugDrawer).length).toBe(4);
    });
    it('voxel outerEdge draws a flat rounded rectangle (4 merged edges)', () => {
        const s = new VoxelizableDebugSquare({
            center: { x: 0, y: 5, z: 0 }, width: 4, height: 4,
            mode: 'voxel', innerEdge: false, outerEdge: true, fill: false,
        });
        s.draw();
        expect(getDrawnShapes(debugDrawer).length).toBe(4);
    });
});
