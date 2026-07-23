import { describe, it, expect } from 'vitest';
import { validateShapeConfig } from '../../../../../Canopy[BP]/scripts/lib/VoxelizableDebugShapes/index.js';

describe('validateShapeConfig', () => {
    it('accepts a well-formed circle', () => {
        expect(validateShapeConfig({
            type: 'circle', center: { x: 0, y: 64, z: 0 }, radius: 8, mode: 'voxel'
        })).toBe(true);
    });

    it('accepts a box from two corners with optional fields omitted', () => {
        expect(validateShapeConfig({
            type: 'box', from: { x: 0, y: 0, z: 0 }, to: { x: 4, y: 4, z: 4 }
        })).toBe(true);
    });

    it('rejects an unknown type', () => {
        expect(validateShapeConfig({ type: 'blob', center: { x: 0, y: 0, z: 0 }, radius: 5 })).toBe(false);
    });

    it('rejects a circle missing its required radius', () => {
        expect(validateShapeConfig({ type: 'circle', center: { x: 0, y: 0, z: 0 } })).toBe(false);
    });

    it('rejects a vector with a non-finite component', () => {
        expect(validateShapeConfig({ type: 'circle', center: { x: 0, y: Number.NaN, z: 0 }, radius: 5 })).toBe(false);
    });

    it('rejects an out-of-range enum value', () => {
        expect(validateShapeConfig({
            type: 'circle', center: { x: 0, y: 0, z: 0 }, radius: 5, mode: 'wireframe'
        })).toBe(false);
    });

    it('rejects a non-boolean toggle', () => {
        expect(validateShapeConfig({
            type: 'box', from: { x: 0, y: 0, z: 0 }, to: { x: 1, y: 1, z: 1 }, innerEdge: 'yes'
        })).toBe(false);
    });

    it('accepts an optional rgba color that is fully specified', () => {
        expect(validateShapeConfig({
            type: 'sphere', center: { x: 0, y: 0, z: 0 }, radius: 4,
            color: { red: 1, green: 0, blue: 0, alpha: 1 }
        })).toBe(true);
    });

    it('rejects a partially specified color (missing alpha)', () => {
        expect(validateShapeConfig({
            type: 'sphere', center: { x: 0, y: 0, z: 0 }, radius: 4,
            color: { red: 1, green: 0, blue: 0 }
        })).toBe(false);
    });

    it('ignores extra keys like dimension', () => {
        expect(validateShapeConfig({
            type: 'circle', center: { x: 0, y: 0, z: 0 }, radius: 5,
            dimension: 'minecraft:overworld', someExtra: 42
        })).toBe(true);
    });

    it('rejects null/non-object input', () => {
        expect(validateShapeConfig(null)).toBe(false);
        expect(validateShapeConfig(undefined)).toBe(false);
        expect(validateShapeConfig('circle')).toBe(false);
    });
});
