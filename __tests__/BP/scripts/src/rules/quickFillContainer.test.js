import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { Player, world } from "@minecraft/server";
import { quickFillContainer } from "../../../../../Canopy[BP]/scripts/src/rules/quickFillContainer";
import { QuickFillPlayer } from "../../../../../Canopy[BP]/scripts/src/classes/quickfill/QuickFillPlayer";

const makePlayer = (id) => {
    const player = new Player();
    player.id = id;
    return player;
};

describe('quickFillContainer', () => {
    afterEach(() => {
        quickFillContainer.onDisable();
        quickFillContainer.activePlayerIds.clear();
    });

    test('is an ability rule bound to inventory slot 9', () => {
        expect(quickFillContainer.getID()).toBe('quickFillContainer');
        expect(quickFillContainer.slotNumber).toBe(9);
        expect(quickFillContainer.getActionItemId()).toBe('minecraft:arrow');
    });

    describe('enabling and disabling', () => {
        test('enabling listens for block interaction, block breaking and the start of block breaking', () => {
            quickFillContainer.onEnable();

            expect(world.beforeEvents.playerInteractWithBlock.subscribe).toHaveBeenCalledWith(quickFillContainer.onPlayerInteractWithBlockBound);
            expect(world.beforeEvents.playerBreakBlock.subscribe).toHaveBeenCalledWith(quickFillContainer.onPlayerBreakBlockBound);
            expect(world.afterEvents.playerStartBreakingBlock.subscribe).toHaveBeenCalledWith(quickFillContainer.onPlayerStartBreakingBlockBound);
        });

        test('disabling unsubscribes the same handlers it subscribed', () => {
            quickFillContainer.onEnable();
            quickFillContainer.onDisable();

            expect(world.beforeEvents.playerInteractWithBlock.unsubscribe).toHaveBeenCalledWith(quickFillContainer.onPlayerInteractWithBlockBound);
            expect(world.beforeEvents.playerBreakBlock.unsubscribe).toHaveBeenCalledWith(quickFillContainer.onPlayerBreakBlockBound);
            expect(world.afterEvents.playerStartBreakingBlock.unsubscribe).toHaveBeenCalledWith(quickFillContainer.onPlayerStartBreakingBlockBound);
        });

        test('disabling destroys and forgets every active quick fill player', () => {
            const first = makePlayer('p1');
            const second = makePlayer('p2');
            quickFillContainer.enableForPlayer(first);
            quickFillContainer.enableForPlayer(second);
            const destroySpies = [first, second].map(player => vi.spyOn(quickFillContainer.getActiveQuickFillPlayer(player), 'destroy'));

            quickFillContainer.onDisable();

            destroySpies.forEach(spy => expect(spy).toHaveBeenCalledTimes(1));
            expect(quickFillContainer.getActiveQuickFillPlayer(first)).toBeUndefined();
            expect(quickFillContainer.getActiveQuickFillPlayer(second)).toBeUndefined();
        });
    });

    describe('per-player state', () => {
        test('has no quick fill player for someone who has not enabled it', () => {
            expect(quickFillContainer.getActiveQuickFillPlayer(makePlayer('p1'))).toBeUndefined();
        });

        test('tolerates a missing player', () => {
            expect(quickFillContainer.getActiveQuickFillPlayer(void 0)).toBeUndefined();
        });

        test('enabling for a player creates a quick fill player owned by that player', () => {
            const player = makePlayer('p1');

            quickFillContainer.enableForPlayer(player);

            const quickFillPlayer = quickFillContainer.getActiveQuickFillPlayer(player);
            expect(quickFillPlayer).toBeInstanceOf(QuickFillPlayer);
            expect(quickFillPlayer.player).toBe(player);
        });

        test('looks players up by id, so a refreshed player object finds the same state', () => {
            const player = makePlayer('p1');
            quickFillContainer.enableForPlayer(player);

            expect(quickFillContainer.getActiveQuickFillPlayer(makePlayer('p1'))).toBe(quickFillContainer.getActiveQuickFillPlayer(player));
        });

        test('keeps different players separate', () => {
            const first = makePlayer('p1');
            const second = makePlayer('p2');

            quickFillContainer.enableForPlayer(first);
            quickFillContainer.enableForPlayer(second);

            expect(quickFillContainer.getActiveQuickFillPlayer(first)).not.toBe(quickFillContainer.getActiveQuickFillPlayer(second));
        });

        test('enabling twice keeps the existing quick fill player and its chosen mode', () => {
            const player = makePlayer('p1');
            quickFillContainer.enableForPlayer(player);
            const original = quickFillContainer.getActiveQuickFillPlayer(player);
            const mode = original.mode;

            quickFillContainer.enableForPlayer(player);

            expect(quickFillContainer.getActiveQuickFillPlayer(player)).toBe(original);
            expect(original.mode).toBe(mode);
        });

        test('disabling for a player destroys and removes only their quick fill player', () => {
            const leaving = makePlayer('p1');
            const staying = makePlayer('p2');
            quickFillContainer.enableForPlayer(leaving);
            quickFillContainer.enableForPlayer(staying);
            const destroySpy = vi.spyOn(quickFillContainer.getActiveQuickFillPlayer(leaving), 'destroy');
            const stayingPlayer = quickFillContainer.getActiveQuickFillPlayer(staying);

            quickFillContainer.disableForPlayer(leaving);

            expect(destroySpy).toHaveBeenCalledTimes(1);
            expect(quickFillContainer.getActiveQuickFillPlayer(leaving)).toBeUndefined();
            expect(quickFillContainer.getActiveQuickFillPlayer(staying)).toBe(stayingPlayer);
        });

        test('disabling for a player who never enabled it does nothing', () => {
            expect(() => quickFillContainer.disableForPlayer(makePlayer('p1'))).not.toThrow();
        });

        test('re-enabling after disabling starts from a fresh quick fill player', () => {
            const player = makePlayer('p1');
            quickFillContainer.enableForPlayer(player);
            const original = quickFillContainer.getActiveQuickFillPlayer(player);
            quickFillContainer.disableForPlayer(player);

            quickFillContainer.enableForPlayer(player);

            expect(quickFillContainer.getActiveQuickFillPlayer(player)).not.toBe(original);
        });
    });

    describe('event routing', () => {
        let player;
        let quickFillPlayer;

        beforeEach(() => {
            player = makePlayer('p1');
            quickFillContainer.enableForPlayer(player);
            quickFillPlayer = quickFillContainer.getActiveQuickFillPlayer(player);
            vi.spyOn(quickFillPlayer, 'onInteractWithBlock').mockImplementation(() => void 0);
            vi.spyOn(quickFillPlayer, 'onBreakBlock').mockImplementation(() => void 0);
            vi.spyOn(quickFillPlayer, 'onStartBreakingBlock').mockImplementation(() => void 0);
        });

        test('block interaction goes to the interacting player\'s quick fill player', () => {
            const event = { player };

            quickFillContainer.onPlayerInteractWithBlockBound(event);

            expect(quickFillPlayer.onInteractWithBlock).toHaveBeenCalledWith(event);
        });

        test('block breaking goes to the breaking player\'s quick fill player', () => {
            const event = { player };

            quickFillContainer.onPlayerBreakBlockBound(event);

            expect(quickFillPlayer.onBreakBlock).toHaveBeenCalledWith(event);
        });

        test('start of block breaking goes to the player\'s quick fill player', () => {
            const event = { player };

            quickFillContainer.onPlayerStartBreakingBlockBound(event);

            expect(quickFillPlayer.onStartBreakingBlock).toHaveBeenCalledWith(event);
        });

        test('events from players without the ability enabled are ignored', () => {
            const bystander = makePlayer('p2');

            quickFillContainer.onPlayerInteractWithBlockBound({ player: bystander });
            quickFillContainer.onPlayerBreakBlockBound({ player: bystander });
            quickFillContainer.onPlayerStartBreakingBlockBound({ player: bystander });

            expect(quickFillPlayer.onInteractWithBlock).not.toHaveBeenCalled();
            expect(quickFillPlayer.onBreakBlock).not.toHaveBeenCalled();
            expect(quickFillPlayer.onStartBreakingBlock).not.toHaveBeenCalled();
        });

        test('events are ignored after the player disables the ability', () => {
            quickFillContainer.disableForPlayer(player);

            quickFillContainer.onPlayerInteractWithBlockBound({ player });

            expect(quickFillPlayer.onInteractWithBlock).not.toHaveBeenCalled();
        });
    });
});
