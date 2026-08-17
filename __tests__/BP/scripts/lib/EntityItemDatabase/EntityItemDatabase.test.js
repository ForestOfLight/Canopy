import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { world } from '@minecraft/server';
import { EntityItemDatabase } from '../../../../../Canopy[BP]/scripts/lib/EntityItemDatabase/EntityItemDatabase.js';

describe('EntityItemDatabase', () => {
    const key = 'canopy:bot:inventory';
    let dimension;
    let databaseEntity;
    let databaseContainer;
    let sourceContainer;
    let liveEntities;

    const makeContainer = () => ({
        size: 36,
        getItem: vi.fn(() => void 0),
        setItem: vi.fn()
    });

    const makeEntity = (tags = []) => {
        const entity = {
            typeId: 'canopy:nbt_item_database',
            tags: [...tags],
            addTag: vi.fn(tag => entity.tags.push(tag)),
            getComponent: vi.fn(() => ({ container: databaseContainer })),
            remove: vi.fn(() => {
                liveEntities.splice(liveEntities.indexOf(entity), 1);
            })
        };
        return entity;
    };

    const spawnDatabaseEntity = () => {
        databaseEntity = makeEntity();
        liveEntities.push(databaseEntity);
        return databaseEntity;
    };

    beforeEach(() => {
        liveEntities = [];
        databaseContainer = makeContainer();
        sourceContainer = makeContainer();
        databaseEntity = makeEntity();
        dimension = {
            id: 'minecraft:overworld',
            getEntities: vi.fn((options = {}) => liveEntities.filter(entity =>
                (options.type === void 0 || entity.typeId === options.type) &&
                (options.tags === void 0 || options.tags.every(tag => entity.tags.includes(tag)))
            )),
            spawnEntity: vi.fn(() => spawnDatabaseEntity()),
            fillBlocks: vi.fn()
        };
        world.getDimension = vi.fn(() => dimension);
        world.structureManager = { createFromWorld: vi.fn(), place: vi.fn(), delete: vi.fn() };
        world.tickingAreaManager = {
            createTickingArea: vi.fn(() => Promise.resolve()),
            removeTickingArea: vi.fn(),
            hasTickingArea: vi.fn(() => false)
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

    it('leaves no entity behind after a save', () => {
        const database = new EntityItemDatabase();

        database.saveContainer(key, sourceContainer);

        expect(liveEntities).toHaveLength(0);
    });

    it('removes the entity when the structure save throws', () => {
        world.structureManager.createFromWorld.mockImplementation(() => {
            throw new Error('structure bounds outside world');
        });
        const database = new EntityItemDatabase();

        expect(() => database.saveContainer(key, sourceContainer)).toThrow();
        expect(liveEntities).toHaveLength(0);
    });

    it('removes the entity when writing items throws', () => {
        databaseContainer.setItem.mockImplementation(() => {
            throw new Error('bad item');
        });
        const database = new EntityItemDatabase();

        expect(() => database.saveContainer(key, sourceContainer)).toThrow();
        expect(liveEntities).toHaveLength(0);
    });

    it('does not accumulate entities across repeated saves', () => {
        const database = new EntityItemDatabase();

        for (let i = 0; i < 20; i++)
            database.saveContainer(key, sourceContainer);

        expect(dimension.spawnEntity).toHaveBeenCalledTimes(20);
        expect(liveEntities).toHaveLength(0);
    });

    it('removes untagged stray database entities left in the working region', () => {
        liveEntities.push(makeEntity());
        const database = new EntityItemDatabase();

        database.saveContainer(key, sourceContainer);

        expect(liveEntities).toHaveLength(0);
    });

    it('removes stray database entities tagged with another key', () => {
        liveEntities.push(makeEntity(['canopy:otherbot:inventory']));
        const database = new EntityItemDatabase();

        database.saveContainer(key, sourceContainer);

        expect(liveEntities).toHaveLength(0);
    });

    it('leaves no entity behind after a load', () => {
        world.structureManager.place.mockImplementation(() => {
            liveEntities.push(makeEntity([key]));
        });
        const database = new EntityItemDatabase();

        database.loadContainer(key, sourceContainer);

        expect(liveEntities).toHaveLength(0);
    });

    it('removes placed entities when the structure holds no entity for the key', () => {
        world.structureManager.place.mockImplementation(() => {
            liveEntities.push(makeEntity());
        });
        const database = new EntityItemDatabase();

        try {
            database.loadContainer(key, sourceContainer);
        } catch {
            // the missing key is reported separately; this test only covers cleanup
        }

        expect(liveEntities).toHaveLength(0);
    });
});
