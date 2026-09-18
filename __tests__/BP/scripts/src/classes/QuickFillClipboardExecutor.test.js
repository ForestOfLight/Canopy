import { QuickFillClipboard } from "../../../../../Canopy[BP]/scripts/src/classes/QuickFillClipboard";
import { QuickFillClipboardExecutor } from "../../../../../Canopy[BP]/scripts/src/classes/QuickFillClipboardExecutor";
import { describe, expect, test, vi } from "vitest";

describe('QuickFillClipboardExecutor', () => {
    function makeItemStack(
        typeId = 'minecraft:stone',
        amount = 1
    ) {
        const itemStack = {
            typeId,
            amount
        };

        itemStack.clone = vi.fn(() =>
            makeItemStack(
                itemStack.typeId,
                itemStack.amount
            )
        );

        itemStack.isStackableWith = vi.fn(other =>
            other?.typeId === itemStack.typeId
        );

        return itemStack;
    }

    function makeContainer(size, contents = []) {
        const slots = new Array(size).fill(void 0);

        for (const [slot, itemStack] of contents)
            slots[slot] = itemStack;

        return {
            size,
            slots,

            getItem: vi.fn(slot => slots[slot]),

            setItem: vi.fn((slot, itemStack) => {
                slots[slot] = itemStack ?? void 0;
            }),

            addItem: vi.fn(itemStack => {
                for (let slot = 0; slot < size; slot++) {
                    if (!slots[slot]) {
                        slots[slot] = itemStack;
                        return;
                    }

                    const existing = slots[slot];

                    if (existing.typeId !== itemStack.typeId)
                        continue;

                    const space = 64 - existing.amount;

                    if (space <= 0)
                        continue;

                    const added = Math.min(
                        space,
                        itemStack.amount
                    );

                    existing.amount += added;

                    if (added === itemStack.amount)
                        return;

                    const remaining = itemStack.clone();
                    remaining.amount -= added;
                    itemStack = remaining;
                }

                return itemStack;
            })
        };
    }

    function makeBlock(
        typeId = 'minecraft:hopper'
    ) {
        return { typeId };
    }

    function makeClipboard(contents) {
        return QuickFillClipboard.copy(
            makeBlock(),
            makeContainer(5, contents)
        );
    }

    test('creative paste reproduces literal slot amounts', () => {
        const clipboard = makeClipboard([
            [1, makeItemStack('minecraft:stone', 17)],
            [2, makeItemStack('minecraft:stone', 1)],
            [3, makeItemStack('minecraft:stone', 1)],
            [4, makeItemStack('minecraft:stone', 1)]
        ]);

        const target = makeContainer(5);

        const result = QuickFillClipboardExecutor.applyCreative(
            makeBlock(),
            target,
            clipboard
        );

        expect(result.changedSlots).toBe(4);
        expect(target.slots[0]).toBeUndefined();
        expect(target.slots[1].amount).toBe(17);
        expect(target.slots[2].amount).toBe(1);
        expect(target.slots[3].amount).toBe(1);
        expect(target.slots[4].amount).toBe(1);
    });

    test('creative paste does not overwrite a different item', () => {
        const clipboard = makeClipboard([
            [1, makeItemStack('minecraft:stone', 17)]
        ]);

        const dirt = makeItemStack(
            'minecraft:dirt',
            32
        );

        const target = makeContainer(5, [
            [1, dirt]
        ]);

        QuickFillClipboardExecutor.applyCreative(
            makeBlock(),
            target,
            clipboard
        );

        expect(target.slots[1]).toBe(dirt);
        expect(target.slots[1].amount).toBe(32);
    });

    test('creative paste tops up matching slots to clipboard amount', () => {
        const clipboard = makeClipboard([
            [1, makeItemStack('minecraft:stone', 17)]
        ]);

        const target = makeContainer(5, [
            [1, makeItemStack('minecraft:stone', 5)]
        ]);

        QuickFillClipboardExecutor.applyCreative(
            makeBlock(),
            target,
            clipboard
        );

        expect(target.slots[1].amount).toBe(17);
    });

    test('survival paste consumes the required items from inventory', () => {
        const clipboard = makeClipboard([
            [1, makeItemStack('minecraft:stone', 17)],
            [2, makeItemStack('minecraft:stone', 1)],
            [3, makeItemStack('minecraft:stone', 1)],
            [4, makeItemStack('minecraft:stone', 1)]
        ]);

        const playerInventory = makeContainer(9, [
            [0, makeItemStack('minecraft:stone', 20)]
        ]);

        const target = makeContainer(5);

        const result = QuickFillClipboardExecutor.applySurvival(
            playerInventory,
            makeBlock(),
            target,
            clipboard
        );

        expect(result.changedSlots).toBe(4);
        expect(playerInventory.slots[0]).toBeUndefined();
        expect(target.slots[1].amount).toBe(17);
        expect(target.slots[2].amount).toBe(1);
        expect(target.slots[3].amount).toBe(1);
        expect(target.slots[4].amount).toBe(1);
    });

    test('survival paste makes no changes when resources are insufficient', () => {
        const clipboard = makeClipboard([
            [1, makeItemStack('minecraft:stone', 17)],
            [2, makeItemStack('minecraft:stone', 1)],
            [3, makeItemStack('minecraft:stone', 1)],
            [4, makeItemStack('minecraft:stone', 1)]
        ]);

        const playerInventory = makeContainer(9, [
            [0, makeItemStack('minecraft:stone', 19)]
        ]);

        const target = makeContainer(5);

        const result = QuickFillClipboardExecutor.applySurvival(
            playerInventory,
            makeBlock(),
            target,
            clipboard
        );

        expect(result.insufficient).toBe(true);
        expect(playerInventory.slots[0].amount).toBe(19);

        expect(
            target.slots.every(slot => slot === undefined)
        ).toBe(true);
    });

    test('survival paste only consumes the deficit in a matching slot', () => {
        const clipboard = makeClipboard([
            [1, makeItemStack('minecraft:stone', 17)]
        ]);

        const playerInventory = makeContainer(9, [
            [0, makeItemStack('minecraft:stone', 12)]
        ]);

        const target = makeContainer(5, [
            [1, makeItemStack('minecraft:stone', 5)]
        ]);

        QuickFillClipboardExecutor.applySurvival(
            playerInventory,
            makeBlock(),
            target,
            clipboard
        );

        expect(target.slots[1].amount).toBe(17);
        expect(playerInventory.slots[0]).toBeUndefined();
    });

    test('remove reverses literal clipboard quantities', () => {
        const clipboard = makeClipboard([
            [1, makeItemStack('minecraft:stone', 17)],
            [2, makeItemStack('minecraft:stone', 1)]
        ]);

        const target = makeContainer(5, [
            [1, makeItemStack('minecraft:stone', 32)],
            [2, makeItemStack('minecraft:stone', 1)]
        ]);

        const playerInventory = makeContainer(9);

        const result = QuickFillClipboardExecutor.remove(
            playerInventory,
            makeBlock(),
            target,
            clipboard
        );

        expect(result.changedSlots).toBe(2);
        expect(target.slots[1].amount).toBe(15);
        expect(target.slots[2]).toBeUndefined();

        const returned = playerInventory.slots
            .filter(Boolean)
            .reduce(
                (total, itemStack) =>
                    total + itemStack.amount,
                0
            );

        expect(returned).toBe(18);
    });

    test('remove ignores a mismatched target item', () => {
        const clipboard = makeClipboard([
            [1, makeItemStack('minecraft:stone', 17)]
        ]);

        const dirt = makeItemStack(
            'minecraft:dirt',
            32
        );

        const target = makeContainer(5, [
            [1, dirt]
        ]);

        const playerInventory = makeContainer(9);

        QuickFillClipboardExecutor.remove(
            playerInventory,
            makeBlock(),
            target,
            clipboard
        );

        expect(target.slots[1]).toBe(dirt);
    });

    test('same-size incompatible semantic shapes are rejected', () => {
        const clipboard = makeClipboard([
            [1, makeItemStack('minecraft:stone', 1)]
        ]);

        const result = QuickFillClipboardExecutor.applyCreative(
            makeBlock('minecraft:brewing_stand'),
            makeContainer(5),
            clipboard
        );

        expect(result.incompatible).toBe(true);
    });
});