import { describe, it, expect } from 'vitest';
import { Analysis } from '../../../../../../Canopy[BP]/scripts/src/classes/analyzearea/Analysis.js';

const identity = {
    id: 'a1',
    from: { x: 5, y: 1, z: 5 },
    to: { x: 0, y: 3, z: 0 },
    dimensionId: 'minecraft:overworld',
    expression: "typeId === 'minecraft:stone'",
    createdAt: 1234
};

describe('Analysis', () => {
    it('normalizes corners into min/max on construction', () => {
        const analysis = new Analysis(identity);
        expect(analysis.min).toEqual({ x: 0, y: 1, z: 0 });
        expect(analysis.max).toEqual({ x: 5, y: 3, z: 5 });
    });

    it('serializes to identity only (no results) with normalized corners', () => {
        const analysis = new Analysis(identity);
        analysis.matches = [{ x: 1, y: 1, z: 1 }];
        expect(analysis.serialize()).toEqual({
            id: 'a1',
            from: { x: 0, y: 1, z: 0 },
            to: { x: 5, y: 3, z: 5 },
            dimensionId: 'minecraft:overworld',
            expression: "typeId === 'minecraft:stone'",
            createdAt: 1234
        });
    });

    it('round-trips through serialize/deserialize', () => {
        const analysis = new Analysis(identity);
        const clone = Analysis.deserialize(analysis.serialize());
        expect(clone.serialize()).toEqual(analysis.serialize());
        expect(clone.matches).toEqual([]);
    });

    it('matchesCoords regardless of corner order, respecting dimension', () => {
        const analysis = new Analysis(identity);
        expect(analysis.matchesCoords({ x: 0, y: 3, z: 5 }, { x: 5, y: 1, z: 0 }, 'minecraft:overworld')).toBe(true);
        expect(analysis.matchesCoords({ x: 0, y: 1, z: 0 }, { x: 5, y: 3, z: 5 }, 'minecraft:nether')).toBe(false);
        expect(analysis.matchesCoords({ x: 0, y: 1, z: 0 }, { x: 4, y: 3, z: 5 }, 'minecraft:overworld')).toBe(false);
    });

    it('computes capacity and a namespaced ticking id', () => {
        const analysis = new Analysis(identity);
        expect(analysis.capacity()).toBe(6 * 3 * 6);
        expect(analysis.tickingId()).toBe('canopy_analyzearea_a1');
    });

    it('create generates an id and createdAt', () => {
        const analysis = Analysis.create({ x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1 }, 'minecraft:overworld', 'x === 0');
        expect(typeof analysis.id).toBe('string');
        expect(analysis.id.length).toBeGreaterThan(0);
        expect(typeof analysis.createdAt).toBe('number');
    });
});
