import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { world } from '@minecraft/server';
import { EntityItemDatabase } from '../../../../../Canopy[BP]/scripts/lib/EntityItemDatabase/EntityItemDatabase.js';

describe('EntityItemDatabase', () => {
    const key = 'canopy:bot:inventory';
    let dimension;
    let databaseEntity;
    let databaseContainer;
    let sourceContainer;

    const makeContainer = () => ({
        size: 36,
        getItem: vi.fn(() => void 0),
        setItem: vi.fn()
    });

    beforeEach(() => {
        databaseContainer = makeContainer();
        sourceContainer = makeContainer();
        databaseEntity = {
            addTag: vi.fn(),
            getComponent: vi.fn(() => ({ container: databaseContainer })),
            remove: vi.fn()
        };
        dimension = {
            id: 'minecraft:overworld',
            getEntities: vi.fn(() => []),
            spawnEntity: vi.fn(() => databaseEntity),
            fillBlocks: vi.fn()
        };
        world.getDimension = vi.fn(() => dimension);
        world.structureManager = { createFromWorld: vi.fn(), place: vi.fn() };
        world.tickingAreaManager = {
            createTickingArea: vi.fn(() => Promise.resolve('EntityItemDatabase')),
            removeTickingArea: vi.fn()
        };
    });

    afterEach(() => {
        delete world.structureManager;
        delete world.tickingAreaManager;
    });

    it('creates the database entity when no entity exists for the key', () => {
        const database = new EntityItemDatabase();

        expect(() => database.saveContainer(key, sourceContainer)).not.toThrow();
        expect(dimension.spawnEntity).toHaveBeenCalledTimes(1);
        expect(databaseEntity.addTag).toHaveBeenCalledWith(key);
        expect(world.structureManager.createFromWorld).toHaveBeenCalledTimes(1);
    });

    it('reuses an existing database entity for the key', () => {
        dimension.getEntities.mockReturnValue([databaseEntity]);
        const database = new EntityItemDatabase();

        database.saveContainer(key, sourceContainer);

        expect(dimension.spawnEntity).not.toHaveBeenCalled();
        expect(world.structureManager.createFromWorld).toHaveBeenCalledTimes(1);
    });
});
