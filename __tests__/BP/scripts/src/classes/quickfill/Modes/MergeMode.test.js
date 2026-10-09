import { describe, expect, test } from "vitest";
import { GameMode } from "@minecraft/server";
import { MergeMode } from "../../../../../../../Canopy[BP]/scripts/src/classes/quickfill/Modes/MergeMode";
import { actionBarCount, containerOf, contents, countOf, langKeys, lastActionBar, playerWith, stack } from "./helpers";

describe('MergeMode', () => {
    test('has no configure interaction', () => {
        const { player } = playerWith(GameMode.Survival);

        expect(new MergeMode(player).hasConfigureInteraction()).toBe(false);
    });

    describe('onFillInteraction()', () => {
        test('moves every player item that matches an item already in the container', () => {
            const { player, inventory } = playerWith(GameMode.Survival, { 0: stack('stone', 64), 1: stack('dirt', 30), 2: stack('oak_log', 64) });
            const container = containerOf(4, { 0: stack('stone', 10), 1: stack('dirt', 5) });

            new MergeMode(player).onFillInteraction(container, stack('oak_log'));

            expect(contents(container)).toEqual([['stone', 64], ['dirt', 35], ['stone', 10], void 0]);
            expect(countOf(inventory, 'stone')).toBe(0);
            expect(countOf(inventory, 'dirt')).toBe(0);
            expect(countOf(inventory, 'oak_log')).toBe(64);
        });

        test('ignores the held item when it is not already in the container', () => {
            const { player, inventory } = playerWith(GameMode.Survival, { 0: stack('oak_log', 64), 1: stack('stone', 20) });
            const container = containerOf(2, { 0: stack('stone', 1) });

            new MergeMode(player).onFillInteraction(container, stack('oak_log'));

            expect(contents(container)).toEqual([['stone', 21], void 0]);
            expect(countOf(inventory, 'oak_log')).toBe(64);
        });

        test('moves nothing into an empty container', () => {
            const { player, inventory } = playerWith(GameMode.Survival, { 0: stack('stone', 64) });
            const container = containerOf(2);

            new MergeMode(player).onFillInteraction(container, stack('stone'));

            expect(contents(container)).toEqual([void 0, void 0]);
            expect(countOf(inventory, 'stone')).toBe(64);
        });

        test('leaves the remainder in the player inventory when the container runs out of space', () => {
            const { player, inventory } = playerWith(GameMode.Survival, { 0: stack('stone', 64), 1: stack('stone', 64) });
            const container = containerOf(2, { 0: stack('stone', 60) });

            new MergeMode(player).onFillInteraction(container, stack('stone'));

            expect(contents(container)).toEqual([['stone', 64], ['stone', 64]]);
            expect(countOf(inventory, 'stone')).toBe(60);
        });

        test('behaves the same in creative, taking from the player inventory', () => {
            const { player, inventory } = playerWith(GameMode.Creative, { 0: stack('stone', 30) });
            const container = containerOf(2, { 0: stack('stone', 10) });

            new MergeMode(player).onFillInteraction(container, stack('oak_log'));

            expect(contents(container)).toEqual([['stone', 40], void 0]);
            expect(countOf(inventory, 'stone')).toBe(0);
        });
    });

    describe('onTakeInteraction()', () => {
        test('takes every container item that matches an item already in the player inventory', () => {
            const { player, inventory } = playerWith(GameMode.Survival, { 0: stack('stone', 1), 1: stack('dirt', 1) });
            const container = containerOf(4, { 0: stack('stone', 40), 1: stack('oak_log', 20), 2: stack('dirt', 10), 3: stack('stone', 64) });

            new MergeMode(player).onTakeInteraction(container, stack('oak_log'));

            expect(contents(container)).toEqual([void 0, ['oak_log', 20], void 0, void 0]);
            expect(countOf(inventory, 'stone')).toBe(105);
            expect(countOf(inventory, 'dirt')).toBe(11);
            expect(countOf(inventory, 'oak_log')).toBe(0);
        });

        test('takes nothing when the player inventory is empty', () => {
            const { player, inventory } = playerWith(GameMode.Survival);
            const container = containerOf(2, { 0: stack('stone', 40) });

            new MergeMode(player).onTakeInteraction(container, stack('stone'));

            expect(contents(container)).toEqual([['stone', 40], void 0]);
            expect(countOf(inventory, 'stone')).toBe(0);
        });
    });

    describe('action bar feedback', () => {
        test('names the container after filling, with the amount transferred', () => {
            const { player } = playerWith(GameMode.Survival, { 0: stack('stone', 30) });
            const container = containerOf(2, { 0: stack('stone', 10) });

            new MergeMode(player).onFillInteraction(container, stack('oak_log'), 'tile.chest.name');

            expect(lastActionBar(player)).toEqual({ rawtext: [
                { translate: 'rules.quickFillContainer.filled.merge', with: { rawtext: [{ translate: 'tile.chest.name' }] } },
                { text: ' (30)' }
            ]});
        });

        test('names the container after taking, with the amount taken', () => {
            const { player } = playerWith(GameMode.Survival, { 0: stack('stone', 1) });
            const container = containerOf(2, { 0: stack('stone', 10), 1: stack('dirt', 5) });

            new MergeMode(player).onTakeInteraction(container, stack('oak_log'), 'tile.chest.name');

            expect(lastActionBar(player)).toEqual({ rawtext: [
                { translate: 'rules.quickFillContainer.taken.merge', with: { rawtext: [{ translate: 'tile.chest.name' }] } },
                { text: ' (10)' }
            ]});
        });

        test('says nothing matched when filling moves nothing', () => {
            const { player } = playerWith(GameMode.Survival, { 0: stack('oak_log', 64) });
            const container = containerOf(2, { 0: stack('stone', 10) });

            new MergeMode(player).onFillInteraction(container, stack('oak_log'), 'tile.chest.name');

            expect(lastActionBar(player)).toEqual({ rawtext: [
                { translate: 'rules.quickFillContainer.filled.nomatch', with: { rawtext: [{ translate: 'tile.chest.name' }] } }
            ]});
        });

        test('says the container is full when filling a full container moves nothing', () => {
            const { player } = playerWith(GameMode.Survival, { 0: stack('stone', 64) });
            const container = containerOf(1, { 0: stack('stone', 64) });

            new MergeMode(player).onFillInteraction(container, stack('stone'), 'tile.chest.name');

            expect(lastActionBar(player)).toEqual({ rawtext: [
                { translate: 'rules.quickFillContainer.filled.full', with: { rawtext: [{ translate: 'tile.chest.name' }] } }
            ]});
        });

        test('says nothing matched when taking moves nothing', () => {
            const { player } = playerWith(GameMode.Survival, { 0: stack('oak_log', 64) });
            const container = containerOf(2, { 0: stack('stone', 10) });

            new MergeMode(player).onTakeInteraction(container, stack('oak_log'), 'tile.chest.name');

            expect(lastActionBar(player)).toEqual({ rawtext: [
                { translate: 'rules.quickFillContainer.taken.nomatch', with: { rawtext: [{ translate: 'tile.chest.name' }] } }
            ]});
        });

        test('sends exactly one action bar message per interaction', () => {
            const { player } = playerWith(GameMode.Survival);
            const container = containerOf(2);
            const mode = new MergeMode(player);

            mode.onFillInteraction(container, stack('oak_log'), 'tile.chest.name');
            mode.onTakeInteraction(container, stack('oak_log'), 'tile.chest.name');

            expect(actionBarCount(player)).toBe(2);
        });

        test('every message it can send has an English localization entry', () => {
            const keys = [
                'rules.quickFillContainer.filled.merge',
                'rules.quickFillContainer.taken.merge',
                'rules.quickFillContainer.filled.nomatch',
                'rules.quickFillContainer.taken.nomatch',
                'rules.quickFillContainer.filled.full'
            ];
            for (const key of keys)
                expect(langKeys.has(key), key).toBe(true);
        });
    });
});
