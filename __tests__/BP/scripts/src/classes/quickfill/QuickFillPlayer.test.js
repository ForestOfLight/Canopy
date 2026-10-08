import { beforeEach, describe, expect, test, vi } from "vitest";
import { BlockComponentTypes, ButtonState, GameMode, Player } from "@minecraft/server";
import { scheduler as mockScheduler } from "@forestoflight/minecraft-vitest-mocks";
import { QuickFillPlayer } from "../../../../../../Canopy[BP]/scripts/src/classes/quickfill/QuickFillPlayer";
import { BulkMode } from "../../../../../../Canopy[BP]/scripts/src/classes/quickfill/Modes/BulkMode";
import { ClipboardMode } from "../../../../../../Canopy[BP]/scripts/src/classes/quickfill/Modes/ClipboardMode";
import { containerOf, stack } from "./Modes/helpers";

const blockWith = (container, typeId = 'minecraft:chest') => ({
    typeId,
    getComponent: vi.fn(type => type === BlockComponentTypes.Inventory && container ? { container } : void 0)
});

const fakeMode = ({ configurable = false } = {}) => ({
    destroy: vi.fn(),
    onFillInteraction: vi.fn(),
    onGrabInteraction: vi.fn(),
    onConfigureInteraction: vi.fn(),
    hasConfigureInteraction: vi.fn(() => configurable)
});

const makePlayer = ({ gameMode = GameMode.Survival, sneaking = false } = {}) => {
    const player = new Player();
    player.getGameMode.mockReturnValue(gameMode);
    player.inputInfo.getButtonState.mockReturnValue(sneaking ? ButtonState.Pressed : ButtonState.Released);
    return player;
};

const makeQuickFillPlayer = (playerOptions, modeOptions) => {
    const player = makePlayer(playerOptions);
    const quickFillPlayer = new QuickFillPlayer(player);
    quickFillPlayer.mode = fakeMode(modeOptions);
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
            const previousMode = fakeMode();
            quickFillPlayer.mode = previousMode;

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
            const event = { block, itemStack, cancel: false };
            quickFillPlayer.onInteractWithBlock(event);
            return event;
        };

        test.each(['minecraft:beacon', 'minecraft:jukebox', 'minecraft:lectern'])('ignores %s so its normal interaction still happens', (typeId) => {
            const quickFillPlayer = makeQuickFillPlayer();

            const event = interact(quickFillPlayer, { block: blockWith(container, typeId) });
            flushScheduledRuns();

            expect(event.cancel).toBe(false);
            expect(quickFillPlayer.mode.onFillInteraction).not.toHaveBeenCalled();
        });

        test('ignores blocks without an inventory', () => {
            const quickFillPlayer = makeQuickFillPlayer();

            const event = interact(quickFillPlayer, { block: blockWith(void 0, 'minecraft:stone') });
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
            expect(quickFillPlayer.mode.onGrabInteraction).not.toHaveBeenCalled();
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

            expect(quickFillPlayer.mode.onFillInteraction).toHaveBeenCalledWith(container, heldItemStack);
            expect(quickFillPlayer.mode.onGrabInteraction).not.toHaveBeenCalled();
        });

        test('grabs with the held item when sneaking in survival', () => {
            const quickFillPlayer = makeQuickFillPlayer({ sneaking: true });
            const heldItemStack = stack('oak_log');

            interact(quickFillPlayer, { itemStack: heldItemStack });
            flushScheduledRuns();

            expect(quickFillPlayer.mode.onGrabInteraction).toHaveBeenCalledWith(container, heldItemStack);
            expect(quickFillPlayer.mode.onFillInteraction).not.toHaveBeenCalled();
            expect(container.clearAll).not.toHaveBeenCalled();
        });

        test('grabs when sneaking in adventure mode', () => {
            const quickFillPlayer = makeQuickFillPlayer({ gameMode: GameMode.Adventure, sneaking: true });

            interact(quickFillPlayer);
            flushScheduledRuns();

            expect(quickFillPlayer.mode.onGrabInteraction).toHaveBeenCalledTimes(1);
            expect(container.clearAll).not.toHaveBeenCalled();
        });

        test('clears the container instead of grabbing when sneaking in creative', () => {
            const quickFillPlayer = makeQuickFillPlayer({ gameMode: GameMode.Creative, sneaking: true });

            interact(quickFillPlayer);
            flushScheduledRuns();

            expect(container.clearAll).toHaveBeenCalledTimes(1);
            expect(quickFillPlayer.mode.onGrabInteraction).not.toHaveBeenCalled();
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

            expect(quickFillPlayer.mode.onGrabInteraction).toHaveBeenCalledTimes(1);
        });

        test('uses the player\'s current mode', () => {
            const quickFillPlayer = makeQuickFillPlayer();
            const newMode = fakeMode();
            interact(quickFillPlayer);

            quickFillPlayer.mode = newMode;
            flushScheduledRuns();

            expect(newMode.onFillInteraction).toHaveBeenCalledTimes(1);
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
            expect(quickFillPlayer.mode.onConfigureInteraction).toHaveBeenCalledWith(container);
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

        test.each(['minecraft:beacon', 'minecraft:jukebox', 'minecraft:lectern'])('lets %s break normally', (typeId) => {
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

            quickFillPlayer.onStartBreakingBlock({ block: blockWith(container) });

            expect(quickFillPlayer.mode.onConfigureInteraction).toHaveBeenCalledWith(container);
        });

        test('opens the configure interaction in adventure', () => {
            const quickFillPlayer = makeQuickFillPlayer({ gameMode: GameMode.Adventure }, { configurable: true });

            quickFillPlayer.onStartBreakingBlock({ block: blockWith(container) });

            expect(quickFillPlayer.mode.onConfigureInteraction).toHaveBeenCalledWith(container);
        });

        test('does nothing in creative, where onBreakBlock handles it instead', () => {
            const quickFillPlayer = makeQuickFillPlayer({ gameMode: GameMode.Creative }, { configurable: true });

            quickFillPlayer.onStartBreakingBlock({ block: blockWith(container) });

            expect(quickFillPlayer.mode.onConfigureInteraction).not.toHaveBeenCalled();
        });

        test('does nothing when the mode has no configure interaction', () => {
            const quickFillPlayer = makeQuickFillPlayer({}, { configurable: false });

            quickFillPlayer.onStartBreakingBlock({ block: blockWith(container) });

            expect(quickFillPlayer.mode.onConfigureInteraction).not.toHaveBeenCalled();
        });

        test.each(['minecraft:beacon', 'minecraft:jukebox', 'minecraft:lectern'])('ignores %s', (typeId) => {
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
