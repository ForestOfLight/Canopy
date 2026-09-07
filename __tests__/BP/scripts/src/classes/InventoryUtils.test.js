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