import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EquipmentSlot } from '@minecraft/server';
import { UnderstudyStorageView } from '../../../../../../Canopy[BP]/scripts/src/classes/simplayer/UnderstudyStorageView';

describe('UnderstudyStorageView', () => {
    let inventory;
    let equipment;
    let equippable;

    const makeInventory = (size = 36) => {
        const slots = new Array(size).fill(void 0);
        return {
            size,
            getItem: vi.fn(index => slots[index]),
            setItem: vi.fn((index, itemStack) => {
                slots[index] = itemStack;
            })
        };
    };

    beforeEach(() => {
        inventory = makeInventory();
        equipment = {};
        equippable = {
            getEquipment: vi.fn(slot => equipment[slot]),
            setEquipment: vi.fn((slot, itemStack) => {
                equipment[slot] = itemStack;
                return true;
            })
        };
    });

    describe('size', () => {
        it('reports the inventory size plus every equipment slot except mainhand', () => {
            const view = new UnderstudyStorageView(inventory, equippable);
            expect(view.size).toBe(36 + 6);
        });

        it('reports only the inventory size when the equippable component is absent', () => {
            const view = new UnderstudyStorageView(inventory, void 0);
            expect(view.size).toBe(36);
        });
    });

    describe('getItem', () => {
        it('reads inventory slots below the inventory size from the container', () => {
            const stone = { typeId: 'minecraft:stone', amount: 1 };
            inventory.setItem(35, stone);
            const view = new UnderstudyStorageView(inventory, equippable);

            expect(view.getItem(35)).toBe(stone);
            expect(equippable.getEquipment).not.toHaveBeenCalled();
        });

        it('reads the first slot past the inventory from the body equipment slot', () => {
            const wolfArmor = { typeId: 'minecraft:wolf_armor', amount: 1 };
            equipment[EquipmentSlot.Body] = wolfArmor;
            const view = new UnderstudyStorageView(inventory, equippable);

            expect(view.getItem(36)).toBe(wolfArmor);
            expect(inventory.getItem).not.toHaveBeenCalled();
        });

        it('reads the last slot from the offhand equipment slot', () => {
            const shield = { typeId: 'minecraft:shield', amount: 1 };
            equipment[EquipmentSlot.Offhand] = shield;
            const view = new UnderstudyStorageView(inventory, equippable);

            expect(view.getItem(41)).toBe(shield);
        });

        it('never reads the mainhand equipment slot', () => {
            const view = new UnderstudyStorageView(inventory, equippable);

            for (let i = 0; i < view.size; i++)
                view.getItem(i);

            expect(equippable.getEquipment).not.toHaveBeenCalledWith(EquipmentSlot.Mainhand);
        });
    });

    describe('setItem', () => {
        it('writes inventory slots below the inventory size to the container', () => {
            const stone = { typeId: 'minecraft:stone', amount: 1 };
            const view = new UnderstudyStorageView(inventory, equippable);

            view.setItem(0, stone);

            expect(inventory.setItem).toHaveBeenCalledWith(0, stone);
            expect(equippable.setEquipment).not.toHaveBeenCalled();
        });

        it('writes the first slot past the inventory to the body equipment slot', () => {
            const wolfArmor = { typeId: 'minecraft:wolf_armor', amount: 1 };
            const view = new UnderstudyStorageView(inventory, equippable);

            view.setItem(36, wolfArmor);

            expect(equippable.setEquipment).toHaveBeenCalledWith(EquipmentSlot.Body, wolfArmor);
            expect(inventory.setItem).not.toHaveBeenCalled();
        });

        it('clears an equipment slot when the item is undefined', () => {
            equipment[EquipmentSlot.Offhand] = { typeId: 'minecraft:shield', amount: 1 };
            const view = new UnderstudyStorageView(inventory, equippable);

            view.setItem(41, void 0);

            expect(equippable.setEquipment).toHaveBeenCalledWith(EquipmentSlot.Offhand, void 0);
            expect(equipment[EquipmentSlot.Offhand]).toBe(void 0);
        });

        it('never writes the mainhand equipment slot', () => {
            const sword = { typeId: 'minecraft:iron_sword', amount: 1 };
            const view = new UnderstudyStorageView(inventory, equippable);

            for (let i = 0; i < view.size; i++)
                view.setItem(i, sword);

            expect(equippable.setEquipment).not.toHaveBeenCalledWith(EquipmentSlot.Mainhand, expect.anything());
        });
    });

    describe('slot mapping', () => {
        it('maps each slot past the inventory to a distinct equipment slot in a stable order', () => {
            const view = new UnderstudyStorageView(inventory, equippable);

            for (let i = inventory.size; i < view.size; i++)
                view.getItem(i);

            expect(equippable.getEquipment.mock.calls.map(([slot]) => slot)).toEqual([
                EquipmentSlot.Body,
                EquipmentSlot.Chest,
                EquipmentSlot.Feet,
                EquipmentSlot.Head,
                EquipmentSlot.Legs,
                EquipmentSlot.Offhand
            ]);
        });

        it('round-trips an item written to an equipment slot', () => {
            const boots = { typeId: 'minecraft:netherite_boots', amount: 1 };
            const view = new UnderstudyStorageView(inventory, equippable);

            view.setItem(39, boots);

            expect(view.getItem(39)).toBe(boots);
        });
    });

    describe('without an equippable component', () => {
        it('reads inventory slots normally', () => {
            const stone = { typeId: 'minecraft:stone', amount: 1 };
            inventory.setItem(0, stone);
            const view = new UnderstudyStorageView(inventory, void 0);

            expect(view.getItem(0)).toBe(stone);
        });

        it('ignores writes past the inventory instead of throwing', () => {
            const view = new UnderstudyStorageView(inventory, void 0);

            expect(() => view.setItem(36, { typeId: 'minecraft:stone', amount: 1 })).not.toThrow();
        });
    });
});
