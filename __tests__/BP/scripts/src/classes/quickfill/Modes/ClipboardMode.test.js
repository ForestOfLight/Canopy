import { beforeEach, describe, expect, test } from "vitest";
import { GameMode } from "@minecraft/server";
import { CustomForm } from "@minecraft/server-ui";
import { ClipboardMode } from "../../../../../../../Canopy[BP]/scripts/src/classes/quickfill/Modes/ClipboardMode";
import { containerOf, contents, countOf, playerWith, stack } from "./helpers";

const configure = (mode, container) => {
    mode.onConfigureInteraction(container);
    return CustomForm.instances.at(-1);
};

const apply = (form, { wildcardValue = 0, grabCopies = 0 } = {}) => {
    form.getControl('dropdown').observable.setData(wildcardValue);
    form.getControl('slider').observable.setData(grabCopies);
    form.getControl('button').onClick();
};

describe('ClipboardMode', () => {
    beforeEach(() => {
        CustomForm.instances.length = 0;
    });

    test('starts with an empty clipboard and no grab copies', () => {
        const { player } = playerWith(GameMode.Survival);
        const mode = new ClipboardMode(player);

        expect(mode.clipboard.isEmpty).toBe(true);
        expect(mode.grabCopies).toBe(0);
    });

    test('has a configure interaction', () => {
        const { player } = playerWith(GameMode.Survival);

        expect(new ClipboardMode(player).hasConfigureInteraction()).toBe(true);
    });

    describe('getDropdownItems()', () => {
        test('always offers None first, with value 0', () => {
            const { player } = playerWith(GameMode.Survival);

            expect(new ClipboardMode(player).getDropdownItems(containerOf(3))).toEqual([{ label: 'None', value: 0 }]);
        });

        test('lists each distinct item type once, in slot order, with sequential values', () => {
            const { player } = playerWith(GameMode.Survival);
            const container = containerOf(6, { 1: stack('stone', 5), 2: stack('dirt'), 4: stack('stone', 9), 5: stack('oak_log') });

            expect(new ClipboardMode(player).getDropdownItems(container)).toEqual([
                { label: 'None', value: 0 },
                { label: 'minecraft:stone', value: 1 },
                { label: 'minecraft:dirt', value: 2 },
                { label: 'minecraft:oak_log', value: 3 }
            ]);
        });
    });

    describe('onConfigureInteraction()', () => {
        test('shows a form to the player with the menu title', () => {
            const { player } = playerWith(GameMode.Survival);

            const form = configure(new ClipboardMode(player), containerOf(1, { 0: stack('stone') }));

            expect(form.player).toBe(player);
            expect(form.title).toBe('rules.quickFillContainer.menu.title');
            expect(form.show).toHaveBeenCalledTimes(1);
        });

        test('offers a wildcard dropdown of the container\'s item types, starting on None', () => {
            const { player } = playerWith(GameMode.Survival);

            const form = configure(new ClipboardMode(player), containerOf(2, { 0: stack('stone'), 1: stack('dirt') }));
            const dropdown = form.getControl('dropdown');

            expect(dropdown.label).toBe('rules.quickFillContainer.menu.wildcard');
            expect(dropdown.items.map(item => item.label)).toEqual(['None', 'minecraft:stone', 'minecraft:dirt']);
            expect(dropdown.observable.getData()).toBe(0);
        });

        test('offers a grab copies slider from 0 to 64 in whole steps, starting at 0', () => {
            const { player } = playerWith(GameMode.Survival);

            const slider = configure(new ClipboardMode(player), containerOf(1)).getControl('slider');

            expect(slider.label).toBe('rules.quickFillContainer.menu.grabcopies');
            expect([slider.min, slider.max, slider.options.step]).toEqual([0, 64, 1]);
            expect(slider.observable.getData()).toBe(0);
        });

        test('lets the client write both controls', () => {
            const { player } = playerWith(GameMode.Survival);

            const form = configure(new ClipboardMode(player), containerOf(1));

            expect(form.getControl('dropdown').observable.options.clientWritable).toBe(true);
            expect(form.getControl('slider').observable.options.clientWritable).toBe(true);
        });

        test('does not touch the clipboard until Apply is pressed', () => {
            const { player } = playerWith(GameMode.Survival);
            const mode = new ClipboardMode(player);

            configure(mode, containerOf(1, { 0: stack('stone') }));

            expect(mode.clipboard.isEmpty).toBe(true);
        });

        test('Apply closes the form', () => {
            const { player } = playerWith(GameMode.Survival);
            const form = configure(new ClipboardMode(player), containerOf(1, { 0: stack('stone') }));

            apply(form);

            expect(form.close).toHaveBeenCalledTimes(1);
            expect(form.isShowing).toBe(false);
        });

        test('Apply copies the container into the clipboard', () => {
            const { player } = playerWith(GameMode.Survival);
            const mode = new ClipboardMode(player);
            const form = configure(mode, containerOf(3, { 0: stack('stone', 5), 2: stack('dirt', 2) }));

            apply(form);

            expect(mode.clipboard.items.map(item => item && [item.typeId, item.amount])).toEqual([['minecraft:stone', 5], void 0, ['minecraft:dirt', 2]]);
        });

        test('Apply stores the chosen grab copies', () => {
            const { player } = playerWith(GameMode.Survival);
            const mode = new ClipboardMode(player);
            const form = configure(mode, containerOf(1, { 0: stack('stone') }));

            apply(form, { grabCopies: 7 });

            expect(mode.grabCopies).toBe(7);
        });

        test('Apply with a wildcard type makes later fills substitute the held item for it', () => {
            const { player } = playerWith(GameMode.Creative);
            const mode = new ClipboardMode(player);
            const form = configure(mode, containerOf(2, { 0: stack('stone', 4), 1: stack('dirt', 2) }));

            apply(form, { wildcardValue: 1 });
            const target = containerOf(2);
            mode.onFillInteraction(target, stack('oak_log'));

            expect(contents(target)).toEqual([['oak_log', 4], ['dirt', 2]]);
        });

        test('Apply with None leaves the copied items unsubstituted', () => {
            const { player } = playerWith(GameMode.Creative);
            const mode = new ClipboardMode(player);
            const form = configure(mode, containerOf(2, { 0: stack('stone', 4), 1: stack('dirt', 2) }));

            apply(form, { wildcardValue: 0 });
            const target = containerOf(2);
            mode.onFillInteraction(target, stack('oak_log'));

            expect(contents(target)).toEqual([['stone', 4], ['dirt', 2]]);
        });

        test('re-applying replaces the previous clipboard, wildcard and grab copies', () => {
            const { player } = playerWith(GameMode.Creative);
            const mode = new ClipboardMode(player);
            apply(configure(mode, containerOf(1, { 0: stack('stone', 4) })), { wildcardValue: 1, grabCopies: 5 });

            apply(configure(mode, containerOf(1, { 0: stack('dirt', 2) })), { wildcardValue: 0, grabCopies: 1 });
            const target = containerOf(2);
            mode.onFillInteraction(target, stack('oak_log'));

            expect(contents(target)).toEqual([['dirt', 2], void 0]);
            expect(mode.grabCopies).toBe(1);
        });

        test('an empty container produces an empty clipboard', () => {
            const { player } = playerWith(GameMode.Survival);
            const mode = new ClipboardMode(player);

            apply(configure(mode, containerOf(3)));

            expect(mode.clipboard.isEmpty).toBe(true);
        });

        test('has a close button', () => {
            const { player } = playerWith(GameMode.Survival);

            const form = configure(new ClipboardMode(player), containerOf(1));

            expect(form.getControl('closeButton')).toBeDefined();
            expect(form.getControl('button').label).toBe('rules.quickFillContainer.menu.apply');
        });
    });

    describe('onFillInteraction()', () => {
        test('in creative, puts copies into empty slots without removing anything from the player', () => {
            const { player, inventory } = playerWith(GameMode.Creative, { 0: stack('stone', 3) });
            const mode = new ClipboardMode(player);
            mode.clipboard.copy(containerOf(2, { 0: stack('stone', 10), 1: stack('dirt', 2) }));
            const container = containerOf(3, { 0: stack('stone', 5) });

            mode.onFillInteraction(container, stack('stone'));

            expect(contents(container)).toEqual([['stone', 5], ['stone', 10], ['dirt', 2]]);
            expect(countOf(inventory, 'stone')).toBe(3);
        });

        test('in survival, moves the clipboard\'s items out of the player inventory slot for slot', () => {
            const { player, inventory } = playerWith(GameMode.Survival, { 0: stack('stone', 30), 1: stack('dirt', 10) });
            const mode = new ClipboardMode(player);
            mode.clipboard.copy(containerOf(2, { 0: stack('stone', 10), 1: stack('dirt', 2) }));
            const container = containerOf(2);

            mode.onFillInteraction(container, stack('stone'));

            expect(contents(container)).toEqual([['stone', 10], ['dirt', 2]]);
            expect(countOf(inventory, 'stone')).toBe(20);
            expect(countOf(inventory, 'dirt')).toBe(8);
        });

        test('in survival, uses the held item in place of the wildcarded type', () => {
            const { player, inventory } = playerWith(GameMode.Survival, { 0: stack('stone', 64), 1: stack('oak_log', 64) });
            const mode = new ClipboardMode(player);
            mode.clipboard.copy(containerOf(1, { 0: stack('stone', 6) }));
            mode.clipboard.setWildcardTypeId('minecraft:stone');
            const container = containerOf(1);

            mode.onFillInteraction(container, stack('oak_log'));

            expect(contents(container)).toEqual([['oak_log', 6]]);
            expect(countOf(inventory, 'stone')).toBe(64);
            expect(countOf(inventory, 'oak_log')).toBe(58);
        });

        test('with an empty clipboard, moves nothing', () => {
            const { player, inventory } = playerWith(GameMode.Survival, { 0: stack('stone', 30) });
            const container = containerOf(2);

            new ClipboardMode(player).onFillInteraction(container, stack('stone'));

            expect(contents(container)).toEqual([void 0, void 0]);
            expect(countOf(inventory, 'stone')).toBe(30);
        });
    });

    describe('onGrabInteraction()', () => {
        const modeWithClipboard = (player, clipboardItems) => {
            const mode = new ClipboardMode(player);
            mode.clipboard.copy(containerOf(clipboardItems.length, { ...clipboardItems }));
            return mode;
        };

        test('with an empty clipboard, moves nothing', () => {
            const { player, inventory } = playerWith(GameMode.Survival);
            const container = containerOf(1, { 0: stack('stone', 10) });

            new ClipboardMode(player).onGrabInteraction(container, stack('stone'));

            expect(contents(container)).toEqual([['stone', 10]]);
            expect(countOf(inventory, 'stone')).toBe(0);
        });

        test('with grab copies 0, keeps grabbing whole copies until the container runs out', () => {
            const { player, inventory } = playerWith(GameMode.Survival);
            const mode = modeWithClipboard(player, [stack('stone', 2)]);
            const container = containerOf(2, { 0: stack('stone', 4), 1: stack('dirt', 3) });

            mode.onGrabInteraction(container, stack('stone'));

            expect(countOf(inventory, 'stone')).toBe(4);
            expect(contents(container)).toEqual([void 0, ['dirt', 3]]);
        });

        test('with grab copies 0, also takes the final partial copy', () => {
            const { player, inventory } = playerWith(GameMode.Survival);
            const mode = modeWithClipboard(player, [stack('stone', 2)]);
            const container = containerOf(1, { 0: stack('stone', 5) });

            mode.onGrabInteraction(container, stack('stone'));

            expect(countOf(inventory, 'stone')).toBe(5);
            expect(contents(container)).toEqual([void 0]);
        });

        test('with grab copies 0, stops when the clipboard\'s item is not in the container', () => {
            const { player, inventory } = playerWith(GameMode.Survival);
            const mode = modeWithClipboard(player, [stack('stone', 2)]);
            const container = containerOf(1, { 0: stack('dirt', 3) });

            mode.onGrabInteraction(container, stack('stone'));

            expect(countOf(inventory, 'stone')).toBe(0);
            expect(contents(container)).toEqual([['dirt', 3]]);
        });

        test('with a fixed number of grab copies, takes exactly that many copies', () => {
            const { player, inventory } = playerWith(GameMode.Survival);
            const mode = modeWithClipboard(player, [stack('stone', 2)]);
            mode.grabCopies = 3;
            const container = containerOf(1, { 0: stack('stone', 20) });

            mode.onGrabInteraction(container, stack('stone'));

            expect(countOf(inventory, 'stone')).toBe(6);
            expect(contents(container)).toEqual([['stone', 14]]);
        });

        test('with a fixed number of grab copies, takes less when the container has less', () => {
            const { player, inventory } = playerWith(GameMode.Survival);
            const mode = modeWithClipboard(player, [stack('stone', 2)]);
            mode.grabCopies = 10;
            const container = containerOf(1, { 0: stack('stone', 5) });

            mode.onGrabInteraction(container, stack('stone'));

            expect(countOf(inventory, 'stone')).toBe(5);
            expect(contents(container)).toEqual([void 0]);
        });

        test('takes the held item in place of the wildcarded type', () => {
            const { player, inventory } = playerWith(GameMode.Survival);
            const mode = modeWithClipboard(player, [stack('stone', 2)]);
            mode.clipboard.setWildcardTypeId('minecraft:stone');
            mode.grabCopies = 1;
            const container = containerOf(2, { 0: stack('stone', 10), 1: stack('oak_log', 10) });

            mode.onGrabInteraction(container, stack('oak_log'));

            expect(countOf(inventory, 'oak_log')).toBe(2);
            expect(countOf(inventory, 'stone')).toBe(0);
            expect(contents(container)).toEqual([['stone', 10], ['oak_log', 8]]);
        });
    });
});
