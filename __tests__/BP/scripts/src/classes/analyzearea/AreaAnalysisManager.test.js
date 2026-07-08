import { describe, it, expect, beforeEach } from 'vitest';
import { world } from '@minecraft/server';
import { Analysis } from '../../../../../../Canopy[BP]/scripts/src/classes/analyzearea/Analysis.js';
import { AreaAnalysisManager, PROPERTY_KEY } from '../../../../../../Canopy[BP]/scripts/src/classes/analyzearea/AreaAnalysisManager.js';

function fixture(id, from, to) {
    return new Analysis({ id, from, to, dimensionId: 'minecraft:overworld', expression: 'x === 0', createdAt: 1 });
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
});
