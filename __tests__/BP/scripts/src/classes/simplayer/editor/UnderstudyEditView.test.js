import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Container, EquipmentSlot } from '@minecraft/server';
import { UnderstudyEditView, UnderstudyEditViewMode } from '../../../../../../../Canopy[BP]/scripts/src/classes/simplayer/editor/UnderstudyEditView';

const makeItem = typeId => ({ typeId });

describe('UnderstudyEditView', () => {
    let inventory;
    let equipment;
    let equippable;

    beforeEach(() => {
        inventory = new Container({ size: 36 });
        equipment = {};
        equippable = {
            getEquipment: vi.fn(slot => equipment[slot]),
            setEquipment: vi.fn((slot, itemStack) => {
                equipment[slot] = itemStack;
                return true;
            })
        };
    });

    const makeHotbarView = () => new UnderstudyEditView(inventory, equippable, UnderstudyEditViewMode.HotbarAndArmor);
    const makeInventoryView = () => new UnderstudyEditView(inventory, equippable, UnderstudyEditViewMode.Inventory);

    describe('viewModeFor', () => {
        it('gives a sneaking player the main inventory', () => {
            expect(UnderstudyEditView.viewModeFor(true)).toBe(UnderstudyEditViewMode.Inventory);
        });

        it('gives an upright player the hotbar and worn gear', () => {
            expect(UnderstudyEditView.viewModeFor(false)).toBe(UnderstudyEditViewMode.HotbarAndArmor);
        });

        it('falls back to the hotbar view when the sneak state is unknown', () => {
            expect(UnderstudyEditView.viewModeFor(void 0)).toBe(UnderstudyEditViewMode.HotbarAndArmor);
        });
    });

    describe('titleKeyFor', () => {
        it('names each view with its own translation key', () => {
            expect(UnderstudyEditView.titleKeyFor(UnderstudyEditViewMode.HotbarAndArmor)).toBe('simplayer.editor.view.hotbarAndArmor');
            expect(UnderstudyEditView.titleKeyFor(UnderstudyEditViewMode.Inventory)).toBe('simplayer.editor.view.inventory');
        });

        it('names an unrecognized mode after the default view', () => {
            expect(UnderstudyEditView.titleKeyFor('nonsense')).toBe('simplayer.editor.view.hotbarAndArmor');
        });
    });

    describe('hotbar and armor view', () => {
        it('is small enough for a single chest UI', () => {
            expect(makeHotbarView().size).toBe(14);
            expect(makeHotbarView().size).toBeLessThanOrEqual(27);
        });

        it('starts the worn gear right after the hotbar', () => {
            const view = makeHotbarView();
            equipment[EquipmentSlot.Head] = makeItem('minecraft:diamond_helmet');
            expect(view.getItem(9).typeId).toBe('minecraft:diamond_helmet');
        });

        it('drops the equipment slots when the understudy has no equippable', () => {
            expect(new UnderstudyEditView(inventory, void 0, UnderstudyEditViewMode.HotbarAndArmor).size).toBe(9);
        });

        it('reads the hotbar straight off the front of the inventory', () => {
            inventory.setItem(0, makeItem('minecraft:dirt'));
            inventory.setItem(8, makeItem('minecraft:stone'));
            const view = makeHotbarView();
            expect(view.getItem(0).typeId).toBe('minecraft:dirt');
            expect(view.getItem(8).typeId).toBe('minecraft:stone');
        });

        it('never reaches past the hotbar into the main inventory', () => {
            inventory.setItem(9, makeItem('minecraft:diamond'));
            const view = makeHotbarView();
            for (let slotIndex = 0; slotIndex < view.size; slotIndex++)
                expect(view.getItem(slotIndex)?.typeId).not.toBe('minecraft:diamond');
        });

        it('lays the worn gear out head to toe with the offhand last', () => {
            const view = makeHotbarView();
            for (let slotIndex = 9; slotIndex < view.size; slotIndex++)
                view.getItem(slotIndex);
            expect(equippable.getEquipment.mock.calls.map(([slot]) => slot)).toEqual([
                EquipmentSlot.Head,
                EquipmentSlot.Chest,
                EquipmentSlot.Legs,
                EquipmentSlot.Feet,
                EquipmentSlot.Offhand
            ]);
        });

        it('writes an armor slot back through the equippable', () => {
            makeHotbarView().setItem(9, makeItem('minecraft:diamond_helmet'));
            expect(equippable.setEquipment).toHaveBeenCalledWith(EquipmentSlot.Head, { typeId: 'minecraft:diamond_helmet' });
        });

        it('writes a hotbar slot back into the inventory', () => {
            makeHotbarView().setItem(4, makeItem('minecraft:torch'));
            expect(inventory.getItem(4).typeId).toBe('minecraft:torch');
        });
    });

    describe('main inventory view', () => {
        it('holds exactly the slots behind the hotbar', () => {
            expect(makeInventoryView().size).toBe(27);
        });

        it('reads its first slot from the first non-hotbar inventory slot', () => {
            inventory.setItem(9, makeItem('minecraft:diamond'));
            expect(makeInventoryView().getItem(0).typeId).toBe('minecraft:diamond');
        });

        it('reads its last slot from the last inventory slot', () => {
            inventory.setItem(35, makeItem('minecraft:emerald'));
            expect(makeInventoryView().getItem(26).typeId).toBe('minecraft:emerald');
        });

        it('writes back at the matching inventory offset', () => {
            makeInventoryView().setItem(0, makeItem('minecraft:gold_ingot'));
            expect(inventory.getItem(9).typeId).toBe('minecraft:gold_ingot');
        });

        it('leaves the hotbar alone', () => {
            inventory.setItem(0, makeItem('minecraft:dirt'));
            makeInventoryView().setItem(0, makeItem('minecraft:gold_ingot'));
            expect(inventory.getItem(0).typeId).toBe('minecraft:dirt');
        });

        it('never touches the worn gear', () => {
            const view = makeInventoryView();
            for (let slotIndex = 0; slotIndex < view.size; slotIndex++)
                view.getItem(slotIndex);
            view.setItem(0, makeItem('minecraft:gold_ingot'));
            expect(equippable.getEquipment).not.toHaveBeenCalled();
            expect(equippable.setEquipment).not.toHaveBeenCalled();
        });
    });

    describe('hasSlot', () => {
        it('claims the hotbar and worn gear slots', () => {
            const view = makeHotbarView();
            expect(view.hasSlot(0)).toBe(true);
            expect(view.hasSlot(8)).toBe(true);
            expect(view.hasSlot(9)).toBe(true);
            expect(view.hasSlot(13)).toBe(true);
        });

        it('disowns anything past the end of the view', () => {
            expect(makeHotbarView().hasSlot(14)).toBe(false);
        });
    });

    describe('out of range slots', () => {
        it('reads nothing past the end of the view', () => {
            expect(makeHotbarView().getItem(14)).toBeUndefined();
        });

        it('swallows a write past the end of the view', () => {
            const view = makeHotbarView();
            expect(() => view.setItem(14, makeItem('minecraft:dirt'))).not.toThrow();
            expect(equippable.setEquipment).not.toHaveBeenCalled();
        });
    });

    describe('unrecognized modes', () => {
        it('falls back to the hotbar and armor layout', () => {
            const view = new UnderstudyEditView(inventory, equippable, 'nonsense');
            expect(view.viewMode).toBe(UnderstudyEditViewMode.HotbarAndArmor);
            expect(view.size).toBe(14);
        });
    });
});
