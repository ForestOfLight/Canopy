import { Container, ItemStack } from "@minecraft/server";
import { ItemClipboard } from "../../../../../../Canopy[BP]/scripts/src/classes/quickfill/ItemClipboard";
import { beforeEach, describe, expect, test } from "vitest";

const stack = (typeId, amount = 1) => new ItemStack(`minecraft:${typeId}`, amount);

const containerOf = (size, items = {}) => new Container({ size, items });

const contents = (container) => Array.from({ length: container.size }, (_, i) => {
    const itemStack = container.getItem(i);
    return itemStack ? [itemStack.typeId.replace('minecraft:', ''), itemStack.amount] : void 0;
});

describe('ItemClipboard', () => {
    let clipboard;

    beforeEach(() => {
        clipboard = new ItemClipboard();
    });

    describe('isEmpty', () => {
        test('is true before anything is copied', () => {
            expect(clipboard.isEmpty).toBe(true);
        });

        test('is true after copying an empty container', () => {
            clipboard.copy(containerOf(3));

            expect(clipboard.isEmpty).toBe(true);
        });

        test('is false after copying a container with items', () => {
            clipboard.copy(containerOf(3, { 1: stack('stone') }));

            expect(clipboard.isEmpty).toBe(false);
        });
    });

    describe('copy()', () => {
        test('copies every non-empty slot in order', () => {
            clipboard.copy(containerOf(5, { 1: stack('stone', 5), 4: stack('dirt', 3) }));
            const target = containerOf(3);

            clipboard.insertWithoutCost(target);

            expect(contents(target)).toEqual([['stone', 5], ['dirt', 3], void 0]);
        });

        test('copying an empty container results in an empty clipboard', () => {
            clipboard.copy(containerOf(3));
            const target = containerOf(3);

            clipboard.insertWithoutCost(target);

            expect(contents(target)).toEqual([void 0, void 0, void 0]);
        });

        test('replaces the previous clipboard contents', () => {
            clipboard.copy(containerOf(2, { 0: stack('stone') }));
            clipboard.copy(containerOf(2, { 1: stack('dirt') }));
            const target = containerOf(2);

            clipboard.insertWithoutCost(target);

            expect(contents(target)).toEqual([['dirt', 1], void 0]);
        });

        test('clears the previous wildcard', () => {
            clipboard.copy(containerOf(1, { 0: stack('stone') }));
            clipboard.setWildcardTypeId('minecraft:stone');
            clipboard.copy(containerOf(1, { 0: stack('dirt') }));
            const target = containerOf(1);

            clipboard.insertWithoutCost(target, stack('oak_log'));

            expect(contents(target)).toEqual([['dirt', 1]]);
        });
    });

    describe('insertIntoEmptySlotsWithoutCost()', () => {
        test('keeps each copied stack separate instead of merging them', () => {
            clipboard.copy(containerOf(5, { 0: stack('oak_planks', 64), 1: stack('stick'), 2: stack('stick'), 3: stack('stick'), 4: stack('stick') }));
            const target = containerOf(6);

            clipboard.insertIntoEmptySlotsWithoutCost(target);

            expect(contents(target)).toEqual([['oak_planks', 64], ['stick', 1], ['stick', 1], ['stick', 1], ['stick', 1], void 0]);
        });

        test('does not stack onto existing partial stacks', () => {
            clipboard.copy(containerOf(1, { 0: stack('stone', 10) }));
            const target = containerOf(2, { 0: stack('stone', 20) });

            clipboard.insertIntoEmptySlotsWithoutCost(target);

            expect(contents(target)).toEqual([['stone', 20], ['stone', 10]]);
        });

        test('substitutes the wildcard item for wildcarded entries', () => {
            clipboard.copy(containerOf(2, { 0: stack('stone'), 1: stack('stone') }));
            clipboard.setWildcardTypeId('minecraft:stone');
            const target = containerOf(2);

            clipboard.insertIntoEmptySlotsWithoutCost(target, stack('oak_log'));

            expect(contents(target)).toEqual([['oak_log', 1], ['oak_log', 1]]);
        });

        test('ignores items that do not fit', () => {
            clipboard.copy(containerOf(2, { 0: stack('stone'), 1: stack('dirt') }));
            const target = containerOf(1);

            clipboard.insertIntoEmptySlotsWithoutCost(target);

            expect(contents(target)).toEqual([['stone', 1]]);
        });
    });

    describe('insertWithoutCost()', () => {
        test('stacks copied items onto matching partial stacks before using empty slots', () => {
            clipboard.copy(containerOf(1, { 0: stack('stone', 10) }));
            const target = containerOf(2, { 1: stack('stone', 60) });

            clipboard.insertWithoutCost(target);

            expect(contents(target)).toEqual([['stone', 6], ['stone', 64]]);
        });

        test('substitutes the wildcard item for wildcarded entries', () => {
            clipboard.copy(containerOf(3, { 0: stack('stone'), 1: stack('dirt'), 2: stack('stone') }));
            clipboard.setWildcardTypeId('minecraft:stone');
            const target = containerOf(3);

            clipboard.insertWithoutCost(target, stack('oak_log'));

            expect(contents(target)).toEqual([['oak_log', 2], ['dirt', 1], void 0]);
        });

        test('uses the copied items when no wildcard item is given', () => {
            clipboard.copy(containerOf(2, { 0: stack('stone'), 1: stack('dirt') }));
            clipboard.setWildcardTypeId('minecraft:stone');
            const target = containerOf(2);

            clipboard.insertWithoutCost(target);

            expect(contents(target)).toEqual([['stone', 1], ['dirt', 1]]);
        });

        test('does not change the clipboard', () => {
            clipboard.copy(containerOf(1, { 0: stack('stone', 3) }));
            const first = containerOf(1);
            const second = containerOf(1);

            clipboard.insertWithoutCost(first);
            clipboard.insertWithoutCost(second);

            expect(contents(second)).toEqual([['stone', 3]]);
        });

        test('ignores items that do not fit', () => {
            clipboard.copy(containerOf(2, { 0: stack('stone'), 1: stack('dirt') }));
            const target = containerOf(1);

            clipboard.insertWithoutCost(target);

            expect(contents(target)).toEqual([['stone', 1]]);
        });
    });

    describe('setWildcardTypeId()', () => {
        test('changing the wildcard type clears the previous wildcard', () => {
            clipboard.copy(containerOf(2, { 0: stack('stone'), 1: stack('dirt') }));
            clipboard.setWildcardTypeId('minecraft:stone');
            clipboard.setWildcardTypeId('minecraft:dirt');
            const target = containerOf(2);

            clipboard.insertWithoutCost(target, stack('oak_log'));

            expect(contents(target)).toEqual([['stone', 1], ['oak_log', 1]]);
        });

        test('a type id not in the clipboard wildcards nothing', () => {
            clipboard.copy(containerOf(1, { 0: stack('stone') }));
            clipboard.setWildcardTypeId('minecraft:diamond');
            const target = containerOf(1);

            clipboard.insertWithoutCost(target, stack('oak_log'));

            expect(contents(target)).toEqual([['stone', 1]]);
        });
    });

    describe('transfer()', () => {
        test('moves every copied item and returns true', () => {
            clipboard.copy(containerOf(2, { 0: stack('stone'), 1: stack('dirt') }));
            const from = containerOf(4, { 1: stack('dirt'), 3: stack('stone') });
            const to = containerOf(2);

            expect(clipboard.transfer(from, to)).toBe(true);
            expect(contents(from)).toEqual([void 0, void 0, void 0, void 0]);
            expect(contents(to)).toEqual([['stone', 1], ['dirt', 1]]);
        });

        test('moves only the copied amount from a larger source stack', () => {
            clipboard.copy(containerOf(1, { 0: stack('stone', 3) }));
            const from = containerOf(2, { 1: stack('stone', 20) });
            const to = containerOf(1);

            expect(clipboard.transfer(from, to)).toBe(true);
            expect(contents(from)).toEqual([void 0, ['stone', 17]]);
            expect(contents(to)).toEqual([['stone', 3]]);
        });

        test('pulls from several source stacks to reach the copied amount', () => {
            clipboard.copy(containerOf(1, { 0: stack('stone', 10) }));
            const from = containerOf(3, { 0: stack('stone', 4), 2: stack('stone', 20) });
            const to = containerOf(2);

            expect(clipboard.transfer(from, to)).toBe(true);
            expect(contents(from)).toEqual([void 0, void 0, ['stone', 14]]);
            expect(contents(to)).toEqual([['stone', 10], void 0]);
        });

        test('stacks onto the matching stack in the same slot of the destination', () => {
            clipboard.copy(containerOf(1, { 0: stack('stone', 8) }));
            const from = containerOf(1, { 0: stack('stone', 8) });
            const to = containerOf(2, { 0: stack('stone', 50) });

            expect(clipboard.transfer(from, to)).toBe(true);
            expect(contents(to)).toEqual([['stone', 58], void 0]);
        });

        test('moves only what fits onto a matching stack and returns false', () => {
            clipboard.copy(containerOf(1, { 0: stack('stone', 8) }));
            const from = containerOf(1, { 0: stack('stone', 8) });
            const to = containerOf(2, { 0: stack('stone', 60) });

            expect(clipboard.transfer(from, to)).toBe(false);
            expect(contents(to)).toEqual([['stone', 64], void 0]);
            expect(contents(from)).toEqual([['stone', 4]]);
        });

        test('skips slots blocked by a non-matching item', () => {
            clipboard.copy(containerOf(2, { 0: stack('stone', 2), 1: stack('dirt', 3) }));
            const from = containerOf(2, { 0: stack('stone', 2), 1: stack('dirt', 3) });
            const to = containerOf(2, { 0: stack('oak_log', 5) });

            expect(clipboard.transfer(from, to)).toBe(false);
            expect(contents(to)).toEqual([['oak_log', 5], ['dirt', 3]]);
            expect(contents(from)).toEqual([['stone', 2], void 0]);
        });

        test('moves what it can and returns false when the source runs short', () => {
            clipboard.copy(containerOf(1, { 0: stack('stone', 10) }));
            const from = containerOf(1, { 0: stack('stone', 4) });
            const to = containerOf(1);

            expect(clipboard.transfer(from, to)).toBe(false);
            expect(contents(from)).toEqual([void 0]);
            expect(contents(to)).toEqual([['stone', 4]]);
        });

        test('skips items missing from the source and returns false', () => {
            clipboard.copy(containerOf(2, { 0: stack('stone'), 1: stack('dirt') }));
            const from = containerOf(2, { 0: stack('dirt') });
            const to = containerOf(2);

            expect(clipboard.transfer(from, to)).toBe(false);
            expect(contents(to)).toEqual([void 0, ['dirt', 1]]);
        });

        test('leaves the untransferred amount in the source when the destination fills up', () => {
            clipboard.copy(containerOf(1, { 0: stack('stone', 5) }));
            const from = containerOf(3, { 2: stack('stone', 10) });
            const to = containerOf(1, { 0: stack('stone', 62) });

            expect(clipboard.transfer(from, to)).toBe(false);
            expect(contents(from)).toEqual([void 0, void 0, ['stone', 8]]);
            expect(contents(to)).toEqual([['stone', 64]]);
        });

        test('leaves the source untouched when the destination has no room', () => {
            clipboard.copy(containerOf(1, { 0: stack('stone', 5) }));
            const from = containerOf(1, { 0: stack('stone', 10) });
            const to = containerOf(1, { 0: stack('dirt', 64) });

            expect(clipboard.transfer(from, to)).toBe(false);
            expect(contents(from)).toEqual([['stone', 10]]);
            expect(contents(to)).toEqual([['dirt', 64]]);
        });

        test('moves the copied amount of the wildcard item for wildcarded entries', () => {
            clipboard.copy(containerOf(2, { 0: stack('stone', 6), 1: stack('dirt') }));
            clipboard.setWildcardTypeId('minecraft:stone');
            const from = containerOf(3, { 0: stack('stone', 64), 1: stack('oak_log', 64), 2: stack('dirt') });
            const to = containerOf(2);

            expect(clipboard.transfer(from, to, stack('oak_log'))).toBe(true);
            expect(contents(from)).toEqual([['stone', 64], ['oak_log', 58], void 0]);
            expect(contents(to)).toEqual([['oak_log', 6], ['dirt', 1]]);
        });

        test('returns false when the wildcard item is not in the source', () => {
            clipboard.copy(containerOf(1, { 0: stack('stone') }));
            clipboard.setWildcardTypeId('minecraft:stone');
            const from = containerOf(1, { 0: stack('stone') });
            const to = containerOf(1);

            expect(clipboard.transfer(from, to, stack('oak_log'))).toBe(false);
            expect(contents(from)).toEqual([['stone', 1]]);
            expect(contents(to)).toEqual([void 0]);
        });

        test('moves the copied item when no wildcard item is given', () => {
            clipboard.copy(containerOf(1, { 0: stack('stone') }));
            clipboard.setWildcardTypeId('minecraft:stone');
            const from = containerOf(1, { 0: stack('stone') });
            const to = containerOf(1);

            expect(clipboard.transfer(from, to)).toBe(true);
            expect(contents(to)).toEqual([['stone', 1]]);
        });

        test('an empty clipboard moves nothing and returns true', () => {
            const from = containerOf(1, { 0: stack('stone') });
            const to = containerOf(1);

            expect(clipboard.transfer(from, to)).toBe(true);
            expect(contents(from)).toEqual([['stone', 1]]);
            expect(contents(to)).toEqual([void 0]);
        });
    });

    describe('transferLikeVanilla()', () => {
        test('fills partial stacks first, then empty slots, ignoring slot position', () => {
            clipboard.copy(containerOf(1, { 0: stack('stone', 8) }));
            const from = containerOf(1, { 0: stack('stone', 8) });
            const to = containerOf(3, { 0: stack('dirt', 1), 2: stack('stone', 60) });

            expect(clipboard.transferLikeVanilla(from, to)).toBe(true);
            expect(contents(to)).toEqual([['dirt', 1], ['stone', 4], ['stone', 64]]);
        });
    });

    describe('transferMultiple()', () => {
        test('moves the requested number of copies when the source has enough', () => {
            clipboard.copy(containerOf(2, { 0: stack('stone', 2), 1: stack('dirt') }));
            const from = containerOf(2, { 0: stack('stone', 10), 1: stack('dirt', 10) });
            const to = containerOf(2);

            expect(clipboard.transferMultiple(from, to, 3)).toBe(3);
            expect(contents(from)).toEqual([['stone', 4], ['dirt', 7]]);
            expect(contents(to)).toEqual([['stone', 6], ['dirt', 3]]);
        });

        test('returns the number of complete copies when the source runs out', () => {
            clipboard.copy(containerOf(1, { 0: stack('stone', 2) }));
            const from = containerOf(1, { 0: stack('stone', 5) });
            const to = containerOf(1);

            expect(clipboard.transferMultiple(from, to, 5)).toBe(2);
            expect(contents(from)).toEqual([void 0]);
            expect(contents(to)).toEqual([['stone', 5]]);
        });

        test('returns the number of complete copies when the destination fills up', () => {
            clipboard.copy(containerOf(1, { 0: stack('stone', 40) }));
            const from = containerOf(3, { 0: stack('stone', 64), 1: stack('stone', 64) });
            const to = containerOf(1);

            expect(clipboard.transferMultiple(from, to, 3)).toBe(1);
            expect(contents(to)).toEqual([['stone', 64]]);
        });

        test('uses the wildcard item for every copy', () => {
            clipboard.copy(containerOf(1, { 0: stack('stone') }));
            clipboard.setWildcardTypeId('minecraft:stone');
            const from = containerOf(2, { 0: stack('stone', 5), 1: stack('oak_log', 5) });
            const to = containerOf(1);

            expect(clipboard.transferMultiple(from, to, 3, stack('oak_log'))).toBe(3);
            expect(contents(from)).toEqual([['stone', 5], ['oak_log', 2]]);
            expect(contents(to)).toEqual([['oak_log', 3]]);
        });

        test('moves nothing when zero copies are requested', () => {
            clipboard.copy(containerOf(1, { 0: stack('stone') }));
            const from = containerOf(1, { 0: stack('stone') });
            const to = containerOf(1);

            expect(clipboard.transferMultiple(from, to, 0)).toBe(0);
            expect(contents(from)).toEqual([['stone', 1]]);
            expect(contents(to)).toEqual([void 0]);
        });
    });
});
