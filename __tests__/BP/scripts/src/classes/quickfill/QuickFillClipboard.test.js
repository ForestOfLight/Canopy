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

    test('clipboard clone does not share item references', () => {
        const clipboard = new QuickFillClipboard({ shape: 'generic:5', slots: [new ItemStack('minecraft:stone', 17)] });
        const copy = clipboard.clone();

        expect(copy).not.toBe(clipboard);
        expect(copy.slots).not.toBe(clipboard.slots);
        expect(copy.slots[0]).not.toBe(clipboard.slots[0]);
        expect(copy.slots[0].amount).toBe(17);
    });
});
