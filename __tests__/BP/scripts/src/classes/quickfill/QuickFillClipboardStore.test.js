import { ItemStack } from "@minecraft/server";
import { QuickFillClipboard } from "../../../../../../Canopy[BP]/scripts/src/classes/quickfill/QuickFillClipboard";
import { QuickFillClipboardStore } from "../../../../../../Canopy[BP]/scripts/src/classes/quickfill/QuickFillClipboardStore";
import { describe, expect, test } from "vitest";

const makeClipboard = typeId => new QuickFillClipboard({ shape: 'generic:1', slots: [new ItemStack(typeId)] });

describe('QuickFillClipboardStore', () => {
    test('stores clipboard state independently per player', () => {
        const firstPlayer = {};
        const secondPlayer = {};
        QuickFillClipboardStore.set(firstPlayer, makeClipboard('minecraft:stone'));
        QuickFillClipboardStore.set(secondPlayer, makeClipboard('minecraft:dirt'));

        expect(QuickFillClipboardStore.get(firstPlayer).slots[0].typeId).toBe('minecraft:stone');
        expect(QuickFillClipboardStore.get(secondPlayer).slots[0].typeId).toBe('minecraft:dirt');
    });

    test('returns clipboard clones rather than shared references', () => {
        const player = {};
        QuickFillClipboardStore.set(player, makeClipboard('minecraft:stone'));

        const first = QuickFillClipboardStore.get(player);
        const second = QuickFillClipboardStore.get(player);
        expect(first).not.toBe(second);
        expect(first.slots[0]).not.toBe(second.slots[0]);
    });

    test('clipboard can be cleared', () => {
        const player = {};
        QuickFillClipboardStore.set(player, makeClipboard('minecraft:stone'));

        expect(QuickFillClipboardStore.has(player)).toBe(true);
        QuickFillClipboardStore.clear(player);
        expect(QuickFillClipboardStore.has(player)).toBe(false);
    });
});
