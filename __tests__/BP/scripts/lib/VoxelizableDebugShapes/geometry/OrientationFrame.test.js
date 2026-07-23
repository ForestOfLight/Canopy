import { describe, it, expect } from 'vitest';
import { OrientationFrame }
    from '../../../../../../Canopy[BP]/scripts/lib/VoxelizableDebugShapes/geometry/OrientationFrame.js';

const near = (a, b, e = 1e-9) => Math.abs(a - b) < e;
const axesNear = (frame, exp) => frame.axes.every((v, i) => near(v, exp[i], 1e-9));

describe('OrientationFrame.fromEuler', () => {
    it('identity → default axes (u=+X, v=+Z, n=+Y)', () => {
        expect(axesNear(OrientationFrame.fromEuler(0, 0, 0), [1, 0, 0, 0, 0, 1, 0, 1, 0])).toBe(true);
    });
    it('90° yaw rotates u and v about +Y', () => {
        const f = OrientationFrame.fromEuler(0, 90, 0);
        expect(axesNear(f, [0, 0, -1, 1, 0, 0, 0, 1, 0])).toBe(true);
    });
    it('produces an orthonormal basis', () => {
        const b = OrientationFrame.fromEuler(30, 40, 50).axes;
        const dot = (o1, o2) => b[o1] * b[o2] + b[o1 + 1] * b[o2 + 1] + b[o1 + 2] * b[o2 + 2];
        expect(near(dot(0, 0), 1)).toBe(true);
        expect(near(dot(3, 3), 1)).toBe(true);
        expect(near(dot(6, 6), 1)).toBe(true);
        expect(near(dot(0, 3), 0)).toBe(true);
        expect(near(dot(0, 6), 0)).toBe(true);
        expect(near(dot(3, 6), 0)).toBe(true);
    });
});

describe('OrientationFrame.fromNormal', () => {
    it('+Y normal → default axes', () => {
        expect(axesNear(OrientationFrame.fromNormal(0, 1, 0), [1, 0, 0, 0, 0, 1, 0, 1, 0])).toBe(true);
    });
    it('-Y normal → 180° about +X (n=-Y, v=-Z)', () => {
        expect(axesNear(OrientationFrame.fromNormal(0, -1, 0), [1, 0, 0, 0, 0, -1, 0, -1, 0])).toBe(true);
    });
    it('non-axis normal stays orthonormal with n = normalized input', () => {
        const b = OrientationFrame.fromNormal(1, 1, 0).axes;
        const inv = 1 / Math.sqrt(2);
        expect(near(b[6], inv) && near(b[7], inv) && near(b[8], 0)).toBe(true);
    });
});

describe('OrientationFrame#isAxisAligned', () => {
    it('true for identity, false for tilt', () => {
        expect(OrientationFrame.fromEuler(0, 90, 0).isAxisAligned()).toBe(true);
        expect(OrientationFrame.fromEuler(30, 0, 0).isAxisAligned()).toBe(false);
    });
});

describe('OrientationFrame#mapLocal', () => {
    it('maps local plane coords to world about center', () => {
        const f = OrientationFrame.fromEuler(0, 0, 0);
        const out = [0, 0, 0];
        f.mapLocal(10, 5, 20, 2, 3, 0, out, 0);
        expect(out).toEqual([12, 5, 23]);
    });
});
