// __tests__/BP/scripts/lib/VoxelizableDebugShapes/VoxelizableDebugArc.test.js
import { describe, it, expect } from 'vitest';
import { debugDrawer, getDrawnShapes } from '@minecraft/debug-utilities';
import { VoxelizableDebugArc }
    from '../../../../../Canopy[BP]/scripts/lib/VoxelizableDebugShapes/VoxelizableDebugArc.js';

describe('VoxelizableDebugArc', () => {
    it('a 90° voxel arc draws fewer lines than a full ring', () => {
        const quarter = new VoxelizableDebugArc({ center: { x: 0.5, y: 64, z: 0.5 }, radius: 8, startAngle: 0, endAngle: 90, mode: 'voxel' });
        quarter.draw();
        const q = getDrawnShapes(debugDrawer).length;
        quarter.remove();
        const full = new VoxelizableDebugArc({ center: { x: 0.5, y: 64, z: 0.5 }, radius: 8, startAngle: 0, endAngle: 360, mode: 'voxel' });
        full.draw();
        expect(q).toBeGreaterThan(0);
        expect(q).toBeLessThan(getDrawnShapes(debugDrawer).length);
    });
    it('smooth mode draws an open arc', () => {
        const a = new VoxelizableDebugArc({ center: { x: 0, y: 0, z: 0 }, radius: 5, startAngle: 0, endAngle: 90, mode: 'smooth' });
        a.draw();
        expect(getDrawnShapes(debugDrawer).length).toBe(16); // autoSegments(5) segments over the sweep
    });
    it('voxel arc honors sign-flipped (yaw 180) orientation', () => {
        // yaw 180 flips local +X→world -X and local +Z→world -Z, so a local 0-90
        // sector must sweep into the world -X,-Z quadrant (not the default +X,+Z).
        const arc = new VoxelizableDebugArc({
            center: { x: 0.5, y: 64, z: 0.5 }, radius: 8,
            startAngle: 0, endAngle: 90, rotation: { x: 0, y: 180, z: 0 }, mode: 'voxel',
        });
        arc.draw();
        const pts = [];
        for (const l of getDrawnShapes(debugDrawer))
            pts.push([l.location.x, l.location.z], [l.endLocation.x, l.endLocation.z]);
        expect(pts.length).toBeGreaterThan(0);
        // sector reaches the -X,-Z quadrant ...
        expect(pts.some(([x, z]) => x < 0.5 && z < 0.5)).toBe(true);
        // ... and never lands deep in the +X,+Z quadrant (the pre-fix reflected sector)
        expect(pts.some(([x, z]) => x > 2.5 && z > 2.5)).toBe(false);
    });

    it('startAngle == endAngle draws nothing', () => {
        const a = new VoxelizableDebugArc({ center: { x: 0, y: 0, z: 0 }, radius: 5, startAngle: 30, endAngle: 30 });
        a.draw();
        expect(getDrawnShapes(debugDrawer).length).toBe(0);
    });
});
