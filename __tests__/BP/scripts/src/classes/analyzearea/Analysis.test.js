import { describe, it, expect, vi } from 'vitest';
import { Analysis } from '../../../../../../Canopy[BP]/scripts/src/classes/analyzearea/Analysis.js';
import { ExpressionForbiddenError } from '../../../../../../Canopy[BP]/scripts/src/classes/analyzearea/ExpressionForbiddenError.js';
import { LoadCapacityError } from '../../../../../../Canopy[BP]/scripts/src/classes/analyzearea/LoadCapacityError.js';
import { stringifyLocation } from '../../../../../../Canopy[BP]/scripts/include/utils.js';

const identity = {
    id: 'a1',
    from: { x: 5, y: 1, z: 5 },
    to: { x: 0, y: 3, z: 0 },
    dimensionId: 'minecraft:overworld',
    expression: "typeId === 'minecraft:stone'",
    createdAt: 1234,
    name: 'Stone Farm'
};

describe('Analysis', () => {
    it('normalizes corners into min/max on construction', () => {
        const analysis = new Analysis(identity);
        expect(analysis.min).toEqual({ x: 0, y: 1, z: 0 });
        expect(analysis.max).toEqual({ x: 5, y: 3, z: 5 });
    });

    it('floors and orders swapped/negative corners on construction', () => {
        const analysis = new Analysis({ ...identity, from: { x: 5.9, y: 2, z: -3 }, to: { x: -1, y: 10.2, z: 4 } });
        expect(analysis.min).toEqual({ x: -1, y: 2, z: -3 });
        expect(analysis.max).toEqual({ x: 5, y: 10, z: 4 });
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
            createdAt: 1234,
            name: 'Stone Farm'
        });
    });

    it('defaults the name to an empty string when none is stored', () => {
        const unnamed = { ...identity };
        delete unnamed.name;
        expect(new Analysis(unnamed).name).toBe('');
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

    it('errorMessage maps known errors by type and anything else to unknown', () => {
        expect(Analysis.errorMessage(new LoadCapacityError())).toEqual({ translate: 'commands.analyzearea.loadcapacity' });
        expect(Analysis.errorMessage(new ExpressionForbiddenError('nope'))).toEqual({ translate: 'commands.analyzearea.forbidden' });
        expect(Analysis.errorMessage(new Error('boom'))).toEqual({ translate: 'commands.analyzearea.unknownerror' });
        expect(Analysis.errorMessage(undefined)).toEqual({ translate: 'commands.analyzearea.unknownerror' });
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
        expect(analysis.name).toBe('');
    });

    it('create keeps the given name without using it as the id', () => {
        const analysis = Analysis.create({ x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1 }, 'minecraft:overworld', 'x === 0', 'My Area');
        expect(analysis.name).toBe('My Area');
        expect(analysis.id).not.toBe('My Area');
    });

    describe('tryCreate', () => {
        const from = { x: 0, y: 0, z: 0 };

        it('returns the analysis for a valid expression', () => {
            const result = Analysis.tryCreate(from, { x: 1, y: 1, z: 1 }, 'minecraft:overworld', "typeId === 'minecraft:stone'");
            expect(result.ok).toBe(true);
            expect(result.analysis).toBeInstanceOf(Analysis);
        });

        it('passes the name through to the created analysis', () => {
            const result = Analysis.tryCreate(from, { x: 1, y: 1, z: 1 }, 'minecraft:overworld', 'true', 'Named');
            expect(result.analysis.name).toBe('Named');
        });

        it('rejects an over-capacity region', () => {
            const result = Analysis.tryCreate(from, { x: 2 ** 32, y: 0, z: 0 }, 'minecraft:overworld', 'true');
            expect(result).toEqual({ ok: false, reason: 'overcapacity' });
        });

        it('rejects a syntactically invalid expression', () => {
            const result = Analysis.tryCreate(from, { x: 1, y: 1, z: 1 }, 'minecraft:overworld', 'a &&');
            expect(result).toEqual({ ok: false, reason: 'syntaxerror' });
        });

        it('rejects a forbidden expression', () => {
            const result = Analysis.tryCreate(from, { x: 1, y: 1, z: 1 }, 'minecraft:overworld', 'block.constructor');
            expect(result).toEqual({ ok: false, reason: 'forbidden' });
        });
    });

    describe('tryEdit', () => {
        const changes = { from: { x: 2, y: 2, z: 2 }, to: { x: -1, y: 0, z: 0 }, dimensionId: 'minecraft:nether', expression: 'true', name: 'Renamed' };

        it('updates the identity in place, keeping the id', () => {
            const analysis = new Analysis(identity);
            const result = analysis.tryEdit(changes);
            expect(result).toEqual({ ok: true, analysis });
            expect(analysis.id).toBe('a1');
            expect(analysis.min).toEqual({ x: -1, y: 0, z: 0 });
            expect(analysis.max).toEqual({ x: 2, y: 2, z: 2 });
            expect(analysis.dimensionId).toBe('minecraft:nether');
            expect(analysis.expression).toBe('true');
            expect(analysis.name).toBe('Renamed');
        });

        it('clears previous results and tears down rendering', () => {
            const analysis = new Analysis(identity);
            const renderer = { destroy: vi.fn() };
            analysis.renderer = renderer;
            analysis.matches = [{ x: 1, y: 1, z: 1 }];
            analysis.hasRun = true;
            analysis.capped = true;
            analysis.tryEdit(changes);
            expect(renderer.destroy).toHaveBeenCalled();
            expect(analysis.renderer).toBeUndefined();
            expect(analysis.matches).toEqual([]);
            expect(analysis.hasRun).toBe(false);
            expect(analysis.capped).toBe(false);
            expect(analysis.statusMessage()).toEqual({ translate: 'commands.analyzearea.ui.page.notrun' });
        });

        it('leaves the analysis untouched when the edit is invalid', () => {
            const analysis = new Analysis(identity);
            analysis.matches = [{ x: 1, y: 1, z: 1 }];
            expect(analysis.tryEdit({ ...changes, expression: 'block.constructor' })).toEqual({ ok: false, reason: 'forbidden' });
            expect(analysis.tryEdit({ ...changes, to: { x: 2 ** 32, y: 0, z: 0 } })).toEqual({ ok: false, reason: 'overcapacity' });
            expect(analysis.serialize()).toEqual(new Analysis(identity).serialize());
            expect(analysis.matches).toHaveLength(1);
        });
    });
});
