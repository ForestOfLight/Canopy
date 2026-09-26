import { BlockComponentTypes, ButtonState, Container, EntityComponentTypes, ItemStack, Player, system } from "@minecraft/server";
import { QuickFillClipboardController } from "../../../../../Canopy[BP]/scripts/src/classes/quickfill/QuickFillClipboardController";
import { QuickFillContainerPolicy } from "../../../../../Canopy[BP]/scripts/src/classes/quickfill/QuickFillContainerPolicy";
import { quickFillContainer } from "../../../../../Canopy[BP]/scripts/src/rules/quickFillContainer";
import { afterEach, describe, expect, test, vi } from "vitest";

function makePlayer(container, enderContainer) {
    const player = new Player();
    player.getComponent.mockImplementation(component => {
        if (component === EntityComponentTypes.Inventory)
            return { container };
        if (component === EntityComponentTypes.EnderInventory && enderContainer)
            return { container: enderContainer };
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

describe('quickFillContainer', () => {
    afterEach(() => {
        vi.restoreAllMocks();
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

    test('empty-hand sneak removes all items from a container', () => {
        const playerInv = new Container({ size: 6 });
        const blockInv = new Container({ size: 4, items: {
            0: new ItemStack('minecraft:stone', 5),
            1: new ItemStack('minecraft:dirt', 32),
            3: new ItemStack('minecraft:oak_log', 4)
        }});
        const player = makePlayer(playerInv);
        const block = makeBlock(blockInv);

        player.inputInfo.getButtonState.mockReturnValue(ButtonState.Pressed);
        vi.spyOn(quickFillContainer, 'isEnabledForPlayer').mockReturnValue(true);
        vi.spyOn(QuickFillClipboardController, 'get').mockReturnValue(undefined);
        vi.spyOn(system, 'run').mockImplementation(callback => callback());

        const event = { player, block, itemStack: undefined, cancel: false };
        quickFillContainer.onPlayerInteractWithBlock(event);

        expect(event.cancel).toBe(true);
        expect(blockInv.emptySlotsCount).toBe(4);
        expect(playerInv.getItem(0).typeId).toBe('minecraft:stone');
        expect(playerInv.getItem(1).typeId).toBe('minecraft:dirt');
        expect(playerInv.getItem(2).typeId).toBe('minecraft:oak_log');
    });

    test('empty-hand sneak remove-all is ignored for functional inventories', () => {
        const playerInv = new Container({ size: 4 });
        const blockInv = new Container({ size: 3, items: {
            0: new ItemStack('minecraft:iron_ore', 8)
        }});
        const player = makePlayer(playerInv);
        const block = makeBlock(blockInv, 'minecraft:furnace');

        player.inputInfo.getButtonState.mockReturnValue(ButtonState.Pressed);
        vi.spyOn(quickFillContainer, 'isEnabledForPlayer').mockReturnValue(true);
        vi.spyOn(QuickFillClipboardController, 'get').mockReturnValue(undefined);

        const event = { player, block, itemStack: undefined, cancel: false };
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

    test('direct QuickFill uses the player ender inventory for ender chests', () => {
        const heldItem = new ItemStack('minecraft:stone');
        const playerInv = new Container({ size: 4, items: { 0: new ItemStack('minecraft:stone', 8) } });
        const enderInv = new Container({ size: 27 });
        const player = makePlayer(playerInv, enderInv);
        const block = makeBlock(undefined, 'minecraft:ender_chest');

        vi.spyOn(quickFillContainer, 'isEnabledForPlayer').mockReturnValue(true);
        vi.spyOn(QuickFillClipboardController, 'get').mockReturnValue(undefined);
        vi.spyOn(system, 'run').mockImplementation(callback => callback());

        const event = { player, block, itemStack: heldItem, cancel: false };
        quickFillContainer.onPlayerInteractWithBlock(event);

        expect(event.cancel).toBe(true);
        expect(enderInv.getItem(0).amount).toBe(8);
        expect(playerInv.getItem(0)).toBeUndefined();
    });

    test('ender chest clipboard actions use the player ender inventory', () => {
        const player = makePlayer(new Container({ size: 4 }), new Container({ size: 27 }));
        const block = makeBlock(undefined, 'minecraft:ender_chest');
        const clipboard = {};

        vi.spyOn(quickFillContainer, 'isEnabledForPlayer').mockReturnValue(true);
        vi.spyOn(QuickFillClipboardController, 'get').mockReturnValue(clipboard);
        const apply = vi.spyOn(QuickFillClipboardController, 'apply').mockImplementation(() => {});
        const copy = vi.spyOn(QuickFillClipboardController, 'copy').mockImplementation(() => {});
        vi.spyOn(system, 'run').mockImplementation(callback => callback());

        const enderInv = player.getComponent(EntityComponentTypes.EnderInventory).container;

        quickFillContainer.onPlayerInteractWithBlock({ player, block, itemStack: new ItemStack('minecraft:stone'), cancel: false });
        quickFillContainer.onPlayerBreakBlock({ player, block, cancel: false });

        expect(apply).toHaveBeenCalledWith(player, block, clipboard, false, enderInv);
        expect(copy).toHaveBeenCalledWith(player, block, enderInv);
    });

    test('direct QuickFill uses only entity cargo slots', () => {
        const heldItem = new ItemStack('minecraft:stone');
        const playerInv = new Container({ size: 4, items: {
            0: new ItemStack('minecraft:stone', 8)
        }});
        const entityInv = new Container({ size: 16, items: {
            0: new ItemStack('minecraft:red_carpet'),
            7: new ItemStack('minecraft:stone', 4)
        }});
        const player = makePlayer(playerInv);
        const entity = makeEntity(entityInv, 'minecraft:llama', true, 2);

        vi.spyOn(quickFillContainer, 'isEnabledForPlayer').mockReturnValue(true);
        vi.spyOn(QuickFillClipboardController, 'get').mockReturnValue(undefined);
        vi.spyOn(system, 'run').mockImplementation(callback => callback());

        const event = { player, target: entity, itemStack: heldItem, cancel: false };
        quickFillContainer.onPlayerInteractWithEntity(event);

        expect(event.cancel).toBe(true);
        expect(entityInv.getItem(0).typeId).toBe('minecraft:red_carpet');
        expect(entityInv.getItem(1).amount).toBe(8);
        expect(entityInv.getItem(7).amount).toBe(4);
        expect(playerInv.getItem(0)).toBeUndefined();
    });

    test('active clipboard does not intercept empty-hand entity interaction', () => {
        const player = makePlayer(new Container({ size: 4 }));
        const entity = makeEntity(new Container({ size: 16 }), 'minecraft:mule');
        const clipboard = {};

        vi.spyOn(quickFillContainer, 'isEnabledForPlayer').mockReturnValue(true);
        vi.spyOn(QuickFillClipboardController, 'get').mockReturnValue(clipboard);
        const apply = vi.spyOn(QuickFillClipboardController, 'apply').mockImplementation(() => {});

        const event = {
            player,
            target: entity,
            itemStack: undefined,
            cancel: false
        };

        quickFillContainer.onPlayerInteractWithEntity(event);

        expect(event.cancel).toBe(false);
        expect(apply).not.toHaveBeenCalled();
    });

    test('remove all uses only entity cargo slots', () => {
        const playerInv = new Container({ size: 6 });
        const entityInv = new Container({ size: 16, items: {
            0: new ItemStack('minecraft:red_carpet'),
            1: new ItemStack('minecraft:dirt', 8),
            7: new ItemStack('minecraft:stone', 4)
        }});
        const player = makePlayer(playerInv);
        const entity = makeEntity(entityInv, 'minecraft:llama', true, 2);

        player.inputInfo.getButtonState.mockReturnValue(ButtonState.Pressed);
        vi.spyOn(quickFillContainer, 'isEnabledForPlayer').mockReturnValue(true);
        vi.spyOn(QuickFillClipboardController, 'get').mockReturnValue(undefined);
        vi.spyOn(system, 'run').mockImplementation(callback => callback());

        const event = { player, target: entity, itemStack: undefined, cancel: false };

        quickFillContainer.onPlayerInteractWithEntity(event);

        expect(event.cancel).toBe(true);
        expect(entityInv.getItem(0).typeId).toBe('minecraft:red_carpet');
        expect(entityInv.getItem(1)).toBeUndefined();
        expect(entityInv.getItem(7).amount).toBe(4);
        expect(playerInv.getItem(0).typeId).toBe('minecraft:dirt');
    });

    test('clipboard paste routes through supported entity storage', () => {
        const player = makePlayer(new Container({ size: 4 }));
        const entityInv = new Container({ size: 16 });
        const entity = makeEntity(entityInv, 'minecraft:mule');
        const clipboard = {};

        vi.spyOn(quickFillContainer, 'isEnabledForPlayer').mockReturnValue(true);
        vi.spyOn(QuickFillClipboardController, 'get').mockReturnValue(clipboard);
        const apply = vi.spyOn(QuickFillClipboardController, 'apply').mockImplementation(() => {});
        vi.spyOn(system, 'run').mockImplementation(callback => callback());

        const event = {
            player,
            target: entity,
            itemStack: new ItemStack('minecraft:stone'),
            cancel: false
        };
        quickFillContainer.onPlayerInteractWithEntity(event);

        expect(event.cancel).toBe(true);
        expect(apply).toHaveBeenCalledWith(player, entity, clipboard, false, entityInv);
    });

    test.each([
        ['minecart_chest', 'minecraft:chest_minecart'],
        ['minecart_hopper', 'minecraft:hopper_minecart'],
        ['chest_boat', 'minecraft:chest_boat']
    ])('non-alive %s storage supports interaction', (containerType, typeId) => {
        const entityInv = new Container({ size: 27 });
        const entity = makeEntity(entityInv, typeId, false, 5, containerType);

        expect(QuickFillContainerPolicy.getInteractableEntityContainer(entity)).toBe(entityInv);
        expect(QuickFillContainerPolicy.getEntityContainer(entity)).toBeUndefined();
    });

    test('clipboard paste routes through non-alive entity storage', () => {
        const player = makePlayer(new Container({ size: 4 }));
        const entityInv = new Container({ size: 27 });
        const entity = makeEntity(entityInv, 'minecraft:chest_minecart', false, 5, 'minecart_chest');
        const clipboard = {};

        vi.spyOn(quickFillContainer, 'isEnabledForPlayer').mockReturnValue(true);
        vi.spyOn(QuickFillClipboardController, 'get').mockReturnValue(clipboard);
        const apply = vi.spyOn(QuickFillClipboardController, 'apply').mockImplementation(() => {});
        vi.spyOn(system, 'run').mockImplementation(callback => callback());

        const event = {
            player,
            target: entity,
            itemStack: new ItemStack('minecraft:stone'),
            cancel: false
        };

        quickFillContainer.onPlayerInteractWithEntity(event);

        expect(event.cancel).toBe(true);
        expect(apply).toHaveBeenCalledWith(player, entity, clipboard, false, entityInv);
    });

    test('empty-hand sneak removes all items from non-alive entity storage', () => {
        const playerInv = new Container({ size: 6 });
        const entityInv = new Container({ size: 27, items: {
            0: new ItemStack('minecraft:stone', 8),
            1: new ItemStack('minecraft:dirt', 16)
        }});
        const player = makePlayer(playerInv);
        const entity = makeEntity(entityInv, 'minecraft:chest_minecart', false, 5, 'minecart_chest');

        player.inputInfo.getButtonState.mockReturnValue(ButtonState.Pressed);
        vi.spyOn(quickFillContainer, 'isEnabledForPlayer').mockReturnValue(true);
        vi.spyOn(QuickFillClipboardController, 'get').mockReturnValue(undefined);
        vi.spyOn(system, 'run').mockImplementation(callback => callback());

        const event = { player, target: entity, itemStack: undefined, cancel: false };
        quickFillContainer.onPlayerInteractWithEntity(event);

        expect(event.cancel).toBe(true);
        expect(entityInv.emptySlotsCount).toBe(27);
        expect(playerInv.getItem(0).typeId).toBe('minecraft:stone');
        expect(playerInv.getItem(1).typeId).toBe('minecraft:dirt');
    });

    test('empty-hand interaction with non-alive storage is ignored by QuickFill', () => {
        const player = makePlayer(new Container({ size: 4 }));
        const entity = makeEntity(new Container({ size: 27 }), 'minecraft:chest_minecart', false, 5, 'minecart_chest');
        const clipboard = {};

        vi.spyOn(quickFillContainer, 'isEnabledForPlayer').mockReturnValue(true);
        vi.spyOn(QuickFillClipboardController, 'get').mockReturnValue(clipboard);
        const apply = vi.spyOn(QuickFillClipboardController, 'apply').mockImplementation(() => {});

        const event = { player, target: entity, cancel: false };

        quickFillContainer.onPlayerInteractWithEntity(event);

        expect(event.cancel).toBe(false);
        expect(apply).not.toHaveBeenCalled();
    });

    test('attacking supported entity storage copies it without applying damage', () => {
        const player = makePlayer(new Container({ size: 4 }));
        const entityInv = new Container({ size: 16 });
        const entity = makeEntity(entityInv, 'minecraft:llama');

        vi.spyOn(quickFillContainer, 'isEnabledForPlayer').mockReturnValue(true);
        const copy = vi.spyOn(QuickFillClipboardController, 'copy').mockImplementation(() => {});
        vi.spyOn(system, 'run').mockImplementation(callback => callback());

        const event = {
            hurtEntity: entity,
            damageSource: { damagingEntity: player },
            cancel: false
        };

        quickFillContainer.onEntityHurt(event);

        expect(event.cancel).toBe(true);
        expect(copy).toHaveBeenCalledWith(player, entity, entityInv);
    });

    test('projectile damage does not trigger entity clipboard copy', () => {
        const player = makePlayer(new Container({ size: 4 }));
        const entity = makeEntity(new Container({ size: 16 }), 'minecraft:donkey');

        const copy = vi.spyOn(QuickFillClipboardController, 'copy').mockImplementation(() => {});

        const event = {
            hurtEntity: entity,
            damageSource: { damagingEntity: player, damagingProjectile: {} },
            cancel: false
        };

        quickFillContainer.onEntityHurt(event);

        expect(event.cancel).toBe(false);
        expect(copy).not.toHaveBeenCalled();
    });

    test('clipboard copy feedback is content-agnostic', () => {
        const player = makePlayer(new Container({ size: 4 }));
        const message = '§7Quick Fill: copied container to clipboard.';

        QuickFillClipboardController.copy(player, makeBlock(new Container({ size: 3, items: { 0: new ItemStack('minecraft:iron_ore') } }), 'minecraft:furnace'));
        expect(player.onScreenDisplay.setActionBar).toHaveBeenLastCalledWith(message);

        QuickFillClipboardController.copy(player, makeBlock(new Container({ size: 3 }), 'minecraft:furnace'));
        expect(player.onScreenDisplay.setActionBar).toHaveBeenLastCalledWith(message);
    });

    test('clipboard feedback reports paste outcomes', () => {
        const player = makePlayer(new Container({ size: 4 }));

        QuickFillClipboardController.sendFeedback(player, { changedSlots: 0, skippedSlots: 2 }, false);
        expect(player.onScreenDisplay.setActionBar).toHaveBeenLastCalledWith('§7Quick Fill: no clipboard items pasted.');

        QuickFillClipboardController.sendFeedback(player, { changedSlots: 1, skippedSlots: 1 }, false);
        expect(player.onScreenDisplay.setActionBar).toHaveBeenLastCalledWith('§7Quick Fill: 1 clipboard slot not fully pasted.');

        QuickFillClipboardController.sendFeedback(player, { changedSlots: 1 }, false);
        expect(player.onScreenDisplay.setActionBar).toHaveBeenLastCalledWith('§7Quick Fill: pasted clipboard to container.');

        QuickFillClipboardController.sendFeedback(player, { changedSlots: 0 }, true);
        expect(player.onScreenDisplay.setActionBar).toHaveBeenLastCalledWith('§7Quick Fill: no matching items removed.');
    });
});
