import { describe, it, expect, beforeEach, vi } from 'vitest';
import { world } from '@minecraft/server';
import { scheduler } from '@forestoflight/minecraft-vitest-mocks';
import { Rules } from '../../../../../../Canopy[BP]/scripts/lib/canopy/rules/Rules';
import { BlockBreakSpeed } from '../../../../../../Canopy[BP]/scripts/src/rules/infodisplay/BlockBreakSpeed';

function createMockPlayer(id, isEnabled = true) {
    return {
        id,
        getDynamicProperty: vi.fn(() => isEnabled),
        setDynamicProperty: vi.fn()
    };
}

function displayedValue(element) {
    return Number(element.getFormattedDataOwnLine().with[0]);
}

function breakBlock(player) {
    const [[onPlayerBreakBlock]] = world.afterEvents.playerBreakBlock.subscribe.mock.calls;
    onPlayerBreakBlock({ player });
}

function leaveWorld(player) {
    const [[onPlayerLeave]] = world.beforeEvents.playerLeave.subscribe.mock.calls;
    onPlayerLeave({ player });
}

describe('BlockBreakSpeed', () => {
    let playerOne;
    let playerTwo;

    beforeEach(() => {
        Rules.clear();
        Rules.rulesToRegister = [];
        scheduler.reset();
        BlockBreakSpeed.breakTicksByPlayerId = {};
        BlockBreakSpeed.isTracking = false;
        playerOne = createMockPlayer('player-one');
        playerTwo = createMockPlayer('player-two');
        world.getAllPlayers.mockReturnValue([playerOne, playerTwo]);
    });

    it('does not subscribe to events until the rule is enabled', () => {
        const element = new BlockBreakSpeed(playerOne, 23);
        expect(world.afterEvents.playerBreakBlock.subscribe).not.toHaveBeenCalled();

        element.rule.onEnable();

        expect(world.afterEvents.playerBreakBlock.subscribe).toHaveBeenCalledTimes(1);
    });

    it('reports a rate for a player whose element is created after the rule already exists', () => {
        const first = new BlockBreakSpeed(playerOne, 23);
        first.rule.onEnable();
        const second = new BlockBreakSpeed(playerTwo, 23);
        second.rule.onEnable();

        breakBlock(playerTwo);

        expect(displayedValue(second)).toBe(0.2);
    });

    it('reports zero rather than NaN when nothing has been broken', () => {
        const element = new BlockBreakSpeed(playerOne, 23);
        element.rule.onEnable();

        expect(displayedValue(element)).toBe(0);
    });

    it('only counts blocks broken by its own player', () => {
        const first = new BlockBreakSpeed(playerOne, 23);
        first.rule.onEnable();

        breakBlock(playerTwo);

        expect(displayedValue(first)).toBe(0);
    });

    it('drops blocks broken outside the tracked window', () => {
        const element = new BlockBreakSpeed(playerOne, 23);
        element.rule.onEnable();

        breakBlock(playerOne);
        expect(displayedValue(element)).toBe(0.2);

        scheduler.advanceTicks(BlockBreakSpeed.TRACKED_TICK_COUNT);
        expect(displayedValue(element)).toBe(0);
    });

    it('stops tracking a player who leaves', () => {
        const element = new BlockBreakSpeed(playerOne, 23);
        element.rule.onEnable();
        breakBlock(playerOne);

        leaveWorld(playerOne);

        expect(displayedValue(element)).toBe(0);
    });

    it('keeps tracking when one player disables the rule while another still has it enabled', () => {
        const first = new BlockBreakSpeed(playerOne, 23);
        first.rule.onEnable();
        const second = new BlockBreakSpeed(playerTwo, 23);
        second.rule.onEnable();

        playerOne.getDynamicProperty.mockReturnValue(false);
        first.rule.onDisable();

        expect(world.afterEvents.playerBreakBlock.unsubscribe).not.toHaveBeenCalled();
        breakBlock(playerTwo);
        expect(displayedValue(second)).toBe(0.2);
    });

    it('unsubscribes once the last player disables the rule', () => {
        const element = new BlockBreakSpeed(playerOne, 23);
        element.rule.onEnable();

        playerOne.getDynamicProperty.mockReturnValue(false);
        playerTwo.getDynamicProperty.mockReturnValue(false);
        element.rule.onDisable();

        expect(world.afterEvents.playerBreakBlock.unsubscribe).toHaveBeenCalledTimes(1);
        expect(world.beforeEvents.playerLeave.unsubscribe).toHaveBeenCalledTimes(1);
        expect(BlockBreakSpeed.breakTicksByPlayerId).toEqual({});
    });
});
