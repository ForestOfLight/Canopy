import { describe, expect, it, vi } from "vitest";
import { ItemStack } from "@minecraft/server";
import { RecipeProcessingContainer } from "../../../../../Canopy[BP]/scripts/src/classes/RecipeProcessingContainer";
import { InventoryUtils } from "../../../../../Canopy[BP]/scripts/src/classes/InventoryUtils";

const makeRecipeProcessing = ({ items = {}, disabled = [], slotCount = 9 } = {}) => {
	const slots = Array.from({ length: slotCount }, (_, i) => items[i]);
	return {
		isValid: true,
		inputSlotCount: slotCount,
		getInputItem: vi.fn(i => slots[i]?.clone()),
		setInputItem: vi.fn((i, item) => { slots[i] = item; }),
		getInputSlotEnabled: vi.fn(i => !disabled.includes(i)),
		setInputSlotEnabled: vi.fn()
	};
};

const stone = (amount = 1) => new ItemStack('minecraft:stone', amount);

describe('RecipeProcessingContainer', () => {
	it('exposes the input slot count as its size', () => {
		expect(new RecipeProcessingContainer(makeRecipeProcessing()).size).toBe(9);
	});

	it('reads and writes input slots', () => {
		const container = new RecipeProcessingContainer(makeRecipeProcessing());
		container.setItem(2, stone(5));
		expect(container.getItem(2).amount).toBe(5);
		container.setItem(2, void 0);
		expect(container.getItem(2)).toBeUndefined();
	});

	it('refuses to put items into disabled slots', () => {
		const recipeProcessing = makeRecipeProcessing({ disabled: [0] });
		const container = new RecipeProcessingContainer(recipeProcessing);
		container.setItem(0, stone());
		expect(recipeProcessing.setInputItem).not.toHaveBeenCalled();
		expect(container.getItem(0)).toBeUndefined();
	});

	it('treats slots as enabled when the block does not support disabling', () => {
		const recipeProcessing = makeRecipeProcessing();
		recipeProcessing.getInputSlotEnabled = vi.fn(() => { throw new Error('unsupported'); });
		const container = new RecipeProcessingContainer(recipeProcessing);
		expect(container.isSlotEnabled(0)).toBe(true);
		expect(container.emptySlotsCount).toBe(9);
	});

	it('counts and finds only enabled empty slots', () => {
		const container = new RecipeProcessingContainer(makeRecipeProcessing({ items: { 1: stone() }, disabled: [0, 2] }));
		expect(container.emptySlotsCount).toBe(6);
		expect(container.firstEmptySlot()).toBe(3);
	});

	it('finds slots holding a stackable item', () => {
		const container = new RecipeProcessingContainer(makeRecipeProcessing({ items: { 4: stone() } }));
		expect(container.find(stone())).toBe(4);
		expect(container.find(new ItemStack('minecraft:dirt'))).toBeUndefined();
	});

	it('clears all slots', () => {
		const container = new RecipeProcessingContainer(makeRecipeProcessing({ items: { 0: stone(), 8: stone() } }));
		container.clearAll();
		expect(container.emptySlotsCount).toBe(9);
	});

	it('reports invalid once the component is invalid', () => {
		const recipeProcessing = makeRecipeProcessing();
		const container = new RecipeProcessingContainer(recipeProcessing);
		expect(container.isValid).toBe(true);
		recipeProcessing.isValid = false;
		expect(container.isValid).toBe(false);
	});

	describe('getSlot()', () => {
		it('treats disabled slots as occupied and unstackable', () => {
			const slot = new RecipeProcessingContainer(makeRecipeProcessing({ disabled: [0] })).getSlot(0);
			expect(slot.hasItem()).toBe(true);
			expect(slot.isStackableWith(stone())).toBe(false);
		});

		it('updates the slot amount', () => {
			const container = new RecipeProcessingContainer(makeRecipeProcessing({ items: { 0: stone(10) } }));
			const slot = container.getSlot(0);
			slot.amount += 5;
			expect(container.getItem(0).amount).toBe(15);
			expect(slot.maxAmount).toBe(64);
		});
	});

	describe('with addItemLikeVanilla()', () => {
		it('stacks into matching slots, then fills enabled empty slots', () => {
			const container = new RecipeProcessingContainer(makeRecipeProcessing({ items: { 1: stone(60) }, disabled: [0], slotCount: 3 }));
			const remainder = InventoryUtils.addItemLikeVanilla(container, stone(70));
			expect(container.getItem(0)).toBeUndefined();
			expect(container.getItem(1).amount).toBe(64);
			expect(container.getItem(2).amount).toBe(64);
			expect(remainder.amount).toBe(2);
		});
	});
});
