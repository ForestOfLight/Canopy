import { BlockComponentTypes, ButtonState, Container, EntityComponentTypes, ItemStack, Player, system } from "@minecraft/server";
import { QuickFillClipboardController } from "../../../../../Canopy[BP]/scripts/src/classes/quickfill/QuickFillClipboardController";
import { quickFillContainer } from "../../../../../Canopy[BP]/scripts/src/rules/quickFillContainer";
import { afterEach, describe, expect, test, vi } from "vitest";

function makePlayer(container) {
    const player = new Player();
    player.getComponent.mockImplementation(component => component === EntityComponentTypes.Inventory ? { container } : undefined);
    return player;
}

function makeBlock(container, typeId = 'minecraft:chest') {
    return {
        typeId,
        localizationKey: `tile.${typeId}`,
        getComponent: vi.fn(component => component === BlockComponentTypes.Inventory ? { container } : undefined)
    };
}

describe('quickFillContainer', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    test('survival QuickFill transfers matching owned items into the container', () => {
        const heldItem = new ItemStack('minecraft:stone');
        const playerInv = new Container({ size: 4, items: {
            0: new ItemStack('minecraft:stone', 8),
            1: new ItemStack('minecraft:dirt', 64),
            2: new ItemStack('minecraft:stone', 3)
        }});
        const blockInv = new Container({ size: 4 });
        const player = makePlayer(playerInv);
        const block = makeBlock(blockInv);

        const feedback = vi.spyOn(quickFillContainer, 'sendFeedbackMessage').mockImplementation(() => {});
        quickFillContainer.transferToContainer(player, block, heldItem);

        expect(blockInv.getItem(0).amount).toBe(11);
        expect(playerInv.getItem(0)).toBeUndefined();
        expect(playerInv.getItem(2)).toBeUndefined();
        expect(playerInv.getItem(1).typeId).toBe('minecraft:dirt');
        expect(feedback).toHaveBeenCalledWith(true, player, block, heldItem, 1, false);
    });

    test('reverse QuickFill pulls matching items out of the container', () => {
        const heldItem = new ItemStack('minecraft:stone');
        const playerInv = new Container({ size: 4 });
        const blockInv = new Container({ size: 4, items: {
            0: new ItemStack('minecraft:stone', 5),
            1: new ItemStack('minecraft:dirt', 32),
            2: new ItemStack('minecraft:stone', 7)
        }});
        const player = makePlayer(playerInv);
        const block = makeBlock(blockInv);

        const feedback = vi.spyOn(quickFillContainer, 'sendFeedbackMessage').mockImplementation(() => {});
        quickFillContainer.transferToPlayer(player, block, heldItem);

        expect(playerInv.getItem(0).amount).toBe(5);
        expect(playerInv.getItem(1).amount).toBe(7);
        expect(blockInv.getItem(0)).toBeUndefined();
        expect(blockInv.getItem(2)).toBeUndefined();
        expect(blockInv.getItem(1).typeId).toBe('minecraft:dirt');
        expect(feedback).toHaveBeenCalledWith(false, player, block, heldItem, 2, false);
    });

    test('creative QuickFill fills available capacity without overwriting other items', () => {
        const heldItem = new ItemStack('minecraft:ender_pearl');
        heldItem.maxAmount = 16;
        const matching = new ItemStack('minecraft:ender_pearl', 5);
        matching.maxAmount = 16;
        const dirt = new ItemStack('minecraft:dirt', 32);
        const blockInv = new Container({ size: 3, items: { 0: matching, 1: dirt } });
        const playerInv = new Container({ size: 4, items: { 0: new ItemStack('minecraft:stone', 12) } });
        const player = makePlayer(playerInv);
        const block = makeBlock(blockInv);

        const feedback = vi.spyOn(quickFillContainer, 'sendFeedbackMessage').mockImplementation(() => {});
        quickFillContainer.fillCreative(player, block, heldItem);

        expect(blockInv.getItem(0).amount).toBe(16);
        expect(blockInv.getItem(1)).toBe(dirt);
        expect(blockInv.getItem(2).typeId).toBe('minecraft:ender_pearl');
        expect(blockInv.getItem(2).amount).toBe(16);
        expect(heldItem.amount).toBe(1);
        expect(playerInv.getItem(0).amount).toBe(12);
        expect(feedback).toHaveBeenCalledWith(true, player, block, heldItem, 2, false);
    });

    test('creative QuickFill skips a destination slot that rejects the item', () => {
        const heldItem = new ItemStack('minecraft:stone');
        const blockInv = new Container({ size: 3 });
        const setItem = blockInv.setItem.getMockImplementation();
        blockInv.setItem.mockImplementation((slot, item) => {
            if (slot === 1)
                throw new Error('slot rejected item');
            setItem(slot, item);
        });
        const player = makePlayer(new Container({ size: 4 }));
        const block = makeBlock(blockInv);

        vi.spyOn(quickFillContainer, 'sendFeedbackMessage').mockImplementation(() => {});
        quickFillContainer.fillCreative(player, block, heldItem);

        expect(blockInv.getItem(0).amount).toBe(64);
        expect(blockInv.getItem(1)).toBeUndefined();
        expect(blockInv.getItem(2).amount).toBe(64);
    });

    test.each([
        'minecraft:furnace',
        'minecraft:smoker',
        'minecraft:blast_furnace',
        'minecraft:brewing_stand'
    ])('direct QuickFill does not intercept %s without a clipboard', typeId => {
        const heldItem = new ItemStack('minecraft:stone');
        const playerInv = new Container({ size: 4, items: { 0: new ItemStack('minecraft:stone', 64) } });
        const blockInv = new Container({ size: typeId === 'minecraft:brewing_stand' ? 5 : 3 });
        const player = makePlayer(playerInv);
        const block = makeBlock(blockInv, typeId);

        vi.spyOn(quickFillContainer, 'isEnabledForPlayer').mockReturnValue(true);
        vi.spyOn(QuickFillClipboardController, 'get').mockReturnValue(undefined);
        const event = { player, block, itemStack: heldItem, cancel: false };

        quickFillContainer.onPlayerInteractWithBlock(event);

        expect(event.cancel).toBe(false);
        expect(blockInv.emptySlotsCount).toBe(blockInv.size);
        expect(playerInv.getItem(0).amount).toBe(64);
    });

    test('direct reverse QuickFill is ignored for functional inventories', () => {
        const heldItem = new ItemStack('minecraft:stone');
        const playerInv = new Container({ size: 4 });
        const blockInv = new Container({ size: 3, items: { 0: new ItemStack('minecraft:stone', 8) } });
        const player = makePlayer(playerInv);
        const block = makeBlock(blockInv, 'minecraft:furnace');

        player.inputInfo.getButtonState.mockReturnValue(ButtonState.Pressed);
        vi.spyOn(quickFillContainer, 'isEnabledForPlayer').mockReturnValue(true);
        vi.spyOn(QuickFillClipboardController, 'get').mockReturnValue(undefined);
        const event = { player, block, itemStack: heldItem, cancel: false };

        quickFillContainer.onPlayerInteractWithBlock(event);

        expect(event.cancel).toBe(false);
        expect(blockInv.getItem(0).amount).toBe(8);
        expect(playerInv.getItem(0)).toBeUndefined();
    });

    test('empty-hand interaction is ignored by QuickFill', () => {
        const player = makePlayer(new Container({ size: 4 }));
        const block = makeBlock(new Container({ size: 27 }));

        vi.spyOn(quickFillContainer, 'isEnabledForPlayer').mockReturnValue(true);
        const event = { player, block, itemStack: undefined, cancel: false };
        quickFillContainer.onPlayerInteractWithBlock(event);

        expect(event.cancel).toBe(false);
    });

    test('shulker boxes cannot be QuickFilled with another shulker box', () => {
        const player = makePlayer(new Container({ size: 4 }));
        const block = makeBlock(new Container({ size: 27 }), 'minecraft:shulker_box');
        const heldItem = new ItemStack('minecraft:red_shulker_box');

        vi.spyOn(quickFillContainer, 'isEnabledForPlayer').mockReturnValue(true);
        const event = { player, block, itemStack: heldItem, cancel: false };
        quickFillContainer.onPlayerInteractWithBlock(event);

        expect(event.cancel).toBe(false);
    });

    test('sneak + break deactivates an active clipboard regardless of target contents', () => {
        const player = makePlayer(new Container({ size: 4 }));
        const block = makeBlock(new Container({ size: 5, items: {
            0: new ItemStack('minecraft:stone'),
            1: new ItemStack('minecraft:stone'),
            2: new ItemStack('minecraft:stone'),
            3: new ItemStack('minecraft:stone'),
            4: new ItemStack('minecraft:stone')
        }}), 'minecraft:hopper');

        player.inputInfo.getButtonState.mockReturnValue(ButtonState.Pressed);
        vi.spyOn(quickFillContainer, 'isEnabledForPlayer').mockReturnValue(true);
        vi.spyOn(QuickFillClipboardController, 'get').mockReturnValue({});
        const deactivate = vi.spyOn(QuickFillClipboardController, 'deactivate').mockReturnValue(true);
        const copy = vi.spyOn(QuickFillClipboardController, 'copy').mockImplementation(() => {});
        vi.spyOn(system, 'run').mockImplementation(callback => callback());

        const event = { player, block, cancel: false };
        quickFillContainer.onPlayerBreakBlock(event);

        expect(event.cancel).toBe(true);
        expect(deactivate).toHaveBeenCalledWith(player);
        expect(copy).not.toHaveBeenCalled();
    });

    test('sneak + break is not intercepted without an active clipboard', () => {
        const player = makePlayer(new Container({ size: 4 }));
        const block = makeBlock(new Container({ size: 27 }));

        player.inputInfo.getButtonState.mockReturnValue(ButtonState.Pressed);
        vi.spyOn(quickFillContainer, 'isEnabledForPlayer').mockReturnValue(true);
        vi.spyOn(QuickFillClipboardController, 'get').mockReturnValue(undefined);
        const deactivate = vi.spyOn(QuickFillClipboardController, 'deactivate').mockImplementation(() => {});
        const copy = vi.spyOn(QuickFillClipboardController, 'copy').mockImplementation(() => {});
        vi.spyOn(system, 'run').mockImplementation(callback => callback());

        const event = { player, block, cancel: false };
        quickFillContainer.onPlayerBreakBlock(event);

        expect(event.cancel).toBe(false);
        expect(deactivate).not.toHaveBeenCalled();
        expect(copy).not.toHaveBeenCalled();
    });

    test('direct QuickFill feedback reports no-op actions and singular slots', () => {
        const player = makePlayer(new Container({ size: 4 }));
        const block = makeBlock(new Container({ size: 27 }));
        const item = new ItemStack('minecraft:stone');

        quickFillContainer.sendFeedbackMessage(true, player, block, item, 0);
        expect(player.onScreenDisplay.setActionBar).toHaveBeenLastCalledWith(expect.stringContaining('nothing to fill.'));

        quickFillContainer.sendFeedbackMessage(false, player, block, item, 0);
        expect(player.onScreenDisplay.setActionBar).toHaveBeenLastCalledWith(expect.stringContaining('nothing to remove.'));

        quickFillContainer.sendFeedbackMessage(true, player, block, item, 1);
        const feedback = player.onScreenDisplay.setActionBar.mock.calls.at(-1)[0];
        expect(feedback.rawtext.at(-1).text).toContain('slot)');
        expect(feedback.rawtext.at(-1).text).not.toContain('slots)');
    });

    test('direct QuickFill reports full destination inventories', () => {
        const fillPlayer = makePlayer(new Container({ size: 2, items: { 0: new ItemStack('minecraft:stone', 64) } }));
        const fullBlock = makeBlock(new Container({ size: 2, items: {
            0: new ItemStack('minecraft:dirt', 64),
            1: new ItemStack('minecraft:cobblestone', 64)
        }}));

        quickFillContainer.transferToContainer(fillPlayer, fullBlock, new ItemStack('minecraft:stone'));
        expect(fillPlayer.onScreenDisplay.setActionBar).toHaveBeenLastCalledWith(expect.stringContaining('no available space in container.'));

        const fullPlayer = makePlayer(new Container({ size: 2, items: {
            0: new ItemStack('minecraft:dirt', 64),
            1: new ItemStack('minecraft:cobblestone', 64)
        }}));
        const sourceBlock = makeBlock(new Container({ size: 2, items: { 0: new ItemStack('minecraft:stone', 8) } }));

        quickFillContainer.transferToPlayer(fullPlayer, sourceBlock, new ItemStack('minecraft:stone'));
        expect(fullPlayer.onScreenDisplay.setActionBar).toHaveBeenLastCalledWith(expect.stringContaining('player inventory is full.'));
    });

    test('clipboard copy feedback reports occupied slots rather than clipboard capacity', () => {
        const player = makePlayer(new Container({ size: 4 }));
        const furnace = makeBlock(new Container({ size: 3, items: { 0: new ItemStack('minecraft:iron_ore') } }), 'minecraft:furnace');

        QuickFillClipboardController.copy(player, furnace);
        expect(player.onScreenDisplay.setActionBar).toHaveBeenLastCalledWith('§7Quick Fill: copied §a1§7 occupied slot.');

        const emptyFurnace = makeBlock(new Container({ size: 3 }), 'minecraft:furnace');
        QuickFillClipboardController.copy(player, emptyFurnace);
        expect(player.onScreenDisplay.setActionBar).toHaveBeenLastCalledWith(expect.stringContaining('copied empty clipboard.'));
    });

    test('clipboard feedback reports no-op actions and singular slots', () => {
        const player = makePlayer(new Container({ size: 4 }));

        QuickFillClipboardController.sendFeedback(player, { changedSlots: 0 }, false);
        expect(player.onScreenDisplay.setActionBar).toHaveBeenLastCalledWith(expect.stringContaining('no changes applied.'));

        QuickFillClipboardController.sendFeedback(player, { changedSlots: 0 }, true);
        expect(player.onScreenDisplay.setActionBar).toHaveBeenLastCalledWith(expect.stringContaining('no matching items removed.'));

        QuickFillClipboardController.sendFeedback(player, { changedSlots: 1 }, false);
        const feedback = player.onScreenDisplay.setActionBar.mock.calls.at(-1)[0];
        expect(feedback).toContain('slot).');
        expect(feedback).not.toContain('slots).');
    });
});
