import { beforeEach, describe, expect, test, vi } from "vitest";
import { BlockComponentTypes, ButtonState, EntityComponentTypes, GameMode, Player } from "@minecraft/server";
import { scheduler as mockScheduler } from "@forestoflight/minecraft-vitest-mocks";
import { QuickFillPlayer } from "../../../../../../Canopy[BP]/scripts/src/classes/quickfill/QuickFillPlayer";
import { BulkMode } from "../../../../../../Canopy[BP]/scripts/src/classes/quickfill/Modes/BulkMode";
import { ClipboardMode } from "../../../../../../Canopy[BP]/scripts/src/classes/quickfill/Modes/ClipboardMode";
import { containerOf, stack } from "./Modes/helpers";

const blockWith = (container, typeId = 'minecraft:chest') => ({
    typeId,
    localizationKey: `tile.${typeId.replace('minecraft:', '')}.name`,
    getComponent: vi.fn(type => type === BlockComponentTypes.Inventory && container ? { container } : void 0)
});

const entityWith = (container, typeId = 'minecraft:chest_minecart') => ({
    typeId,
    localizationKey: `entity.${typeId.replace('minecraft:', '')}.name`,
    getComponent: vi.fn(type => type === EntityComponentTypes.Inventory && container ? { container } : void 0)
});

const BANNED_BLOCK_IDS = ['minecraft:beacon', 'minecraft:jukebox', 'minecraft:lectern', 'minecraft:chiseled_bookshelf'];

const stubMode = (mode, { configurable = false } = {}) => {
    for (const method of ['destroy', 'onFillInteraction', 'onTakeInteraction', 'onConfigureInteraction'])
        vi.spyOn(mode, method).mockImplementation(() => void 0);
    vi.spyOn(mode, 'hasConfigureInteraction').mockReturnValue(configurable);
    return mode;
};

const makePlayer = ({ gameMode = GameMode.Survival, sneaking = false } = {}) => {
    const player = new Player();
    player.getGameMode.mockReturnValue(gameMode);
    player.inputInfo.getButtonState.mockReturnValue(sneaking ? ButtonState.Pressed : ButtonState.Released);
    return player;
};

const makeQuickFillPlayer = (playerOptions, modeOptions) => {
    const player = makePlayer(playerOptions);
    const quickFillPlayer = new QuickFillPlayer(player);
    quickFillPlayer.setMode(ClipboardMode);
    stubMode(quickFillPlayer.mode, modeOptions);
    return quickFillPlayer;
};

const flushScheduledRuns = () => mockScheduler.advanceTicks(1);

