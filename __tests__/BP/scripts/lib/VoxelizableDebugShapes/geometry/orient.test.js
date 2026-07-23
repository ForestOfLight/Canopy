import { describe, it, expect } from 'vitest';
import { eulerToBasis, normalToBasis, isAxisAligned, mapLocal }
    from '../../../../../../Canopy[BP]/scripts/lib/VoxelizableDebugShapes/geometry/orient.js';

const near = (a, b, e = 1e-9) => Math.abs(a - b) < e;
const basisNear = (got, exp) => got.every((v, i) => near(v, exp[i], 1e-9));

describe('eulerToBasis', () => {
    it('identity → default basis (u=+X, v=+Z, n=+Y)', () => {
        expect(basisNear(eulerToBasis(0, 0, 0), [1, 0, 0, 0, 0, 1, 0, 1, 0])).toBe(true);
    });
    it('90° yaw rotates u and v about +Y', () => {
        const b = eulerToBasis(0, 90, 0); // yaw about +Y
        // u:+X → -Z ; v:+Z → +X ; n stays +Y
        expect(basisNear(b, [0, 0, -1, 1, 0, 0, 0, 1, 0])).toBe(true);
    });
    it('produces an orthonormal basis', () => {
        const b = eulerToBasis(30, 40, 50);
        const dot = (o1, o2) => b[o1] * b[o2] + b[o1 + 1] * b[o2 + 1] + b[o1 + 2] * b[o2 + 2];
        expect(near(dot(0, 0), 1)).toBe(true);
        expect(near(dot(3, 3), 1)).toBe(true);
        expect(near(dot(6, 6), 1)).toBe(true);
        expect(near(dot(0, 3), 0)).toBe(true);
        expect(near(dot(0, 6), 0)).toBe(true);
        expect(near(dot(3, 6), 0)).toBe(true);
    });
});

describe('normalToBasis', () => {
    it('+Y normal → default basis', () => {
        expect(basisNear(normalToBasis(0, 1, 0), [1, 0, 0, 0, 0, 1, 0, 1, 0])).toBe(true);
    });
    it('-Y normal → 180° about +X (n=-Y, v=-Z)', () => {
        expect(basisNear(normalToBasis(0, -1, 0), [1, 0, 0, 0, 0, -1, 0, -1, 0])).toBe(true);
    });
    it('non-axis normal stays orthonormal with n = normalized input', () => {
        const b = normalToBasis(1, 1, 0);
        const inv = 1 / Math.sqrt(2);
        expect(near(b[6], inv) && near(b[7], inv) && near(b[8], 0)).toBe(true);
    });
});

describe('isAxisAligned', () => {
    it('true for identity, false for tilt', () => {
        expect(isAxisAligned(eulerToBasis(0, 90, 0))).toBe(true);
        expect(isAxisAligned(eulerToBasis(30, 0, 0))).toBe(false);
    });
});

describe('mapLocal', () => {
    it('maps local plane coords to world about center', () => {
        const b = eulerToBasis(0, 0, 0);
        const out = [0, 0, 0];
        mapLocal(b, 10, 5, 20, 2, 3, 0, out, 0); // 2 along +X, 3 along +Z
        expect(out).toEqual([12, 5, 23]);
    });
});
