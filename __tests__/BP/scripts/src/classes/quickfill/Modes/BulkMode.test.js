import { describe, expect, test } from "vitest";
import { GameMode } from "@minecraft/server";
import { BulkMode } from "../../../../../../../Canopy[BP]/scripts/src/classes/quickfill/Modes/BulkMode";
import { containerOf, contents, countOf, playerWith, stack } from "./helpers";

describe('BulkMode', () => {
    test('has no configure interaction', () => {
        const { player } = playerWith(GameMode.Survival);

        expect(new BulkMode(player).hasConfigureInteraction()).toBe(false);
    });

    describe('onFillInteraction()', () => {
        test('in creative, fills the container with full stacks of the held item at no cost', () => {
            const { player, inventory } = playerWith(GameMode.Creative, { 0: stack('oak_log', 1) });
            const container = containerOf(3);

            new BulkMode(player).onFillInteraction(container, stack('oak_log'));

            expect(contents(container)).toEqual([['oak_log', 64], ['oak_log', 64], ['oak_log', 64]]);
            expect(contents(inventory).slice(0, 2)).toEqual([['oak_log', 1], void 0]);
        });

        test('in creative, tops up matching partial stacks before using empty slots', () => {
            const { player } = playerWith(GameMode.Creative);
            const container = containerOf(2, { 1: stack('oak_log', 60) });

            new BulkMode(player).onFillInteraction(container, stack('oak_log'));

            expect(contents(container)).toEqual([['oak_log', 64], ['oak_log', 64]]);
        });

        test('in creative, leaves other items in the container alone', () => {
            const { player } = playerWith(GameMode.Creative);
            const container = containerOf(2, { 0: stack('dirt', 5) });

            new BulkMode(player).onFillInteraction(container, stack('oak_log'));

            expect(contents(container)).toEqual([['dirt', 5], ['oak_log', 64]]);
        });

        test('in survival, moves the held item type out of the player inventory into the container', () => {
            const { player, inventory } = playerWith(GameMode.Survival, { 0: stack('oak_log', 64), 1: stack('oak_log', 30), 2: stack('dirt', 64) });
            const container = containerOf(3);

            new BulkMode(player).onFillInteraction(container, stack('oak_log'));

            expect(countOf(container, 'oak_log')).toBe(94);
            expect(countOf(container, 'dirt')).toBe(0);
            expect(countOf(inventory, 'oak_log')).toBe(0);
            expect(countOf(inventory, 'dirt')).toBe(64);
        });

        test('in survival, never moves more than the player has', () => {
            const { player } = playerWith(GameMode.Survival, { 0: stack('oak_log', 10) });
            const container = containerOf(3);

            new BulkMode(player).onFillInteraction(container, stack('oak_log'));

            expect(countOf(container, 'oak_log')).toBe(10);
        });

        test('in survival, does nothing when the player has none of the held item type', () => {
            const { player, inventory } = playerWith(GameMode.Survival, { 0: stack('dirt', 64) });
            const container = containerOf(3);

            new BulkMode(player).onFillInteraction(container, stack('oak_log'));

            expect(contents(container)).toEqual([void 0, void 0, void 0]);
            expect(countOf(inventory, 'dirt')).toBe(64);
        });

        test('in adventure, charges the player like survival', () => {
            const { player, inventory } = playerWith(GameMode.Adventure, { 0: stack('oak_log', 10) });
            const container = containerOf(2);

            new BulkMode(player).onFillInteraction(container, stack('oak_log'));

            expect(countOf(container, 'oak_log')).toBe(10);
            expect(countOf(inventory, 'oak_log')).toBe(0);
        });
    });

    describe('onGrabInteraction()', () => {
        test('moves every stack of the held item type from the container to the player', () => {
            const { player, inventory } = playerWith(GameMode.Survival);
            const container = containerOf(4, { 0: stack('oak_log', 64), 1: stack('dirt', 20), 3: stack('oak_log', 12) });

            new BulkMode(player).onGrabInteraction(container, stack('oak_log'));

            expect(countOf(inventory, 'oak_log')).toBe(76);
            expect(contents(container)).toEqual([void 0, ['dirt', 20], void 0, void 0]);
        });

        test('merges into the player\'s existing partial stacks', () => {
            const { player, inventory } = playerWith(GameMode.Survival, { 5: stack('oak_log', 60) });
            const container = containerOf(1, { 0: stack('oak_log', 10) });

            new BulkMode(player).onGrabInteraction(container, stack('oak_log'));

            expect(inventory.getItem(5).amount).toBe(64);
            expect(countOf(inventory, 'oak_log')).toBe(70);
        });

        test('leaves items in the container that the player has no room for', () => {
            const { player } = playerWith(GameMode.Survival);
            const crowdedInventory = containerOf(1, { 0: stack('dirt', 64) });
            const mode = new BulkMode(player);
            mode.playerContainer = crowdedInventory;
            const container = containerOf(1, { 0: stack('oak_log', 10) });

            mode.onGrabInteraction(container, stack('oak_log'));

            expect(contents(container)).toEqual([['oak_log', 10]]);
            expect(contents(crowdedInventory)).toEqual([['dirt', 64]]);
        });

        test('works the same in creative, taking the items out of the container', () => {
            const { player, inventory } = playerWith(GameMode.Creative);
            const container = containerOf(1, { 0: stack('oak_log', 10) });

            new BulkMode(player).onGrabInteraction(container, stack('oak_log'));

            expect(countOf(inventory, 'oak_log')).toBe(10);
            expect(contents(container)).toEqual([void 0]);
        });

        test('does nothing when the container has none of the held item type', () => {
            const { player, inventory } = playerWith(GameMode.Survival);
            const container = containerOf(1, { 0: stack('dirt', 10) });

            new BulkMode(player).onGrabInteraction(container, stack('oak_log'));

            expect(contents(container)).toEqual([['dirt', 10]]);
            expect(countOf(inventory, 'dirt')).toBe(0);
        });
    });
});
