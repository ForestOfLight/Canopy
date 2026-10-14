import { describe, it, expect, beforeEach } from 'vitest';
import { world } from '@minecraft/server';
import { Analysis } from '../../../../../../Canopy[BP]/scripts/src/classes/analyzearea/Analysis.js';
import { AreaAnalysisManager, PROPERTY_KEY } from '../../../../../../Canopy[BP]/scripts/src/classes/analyzearea/AreaAnalysisManager.js';

function fixture(id, from, to, name) {
    return new Analysis({ id, from, to, dimensionId: 'minecraft:overworld', expression: 'x === 0', createdAt: 1, name });
}

describe('AreaAnalysisManager', () => {
    beforeEach(() => {
        world.setDynamicProperty(PROPERTY_KEY, undefined);
    });

    it('starts empty when no property is stored', () => {
        expect(new AreaAnalysisManager().list()).toEqual([]);
    });

    it('persists added analyses to the world property', () => {
        const manager = new AreaAnalysisManager();
        manager.add(fixture('a1', { x: 0, y: 0, z: 0 }, { x: 2, y: 2, z: 2 }));
        const reloaded = new AreaAnalysisManager();
        expect(reloaded.list()).toHaveLength(1);
        expect(reloaded.list()[0].id).toBe('a1');
    });

    it('removes analyses and updates the property', () => {
        const manager = new AreaAnalysisManager();
        const a = fixture('a1', { x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1 });
        manager.add(a);
        manager.remove(a);
        expect(new AreaAnalysisManager().list()).toEqual([]);
    });

    it('finds an analysis by normalized coords + dimension', () => {
        const manager = new AreaAnalysisManager();
        manager.add(fixture('a1', { x: 0, y: 0, z: 0 }, { x: 4, y: 4, z: 4 }));
        const found = manager.findByCoords({ x: 4, y: 4, z: 4 }, { x: 0, y: 0, z: 0 }, 'minecraft:overworld');
        expect(found?.id).toBe('a1');
        expect(manager.findByCoords({ x: 0, y: 0, z: 0 }, { x: 4, y: 4, z: 4 }, 'minecraft:nether')).toBeUndefined();
    });

    it('finds an analysis by its exact name', () => {
        const manager = new AreaAnalysisManager();
        manager.add(fixture('a1', { x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1 }, 'Stone Farm'));
        manager.add(fixture('a2', { x: 0, y: 0, z: 0 }, { x: 2, y: 2, z: 2 }));
        expect(manager.findByName('Stone Farm')?.id).toBe('a1');
        expect(manager.findByName('stone farm')).toBeUndefined();
    });

    it('never matches an empty name, so unnamed analyses can coexist', () => {
        const manager = new AreaAnalysisManager();
        manager.add(fixture('a1', { x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1 }));
        expect(manager.findByName('')).toBeUndefined();
        expect(manager.findByName(undefined)).toBeUndefined();
    });

    describe('edit', () => {
        const changes = { from: { x: 0, y: 0, z: 0 }, to: { x: 3, y: 3, z: 3 }, dimensionId: 'minecraft:nether', expression: 'true', name: 'Renamed' };

        it('applies and persists the changes', () => {
            const manager = new AreaAnalysisManager();
            const a = fixture('a1', { x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1 }, 'Stone Farm');
            manager.add(a);
            expect(manager.edit(a, changes)).toEqual({ ok: true, analysis: a });
            const reloaded = new AreaAnalysisManager().list()[0];
            expect(reloaded.id).toBe('a1');
            expect(reloaded.name).toBe('Renamed');
            expect(reloaded.max).toEqual({ x: 3, y: 3, z: 3 });
            expect(reloaded.dimensionId).toBe('minecraft:nether');
            expect(reloaded.expression).toBe('true');
        });

        it('allows keeping the same name', () => {
            const manager = new AreaAnalysisManager();
            const a = fixture('a1', { x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1 }, 'Stone Farm');
            manager.add(a);
            expect(manager.edit(a, { ...changes, name: 'Stone Farm' }).ok).toBe(true);
        });

        it('rejects renaming to a name another analysis already has', () => {
            const manager = new AreaAnalysisManager();
            const a = fixture('a1', { x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1 }, 'Stone Farm');
            manager.add(a);
            manager.add(fixture('a2', { x: 0, y: 0, z: 0 }, { x: 2, y: 2, z: 2 }, 'Renamed'));
            expect(manager.edit(a, changes)).toEqual({ ok: false, reason: 'nametaken' });
            expect(a.name).toBe('Stone Farm');
        });

        it('does not persist an invalid edit', () => {
            const manager = new AreaAnalysisManager();
            const a = fixture('a1', { x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1 }, 'Stone Farm');
            manager.add(a);
            expect(manager.edit(a, { ...changes, expression: 'a &&' })).toEqual({ ok: false, reason: 'syntaxerror' });
            expect(new AreaAnalysisManager().list()[0].name).toBe('Stone Farm');
        });
    });
});
