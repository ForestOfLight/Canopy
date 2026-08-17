import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { world } from '@minecraft/server';

const { saveContainer, findSavedNames, readStorage, remove } = vi.hoisted(() => ({
    saveContainer: vi.fn(),
    findSavedNames: vi.fn(() => new Set()),
    readStorage: vi.fn(truncatedName => ({ truncatedName, size: 42, getItem: () => void 0 })),
    remove: vi.fn()
}));

vi.mock('../../../../../../Canopy[BP]/scripts/lib/EntityItemDatabase/EntityItemDatabase.js', () => ({
    EntityItemDatabase: class EntityItemDatabase {
        saveContainer = saveContainer;
    }
}));

vi.mock('../../../../../../Canopy[BP]/scripts/src/classes/simplayer/LegacyInventoryReader.js', () => ({
    LegacyInventoryReader: class LegacyInventoryReader {
        static findSavedNames = findSavedNames;

        constructor(truncatedName) {
            this.truncatedName = truncatedName;
        }

        readStorage() {
            return readStorage(this.truncatedName);
        }

        remove() {
            remove(this.truncatedName);
        }
    }
}));

const { LegacyInventoryMigrator } = await import('../../../../../../Canopy[BP]/scripts/src/classes/simplayer/LegacyInventoryMigrator.js');

describe('LegacyInventoryMigrator', () => {
    let structures;
    let dynamicPropertyIds;
    let originalStructureManager;

    beforeEach(() => {
        structures = new Set();
        dynamicPropertyIds = [];
        originalStructureManager = world.structureManager;
        world.structureManager = {
            get: vi.fn(id => structures.has(id) ? { id } : void 0),
            delete: vi.fn(id => structures.delete(id)),
            getWorldStructureIds: vi.fn(() => [...structures])
        };
        world.getDynamicPropertyIds = vi.fn(() => [...dynamicPropertyIds]);
        vi.spyOn(console, 'warn').mockImplementation(() => void 0);
    });

    afterEach(() => {
        world.structureManager = originalStructureManager;
        vi.clearAllMocks();
        vi.restoreAllMocks();
    });

    it('migrates legacy data to the current key and then deletes it', async () => {
        findSavedNames.mockReturnValue(new Set(['Steve123']));
        dynamicPropertyIds = ['Steve1234567:playerinfo', 'commandPrefix'];

        const migratedCount = await LegacyInventoryMigrator.migrate();

        expect(saveContainer).toHaveBeenCalledWith('canopy:Steve1234567-inventory', expect.objectContaining({ truncatedName: 'Steve123' }));
        expect(remove).toHaveBeenCalledWith('Steve123');
        expect(migratedCount).toBe(1);
    });

    it('saves before deleting so a failed save keeps the legacy data', async () => {
        findSavedNames.mockReturnValue(new Set(['Steve123']));
        dynamicPropertyIds = ['Steve1234567:playerinfo'];
        saveContainer.mockImplementation(() => {
            throw new Error('structure bounds outside world');
        });

        const migratedCount = await LegacyInventoryMigrator.migrate();

        expect(remove).not.toHaveBeenCalled();
        expect(migratedCount).toBe(0);
    });

    it('keeps migrating the remaining players after one fails', async () => {
        findSavedNames.mockReturnValue(new Set(['Steve123', 'Alex4567']));
        dynamicPropertyIds = ['Steve1234567:playerinfo', 'Alex45678:playerinfo'];
        saveContainer.mockImplementation(key => {
            if (key === 'canopy:Steve1234567-inventory')
                throw new Error('structure bounds outside world');
        });

        const migratedCount = await LegacyInventoryMigrator.migrate();

        expect(remove).toHaveBeenCalledTimes(1);
        expect(remove).toHaveBeenCalledWith('Alex4567');
        expect(migratedCount).toBe(1);
    });

    it('deletes orphaned legacy data without saving it', async () => {
        findSavedNames.mockReturnValue(new Set(['Ghost123']));
        dynamicPropertyIds = ['Steve1234567:playerinfo'];

        const migratedCount = await LegacyInventoryMigrator.migrate();

        expect(saveContainer).not.toHaveBeenCalled();
        expect(remove).toHaveBeenCalledWith('Ghost123');
        expect(migratedCount).toBe(0);
    });

    it('resolves a truncated-name collision to the first saved player', async () => {
        findSavedNames.mockReturnValue(new Set(['Steve123']));
        dynamicPropertyIds = ['Steve1234567:playerinfo', 'Steve123456789:playerinfo'];

        await LegacyInventoryMigrator.migrate();

        expect(saveContainer).toHaveBeenCalledTimes(1);
        expect(saveContainer).toHaveBeenCalledWith('canopy:Steve1234567-inventory', expect.anything());
    });

    it('deletes legacy data without overwriting an already migrated inventory', async () => {
        findSavedNames.mockReturnValue(new Set(['Steve123']));
        dynamicPropertyIds = ['Steve1234567:playerinfo'];
        structures.add('canopy:Steve1234567-inventory');

        const migratedCount = await LegacyInventoryMigrator.migrate();

        expect(saveContainer).not.toHaveBeenCalled();
        expect(remove).toHaveBeenCalledWith('Steve123');
        expect(migratedCount).toBe(0);
    });

    it('does nothing when there is no legacy data', async () => {
        findSavedNames.mockReturnValue(new Set());
        dynamicPropertyIds = ['Steve1234567:playerinfo'];

        const migratedCount = await LegacyInventoryMigrator.migrate();

        expect(saveContainer).not.toHaveBeenCalled();
        expect(remove).not.toHaveBeenCalled();
        expect(migratedCount).toBe(0);
    });

    it('matches a player whose name is shorter than the truncated key', async () => {
        findSavedNames.mockReturnValue(new Set(['bot']));
        dynamicPropertyIds = ['bot:playerinfo'];

        await LegacyInventoryMigrator.migrate();

        expect(saveContainer).toHaveBeenCalledWith('canopy:bot-inventory', expect.anything());
    });
});
