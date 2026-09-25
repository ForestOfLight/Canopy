import { BlockComponentTypes, Container, EntityComponentTypes, ItemStack, Player } from "@minecraft/server";
import { QuickFillDirectExecutor } from "../../../../../../Canopy[BP]/scripts/src/classes/quickfill/QuickFillDirectExecutor";
import { afterEach, describe, expect, test, vi } from "vitest";

function makePlayer(container) {
    const player = new Player();
    player.getComponent.mockImplementation(component => {
        if (component === EntityComponentTypes.Inventory)
            return { container };
    });
    return player;
}

function makeBlock(container, typeId = 'minecraft:chest') {
    return {
        typeId,
        localizationKey: `tile.${typeId}`,
        getComponent: vi.fn(component => component === BlockComponentTypes.Inventory ? { container } : undefined)
    };
}

function makeEntity(container, typeId = 'minecraft:llama', isChested = true, strength = 5, containerType = 'horse') {
    return {
        typeId,
        localizationKey: `entity.${typeId}`,
        getComponent: vi.fn(component => {
            if (component === EntityComponentTypes.Inventory)
                return { container, containerType, additionalSlotsPerStrength: 3 };
            if (component === EntityComponentTypes.Strength)
                return { value: strength };
        }),
        hasComponent: vi.fn(component => component === EntityComponentTypes.IsChested && isChested)
    };
}

