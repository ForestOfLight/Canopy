import { describe, expect, test } from "vitest";
import { GameMode } from "@minecraft/server";
import { LogicalBulkMode } from "../../../../../../../Canopy[BP]/scripts/src/classes/quickfill/Modes/LogicalBulkMode";
import { actionBarCount, containerOf, contents, countOf, langKeys, lastActionBar, playerWith, stack } from "./helpers";

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

    describe('onTakeInteraction()', () => {
        test('takes only the dominant item, ignoring the held item', () => {
            const { player, inventory } = playerWith(GameMode.Survival);
            const container = containerOf(4, { 0: stack('dirt', 40), 1: stack('stone', 30), 2: stack('stone', 30), 3: stack('oak_log', 5) });

            new LogicalBulkMode(player).onTakeInteraction(container, stack('oak_log'));

            expect(countOf(inventory, 'stone')).toBe(60);
            expect(countOf(inventory, 'oak_log')).toBe(0);
            expect(contents(container)).toEqual([['dirt', 40], void 0, void 0, ['oak_log', 5]]);
        });

        test('falls back to the held item when the container is empty without moving anything', () => {
            const { player, inventory } = playerWith(GameMode.Survival);
            const container = containerOf(2);

            new LogicalBulkMode(player).onTakeInteraction(container, stack('oak_log'));

            expect(contents(container)).toEqual([void 0, void 0]);
            expect(countOf(inventory, 'oak_log')).toBe(0);
        });
    });

    describe('action bar feedback', () => {
        test('names the container and the held item after filling, with the amount transferred', () => {
            const { player } = playerWith(GameMode.Creative);
            const container = containerOf(3);

            new LogicalBulkMode(player).onFillInteraction(container, stack('oak_log'), 'tile.chest.name');

            expect(lastActionBar(player)).toEqual({ rawtext: [
                { translate: 'rules.quickFillContainer.filled.bulk', with: ['tile.chest.name', 'item.oak_log.name'] },
                { text: ' (192)' }
            ]});
        });

        test('names the dominant item it filled with, not the held item', () => {
            const { player } = playerWith(GameMode.Creative);
            const container = containerOf(2, { 0: stack('stone', 10) });

            new LogicalBulkMode(player).onFillInteraction(container, stack('oak_log'), 'tile.chest.name');

            expect(countOf(container, 'stone')).toBe(128);
            expect(lastActionBar(player).rawtext[0].with).toEqual(['tile.chest.name', 'item.stone.name']);
        });

        test('counts only the items that were actually transferred', () => {
            const { player } = playerWith(GameMode.Survival, { 0: stack('stone', 10) });
            const container = containerOf(3, { 0: stack('stone', 20) });

            new LogicalBulkMode(player).onFillInteraction(container, stack('oak_log'), 'tile.chest.name');

            expect(lastActionBar(player).rawtext[1]).toEqual({ text: ' (10)' });
        });

        test('names the dominant item before the container after taking, with the amount taken', () => {
            const { player } = playerWith(GameMode.Survival);
            const container = containerOf(2, { 0: stack('stone', 10), 1: stack('dirt', 5) });

            new LogicalBulkMode(player).onTakeInteraction(container, stack('oak_log'), 'tile.chest.name');

            expect(lastActionBar(player)).toEqual({ rawtext: [
                { translate: 'rules.quickFillContainer.taken.bulk', with: ['item.stone.name', 'tile.chest.name'] },
                { text: ' (10)' }
            ]});
        });

        test('says nothing was taken when the container is empty', () => {
            const { player } = playerWith(GameMode.Survival);
            const container = containerOf(2);

            new LogicalBulkMode(player).onTakeInteraction(container, stack('oak_log'), 'tile.chest.name');

            expect(lastActionBar(player)).toEqual({ rawtext: [
                { translate: 'rules.quickFillContainer.taken.noitem', with: { rawtext: [{ translate: 'tile.chest.name' }, { translate: 'item.oak_log.name' }] } }
            ]});
        });

        test('says nothing was filled when the player has none of the dominant item', () => {
            const { player } = playerWith(GameMode.Survival, { 0: stack('oak_log', 64) });
            const container = containerOf(2, { 0: stack('stone', 10) });

            new LogicalBulkMode(player).onFillInteraction(container, stack('oak_log'), 'tile.chest.name');

            expect(lastActionBar(player)).toEqual({ rawtext: [
                { translate: 'rules.quickFillContainer.filled.noitem', with: { rawtext: [{ translate: 'tile.chest.name' }, { translate: 'item.stone.name' }] } }
            ]});
        });

        test('sends exactly one action bar message per interaction', () => {
            const { player } = playerWith(GameMode.Creative);
            const container = containerOf(2);
            const mode = new LogicalBulkMode(player);

            mode.onFillInteraction(container, stack('oak_log'), 'tile.chest.name');
            mode.onTakeInteraction(container, stack('oak_log'), 'tile.chest.name');

            expect(actionBarCount(player)).toBe(2);
        });

        test('every message it can send has an English localization entry', () => {
            const keys = [
                'rules.quickFillContainer.filled.bulk',
                'rules.quickFillContainer.taken.bulk',
                'rules.quickFillContainer.filled.noitem',
                'rules.quickFillContainer.taken.noitem'
            ];
            for (const key of keys)
                expect(langKeys.has(key), key).toBe(true);
        });
    });
});
