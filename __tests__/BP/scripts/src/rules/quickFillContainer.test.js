import { ButtonState, system } from "@minecraft/server";
import { QuickFillClipboardController } from "../../../../../Canopy[BP]/scripts/src/classes/QuickFillClipboardController";
import { quickFillContainer } from "../../../../../Canopy[BP]/scripts/src/rules/quickFillContainer";
import { expect, test, describe, vi, afterEach } from "vitest";

describe('quickFillContainer', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    function makeItemStack({
        typeId = 'minecraft:stone',
        amount = 1,
        maxAmount = 64
    } = {}) {
        const itemStack = {
            typeId,
            amount,
            maxAmount,
            localizationKey: `item.${typeId}`
        };

        itemStack.clone = vi.fn(() => makeItemStack({
            typeId: itemStack.typeId,
            amount: itemStack.amount,
            maxAmount: itemStack.maxAmount
        }));

        return itemStack;
    }

    function makeContainer(size, contents = []) {
        const slots = new Array(size).fill(void 0);

        for (const [slot, item] of contents)
            slots[slot] = item;

        return {
            size,
            slots,

            get emptySlotsCount() {
                return slots.filter(slot => !slot).length;
            },

            getItem: vi.fn(slot => slots[slot]),

            setItem: vi.fn((slot, item) => {
                slots[slot] = item ?? void 0;
            }),

            addItem: vi.fn(item => {
                for (let slot = 0; slot < slots.length; slot++) {
                    if (!slots[slot]) {
                        slots[slot] = item;
                        return;
                    }
                }

                return item;
            })
        };
    }

    function makePlayer(playerInv) {
        return {
            getComponent: vi.fn(component => {
                if (component === 'inventory')
                    return { container: playerInv };
            }),
            inputInfo: {
                getButtonState: vi.fn()
            },
            onScreenDisplay: {
                setActionBar: vi.fn()
            }
        };
    }

    function makeBlock(blockInv, typeId = 'minecraft:chest') {
        return {
            typeId,
            localizationKey: `tile.${typeId}`,
            getComponent: vi.fn(component => {
                if (component === 'inventory')
                    return { container: blockInv };
            })
        };
    }

    test('survival QuickFill transfers matching owned items into the container', () => {
        const heldItem = makeItemStack();

        const playerInv = makeContainer(4, [
            [0, makeItemStack({ amount: 8 })],
            [1, makeItemStack({
                typeId: 'minecraft:dirt',
                amount: 64
            })],
            [2, makeItemStack({ amount: 3 })]
        ]);

        const blockInv = makeContainer(4);
        const player = makePlayer(playerInv);
        const block = makeBlock(blockInv);

        vi.spyOn(
            quickFillContainer,
            'sendFeedbackMessage'
        ).mockImplementation(() => {});

        quickFillContainer.transferToContainer(
            player,
            block,
            heldItem
        );

        expect(blockInv.slots[0]?.amount).toBe(8);
        expect(blockInv.slots[1]?.amount).toBe(3);
        expect(playerInv.slots[0]).toBeUndefined();
        expect(playerInv.slots[2]).toBeUndefined();
        expect(playerInv.slots[1]?.typeId).toBe('minecraft:dirt');
    });

    test('reverse QuickFill pulls matching items out of the container', () => {
        const heldItem = makeItemStack();

        const playerInv = makeContainer(4);
        const blockInv = makeContainer(4, [
            [0, makeItemStack({ amount: 5 })],
            [1, makeItemStack({
                typeId: 'minecraft:dirt',
                amount: 32
            })],
            [2, makeItemStack({ amount: 7 })]
        ]);

        const player = makePlayer(playerInv);
        const block = makeBlock(blockInv);

        vi.spyOn(
            quickFillContainer,
            'sendFeedbackMessage'
        ).mockImplementation(() => {});

        quickFillContainer.transferToPlayer(
            player,
            block,
            heldItem
        );

        expect(playerInv.slots[0]?.amount).toBe(5);
        expect(playerInv.slots[1]?.amount).toBe(7);
        expect(blockInv.slots[0]).toBeUndefined();
        expect(blockInv.slots[2]).toBeUndefined();
        expect(blockInv.slots[1]?.typeId).toBe('minecraft:dirt');
    });

    test('creative QuickFill fills every container slot with the held item', () => {
        const heldItem = makeItemStack({
            typeId: 'minecraft:ender_pearl',
            maxAmount: 16
        });

        const blockInv = makeContainer(3, [
            [1, makeItemStack({
                typeId: 'minecraft:dirt',
                amount: 32
            })]
        ]);

        const player = makePlayer(makeContainer(4));
        const block = makeBlock(blockInv);

        vi.spyOn(
            quickFillContainer,
            'sendFeedbackMessage'
        ).mockImplementation(() => {});

        quickFillContainer.fillCreative(
            player,
            block,
            heldItem
        );

        expect(
            blockInv.slots.every(
                item => item?.typeId === 'minecraft:ender_pearl'
            )
        ).toBe(true);

        expect(
            blockInv.slots.every(item => item?.amount === 16)
        ).toBe(true);
    });

    test('creative QuickFill does not consume the held item or player inventory', () => {
        const heldItem = makeItemStack({ amount: 1 });

        const ownedStack = makeItemStack({ amount: 12 });
        const playerInv = makeContainer(4, [
            [0, ownedStack]
        ]);

        const blockInv = makeContainer(3);
        const player = makePlayer(playerInv);
        const block = makeBlock(blockInv);

        vi.spyOn(
            quickFillContainer,
            'sendFeedbackMessage'
        ).mockImplementation(() => {});

        quickFillContainer.fillCreative(
            player,
            block,
            heldItem
        );

        expect(heldItem.amount).toBe(1);
        expect(playerInv.slots[0]).toBe(ownedStack);
        expect(playerInv.slots[0].amount).toBe(12);
    });

    test('creative QuickFill skips a destination slot that rejects the item', () => {
        const heldItem = makeItemStack();
        const blockInv = makeContainer(3);

        blockInv.setItem.mockImplementation((slot, item) => {
            if (slot === 1)
                throw new Error('slot rejected item');

            blockInv.slots[slot] = item;
        });

        const player = makePlayer(makeContainer(4));
        const block = makeBlock(blockInv);

        vi.spyOn(
            quickFillContainer,
            'sendFeedbackMessage'
        ).mockImplementation(() => {});

        quickFillContainer.fillCreative(
            player,
            block,
            heldItem
        );

        expect(blockInv.slots[0]?.amount).toBe(64);
        expect(blockInv.slots[1]).toBeUndefined();
        expect(blockInv.slots[2]?.amount).toBe(64);
    });
    test('empty-hand interaction is ignored by QuickFill', () => {
        const player = makePlayer(makeContainer(4));
        const block = makeBlock(makeContainer(27));

        vi.spyOn(
            quickFillContainer,
            'isEnabledForPlayer'
        ).mockReturnValue(true);

        const event = {
            player,
            block,
            itemStack: undefined,
            cancel: false
        };

        quickFillContainer.onPlayerInteractWithBlock(event);

        expect(event.cancel).toBe(false);
    });

    test('shulker boxes cannot be QuickFilled with another shulker box', () => {
        const player = makePlayer(makeContainer(4));
        const block = makeBlock(
            makeContainer(27),
            'minecraft:shulker_box'
        );

        const heldItem = makeItemStack({
            typeId: 'minecraft:red_shulker_box'
        });

        vi.spyOn(
            quickFillContainer,
            'isEnabledForPlayer'
        ).mockReturnValue(true);

        const event = {
            player,
            block,
            itemStack: heldItem,
            cancel: false
        };

        quickFillContainer.onPlayerInteractWithBlock(event);

        expect(event.cancel).toBe(false);
    });
    test('creative QuickFill does not blindly fill functional inventories', () => {
        const heldItem = makeItemStack();
        const blockInv = makeContainer(3);
        const player = makePlayer(makeContainer(4));
        const block = makeBlock(blockInv, 'minecraft:furnace');

        vi.spyOn(
            quickFillContainer,
            'sendFeedbackMessage'
        ).mockImplementation(() => {});

        quickFillContainer.fillCreative(
            player,
            block,
            heldItem
        );

        expect(
            blockInv.slots.every(slot => slot === undefined)
        ).toBe(true);

        expect(blockInv.setItem).not.toHaveBeenCalled();
    });
    test('sneak + break deactivates an active clipboard', () => {
        const player = makePlayer(makeContainer(4));
        const block = makeBlock(makeContainer(27));

        player.inputInfo.getButtonState.mockReturnValue(
            ButtonState.Pressed
        );

        vi.spyOn(
            quickFillContainer,
            'isEnabledForPlayer'
        ).mockReturnValue(true);

        vi.spyOn(
            QuickFillClipboardController,
            'get'
        ).mockReturnValue({});

        const deactivate = vi.spyOn(
            QuickFillClipboardController,
            'deactivate'
        ).mockReturnValue(true);

        const copy = vi.spyOn(
            QuickFillClipboardController,
            'copy'
        ).mockImplementation(() => {});

        vi.spyOn(system, 'run').mockImplementation(callback => callback());

        const event = { player, block, cancel: false };

        quickFillContainer.onPlayerBreakBlock(event);

        expect(event.cancel).toBe(true);
        expect(deactivate).toHaveBeenCalledWith(player);
        expect(copy).not.toHaveBeenCalled();
    });

    test('sneak + break is not intercepted without an active clipboard', () => {
        const player = makePlayer(makeContainer(4));
        const block = makeBlock(makeContainer(27));

        player.inputInfo.getButtonState.mockReturnValue(
            ButtonState.Pressed
        );

        vi.spyOn(
            quickFillContainer,
            'isEnabledForPlayer'
        ).mockReturnValue(true);

        vi.spyOn(
            QuickFillClipboardController,
            'get'
        ).mockReturnValue(undefined);

        const deactivate = vi.spyOn(
            QuickFillClipboardController,
            'deactivate'
        ).mockImplementation(() => {});

        const copy = vi.spyOn(
            QuickFillClipboardController,
            'copy'
        ).mockImplementation(() => {});

        vi.spyOn(system, 'run').mockImplementation(callback => callback());

        const event = { player, block, cancel: false };

        quickFillContainer.onPlayerBreakBlock(event);

        expect(event.cancel).toBe(false);
        expect(deactivate).not.toHaveBeenCalled();
        expect(copy).not.toHaveBeenCalled();
    });

    test('clipboard paste reports when nothing can be applied', () => {
        const player = makePlayer(makeContainer(4));

        QuickFillClipboardController.sendFeedback(
            player,
            { changedSlots: 0 },
            false
        );

        expect(
            player.onScreenDisplay.setActionBar
        ).toHaveBeenCalledWith(
            '§7Quick Fill: nothing to apply.'
        );
    });

    test('clipboard remove reports when nothing can be removed', () => {
        const player = makePlayer(makeContainer(4));

        QuickFillClipboardController.sendFeedback(
            player,
            { changedSlots: 0 },
            true
        );

        expect(
            player.onScreenDisplay.setActionBar
        ).toHaveBeenCalledWith(
            '§7Quick Fill: nothing to remove.'
        );
    });
});