describe('QuickFillDirectExecutor', () => {
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

        const feedback = vi.spyOn(QuickFillDirectExecutor, 'sendFeedbackMessage').mockImplementation(() => {});
        QuickFillDirectExecutor.transferToContainer(player, block, heldItem);

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

        const feedback = vi.spyOn(QuickFillDirectExecutor, 'sendFeedbackMessage').mockImplementation(() => {});
        QuickFillDirectExecutor.transferToPlayer(player, block, heldItem);

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

        const feedback = vi.spyOn(QuickFillDirectExecutor, 'sendFeedbackMessage').mockImplementation(() => {});
        QuickFillDirectExecutor.fillCreative(player, block, heldItem);

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

        vi.spyOn(QuickFillDirectExecutor, 'sendFeedbackMessage').mockImplementation(() => {});
        QuickFillDirectExecutor.fillCreative(player, block, heldItem);

        expect(blockInv.getItem(0).amount).toBe(64);
        expect(blockInv.getItem(1)).toBeUndefined();
        expect(blockInv.getItem(2).amount).toBe(64);
    });

    test('creative QuickFill uses only entity cargo slots', () => {
        const heldItem = new ItemStack('minecraft:stone');
        const entityInv = new Container({ size: 16, items: {
            0: new ItemStack('minecraft:red_carpet'),
            7: new ItemStack('minecraft:stone', 4)
        }});
        const player = makePlayer(new Container({ size: 4 }));
        const entity = makeEntity(entityInv, 'minecraft:llama', true, 2);

        vi.spyOn(QuickFillDirectExecutor, 'sendFeedbackMessage').mockImplementation(() => {});
        QuickFillDirectExecutor.fillCreative(player, entity, heldItem, entityInv);

        expect(entityInv.getItem(0).typeId).toBe('minecraft:red_carpet');
        for (let slot = 1; slot <= 6; slot++)
            expect(entityInv.getItem(slot).amount).toBe(64);
        expect(entityInv.getItem(7).amount).toBe(4);
    });

    test('reverse QuickFill uses only entity cargo slots', () => {
        const heldItem = new ItemStack('minecraft:stone');
        const playerInv = new Container({ size: 4 });
        const entityInv = new Container({ size: 16, items: {
            0: new ItemStack('minecraft:stone', 2),
            1: new ItemStack('minecraft:stone', 5),
            7: new ItemStack('minecraft:stone', 7)
        }});
        const player = makePlayer(playerInv);
        const entity = makeEntity(entityInv, 'minecraft:llama', true, 2);

        const feedback = vi.spyOn(QuickFillDirectExecutor, 'sendFeedbackMessage').mockImplementation(() => {});
        QuickFillDirectExecutor.transferToPlayer(player, entity, heldItem, entityInv);

        expect(playerInv.getItem(0).amount).toBe(5);
        expect(entityInv.getItem(0).amount).toBe(2);
        expect(entityInv.getItem(1)).toBeUndefined();
        expect(entityInv.getItem(7).amount).toBe(7);
        expect(feedback).toHaveBeenCalledWith(false, player, entity, heldItem, 1, false);
    });

    test('entity QuickFill feedback ignores equipment and hidden slots', () => {
        const heldItem = new ItemStack('minecraft:stone');

        const cargoItems = {
            0: new ItemStack('minecraft:red_carpet')
        };
        for (let slot = 1; slot <= 6; slot++)
            cargoItems[slot] = new ItemStack('minecraft:dirt', 64);

        const entityInv = new Container({ size: 16, items: cargoItems });
        const player = makePlayer(new Container({ size: 2, items: {
            0: new ItemStack('minecraft:stone', 8)
        }}));
        const entity = makeEntity(entityInv, 'minecraft:llama', true, 2);

        QuickFillDirectExecutor.transferToContainer(player, entity, heldItem, entityInv);

        expect(player.onScreenDisplay.setActionBar).toHaveBeenLastCalledWith(
            expect.stringContaining('no available space in container.')
        );

        const fullPlayer = makePlayer(new Container({ size: 2, items: {
            0: new ItemStack('minecraft:dirt', 64),
            1: new ItemStack('minecraft:cobblestone', 64)
        }}));
        const nonCargoInv = new Container({ size: 16, items: {
            0: new ItemStack('minecraft:stone', 5),
            7: new ItemStack('minecraft:stone', 5)
        }});
        const nonCargoEntity = makeEntity(nonCargoInv, 'minecraft:llama', true, 2);

        QuickFillDirectExecutor.transferToPlayer(fullPlayer, nonCargoEntity, heldItem, nonCargoInv);

        expect(fullPlayer.onScreenDisplay.setActionBar).toHaveBeenLastCalledWith(
            expect.stringContaining('nothing to remove.')
        );
    });

    test('direct QuickFill feedback reports no-op actions and singular slots', () => {
        const player = makePlayer(new Container({ size: 4 }));
        const block = makeBlock(new Container({ size: 27 }));
        const item = new ItemStack('minecraft:stone');

        QuickFillDirectExecutor.sendFeedbackMessage(true, player, block, item, 0);
        expect(player.onScreenDisplay.setActionBar).toHaveBeenLastCalledWith(expect.stringContaining('nothing to fill.'));

        QuickFillDirectExecutor.sendFeedbackMessage(false, player, block, item, 0);
        expect(player.onScreenDisplay.setActionBar).toHaveBeenLastCalledWith(expect.stringContaining('nothing to remove.'));

        QuickFillDirectExecutor.sendFeedbackMessage(true, player, block, item, 1);
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

        QuickFillDirectExecutor.transferToContainer(fillPlayer, fullBlock, new ItemStack('minecraft:stone'));
        expect(fillPlayer.onScreenDisplay.setActionBar).toHaveBeenLastCalledWith(expect.stringContaining('no available space in container.'));

        const fullPlayer = makePlayer(new Container({ size: 2, items: {
            0: new ItemStack('minecraft:dirt', 64),
            1: new ItemStack('minecraft:cobblestone', 64)
        }}));
        const sourceBlock = makeBlock(new Container({ size: 2, items: { 0: new ItemStack('minecraft:stone', 8) } }));

        QuickFillDirectExecutor.transferToPlayer(fullPlayer, sourceBlock, new ItemStack('minecraft:stone'));
        expect(fullPlayer.onScreenDisplay.setActionBar).toHaveBeenLastCalledWith(expect.stringContaining('player inventory is full.'));
    });
});
