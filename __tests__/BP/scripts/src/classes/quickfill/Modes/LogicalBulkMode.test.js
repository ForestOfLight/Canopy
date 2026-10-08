import { describe, expect, test } from "vitest";
import { GameMode } from "@minecraft/server";
import { LogicalBulkMode } from "../../../../../../../Canopy[BP]/scripts/src/classes/quickfill/Modes/LogicalBulkMode";
import { containerOf, contents, countOf, playerWith, stack } from "./helpers";

describe('LogicalBulkMode', () => {
    test('has no configure interaction', () => {
        const { player } = playerWith(GameMode.Survival);

        expect(new LogicalBulkMode(player).hasConfigureInteraction()).toBe(false);
    });

    describe('onFillInteraction()', () => {
        test('fills with the dominant item in the container instead of the held item', () => {
            const { player, inventory } = playerWith(GameMode.Survival, { 0: stack('stone', 128), 1: stack('oak_log', 64) });
            const container = containerOf(3, { 0: stack('dirt', 20), 1: stack('stone', 30) });

            new LogicalBulkMode(player).onFillInteraction(container, stack('oak_log'));

            expect(countOf(inventory, 'oak_log')).toBe(64);
            expect(countOf(container, 'oak_log')).toBe(0);
            expect(contents(container)).toEqual([['dirt', 20], ['stone', 64], ['stone', 64]]);
        });

        test('picks the dominant item by total count across stacks, not by largest single stack', () => {
            const { player, inventory } = playerWith(GameMode.Survival, { 0: stack('stone', 64), 1: stack('dirt', 64) });
            const container = containerOf(4, { 0: stack('dirt', 40), 1: stack('stone', 30), 2: stack('stone', 30) });

            new LogicalBulkMode(player).onFillInteraction(container, stack('oak_log'));

            expect(countOf(inventory, 'stone')).toBe(0);
            expect(countOf(inventory, 'dirt')).toBe(64);
        });

        test('falls back to the held item when the container is empty', () => {
            const { player, inventory } = playerWith(GameMode.Survival, { 0: stack('oak_log', 64), 1: stack('stone', 64) });
            const container = containerOf(2);

            new LogicalBulkMode(player).onFillInteraction(container, stack('oak_log'));

            expect(contents(container)).toEqual([['oak_log', 64], void 0]);
            expect(countOf(inventory, 'stone')).toBe(64);
        });

        test('in creative, adds the dominant item at no cost', () => {
            const { player } = playerWith(GameMode.Creative);
            const container = containerOf(3, { 0: stack('stone', 10) });

            new LogicalBulkMode(player).onFillInteraction(container, stack('oak_log'));

            expect(countOf(container, 'oak_log')).toBe(0);
            expect(contents(container)).toEqual([['stone', 64], ['stone', 64], ['stone', 64]]);
        });

        test('in creative, falls back to the held item when the container is empty', () => {
            const { player } = playerWith(GameMode.Creative);
            const container = containerOf(2);

            new LogicalBulkMode(player).onFillInteraction(container, stack('oak_log'));

            expect(contents(container)).toEqual([['oak_log', 64], ['oak_log', 64]]);
        });
    });

    describe('onGrabInteraction()', () => {
        test('takes only the dominant item, ignoring the held item', () => {
            const { player, inventory } = playerWith(GameMode.Survival);
            const container = containerOf(4, { 0: stack('dirt', 40), 1: stack('stone', 30), 2: stack('stone', 30), 3: stack('oak_log', 5) });

            new LogicalBulkMode(player).onGrabInteraction(container, stack('oak_log'));

            expect(countOf(inventory, 'stone')).toBe(60);
            expect(countOf(inventory, 'oak_log')).toBe(0);
            expect(contents(container)).toEqual([['dirt', 40], void 0, void 0, ['oak_log', 5]]);
        });

        test('falls back to the held item when the container is empty without moving anything', () => {
            const { player, inventory } = playerWith(GameMode.Survival);
            const container = containerOf(2);

            new LogicalBulkMode(player).onGrabInteraction(container, stack('oak_log'));

            expect(contents(container)).toEqual([void 0, void 0]);
            expect(countOf(inventory, 'oak_log')).toBe(0);
        });
    });
});
