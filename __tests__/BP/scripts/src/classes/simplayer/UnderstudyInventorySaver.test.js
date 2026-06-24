import { vi, describe, it, expect, beforeEach } from 'vitest';
import { world, Container, EquipmentSlot, EntityComponentTypes } from '@minecraft/server';
import { makeEquippable } from '@minecraft/server-gametest';
import { UnderstudyInventorySaver } from '../../../../../../Canopy[BP]/scripts/src/classes/simplayer/UnderstudyInventorySaver';
import Understudy from '../../../../../../Canopy[BP]/scripts/src/classes/simplayer/Understudy';

vi.mock('../../../../../../Canopy[BP]/scripts/src/rules/simplayer/simplayerSaving', () => ({
    simplayerSaving: { getNativeValue: vi.fn(() => true), getID: vi.fn(() => 'simplayerSaving') }
}));
vi.mock('../../../../../../Canopy[BP]/scripts/src/classes/simplayer/Understudies', () => ({
    default: { onConnect: vi.fn() }
}));

describe('UnderstudyInventorySaver', () => {
    let understudy;
    let inventorySaver;

    beforeEach(() => {
        vi.clearAllMocks();
        understudy = new Understudy('TestBot');
        inventorySaver = new UnderstudyInventorySaver(understudy);
        understudy.join({ location: { x: 0, y: 0, z: 0 }, dimension: world.getDimension('overworld') });
    });

    describe('constructor', () => {
        it('sets inventory dynamic property key based on player name', () => {
            expect(inventorySaver.inventoryDP).toBe('bot_TestBot_inventory');
        });

        it('sets equippable dynamic property key based on player name', () => {
            expect(inventorySaver.equippableDP).toBe('bot_TestBot_equippable');
        });

        it('truncates player name to 8 characters in the table name', () => {
            const inv = new UnderstudyInventorySaver(new Understudy('LongNamedPlayer'));
            expect(inv.inventoryDP).toBe('bot_LongName_inventory');
        });
    });

    describe('save', () => {
        it('writes inventory items to world dynamic property', () => {
            inventorySaver.save();
            expect(world.setDynamicProperty).toHaveBeenCalledWith('bot_TestBot_inventory', expect.any(String));
        });

        it('writes equippable items to world dynamic property', () => {
            inventorySaver.save();
            expect(world.setDynamicProperty).toHaveBeenCalledWith('bot_TestBot_equippable', expect.any(String));
        });

        it('includes equipped items in the serialized equippable output', () => {
            const sword = { typeId: 'minecraft:iron_sword', amount: 1 };
            const equippable = makeEquippable({ [EquipmentSlot.Head]: sword });
            const container = understudy.getInventory();
            understudy.simulatedPlayer.getComponent.mockImplementation(type => {
                if (type === EntityComponentTypes.Equippable) return equippable;
                if (type === EntityComponentTypes.Inventory) return { container };
            });
            inventorySaver.save();
            expect(world.setDynamicProperty).toHaveBeenCalledWith(
                'bot_TestBot_equippable',
                expect.stringContaining('"Head":{"typeId":"minecraft:iron_sword","amount":1}')
            );
        });

        it('excludes undefined items from the serialized output', () => {
            const inventory = understudy.getInventory();
            const itemStack = { typeId: 'minecraft:stone', amount: 1 };
            inventory.setItem(0, itemStack);
            inventorySaver.save();
            expect(world.setDynamicProperty).toHaveBeenCalledWith(
                'bot_TestBot_inventory', JSON.stringify({ 0: itemStack })
            );
        });

        it('saves items to the item database', () => {
            const spy = vi.spyOn(inventorySaver.itemDatabase, 'setItems');
            inventorySaver.save();
            expect(spy).toHaveBeenCalled();
        });
    });

    describe('saveWithoutNBT', () => {
        it('writes inventory items to world dynamic property', () => {
            inventorySaver.saveWithoutNBT();
            expect(world.setDynamicProperty).toHaveBeenCalledWith('bot_TestBot_inventory', expect.any(String));
        });

        it('writes equippable items to world dynamic property', () => {
            inventorySaver.saveWithoutNBT();
            expect(world.setDynamicProperty).toHaveBeenCalledWith('bot_TestBot_equippable', expect.any(String));
        });

        it('does not save items to the item database', () => {
            const spy = vi.spyOn(inventorySaver.itemDatabase, 'setItems');
            inventorySaver.saveWithoutNBT();
            expect(spy).not.toHaveBeenCalled();
        });
    });

    describe('load', () => {
        describe('inventory', () => {
            it('returns early when inventory component is absent', () => {
                understudy.simulatedPlayer.getComponent.mockImplementation(
                    component => component === EntityComponentTypes.Equippable ? makeEquippable() : undefined
                );
                inventorySaver.load();
                understudy.simulatedPlayer.getComponent.mockRestore();
                expect(understudy.getInventory().setItem).not.toHaveBeenCalled();
            });

            it('returns early when no saved data exists', () => {
                inventorySaver.load();
                expect(understudy.getInventory().setItem).not.toHaveBeenCalled();
            });

            it('sets items in the inventory container from saved data', () => {
                world.getDynamicProperty.mockImplementation(key =>
                    key === 'bot_TestBot_inventory'
                        ? JSON.stringify({ 0: { typeId: 'minecraft:stone', amount: 1 } })
                        : undefined
                );
                vi.spyOn(inventorySaver.itemDatabase, 'getItems').mockReturnValue([{ typeId: 'minecraft:stone', amount: 1 }]);
                inventorySaver.load();
                expect(understudy.getInventory().setItem).toHaveBeenCalled();
            });

            it('sets item to undefined when absent from the NBT database', () => {
                world.getDynamicProperty.mockImplementation(key =>
                    key === 'bot_TestBot_inventory'
                        ? JSON.stringify({ 0: { typeId: 'minecraft:stone', amount: 1 } })
                        : undefined
                );
                vi.spyOn(inventorySaver.itemDatabase, 'getItems').mockReturnValue([]);
                inventorySaver.load();
                expect(understudy.getInventory().setItem).toHaveBeenCalledWith(0, undefined);
            });
        });

        describe('equippable', () => {
            it('returns early when equippable component is absent', () => {
                understudy.simulatedPlayer.getComponent.mockImplementation(
                    component => component === EntityComponentTypes.Inventory ? new Container() : undefined
                );
                inventorySaver.load();
                understudy.simulatedPlayer.getComponent.mockRestore();
                const equippable = understudy.simulatedPlayer.getComponent(EntityComponentTypes.Equippable);
                expect(equippable.setEquipment).not.toHaveBeenCalled();
            });

            it('returns early when no saved data exists', () => {
                inventorySaver.load();
                const equippable = understudy.simulatedPlayer.getComponent(EntityComponentTypes.Equippable);
                expect(equippable.setEquipment).not.toHaveBeenCalled();
            });

            it('calls setEquipment for each slot from saved data', () => {
                const savedData = Object.fromEntries(Object.keys(EquipmentSlot).map(slot => [slot, null]));
                world.getDynamicProperty.mockImplementation(key =>
                    key === 'bot_TestBot_equippable' ? JSON.stringify(savedData) : undefined
                );
                vi.spyOn(inventorySaver.itemDatabase, 'getItems').mockReturnValue([]);
                inventorySaver.load();
                const equippable = understudy.simulatedPlayer.getComponent(EntityComponentTypes.Equippable);
                expect(equippable.setEquipment).toHaveBeenCalledTimes(Object.keys(EquipmentSlot).length);
            });
        });
    });
});