describe('QuickFillPlayer', () => {
    describe('mode management', () => {
        test('starts in bulk mode', () => {
            expect(new QuickFillPlayer(makePlayer()).mode).toBeInstanceOf(BulkMode);
        });

        test('setMode replaces the mode with a new instance of the given class for the same player', () => {
            const player = makePlayer();
            const quickFillPlayer = new QuickFillPlayer(player);

            quickFillPlayer.setMode(ClipboardMode);

            expect(quickFillPlayer.mode).toBeInstanceOf(ClipboardMode);
            expect(quickFillPlayer.mode.player).toBe(player);
        });

        test('setMode destroys the previous mode first', () => {
            const quickFillPlayer = new QuickFillPlayer(makePlayer());
            const previousMode = quickFillPlayer.mode;
            vi.spyOn(previousMode, 'destroy');

            quickFillPlayer.setMode(ClipboardMode);

            expect(previousMode.destroy).toHaveBeenCalledTimes(1);
        });

        test('destroy destroys the current mode', () => {
            const quickFillPlayer = makeQuickFillPlayer();

            quickFillPlayer.destroy();

            expect(quickFillPlayer.mode.destroy).toHaveBeenCalledTimes(1);
        });
    });

    describe('onInteractWithBlock()', () => {
        let container;

        beforeEach(() => {
            mockScheduler.reset();
            container = containerOf(3, { 0: stack('stone') });
        });

        const interact = (quickFillPlayer, options = {}) => {
            const block = options.block ?? blockWith(container);
            const itemStack = 'itemStack' in options ? options.itemStack : stack('oak_log');
            const event = { block, itemStack, cancel: false, isFirstEvent: options.isFirstEvent ?? true };
            quickFillPlayer.onInteractWithBlock(event);
            return event;
        };

        test.each(BANNED_BLOCK_IDS)('ignores %s so its normal interaction still happens', (typeId) => {
            const quickFillPlayer = makeQuickFillPlayer();

            const event = interact(quickFillPlayer, { block: blockWith(container, typeId) });
            flushScheduledRuns();

            expect(event.cancel).toBe(false);
            expect(quickFillPlayer.mode.onFillInteraction).not.toHaveBeenCalled();
        });

        test('fills a crafter through its recipe processing grid', () => {
            const quickFillPlayer = makeQuickFillPlayer();
            const recipeProcessing = { inputSlotCount: 9, getInputItem: vi.fn(() => void 0), getInputSlotEnabled: vi.fn(() => true) };
            const crafter = {
                typeId: 'minecraft:crafter',
                localizationKey: 'tile.crafter.name',
                getComponent: vi.fn(type => type === BlockComponentTypes.Inventory ? void 0 : recipeProcessing)
            };

            const event = interact(quickFillPlayer, { block: crafter });
            flushScheduledRuns();

            expect(event.cancel).toBe(true);
            const [target] = quickFillPlayer.mode.onFillInteraction.mock.calls[0];
            expect(target.size).toBe(9);
        });

        test('ignores blocks without an inventory', () => {
            const quickFillPlayer = makeQuickFillPlayer();

            const event = interact(quickFillPlayer, { block: blockWith(void 0, 'minecraft:stone') });
            flushScheduledRuns();

            expect(event.cancel).toBe(false);
            expect(quickFillPlayer.mode.onFillInteraction).not.toHaveBeenCalled();
        });

        test.each([false, true])('only acts on the first of several same-tick interact events (sneaking: %s)', (sneaking) => {
            const quickFillPlayer = makeQuickFillPlayer({ sneaking });
            const mode = quickFillPlayer.mode;

            const events = [interact(quickFillPlayer), interact(quickFillPlayer, { isFirstEvent: false }), interact(quickFillPlayer, { isFirstEvent: false })];
            flushScheduledRuns();

            expect(mode.onFillInteraction.mock.calls.length + mode.onTakeInteraction.mock.calls.length).toBe(1);
            expect(events.every(event => event.cancel)).toBe(true);
        });

        test('ignores interactions with an empty hand', () => {
            const quickFillPlayer = makeQuickFillPlayer();

            const event = interact(quickFillPlayer, { itemStack: void 0 });
            flushScheduledRuns();

            expect(event.cancel).toBe(false);
            expect(quickFillPlayer.mode.onFillInteraction).not.toHaveBeenCalled();
            expect(quickFillPlayer.mode.onTakeInteraction).not.toHaveBeenCalled();
        });

        test('cancels the interaction so the container does not open', () => {
            const quickFillPlayer = makeQuickFillPlayer();

            expect(interact(quickFillPlayer).cancel).toBe(true);
        });

        test('defers the mode interaction to the next tick instead of running inside the before event', () => {
            const quickFillPlayer = makeQuickFillPlayer();

            interact(quickFillPlayer);
            expect(quickFillPlayer.mode.onFillInteraction).not.toHaveBeenCalled();

            flushScheduledRuns();
            expect(quickFillPlayer.mode.onFillInteraction).toHaveBeenCalledTimes(1);
        });

        test('fills with the held item when not sneaking', () => {
            const quickFillPlayer = makeQuickFillPlayer();
            const heldItemStack = stack('oak_log');

            interact(quickFillPlayer, { itemStack: heldItemStack });
            flushScheduledRuns();

            expect(quickFillPlayer.mode.onFillInteraction).toHaveBeenCalledWith(container, heldItemStack, 'tile.chest.name');
            expect(quickFillPlayer.mode.onTakeInteraction).not.toHaveBeenCalled();
        });

        test('takes with the held item when sneaking in survival', () => {
            const quickFillPlayer = makeQuickFillPlayer({ sneaking: true });
            const heldItemStack = stack('oak_log');

            interact(quickFillPlayer, { itemStack: heldItemStack });
            flushScheduledRuns();

            expect(quickFillPlayer.mode.onTakeInteraction).toHaveBeenCalledWith(container, heldItemStack, 'tile.chest.name');
            expect(quickFillPlayer.mode.onFillInteraction).not.toHaveBeenCalled();
            expect(container.clearAll).not.toHaveBeenCalled();
        });

        test('takes when sneaking in adventure mode', () => {
            const quickFillPlayer = makeQuickFillPlayer({ gameMode: GameMode.Adventure, sneaking: true });

            interact(quickFillPlayer);
            flushScheduledRuns();

            expect(quickFillPlayer.mode.onTakeInteraction).toHaveBeenCalledTimes(1);
            expect(container.clearAll).not.toHaveBeenCalled();
        });

        test('clears the container instead of taking when sneaking in creative', () => {
            const quickFillPlayer = makeQuickFillPlayer({ gameMode: GameMode.Creative, sneaking: true });

            interact(quickFillPlayer);
            flushScheduledRuns();

            expect(container.clearAll).toHaveBeenCalledTimes(1);
            expect(quickFillPlayer.mode.onTakeInteraction).not.toHaveBeenCalled();
            expect(quickFillPlayer.mode.onFillInteraction).not.toHaveBeenCalled();
        });

        test('fills when not sneaking in creative', () => {
            const quickFillPlayer = makeQuickFillPlayer({ gameMode: GameMode.Creative });

            interact(quickFillPlayer);
            flushScheduledRuns();

            expect(quickFillPlayer.mode.onFillInteraction).toHaveBeenCalledTimes(1);
            expect(container.clearAll).not.toHaveBeenCalled();
        });

        test('reads the sneak state when the deferred action runs, not when the event fires', () => {
            const quickFillPlayer = makeQuickFillPlayer();
            interact(quickFillPlayer);

            quickFillPlayer.player.inputInfo.getButtonState.mockReturnValue(ButtonState.Pressed);
            flushScheduledRuns();

            expect(quickFillPlayer.mode.onTakeInteraction).toHaveBeenCalledTimes(1);
        });

        test('uses the player\'s current mode', () => {
            const quickFillPlayer = makeQuickFillPlayer();
            interact(quickFillPlayer);

            quickFillPlayer.setMode(ClipboardMode);
            const newMode = stubMode(quickFillPlayer.mode);
            flushScheduledRuns();

            expect(newMode.onFillInteraction).toHaveBeenCalledTimes(1);
        });
    });

    describe('onInteractWithEntity()', () => {
        let container;

        beforeEach(() => {
            mockScheduler.reset();
            container = containerOf(3, { 0: stack('stone') });
        });

        const interact = (quickFillPlayer, options = {}) => {
            const target = options.target ?? entityWith(container);
            const itemStack = 'itemStack' in options ? options.itemStack : stack('oak_log');
            const event = { target, itemStack, cancel: false };
            quickFillPlayer.onInteractWithEntity(event);
            return event;
        };

        test('ignores players so their normal interaction still happens', () => {
            const quickFillPlayer = makeQuickFillPlayer();

            const event = interact(quickFillPlayer, { target: entityWith(container, 'minecraft:player') });
            flushScheduledRuns();

            expect(event.cancel).toBe(false);
            expect(quickFillPlayer.mode.onFillInteraction).not.toHaveBeenCalled();
        });

        test('ignores entities without an inventory', () => {
            const quickFillPlayer = makeQuickFillPlayer();

            const event = interact(quickFillPlayer, { target: entityWith(void 0, 'minecraft:cow') });
            flushScheduledRuns();

            expect(event.cancel).toBe(false);
            expect(quickFillPlayer.mode.onFillInteraction).not.toHaveBeenCalled();
        });

        test('ignores interactions with an empty hand', () => {
            const quickFillPlayer = makeQuickFillPlayer();

            const event = interact(quickFillPlayer, { itemStack: void 0 });
            flushScheduledRuns();

            expect(event.cancel).toBe(false);
            expect(quickFillPlayer.mode.onFillInteraction).not.toHaveBeenCalled();
            expect(quickFillPlayer.mode.onTakeInteraction).not.toHaveBeenCalled();
        });

        test('cancels the interaction and defers the mode interaction to the next tick', () => {
            const quickFillPlayer = makeQuickFillPlayer();

            const event = interact(quickFillPlayer);
            expect(event.cancel).toBe(true);
            expect(quickFillPlayer.mode.onFillInteraction).not.toHaveBeenCalled();

            flushScheduledRuns();
            expect(quickFillPlayer.mode.onFillInteraction).toHaveBeenCalledTimes(1);
        });

        test('acts on every interact event', () => {
            const quickFillPlayer = makeQuickFillPlayer();

            interact(quickFillPlayer);
            interact(quickFillPlayer);
            flushScheduledRuns();

            expect(quickFillPlayer.mode.onFillInteraction).toHaveBeenCalledTimes(2);
        });

        test('fills with the held item when not sneaking', () => {
            const quickFillPlayer = makeQuickFillPlayer();
            const heldItemStack = stack('oak_log');

            interact(quickFillPlayer, { itemStack: heldItemStack });
            flushScheduledRuns();

            expect(quickFillPlayer.mode.onFillInteraction).toHaveBeenCalledWith(container, heldItemStack, 'entity.chest_minecart.name');
            expect(quickFillPlayer.mode.onTakeInteraction).not.toHaveBeenCalled();
        });

        test('takes with the held item when sneaking in survival', () => {
            const quickFillPlayer = makeQuickFillPlayer({ sneaking: true });
            const heldItemStack = stack('oak_log');

            interact(quickFillPlayer, { itemStack: heldItemStack });
            flushScheduledRuns();

            expect(quickFillPlayer.mode.onTakeInteraction).toHaveBeenCalledWith(container, heldItemStack, 'entity.chest_minecart.name');
            expect(container.clearAll).not.toHaveBeenCalled();
        });

        test('clears the container instead of taking when sneaking in creative', () => {
            const quickFillPlayer = makeQuickFillPlayer({ gameMode: GameMode.Creative, sneaking: true });

            interact(quickFillPlayer);
            flushScheduledRuns();

            expect(container.clearAll).toHaveBeenCalledTimes(1);
            expect(quickFillPlayer.mode.onTakeInteraction).not.toHaveBeenCalled();
            expect(quickFillPlayer.mode.onFillInteraction).not.toHaveBeenCalled();
        });
    });

    describe('onAttackEntity()', () => {
        let container;

        beforeEach(() => {
            mockScheduler.reset();
            container = containerOf(3, { 0: stack('stone') });
        });

        const attack = (quickFillPlayer, options = {}) => {
            const target = options.target ?? entityWith(container);
            const itemStack = 'itemStack' in options ? options.itemStack : stack('golden_sword');
            const event = { target, itemStack, cancel: false };
            quickFillPlayer.onAttackEntity(event);
            return event;
        };

        test.each([GameMode.Survival, GameMode.Adventure, GameMode.Creative])('cancels the attack and opens the configure interaction next tick in %s', (gameMode) => {
            const quickFillPlayer = makeQuickFillPlayer({ gameMode }, { configurable: true });

            const event = attack(quickFillPlayer);
            expect(quickFillPlayer.mode.onConfigureInteraction).not.toHaveBeenCalled();
            flushScheduledRuns();

            expect(event.cancel).toBe(true);
            expect(quickFillPlayer.mode.onConfigureInteraction).toHaveBeenCalledWith(container, 'entity.chest_minecart.name');
        });

        test('lets the attack happen when the mode has no configure interaction', () => {
            const quickFillPlayer = makeQuickFillPlayer({}, { configurable: false });

            const event = attack(quickFillPlayer);
            flushScheduledRuns();

            expect(event.cancel).toBe(false);
            expect(quickFillPlayer.mode.onConfigureInteraction).not.toHaveBeenCalled();
        });

        test('lets players be attacked normally', () => {
            const quickFillPlayer = makeQuickFillPlayer({}, { configurable: true });

            const event = attack(quickFillPlayer, { target: entityWith(container, 'minecraft:player') });
            flushScheduledRuns();

            expect(event.cancel).toBe(false);
            expect(quickFillPlayer.mode.onConfigureInteraction).not.toHaveBeenCalled();
        });

        test('lets entities without an inventory be attacked normally', () => {
            const quickFillPlayer = makeQuickFillPlayer({}, { configurable: true });

            const event = attack(quickFillPlayer, { target: entityWith(void 0, 'minecraft:cow') });
            flushScheduledRuns();

            expect(event.cancel).toBe(false);
            expect(quickFillPlayer.mode.onConfigureInteraction).not.toHaveBeenCalled();
        });

        test('lets the attack happen when the player is not holding an item', () => {
            const quickFillPlayer = makeQuickFillPlayer({}, { configurable: true });

            const event = attack(quickFillPlayer, { itemStack: void 0 });
            flushScheduledRuns();

            expect(event.cancel).toBe(false);
            expect(quickFillPlayer.mode.onConfigureInteraction).not.toHaveBeenCalled();
        });
    });

    describe('onBreakBlock()', () => {
        let container;

        beforeEach(() => {
            mockScheduler.reset();
            container = containerOf(3, { 0: stack('stone') });
        });

        const breakBlock = (quickFillPlayer, options = {}) => {
            const block = options.block ?? blockWith(container);
            const itemStack = 'itemStack' in options ? options.itemStack : stack('golden_sword');
            const event = { block, itemStack, cancel: false };
            quickFillPlayer.onBreakBlock(event);
            return event;
        };

        test('cancels the break and opens the configure interaction next tick in creative', () => {
            const quickFillPlayer = makeQuickFillPlayer({ gameMode: GameMode.Creative }, { configurable: true });

            const event = breakBlock(quickFillPlayer);
            expect(quickFillPlayer.mode.onConfigureInteraction).not.toHaveBeenCalled();
            flushScheduledRuns();

            expect(event.cancel).toBe(true);
            expect(quickFillPlayer.mode.onConfigureInteraction).toHaveBeenCalledWith(container, 'tile.chest.name');
        });

        test('lets the break happen when the mode has no configure interaction', () => {
            const quickFillPlayer = makeQuickFillPlayer({ gameMode: GameMode.Creative }, { configurable: false });

            const event = breakBlock(quickFillPlayer);
            flushScheduledRuns();

            expect(event.cancel).toBe(false);
            expect(quickFillPlayer.mode.onConfigureInteraction).not.toHaveBeenCalled();
        });

        test.each([GameMode.Survival, GameMode.Adventure])('does nothing in %s', (gameMode) => {
            const quickFillPlayer = makeQuickFillPlayer({ gameMode }, { configurable: true });

            const event = breakBlock(quickFillPlayer);
            flushScheduledRuns();

            expect(event.cancel).toBe(false);
            expect(quickFillPlayer.mode.onConfigureInteraction).not.toHaveBeenCalled();
        });

        test.each(BANNED_BLOCK_IDS)('lets %s break normally', (typeId) => {
            const quickFillPlayer = makeQuickFillPlayer({ gameMode: GameMode.Creative }, { configurable: true });

            const event = breakBlock(quickFillPlayer, { block: blockWith(container, typeId) });
            flushScheduledRuns();

            expect(event.cancel).toBe(false);
            expect(quickFillPlayer.mode.onConfigureInteraction).not.toHaveBeenCalled();
        });

        test('lets blocks without an inventory break normally', () => {
            const quickFillPlayer = makeQuickFillPlayer({ gameMode: GameMode.Creative }, { configurable: true });

            const event = breakBlock(quickFillPlayer, { block: blockWith(void 0, 'minecraft:stone') });
            flushScheduledRuns();

            expect(event.cancel).toBe(false);
            expect(quickFillPlayer.mode.onConfigureInteraction).not.toHaveBeenCalled();
        });

        test('lets the break happen when the player is not holding an item', () => {
            const quickFillPlayer = makeQuickFillPlayer({ gameMode: GameMode.Creative }, { configurable: true });

            const event = breakBlock(quickFillPlayer, { itemStack: void 0 });
            flushScheduledRuns();

            expect(event.cancel).toBe(false);
            expect(quickFillPlayer.mode.onConfigureInteraction).not.toHaveBeenCalled();
        });
    });

    describe('onStartBreakingBlock()', () => {
        let container;

        beforeEach(() => {
            container = containerOf(3, { 0: stack('stone') });
        });

        test('opens the configure interaction immediately in survival', () => {
            const quickFillPlayer = makeQuickFillPlayer({}, { configurable: true });

            quickFillPlayer.onStartBreakingBlock({ block: blockWith(container), heldItemStack: stack('oak_log') });

            expect(quickFillPlayer.mode.onConfigureInteraction).toHaveBeenCalledWith(container, 'tile.chest.name');
        });

        test('does nothing with an empty hand', () => {
            const quickFillPlayer = makeQuickFillPlayer({}, { configurable: true });

            quickFillPlayer.onStartBreakingBlock({ block: blockWith(container), heldItemStack: void 0 });

            expect(quickFillPlayer.mode.onConfigureInteraction).not.toHaveBeenCalled();
        });

        test('opens the configure interaction in adventure', () => {
            const quickFillPlayer = makeQuickFillPlayer({ gameMode: GameMode.Adventure }, { configurable: true });

            quickFillPlayer.onStartBreakingBlock({ block: blockWith(container), heldItemStack: stack('oak_log') });

            expect(quickFillPlayer.mode.onConfigureInteraction).toHaveBeenCalledWith(container, 'tile.chest.name');
        });

        test('does nothing in creative, where onBreakBlock handles it instead', () => {
            const quickFillPlayer = makeQuickFillPlayer({ gameMode: GameMode.Creative }, { configurable: true });

            quickFillPlayer.onStartBreakingBlock({ block: blockWith(container), heldItemStack: stack('oak_log') });

            expect(quickFillPlayer.mode.onConfigureInteraction).not.toHaveBeenCalled();
        });

        test('does nothing when the mode has no configure interaction', () => {
            const quickFillPlayer = makeQuickFillPlayer({}, { configurable: false });

            quickFillPlayer.onStartBreakingBlock({ block: blockWith(container), heldItemStack: stack('oak_log') });

            expect(quickFillPlayer.mode.onConfigureInteraction).not.toHaveBeenCalled();
        });

        test.each(BANNED_BLOCK_IDS)('ignores %s', (typeId) => {
            const quickFillPlayer = makeQuickFillPlayer({}, { configurable: true });

            quickFillPlayer.onStartBreakingBlock({ block: blockWith(container, typeId) });

            expect(quickFillPlayer.mode.onConfigureInteraction).not.toHaveBeenCalled();
        });

        test('ignores blocks without an inventory', () => {
            const quickFillPlayer = makeQuickFillPlayer({}, { configurable: true });

            quickFillPlayer.onStartBreakingBlock({ block: blockWith(void 0, 'minecraft:stone') });

            expect(quickFillPlayer.mode.onConfigureInteraction).not.toHaveBeenCalled();
        });
    });
});
