import { QuickFillClipboard } from "../../../../../Canopy[BP]/scripts/src/classes/QuickFillClipboard";
import { describe, expect, test, vi } from "vitest";

describe('QuickFillClipboard', () => {
    function makeItemStack(typeId, amount = 1) {
        const itemStack = {
            typeId,
            amount
        };

        itemStack.clone = vi.fn(() =>
            makeItemStack(itemStack.typeId, itemStack.amount)
        );

        return itemStack;
    }

    function makeContainer(size, contents = []) {
        const slots = new Array(size).fill(void 0);

        for (const [slot, itemStack] of contents)
            slots[slot] = itemStack;

        return {
            size,
            getItem: vi.fn(slot => slots[slot])
        };
    }

    function makeBlock(typeId = 'minecraft:chest') {
        return { typeId };
    }

    test('default clipboard is adaptive and wildcarded everywhere', () => {
        const clipboard = QuickFillClipboard.createDefault();

        expect(clipboard.shape).toBe('adaptive');
        expect(clipboard.wildcardMask).toBe('all');
        expect(clipboard.hasWildcards()).toBe(true);
        expect(clipboard.isWildcard(0)).toBe(true);
        expect(clipboard.isWildcard(53)).toBe(true);
    });

    test('default clipboard adapts its slot count to the target container', () => {
        const clipboard = QuickFillClipboard.createDefault();

        expect(
            clipboard.getSlotCount(makeContainer(5))
        ).toBe(5);

        expect(
            clipboard.getSlotCount(makeContainer(27))
        ).toBe(27);
    });

    test('wildcard resolves to a clone of the held item', () => {
        const clipboard = QuickFillClipboard.createDefault();
        const heldItem = makeItemStack('minecraft:stone', 12);

        const resolved = clipboard.resolveSlot(3, heldItem);

        expect(resolved).not.toBe(heldItem);
        expect(resolved.typeId).toBe('minecraft:stone');
        expect(resolved.amount).toBe(12);
        expect(heldItem.clone).toHaveBeenCalledTimes(1);
    });

    test('wildcard remains unresolved with an empty hand', () => {
        const clipboard = QuickFillClipboard.createDefault();

        expect(
            clipboard.resolveSlot(0, undefined)
        ).toBeUndefined();
    });

    test('copy creates a literal clipboard with the source inventory shape', () => {
        const stone = makeItemStack('minecraft:stone', 17);
        const dirt = makeItemStack('minecraft:dirt', 1);

        const container = makeContainer(5, [
            [1, stone],
            [4, dirt]
        ]);

        const clipboard = QuickFillClipboard.copy(
            makeBlock('minecraft:hopper'),
            container
        );

        expect(clipboard.shape).toBe('generic:5');
        expect(clipboard.slots).toHaveLength(5);
        expect(clipboard.slots[0]).toBeUndefined();
        expect(clipboard.slots[1]).not.toBe(stone);
        expect(clipboard.slots[1].amount).toBe(17);
        expect(clipboard.slots[4].typeId).toBe('minecraft:dirt');
        expect(clipboard.hasWildcards()).toBe(false);
    });

    test('literal clipboard entries ignore the held item', () => {
        const stone = makeItemStack('minecraft:stone', 17);

        const clipboard = QuickFillClipboard.copy(
            makeBlock('minecraft:hopper'),
            makeContainer(5, [[1, stone]])
        );

        const heldItem = makeItemStack('minecraft:diamond', 64);
        const resolved = clipboard.resolveSlot(1, heldItem);

        expect(resolved.typeId).toBe('minecraft:stone');
        expect(resolved.amount).toBe(17);
    });

    test('literal clipboard is compatible with equivalent inventory shapes', () => {
        const clipboard = QuickFillClipboard.copy(
            makeBlock('minecraft:chest'),
            makeContainer(27)
        );

        expect(
            clipboard.isCompatibleWith(
                makeBlock('minecraft:barrel'),
                makeContainer(27)
            )
        ).toBe(true);

        expect(
            clipboard.isCompatibleWith(
                makeBlock('minecraft:shulker_box'),
                makeContainer(27)
            )
        ).toBe(true);
    });

    test('literal clipboard rejects a different inventory shape', () => {
        const clipboard = QuickFillClipboard.copy(
            makeBlock('minecraft:hopper'),
            makeContainer(5)
        );

        expect(
            clipboard.isCompatibleWith(
                makeBlock('minecraft:brewing_stand'),
                makeContainer(5)
            )
        ).toBe(false);
    });

    test('explicit mixed wildcard masks are representable', () => {
        const stone = makeItemStack('minecraft:stone', 17);

        const clipboard = new QuickFillClipboard({
            shape: 'generic:5',
            slots: [
                undefined,
                stone,
                undefined,
                undefined,
                undefined
            ],
            wildcardMask: [
                false,
                false,
                true,
                false,
                true
            ]
        });

        const heldItem = makeItemStack('minecraft:diamond', 1);

        expect(
            clipboard.resolveSlot(1, heldItem).typeId
        ).toBe('minecraft:stone');

        expect(
            clipboard.resolveSlot(2, heldItem).typeId
        ).toBe('minecraft:diamond');

        expect(
            clipboard.resolveSlot(4, heldItem).typeId
        ).toBe('minecraft:diamond');
    });

    test('clipboard clone does not share item or mask references', () => {
        const clipboard = new QuickFillClipboard({
            shape: 'generic:5',
            slots: [
                makeItemStack('minecraft:stone', 17)
            ],
            wildcardMask: [
                false,
                true,
                false,
                false,
                false
            ]
        });

        const copy = clipboard.clone();

        expect(copy).not.toBe(clipboard);
        expect(copy.slots).not.toBe(clipboard.slots);
        expect(copy.slots[0]).not.toBe(clipboard.slots[0]);
        expect(copy.wildcardMask).not.toBe(clipboard.wildcardMask);
    });
});