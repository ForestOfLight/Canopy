import { QuickFillClipboardStore } from "../../../../../Canopy[BP]/scripts/src/classes/QuickFillClipboardStore";
import { describe, expect, test, vi } from "vitest";

describe('QuickFillClipboardStore', () => {
    function makeClipboard(value) {
        return {
            value,
            clone: vi.fn(() => makeClipboard(value))
        };
    }

    test('stores clipboard state independently per player', () => {
        const firstPlayer = {};
        const secondPlayer = {};

        QuickFillClipboardStore.set(
            firstPlayer,
            makeClipboard('first')
        );

        QuickFillClipboardStore.set(
            secondPlayer,
            makeClipboard('second')
        );

        expect(
            QuickFillClipboardStore.get(firstPlayer).value
        ).toBe('first');

        expect(
            QuickFillClipboardStore.get(secondPlayer).value
        ).toBe('second');
    });

    test('returns clipboard clones rather than shared references', () => {
        const player = {};
        const clipboard = makeClipboard('test');

        QuickFillClipboardStore.set(player, clipboard);

        const first = QuickFillClipboardStore.get(player);
        const second = QuickFillClipboardStore.get(player);

        expect(first).not.toBe(second);
    });

    test('clipboard can be cleared', () => {
        const player = {};

        QuickFillClipboardStore.set(
            player,
            makeClipboard('test')
        );

        expect(
            QuickFillClipboardStore.has(player)
        ).toBe(true);

        QuickFillClipboardStore.clear(player);

        expect(
            QuickFillClipboardStore.has(player)
        ).toBe(false);
    });
});