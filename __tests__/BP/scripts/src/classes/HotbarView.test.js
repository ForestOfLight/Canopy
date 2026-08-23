import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HotbarView } from '../../../../../Canopy[BP]/scripts/src/classes/HotbarView';

describe('HotbarView', () => {
    let inventory;
    let slots;

    const makeInventory = (size = 36) => {
        slots = new Array(size).fill(void 0);
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
    });

    describe('size', () => {
        it('covers only the nine hotbar slots', () => {
            expect(new HotbarView(inventory).size).toBe(9);
        });

        it('never exceeds the size of the backing inventory', () => {
            expect(new HotbarView(makeInventory(4)).size).toBe(4);
        });
    });

    describe('getItem', () => {
        it('reads from the matching inventory slot', () => {
            const stick = { typeId: 'minecraft:stick', amount: 1 };
            slots[3] = stick;
            expect(new HotbarView(inventory).getItem(3)).toBe(stick);
        });

        it('returns undefined for slots outside of the hotbar', () => {
            slots[9] = { typeId: 'minecraft:stick', amount: 1 };
            const view = new HotbarView(inventory);

            expect(view.getItem(9)).toBe(void 0);
            expect(view.getItem(-1)).toBe(void 0);
            expect(inventory.getItem).not.toHaveBeenCalled();
        });
    });

    describe('setItem', () => {
        it('writes to the matching inventory slot', () => {
            const stick = { typeId: 'minecraft:stick', amount: 1 };
            new HotbarView(inventory).setItem(8, stick);
            expect(slots[8]).toBe(stick);
        });

        it('ignores slots outside of the hotbar', () => {
            const view = new HotbarView(inventory);

            view.setItem(9, { typeId: 'minecraft:stick', amount: 1 });
            view.setItem(-1, { typeId: 'minecraft:stick', amount: 1 });

            expect(inventory.setItem).not.toHaveBeenCalled();
        });
    });

    describe('clear', () => {
        it('empties every hotbar slot', () => {
            slots.fill({ typeId: 'minecraft:stick', amount: 1 });

            new HotbarView(inventory).clear();

            expect(slots.slice(0, 9).every(slot => slot === void 0)).toBe(true);
        });

        it('leaves the rest of the inventory untouched', () => {
            const stick = { typeId: 'minecraft:stick', amount: 1 };
            slots.fill(stick);

            new HotbarView(inventory).clear();

            expect(slots.slice(9).every(slot => slot === stick)).toBe(true);
        });
    });
});
