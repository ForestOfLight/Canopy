import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@minecraft/server', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        ItemStack: class ItemStack {
            constructor(typeId, amount = 1) {
                if (typeId === 'minecraft:removed_item')
                    throw new Error(`Unknown item type ${typeId}`);
                this.typeId = typeId;
                this.amount = amount;
            }
        }
    };
});

const { world, EquipmentSlot, InvalidStructureError } = await import('@minecraft/server');
const { WorkingRegion } = await import('../../../../../../Canopy[BP]/scripts/lib/EntityItemDatabase/WorkingRegion.js');
const { LegacyInventoryReader } = await import('../../../../../../Canopy[BP]/scripts/src/classes/simplayer/LegacyInventoryReader.js');

const PLAYER_INVENTORY_SIZE = 36;
const EQUIPMENT_SLOTS = Object.values(EquipmentSlot).filter(slotName => slotName !== EquipmentSlot.Mainhand);
const equipmentIndexOf = (equipmentSlot) => PLAYER_INVENTORY_SIZE + EQUIPMENT_SLOTS.indexOf(equipmentSlot);

describe('LegacyInventoryReader', () => {
    const name = 'bot12345';
    let dimension;
    let liveEntities;
    let structures;
    let originalStructureManager;

    const makeItemEntity = (typeId, amount) => {
        const itemStack = { typeId, amount, nbt: `${typeId}x${amount}` };
        const entity = {
            typeId: 'minecraft:item',
            itemStack,
            getComponent: vi.fn(() => ({ itemStack }))
        };
        entity.remove = vi.fn(() => {
            liveEntities.splice(liveEntities.indexOf(entity), 1);
        });
        return entity;
    };

    const setLegacyStructure = (key, itemEntities) => structures.set(key, itemEntities);

    beforeEach(async () => {
        liveEntities = [];
        structures = new Map();
        dimension = {
            id: 'minecraft:overworld',
            getEntities: vi.fn(() => [...liveEntities]),
            fillBlocks: vi.fn(),
            spawnEntity: vi.fn()
        };
        world.getDimension = vi.fn(() => dimension);
        originalStructureManager = world.structureManager;
        world.structureManager = {
            get: vi.fn(id => structures.has(id) ? { id } : void 0),
            delete: vi.fn(id => structures.delete(id)),
            getWorldStructureIds: vi.fn(() => [...structures.keys()]),
            place: vi.fn(id => {
                if (!structures.has(id))
                    throw new InvalidStructureError(`Structure ${id} does not exist.`);
                for (const savedItem of structures.get(id))
                    liveEntities.push(makeItemEntity(savedItem.typeId, savedItem.amount));
            }),
            createFromWorld: vi.fn()
        };
        world.setDynamicProperty('bot_bot12345_inventory', void 0);
        world.setDynamicProperty('bot_bot12345_equippable', void 0);
        vi.spyOn(console, 'warn').mockImplementation(() => void 0);
        await WorkingRegion.createAt(dimension, { x: 1000000, y: 0, z: 1000000 });
    });

    afterEach(() => {
        WorkingRegion.remove();
        world.structureManager = originalStructureManager;
        vi.clearAllMocks();
        vi.restoreAllMocks();
    });

    describe('findSavedNames', () => {
        it('returns the truncated names of legacy inventory structures', () => {
            setLegacyStructure('bot_bot12345_item:inv', []);
            setLegacyStructure('bot_other_item:equ', []);

            expect(LegacyInventoryReader.findSavedNames()).toEqual(new Set(['bot12345', 'other']));
        });

        it('ignores structures that are not legacy inventory data', () => {
            setLegacyStructure('canopy:bot12345-inventory', []);
            setLegacyStructure('mystructure:bubble_column', []);

            expect(LegacyInventoryReader.findSavedNames()).toEqual(new Set());
        });
    });

    describe('readStorage', () => {
        it('restores items into the slots recorded by the ordering property', () => {
            world.setDynamicProperty('bot_bot12345_inventory', JSON.stringify({
                0: { typeId: 'minecraft:diamond', amount: 3 },
                7: { typeId: 'minecraft:stone', amount: 64 }
            }));
            setLegacyStructure('bot_bot12345_item:inv', [
                { typeId: 'minecraft:stone', amount: 64 },
                { typeId: 'minecraft:diamond', amount: 3 }
            ]);

            const storage = new LegacyInventoryReader(name).readStorage();

            expect(storage.getItem(0)).toMatchObject({ typeId: 'minecraft:diamond', amount: 3, nbt: 'minecraft:diamondx3' });
            expect(storage.getItem(7)).toMatchObject({ typeId: 'minecraft:stone', amount: 64, nbt: 'minecraft:stonex64' });
            expect(storage.getItem(1)).toBeUndefined();
        });

        it('does not hand the same saved stack to two slots', () => {
            world.setDynamicProperty('bot_bot12345_inventory', JSON.stringify({
                0: { typeId: 'minecraft:stone', amount: 64 },
                1: { typeId: 'minecraft:stone', amount: 64 }
            }));
            setLegacyStructure('bot_bot12345_item:inv', [
                { typeId: 'minecraft:stone', amount: 64 },
                { typeId: 'minecraft:stone', amount: 64 }
            ]);

            const storage = new LegacyInventoryReader(name).readStorage();

            expect(storage.getItem(0)).not.toBe(storage.getItem(1));
            expect(storage.getItem(0)).toMatchObject({ typeId: 'minecraft:stone', amount: 64 });
            expect(storage.getItem(1)).toMatchObject({ typeId: 'minecraft:stone', amount: 64 });
        });

        it('rebuilds a plain stack when the saved data holds no matching item', () => {
            world.setDynamicProperty('bot_bot12345_inventory', JSON.stringify({
                2: { typeId: 'minecraft:dirt', amount: 5 }
            }));
            setLegacyStructure('bot_bot12345_item:inv', []);

            const storage = new LegacyInventoryReader(name).readStorage();

            expect(storage.getItem(2)).toMatchObject({ typeId: 'minecraft:dirt', amount: 5 });
            expect(storage.getItem(2).nbt).toBeUndefined();
        });

        it('skips slots whose recorded item can no longer be built', () => {
            world.setDynamicProperty('bot_bot12345_inventory', JSON.stringify({
                2: { typeId: 'minecraft:removed_item', amount: 1 }
            }));
            setLegacyStructure('bot_bot12345_item:inv', []);

            const storage = new LegacyInventoryReader(name).readStorage();

            expect(storage.getItem(2)).toBeUndefined();
        });

        it('ignores malformed slot entries', () => {
            world.setDynamicProperty('bot_bot12345_inventory', JSON.stringify({
                0: { typeId: 'minecraft:dirt', amount: 0 },
                1: { amount: 4 },
                2: { typeId: 'minecraft:dirt' }
            }));
            setLegacyStructure('bot_bot12345_item:inv', []);

            const storage = new LegacyInventoryReader(name).readStorage();

            expect(storage.getItem(0)).toBeUndefined();
            expect(storage.getItem(1)).toBeUndefined();
            expect(storage.getItem(2)).toBeUndefined();
        });

        it('restores equipment into the equipment range of the storage view', () => {
            world.setDynamicProperty('bot_bot12345_equippable', JSON.stringify({
                [EquipmentSlot.Head]: { typeId: 'minecraft:diamond_helmet', amount: 1 },
                [EquipmentSlot.Offhand]: { typeId: 'minecraft:shield', amount: 1 }
            }));
            setLegacyStructure('bot_bot12345_item:equ', [
                { typeId: 'minecraft:shield', amount: 1 },
                { typeId: 'minecraft:diamond_helmet', amount: 1 }
            ]);

            const storage = new LegacyInventoryReader(name).readStorage();

            expect(storage.getItem(equipmentIndexOf(EquipmentSlot.Head)))
                .toMatchObject({ typeId: 'minecraft:diamond_helmet', nbt: 'minecraft:diamond_helmetx1' });
            expect(storage.getItem(equipmentIndexOf(EquipmentSlot.Offhand)))
                .toMatchObject({ typeId: 'minecraft:shield', nbt: 'minecraft:shieldx1' });
            expect(storage.getItem(equipmentIndexOf(EquipmentSlot.Chest))).toBeUndefined();
        });

        it('never lets the mainhand slot occupy the equipment range', () => {
            world.setDynamicProperty('bot_bot12345_equippable', JSON.stringify({
                [EquipmentSlot.Mainhand]: { typeId: 'minecraft:diamond_sword', amount: 1 }
            }));
            setLegacyStructure('bot_bot12345_item:equ', []);

            const storage = new LegacyInventoryReader(name).readStorage();

            for (let i = PLAYER_INVENTORY_SIZE; i < storage.size; i++)
                expect(storage.getItem(i)).toBeUndefined();
        });

        it('returns an empty storage when no legacy data exists', () => {
            const storage = new LegacyInventoryReader(name).readStorage();

            expect(storage.size).toBe(PLAYER_INVENTORY_SIZE + EQUIPMENT_SLOTS.length);
            for (let i = 0; i < storage.size; i++)
                expect(storage.getItem(i)).toBeUndefined();
        });

        it('returns an empty storage when the ordering property is corrupt', () => {
            world.setDynamicProperty('bot_bot12345_inventory', 'not json');
            setLegacyStructure('bot_bot12345_item:inv', [{ typeId: 'minecraft:stone', amount: 1 }]);

            const storage = new LegacyInventoryReader(name).readStorage();

            expect(storage.getItem(0)).toBeUndefined();
        });

        it('leaves no entities behind in the working region', () => {
            world.setDynamicProperty('bot_bot12345_inventory', JSON.stringify({
                0: { typeId: 'minecraft:stone', amount: 1 }
            }));
            setLegacyStructure('bot_bot12345_item:inv', [{ typeId: 'minecraft:stone', amount: 1 }]);

            new LegacyInventoryReader(name).readStorage();

            expect(liveEntities).toHaveLength(0);
        });
    });

    describe('remove', () => {
        it('deletes both legacy structures and both ordering properties', () => {
            setLegacyStructure('bot_bot12345_item:inv', []);
            setLegacyStructure('bot_bot12345_item:equ', []);
            world.setDynamicProperty('bot_bot12345_inventory', '{}');
            world.setDynamicProperty('bot_bot12345_equippable', '{}');

            new LegacyInventoryReader(name).remove();

            expect(structures.has('bot_bot12345_item:inv')).toBe(false);
            expect(structures.has('bot_bot12345_item:equ')).toBe(false);
            expect(world.getDynamicProperty('bot_bot12345_inventory')).toBeUndefined();
            expect(world.getDynamicProperty('bot_bot12345_equippable')).toBeUndefined();
        });
    });
});
