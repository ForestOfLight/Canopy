import { describe, expect, it, vi } from "vitest";
import { InventoryUtils } from "../../../../../Canopy[BP]/scripts/src/classes/InventoryUtils";

describe('getInventory()', () => {
	it('returns correct inventory items', () => {
		const block = {
			getComponent: vi.fn().mockReturnValue({
				container: {
					size: 3,
					getItem: vi.fn((i) => {
						if (i === 0) return { type: { id: 'minecraft:stone' }, amount: 10 };
						if (i === 1) return { type: { id: 'minecraft:dirt' }, amount: 5 };
						if (i === 2) return { type: { id: 'minecraft:stone' }, amount: 15 };
					})
				}
			})
		};
		const items = InventoryUtils.getInventory(block);
		expect(items).toEqual({
			0: { typeId: 'minecraft:stone', amount: 10 },
			1: { typeId: 'minecraft:dirt', amount: 5 },
			2: { typeId: 'minecraft:stone', amount: 15 }
		});
	});

	it('returns empty object for block without inventory', () => {
		const block = {
			getComponent: vi.fn().mockReturnValue(undefined)
		};
		const items = InventoryUtils.getInventory(block);
		expect(items).toEqual({});
	});

	it('returns empty object for empty inventory', () => {
		const block = {
			getComponent: vi.fn().mockReturnValue({
				container: {
					size: 3,
					getItem: vi.fn(() => undefined)
				}
			})
		};
		const items = InventoryUtils.getInventory(block);
		expect(items).toEqual({});
	});

	it('handles inventory with undefined (air) slots', () => {
		const block = {
			getComponent: vi.fn().mockReturnValue({
				container: {
					size: 3,
					getItem: vi.fn((i) => {
						if (i === 0) return { type: { id: 'minecraft:stone' }, amount: 10 };
						if (i === 1) return undefined;
						if (i === 2) return { type: { id: 'minecraft:stone' }, amount: 15 };
					})
				}
			})
		};
		const items = InventoryUtils.getInventory(block);
		expect(items).toEqual({
			0: { typeId: 'minecraft:stone', amount: 10 },
			2: { typeId: 'minecraft:stone', amount: 15 }
		});
	});
});

describe('slot-filtered inventory queries', () => {
    it('limits item and capacity checks to allowed slots', () => {
        const items = [
            { typeId: 'minecraft:stone', amount: 64, maxAmount: 64 },
            undefined,
            { typeId: 'minecraft:stone', amount: 63, maxAmount: 64 }
        ];
        const container = {
            size: items.length,
            getItem: vi.fn(slot => items[slot])
        };
        const stone = { typeId: 'minecraft:stone' };

        expect(InventoryUtils.hasItemType(container, 'minecraft:stone')).toBe(true);
        expect(InventoryUtils.hasItemType(container, 'minecraft:stone', slot => slot === 1)).toBe(false);
        expect(InventoryUtils.hasItemType(container, 'minecraft:stone', slot => slot === 2)).toBe(true);

        expect(InventoryUtils.hasAvailableSpace(container, stone, slot => slot === 0)).toBe(false);
        expect(InventoryUtils.hasAvailableSpace(container, stone, slot => slot === 1)).toBe(true);
        expect(InventoryUtils.hasAvailableSpace(container, stone, slot => slot === 2)).toBe(true);
    });
});