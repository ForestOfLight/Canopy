import { vi, describe, it, expect, beforeEach } from 'vitest';
import { world, EquipmentSlot, EntityComponentTypes } from '@minecraft/server';
import { makeEquippable } from '@minecraft/server-gametest';
import { UnderstudyInventorySaver } from '../../../../../../Canopy[BP]/scripts/src/classes/simplayer/UnderstudyInventorySaver';
import { UnderstudyStorageView } from '../../../../../../Canopy[BP]/scripts/src/classes/simplayer/UnderstudyStorageView';
import Understudy from '../../../../../../Canopy[BP]/scripts/src/classes/simplayer/Understudy';

vi.mock('../../../../../../Canopy[BP]/scripts/src/rules/simplayer/simplayerSaving', () => ({
    simplayerSaving: { getNativeValue: vi.fn(() => true), getID: vi.fn(() => 'simplayerSaving') }
}));
vi.mock('../../../../../../Canopy[BP]/scripts/src/classes/simplayer/Understudies', () => ({
    default: { onConnect: vi.fn() }
}));

describe('UnderstudyInventorySaver', () => {
    const EQUIPMENT_SLOT_COUNT = 6;
    let understudy;
    let inventorySaver;

    beforeEach(() => {
        vi.clearAllMocks();
        understudy = new Understudy('TestBot');
        inventorySaver = new UnderstudyInventorySaver(understudy);
        understudy.join({ location: { x: 0, y: 0, z: 0 }, dimension: world.getDimension('overworld') });
    });

    describe('constructor', () => {
        it('namespaces the inventory key with the player name', () => {
            expect(inventorySaver.inventoryKey).toBe('canopy:TestBot-inventory');
        });
    });

    describe('save', () => {
        it('saves under the inventory key', () => {
            const spy = vi.spyOn(inventorySaver.itemDatabase, 'saveContainer').mockImplementation(() => void 0);
            inventorySaver.save();
            expect(spy).toHaveBeenCalledWith('canopy:TestBot-inventory', expect.any(UnderstudyStorageView));
        });

        it('saves the inventory and every equipment slot in one container', () => {
            const spy = vi.spyOn(inventorySaver.itemDatabase, 'saveContainer').mockImplementation(() => void 0);
            const inventorySize = understudy.getInventory().size;

            inventorySaver.save();

            const [, savedContainer] = spy.mock.calls[0];
            expect(savedContainer.size).toBe(inventorySize + EQUIPMENT_SLOT_COUNT);
        });

        it('writes a single structure rather than one per storage kind', () => {
            const spy = vi.spyOn(inventorySaver.itemDatabase, 'saveContainer').mockImplementation(() => void 0);
            inventorySaver.save();
            expect(spy).toHaveBeenCalledTimes(1);
        });

        it('exposes equipped items through the saved container', () => {
            const helmet = { typeId: 'minecraft:diamond_helmet', amount: 1 };
            const equippable = makeEquippable({ [EquipmentSlot.Head]: helmet });
            const container = understudy.getInventory();
            understudy.simulatedPlayer.getComponent.mockImplementation(type => {
                if (type === EntityComponentTypes.Equippable) return equippable;
                if (type === EntityComponentTypes.Inventory) return { container };
            });
            const spy = vi.spyOn(inventorySaver.itemDatabase, 'saveContainer').mockImplementation(() => void 0);

            inventorySaver.save();

            const [, savedContainer] = spy.mock.calls[0];
            expect(savedContainer.getItem(container.size)).toBe(helmet);
        });

        it('does not save when the inventory component is absent', () => {
            understudy.simulatedPlayer.getComponent.mockReturnValue(undefined);
            const spy = vi.spyOn(inventorySaver.itemDatabase, 'saveContainer').mockImplementation(() => void 0);
            inventorySaver.save();
            expect(spy).not.toHaveBeenCalled();
        });
    });

    describe('load', () => {
        it('loads under the inventory key', () => {
            const spy = vi.spyOn(inventorySaver.itemDatabase, 'loadContainer').mockImplementation(() => void 0);
            inventorySaver.load();
            expect(spy).toHaveBeenCalledWith('canopy:TestBot-inventory', expect.any(UnderstudyStorageView));
        });

        it('loads into a container covering the inventory and every equipment slot', () => {
            const spy = vi.spyOn(inventorySaver.itemDatabase, 'loadContainer').mockImplementation(() => void 0);
            const inventorySize = understudy.getInventory().size;

            inventorySaver.load();

            const [, filledContainer] = spy.mock.calls[0];
            expect(filledContainer.size).toBe(inventorySize + EQUIPMENT_SLOT_COUNT);
        });

        it('applies loaded equipment to the understudy', () => {
            const boots = { typeId: 'minecraft:netherite_boots', amount: 1 };
            const inventorySize = understudy.getInventory().size;
            vi.spyOn(inventorySaver.itemDatabase, 'loadContainer').mockImplementation((key, container) => {
                container.setItem(inventorySize + 3, boots);
            });

            inventorySaver.load();

            expect(understudy.getEquippable().setEquipment).toHaveBeenCalledWith(EquipmentSlot.Feet, boots);
        });

        it('does not load when the inventory component is absent', () => {
            understudy.simulatedPlayer.getComponent.mockReturnValue(undefined);
            const spy = vi.spyOn(inventorySaver.itemDatabase, 'loadContainer').mockImplementation(() => void 0);
            inventorySaver.load();
            expect(spy).not.toHaveBeenCalled();
        });
    });
});
