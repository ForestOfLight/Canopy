import { describe, it, expect } from 'vitest';
import { autoSegments, smoothArc, smoothSphere }
    from '../../../../../../Canopy[BP]/scripts/lib/VoxelizableDebugShapes/geometry/smooth.js';
import { eulerToBasis }
    from '../../../../../../Canopy[BP]/scripts/lib/VoxelizableDebugShapes/geometry/orient.js';

describe('autoSegments', () => {
    it('matches the formula and clamps', () => {
        expect(autoSegments(5)).toBe(16);
        expect(autoSegments(100)).toBe(71);
        expect(autoSegments(0.05)).toBe(12);   // clamped to min
        expect(autoSegments(1e9)).toBe(128);   // clamped to max
    });
});

describe('smoothArc', () => {
    const I = eulerToBasis(0, 0, 0);
    it('a full circle with N segments emits N segments (closed)', () => {
        expect(smoothArc(I, 0, 0, 0, 1, 1, 0, 360, 4).length / 6).toBe(4);
    });
    it('an open arc with N segments emits N segments (N+1 points)', () => {
        expect(smoothArc(I, 0, 0, 0, 1, 1, 0, 90, 4).length / 6).toBe(4);
    });
    it('first vertex of a circle on XZ is at angle 0 along +X', () => {
        const s = smoothArc(I, 10, 5, 20, 2, 2, 0, 360, 4);
        expect(Math.abs(s[0] - 12) < 1e-9 && Math.abs(s[1] - 5) < 1e-9 && Math.abs(s[2] - 20) < 1e-9).toBe(true);
    });
});

describe('smoothSphere', () => {
    it('emits a non-trivial number of ring segments', () => {
        expect(smoothSphere(eulerToBasis(0, 0, 0), 0, 0, 0, 3, 8).length).toBeGreaterThan(0);
    });
});
