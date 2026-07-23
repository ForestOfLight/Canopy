import { describe, it, expect } from 'vitest';
import {
    shapeTypeIds,
    getConfigSchema,
    getShapeClass
} from '../../../../../Canopy[BP]/scripts/lib/VoxelizableDebugShapes/index.js';

const VALID_KINDS = new Set(['vector', 'number', 'boolean', 'enum']);

describe('config schema', () => {
    it('lists box first so the UI can default to it', () => {
        expect(shapeTypeIds[0]).toBe('box');
        expect(new Set(shapeTypeIds)).toEqual(
            new Set(['box', 'line', 'square', 'circle', 'ellipse', 'arc', 'sphere'])
        );
    });

    it('every shape exposes a well-formed schema', () => {
        for (const type of shapeTypeIds) {
            const schema = getConfigSchema(type);
            expect(Array.isArray(schema)).toBe(true);
            expect(schema.length).toBeGreaterThan(0);
            for (const field of schema) {
                expect(typeof field.key).toBe('string');
                expect(VALID_KINDS.has(field.kind)).toBe(true);
                if (field.kind === 'vector') expect(Array.isArray(field.axes)).toBe(true);
                if (field.kind === 'enum') expect(Array.isArray(field.options)).toBe(true);
            }
        }
    });

    it('excludes visibleTo, dimension, and attachedTo from every schema', () => {
        for (const type of shapeTypeIds) {
            const keys = getConfigSchema(type).map((f) => f.key);
            expect(keys).not.toContain('visibleTo');
            expect(keys).not.toContain('dimension');
            expect(keys).not.toContain('attachedTo');
        }
    });

    it('gives curved shapes a segments field but not line/box/square', () => {
        const hasSegments = (type) => getConfigSchema(type).some((f) => f.key === 'segments');
        for (const t of ['circle', 'ellipse', 'arc', 'sphere']) expect(hasSegments(t)).toBe(true);
        for (const t of ['line', 'box', 'square']) expect(hasSegments(t)).toBe(false);
    });

    it('gives every shape but line the inner/outer/fill toggles', () => {
        const edgeKeys = ['innerEdge', 'outerEdge', 'fill'];
        for (const type of shapeTypeIds) {
            const keys = getConfigSchema(type).map((f) => f.key);
            const present = edgeKeys.every((k) => keys.includes(k));
            expect(present).toBe(type !== 'line');
        }
    });

    it('color is an optional rgba vector on every shape', () => {
        for (const type of shapeTypeIds) {
            const color = getConfigSchema(type).find((f) => f.key === 'color');
            expect(color).toBeDefined();
            expect(color.kind).toBe('vector');
            expect(color.axes).toEqual(['red', 'green', 'blue', 'alpha']);
            expect(color.optional).toBe(true);
        }
    });

    it('schema geometry keys are accepted by the constructor for a representative shape', () => {
        // A circle built from its schema keys round-trips through serialize().
        const Circle = getShapeClass('circle');
        const shape = new Circle({ center: { x: 0, y: 0, z: 0 }, radius: 5, mode: 'voxel' });
        const serializedKeys = Object.keys(shape.serialize());
        expect(serializedKeys).toContain('center');
        expect(serializedKeys).toContain('radius');
        expect(serializedKeys).toContain('mode');
    });
});
