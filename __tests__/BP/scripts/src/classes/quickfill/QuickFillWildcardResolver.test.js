import { ItemStack } from "@minecraft/server";
import { QuickFillClipboard } from "../../../../../../Canopy[BP]/scripts/src/classes/quickfill/QuickFillClipboard";
import { QuickFillWildcardResolver } from "../../../../../../Canopy[BP]/scripts/src/classes/quickfill/QuickFillWildcardResolver";
import { describe, expect, test } from "vitest";

describe('QuickFillWildcardResolver', () => {
    test('returns the literal clipboard item for a non-wildcard slot', () => {
        const literal = new ItemStack('minecraft:stone', 18);
        const clipboard = new QuickFillClipboard({
            shape: 'generic:1',
            slots: [literal]
        });

        const result = QuickFillWildcardResolver.resolveSlot(
            clipboard,
            0,
            [new ItemStack('minecraft:dirt')]
        );

        expect(result.unresolved).toBe(false);
        expect(result.itemStack.typeId).toBe('minecraft:stone');
        expect(result.itemStack.amount).toBe(18);
        expect(result.itemStack).not.toBe(literal);
    });

    test('resolves wildcard group zero using the supplied group item', () => {
        const clipboard = new QuickFillClipboard({
            shape: 'generic:1',
            slots: [new ItemStack('minecraft:stone', 18)],
            wildcardGroups: [0]
        });

        const wildcardItem = new ItemStack('minecraft:dirt');

        const result = QuickFillWildcardResolver.resolveSlot(
            clipboard,
            0,
            [wildcardItem]
        );

        expect(result.unresolved).toBe(false);
        expect(result.itemStack.typeId).toBe('minecraft:dirt');
        expect(result.itemStack.amount).toBe(18);
        expect(result.itemStack).not.toBe(wildcardItem);
    });

    test("clamps the resolved amount to the wildcard item's max stack size", () => {
        const clipboard = new QuickFillClipboard({
            shape: 'generic:1',
            slots: [new ItemStack('minecraft:stone', 64)],
            wildcardGroups: [0]
        });

        const wildcardItem = new ItemStack('minecraft:ender_pearl');
        wildcardItem.maxAmount = 16;

        const result = QuickFillWildcardResolver.resolveSlot(
            clipboard,
            0,
            [wildcardItem]
        );

        expect(result.unresolved).toBe(false);
        expect(result.itemStack.typeId).toBe('minecraft:ender_pearl');
        expect(result.itemStack.amount).toBe(16);
    });
    test('reports an unresolved wildcard when its group has no supplied item', () => {
        const clipboard = new QuickFillClipboard({
            shape: 'generic:1',
            slots: [new ItemStack('minecraft:stone', 18)],
            wildcardGroups: [0]
        });

        const result = QuickFillWildcardResolver.resolveSlot(
            clipboard,
            0
        );

        expect(result).toEqual({
            itemStack: undefined,
            unresolved: true
        });
    });

    test('resolves group assignments independently', () => {
        const clipboard = new QuickFillClipboard({
            shape: 'generic:2',
            slots: [
                new ItemStack('minecraft:stone', 4),
                new ItemStack('minecraft:dirt', 7)
            ],
            wildcardGroups: [0, 1]
        });

        const groupItems = [
            new ItemStack('minecraft:cobblestone'),
            new ItemStack('minecraft:deepslate')
        ];

        const first = QuickFillWildcardResolver.resolveSlot(clipboard, 0, groupItems);
        const second = QuickFillWildcardResolver.resolveSlot(clipboard, 1, groupItems);

        expect(first.itemStack.typeId).toBe('minecraft:cobblestone');
        expect(first.itemStack.amount).toBe(4);
        expect(second.itemStack.typeId).toBe('minecraft:deepslate');
        expect(second.itemStack.amount).toBe(7);
    });

    test('does not resolve invalid wildcard metadata over an empty literal slot', () => {
        const clipboard = new QuickFillClipboard({
            shape: 'generic:1',
            slots: [undefined],
            wildcardGroups: [0]
        });

        const result = QuickFillWildcardResolver.resolveSlot(
            clipboard,
            0,
            [new ItemStack('minecraft:stone')]
        );

        expect(result).toEqual({
            itemStack: undefined,
            unresolved: true
        });
    });
});
