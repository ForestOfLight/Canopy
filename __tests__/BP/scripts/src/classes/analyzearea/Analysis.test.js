import { describe, it, expect } from 'vitest';
import { Analysis, analysisErrorMessage, LOAD_CAPACITY_ERROR } from '../../../../../../Canopy[BP]/scripts/src/classes/analyzearea/Analysis.js';
import { stringifyLocation } from '../../../../../../Canopy[BP]/scripts/include/utils.js';

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

    it('starts idle at zero progress and (un)subscribes progress handlers', () => {
        const analysis = new Analysis(identity);
        expect(analysis.running).toBe(false);
        expect(analysis.progress).toBe(0);
        const unsubscribe = analysis.subscribe({ onProgress: () => {} });
        expect(typeof unsubscribe).toBe('function');
        expect(analysis.subscribers.size).toBe(1);
        unsubscribe();
        expect(analysis.subscribers.size).toBe(0);
    });

    it('maps the load-capacity error to its message and anything else to unknown', () => {
        expect(analysisErrorMessage(new Error(LOAD_CAPACITY_ERROR))).toEqual({ translate: 'commands.analyzearea.loadcapacity' });
        expect(analysisErrorMessage(new Error('boom'))).toEqual({ translate: 'commands.analyzearea.unknownerror' });
        expect(analysisErrorMessage(undefined)).toEqual({ translate: 'commands.analyzearea.unknownerror' });
    });

    it('statusMessage is a single source of truth across states', () => {
        const analysis = new Analysis(identity);
        expect(analysis.statusMessage()).toEqual({ translate: 'commands.analyzearea.ui.page.notrun' });

        analysis.hasRun = true;
        analysis.matches = [{ x: 0, y: 1, z: 0 }];
        const results = analysis.statusMessage();
        expect(results.translate).toBe('commands.analyzearea.stats');
        expect(results.with[2]).toBe(identity.expression);
        expect(results.with[3]).toBe('1');
        expect(results.with[4]).toBe('6x3x6');

        analysis.capped = true;
        expect(analysis.statusMessage().translate).toBe('commands.analyzearea.stats.capped');

        analysis.running = true;
        analysis.progress = 0.5;
        const from = stringifyLocation(analysis.min, 0);
        const to = stringifyLocation(analysis.max, 0);
        expect(analysis.statusMessage()).toEqual({ translate: 'commands.analyzearea.stats.analyzing', with: [from, to, identity.expression, '50%'] });
    });

    it('create generates an id and createdAt', () => {
        const analysis = Analysis.create({ x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1 }, 'minecraft:overworld', 'x === 0');
        expect(typeof analysis.id).toBe('string');
        expect(analysis.id.length).toBeGreaterThan(0);
        expect(typeof analysis.createdAt).toBe('number');
    });
});
