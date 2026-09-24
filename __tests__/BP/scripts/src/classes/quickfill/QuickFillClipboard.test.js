import { Container, ItemStack } from "@minecraft/server";
import { QuickFillClipboard } from "../../../../../../Canopy[BP]/scripts/src/classes/quickfill/QuickFillClipboard";
import { describe, expect, test } from "vitest";

const makeBlock = (typeId = 'minecraft:chest') => ({ typeId });

describe('QuickFillClipboard', () => {
    test('copy creates a literal clipboard with the source inventory shape', () => {
        const stone = new ItemStack('minecraft:stone', 17);
        const dirt = new ItemStack('minecraft:dirt');
        const container = new Container({ size: 5, items: { 1: stone, 4: dirt } });
        const clipboard = QuickFillClipboard.copy(makeBlock('minecraft:hopper'), container);

        expect(clipboard.shape).toBe('generic:5');
        expect(clipboard.slots).toHaveLength(5);

        expect(clipboard.slots[0]).toBeUndefined();
        expect(clipboard.slots[1]).not.toBe(stone);
        expect(clipboard.slots[1].amount).toBe(17);
        expect(clipboard.slots[4].typeId).toBe('minecraft:dirt');
    });

    test('literal clipboard is compatible with equivalent inventory shapes', () => {
        const clipboard = QuickFillClipboard.copy(makeBlock(), new Container({ size: 27 }));

        expect(clipboard.isCompatibleWith(makeBlock('minecraft:barrel'), new Container({ size: 27 }))).toBe(true);
        expect(clipboard.isCompatibleWith(makeBlock('minecraft:shulker_box'), new Container({ size: 27 }))).toBe(true);
    });

    test('literal clipboard rejects a different inventory shape', () => {
        const clipboard = QuickFillClipboard.copy(makeBlock('minecraft:hopper'), new Container({ size: 5 }));

        expect(clipboard.isCompatibleWith(makeBlock('minecraft:brewing_stand'), new Container({ size: 5 }))).toBe(false);
    });

    test('sets matching literal item slots as a wildcard group', () => {
        const clipboard = new QuickFillClipboard({
            shape: 'generic:5',
            slots: [
                new ItemStack('minecraft:stone', 18),
                new ItemStack('minecraft:dirt'),
                new ItemStack('minecraft:stone'),
                undefined,
                new ItemStack('minecraft:stone', 7)
            ]
        });

        expect(clipboard.setWildcardGroup('minecraft:stone')).toBe(true);
        expect(clipboard.wildcardGroups).toEqual([0, null, 0, null, 0]);
    });

    test('replaces an existing wildcard group without changing literal items', () => {
        const clipboard = new QuickFillClipboard({
            shape: 'generic:3',
            slots: [
                new ItemStack('minecraft:stone', 18),
                new ItemStack('minecraft:dirt', 12),
                new ItemStack('minecraft:stone')
            ]
        });

        clipboard.setWildcardGroup('minecraft:stone');
        expect(clipboard.setWildcardGroup('minecraft:dirt')).toBe(true);

        expect(clipboard.wildcardGroups).toEqual([null, 0, null]);
        expect(clipboard.slots[0].typeId).toBe('minecraft:stone');
        expect(clipboard.slots[0].amount).toBe(18);
        expect(clipboard.slots[1].typeId).toBe('minecraft:dirt');
        expect(clipboard.slots[1].amount).toBe(12);
    });

    test('leaves the existing wildcard group unchanged when the selector matches nothing', () => {
        const clipboard = new QuickFillClipboard({
            shape: 'generic:2',
            slots: [
                new ItemStack('minecraft:stone'),
                new ItemStack('minecraft:dirt')
            ]
        });

        clipboard.setWildcardGroup('minecraft:stone');

        expect(clipboard.setWildcardGroup('minecraft:diamond')).toBe(false);
        expect(clipboard.wildcardGroups).toEqual([0, null]);
    });

    test('clipboard clone does not share item or wildcard references', () => {
        const clipboard = new QuickFillClipboard({ shape: 'generic:5', slots: [new ItemStack('minecraft:stone', 17)] });
        clipboard.setWildcardGroup('minecraft:stone');
        const copy = clipboard.clone();

        expect(copy).not.toBe(clipboard);
        expect(copy.slots).not.toBe(clipboard.slots);
        expect(copy.slots[0]).not.toBe(clipboard.slots[0]);
        expect(copy.slots[0].amount).toBe(17);
        expect(copy.wildcardGroups).not.toBe(clipboard.wildcardGroups);
        expect(copy.wildcardGroups).toEqual([0]);
    });
});
