import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { world } from '@minecraft/server';
import { RegionLoader } from '../../../../../Canopy[BP]/scripts/src/classes/RegionLoader.js';

describe('RegionLoader', () => {
    const dimension = { id: 'minecraft:overworld' };
    const min = { x: 0, y: 0, z: 0 };
    const max = { x: 4, y: 4, z: 4 };
    let manager;

    beforeEach(() => {
        manager = {
            hasCapacity: vi.fn(() => true),
            createTickingArea: vi.fn(() => Promise.resolve()),
            removeTickingArea: vi.fn()
        };
        world.tickingAreaManager = manager;
    });

    afterEach(() => {
        delete world.tickingAreaManager;
    });

    it('checks capacity with dimension/from/to', () => {
        const loader = new RegionLoader(dimension, min, max, 'canopy_analyzearea_1');
        expect(loader.hasCapacity()).toBe(true);
        expect(manager.hasCapacity).toHaveBeenCalledWith({ dimension, from: min, to: max });
    });

    it('creates a ticking area with the id on load', async () => {
        const loader = new RegionLoader(dimension, min, max, 'canopy_analyzearea_1');
        await loader.load();
        expect(manager.createTickingArea).toHaveBeenCalledWith('canopy_analyzearea_1', { dimension, from: min, to: max });
    });

    it('removes the ticking area on unload and swallows errors', () => {
        manager.removeTickingArea.mockImplementation(() => { throw new Error('gone'); });
        const loader = new RegionLoader(dimension, min, max, 'canopy_analyzearea_1');
        expect(() => loader.unload()).not.toThrow();
        expect(manager.removeTickingArea).toHaveBeenCalledWith('canopy_analyzearea_1');
    });
});
